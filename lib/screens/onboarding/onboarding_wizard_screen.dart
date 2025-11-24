import 'package:flutter/material.dart';
import '../../models/account.dart';
import '../../services/firestore_service.dart';
import '../../widgets/revolutionary_logo.dart';
import 'package:budget/l10n/app_localizations.dart';

/// Écran d'onboarding wizard en 3 étapes
/// Étape 1: Profil utilisateur (nom + devise)
/// Étape 2: Comptes initiaux
/// Étape 3: Plan budgétaire (revenus + allocation)
class OnboardingWizardScreen extends StatefulWidget {
  const OnboardingWizardScreen({super.key});

  @override
  State<OnboardingWizardScreen> createState() => _OnboardingWizardScreenState();
}

class _OnboardingWizardScreenState extends State<OnboardingWizardScreen> {
  static const Color _brandPrimary = Color(0xFF6C5CF7);
  static const Color _brandSecondary = Color(0xFFC542C1);
  static const Color _brandSurface = Color(0xFFF1EEFF);

  final PageController _pageController = PageController();
  int _currentPage = 0;
  
  // Service Firestore (Module 11)
  final _firestoreService = FirestoreService();
  
  final _formKeyStep1 = GlobalKey<FormState>();
  final _formKeyStep3 = GlobalKey<FormState>();

  // États globaux de l'onboarding
  String _name = '';
  String _currency = 'EUR';
  double _monthlyIncome = 0.0;
  
  // Liste des comptes initiaux
  final List<_AccountInput> _initialAccounts = [
    _AccountInput(name: 'Compte Courant', balance: 0.0, type: AccountType.checking, icon: '💳', color: '#4CAF50')
  ];
  
  // Allocation budgétaire (total doit faire 100%)
  final Map<String, double> _budgetAllocation = {
    '🏠 Logement': 0.30,
    '🛒 Nourriture': 0.15,
    '🚘 Transport': 0.10,
    '📄 Factures/Abo': 0.05,
    '💊 Santé': 0.05,
    '🛡️ Épargne Sécurité': 0.10,
    '💡 Investissements': 0.10,
    '🎉 Loisirs': 0.10,
    '👨‍👩‍👧 Famille/Dons': 0.05,
  };

  void _nextPage() {
    // Validation de l'étape 1
    if (_currentPage == 0 && !_formKeyStep1.currentState!.validate()) return;
    
    // Validation de l'étape 2
    if (_currentPage == 1 && _initialAccounts.any((a) => a.name.isEmpty || a.balance.isNaN)) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: TrText('Veuillez renseigner tous les champs')),
      );
      return;
    }
    
    if (_currentPage < 2) {
      _pageController.nextPage(
        duration: const Duration(milliseconds: 400),
        curve: Curves.easeInOut,
      );
      setState(() => _currentPage++);
    }
  }

  void _previousPage() {
    if (_currentPage > 0) {
      _pageController.previousPage(
        duration: const Duration(milliseconds: 400),
        curve: Curves.easeInOut,
      );
      setState(() => _currentPage--);
    }
  }

  Future<void> _completeOnboarding() async {
    if (!_formKeyStep3.currentState!.validate()) return;
    
    // Vérifier que l'allocation est bien à 100%
    final totalAllocation = _budgetAllocation.values.reduce((a, b) => a + b);
    if ((totalAllocation * 100).round() != 100) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: TrText('L\'allocation budgétaire doit totaliser 100%')),
      );
      return;
    }
    
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: TrText('Sauvegarde en cours...'), duration: Duration(seconds: 1)),
    );

    try {
      // 1. Connexion anonyme
      final userId = await _firestoreService.signInAnonymously();
      
      // 2. Créer le profil
      await _firestoreService.createUserProfile(
        userId: userId,
        displayName: _name,
        currency: _currency,
      );
      
      // 3. Créer les comptes
      for (var accountInput in _initialAccounts) {
        await _firestoreService.addAccount(
          userId: userId,
          name: accountInput.name,
          type: accountInput.type,
          balance: accountInput.balance,
          currency: _currency,
          icon: accountInput.icon,
          color: accountInput.color,
        );
      }
      
      // 4. Sauvegarder le budget (Module 5)
      await _firestoreService.saveBudgetPlan(
        userId: userId,
        totalBudget: _monthlyIncome,
        categoryAllocations: _budgetAllocation,
      );
      
      // 5. Redirection vers l'app principale
      if (mounted) {
        Navigator.of(context).pushReplacement(
          MaterialPageRoute(
            builder: (context) => const _SuccessScreen(),
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: TrText('Erreur: $e'), duration: const Duration(seconds: 4)),
        );
      }
    }
  }

  void _updateAllocation(String category, double newPercentage) {
    // Logique Smart 100% : ajuste automatiquement "Loisirs" comme tampon
    // Si on modifie "Loisirs", on ajuste "Investissements" ou un autre
    
    String bufferCategory = '🎉 Loisirs';
    if (category == bufferCategory) {
      bufferCategory = '💡 Investissements'; // Fallback si on modifie le tampon principal
    }

    double oldPercentage = _budgetAllocation[category] ?? 0.0;
    double difference = newPercentage - oldPercentage;
    
    double bufferValue = _budgetAllocation[bufferCategory]!;
    double newBufferValue = bufferValue - difference;

    // Ne pas autoriser si ça met le tampon en négatif
    // On autorise une petite marge d'erreur pour les float
    if (newBufferValue < -0.001) {
      // Si on ne peut pas ajuster le tampon, on bloque ou on sature
      // Ici on sature : on ne change que ce qui est possible
      // Mais pour une UX fluide avec Slider, mieux vaut bloquer ou limiter
      return; 
    }

    setState(() {
      _budgetAllocation[category] = newPercentage;
      _budgetAllocation[bufferCategory] = newBufferValue;
    });
  }

  @override
  Widget build(BuildContext context) {
    final progress = (_currentPage + 1) / 3.0;

    return Scaffold(
      appBar: AppBar(
        leading: const Padding(
          padding: EdgeInsets.all(8.0),
          child: RevolutionaryLogo(size: 32),
        ),
        title: Column(
          children: [
            TrText(
              'Configuration ${_currentPage + 1}/3',
              style: const TextStyle(fontSize: 14),
            ),
            const SizedBox(height: 4),
            ClipRRect(
              borderRadius: BorderRadius.circular(10),
              child: LinearProgressIndicator(
                value: progress,
                backgroundColor: Colors.grey[200],
                valueColor: const AlwaysStoppedAnimation<Color>(_brandPrimary),
                minHeight: 6,
              ),
            ),
          ],
        ),
        automaticallyImplyLeading: false,
        centerTitle: true,
      ),
      body: Column(
        children: [
          Expanded(
            child: PageView(
              controller: _pageController,
              physics: const NeverScrollableScrollPhysics(),
              children: [
                _buildStep1Profile(),
                _buildStep2Accounts(),
                _buildStep3Budget(),
              ],
            ),
          ),
          _buildNavigationButtons(),
        ],
      ),
    );
  }

  Widget _buildNavigationButtons() {
    return Container(
      padding: const EdgeInsets.all(16.0),
      decoration: BoxDecoration(
        color: Colors.white,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.05),
            blurRadius: 10,
            offset: const Offset(0, -4),
          ),
        ],
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          if (_currentPage > 0)
            TextButton.icon(
              onPressed: _previousPage,
              icon: const Icon(Icons.arrow_back),
              label: const TrText('Précédent'),
              style: TextButton.styleFrom(
                foregroundColor: Colors.grey[600],
              ),
            )
          else
            const SizedBox.shrink(),
          const Spacer(),
          ElevatedButton(
            onPressed: _currentPage == 2 ? _completeOnboarding : _nextPage,
            style: ElevatedButton.styleFrom(
              backgroundColor: _brandPrimary,
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 16),
              elevation: 0,
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                TrText(
                  _currentPage == 2 ? 'Terminer' : 'Suivant',
                  style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                ),
                const SizedBox(width: 8),
                Icon(_currentPage == 2 ? Icons.check : Icons.arrow_forward),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStep1Profile() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(24.0),
      child: Form(
        key: _formKeyStep1,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Center(
              child: Column(
                children: [
                  const RevolutionaryLogo(size: 80, withText: true),
                  const SizedBox(height: 12),
                  const TrText(
                    '👋 Bienvenue !',
                    style: TextStyle(fontSize: 28, fontWeight: FontWeight.w800),
                  ),
                  const SizedBox(height: 6),
                  TrText(
                    'Commençons par quelques informations de base',
                    style: TextStyle(fontSize: 15, color: Colors.grey[700]),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 32),
            
            TextFormField(
              decoration: InputDecoration(
                labelText: t('Votre prénom'),
                hintText: t('ex: Marie'),
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                prefixIcon: const Icon(Icons.person_outline),
                filled: true,
                fillColor: Colors.grey[50],
              ),
              onChanged: (value) => _name = value,
              validator: (value) => value!.isEmpty ? 'Prénom requis' : null,
            ),
            
            const SizedBox(height: 32),
            const TrText(
              'Votre devise par défaut',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.w600),
            ),
            const SizedBox(height: 16),
            
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceAround,
              children: [
                _buildCurrencyOption('EUR', '€'),
                _buildCurrencyOption('USD', '\$'),
                _buildCurrencyOption('XAF', 'XAF'),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildCurrencyOption(String code, String symbol) {
    final isSelected = _currency == code;
    return GestureDetector(
      onTap: () => setState(() => _currency = code),
      child: Container(
        width: 100,
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          color: isSelected ? _brandSurface : Colors.grey[100],
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: isSelected ? _brandPrimary : Colors.transparent,
            width: 2,
          ),
        ),
        child: Column(
          children: [
            TrText(
              symbol,
              style: TextStyle(
                fontSize: 28,
                fontWeight: FontWeight.bold,
                color: isSelected ? _brandPrimary : Colors.black87,
              ),
            ),
            const SizedBox(height: 4),
            TrText(
              code,
              style: TextStyle(
                fontSize: 12,
                color: isSelected ? _brandPrimary : Colors.grey[600],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildStep2Accounts() {
    return Padding(
      padding: const EdgeInsets.all(24.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const TrText(
            '💰 Vos Comptes',
            style: TextStyle(fontSize: 28, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 8),
          TrText(
            'Où se trouve votre argent ?',
            style: TextStyle(fontSize: 16, color: Colors.grey[600]),
          ),
          const SizedBox(height: 24),
          
          Expanded(
            child: ListView.builder(
              itemCount: _initialAccounts.length,
              itemBuilder: (context, index) {
                final account = _initialAccounts[index];
                return _buildAccountCard(account, index);
              },
            ),
          ),
          
          Center(
            child: TextButton.icon(
              icon: const Icon(Icons.add_circle_outline, size: 28),
              label: const TrText('Ajouter un Compte', style: TextStyle(fontSize: 16)),
              onPressed: () {
                setState(() {
                  _initialAccounts.add(_AccountInput(
                    name: '',
                    balance: 0.0,
                    type: AccountType.checking,
                    icon: '💳',
                    color: '#4CAF50',
                  ));
                });
              },
              style: TextButton.styleFrom(
                foregroundColor: _brandPrimary,
                padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildAccountCard(_AccountInput account, int index) {
    return Card(
      margin: const EdgeInsets.only(bottom: 16),
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
        side: BorderSide(color: Colors.grey[200]!),
      ),
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                TrText(account.icon, style: const TextStyle(fontSize: 32)),
                const SizedBox(width: 12),
                Expanded(
                  child: TextFormField(
                    initialValue: account.name,
                    decoration: InputDecoration(
                      labelText: t('Nom du compte'),
                      border: InputBorder.none,
                      isDense: true,
                    ),
                    style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w600),
                    onChanged: (value) => account.name = value,
                  ),
                ),
                if (_initialAccounts.length > 1)
                  IconButton(
                    icon: const Icon(Icons.delete_outline, color: Colors.red),
                    onPressed: () => setState(() => _initialAccounts.removeAt(index)),
                  ),
              ],
            ),
            const SizedBox(height: 12),
            TextFormField(
              initialValue: account.balance.toString(),
              keyboardType: TextInputType.number,
              decoration: InputDecoration(
                labelText: t('Solde Actuel'),
                suffixText: _currency,
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                filled: true,
                fillColor: Colors.grey[50],
              ),
              onChanged: (value) => account.balance = double.tryParse(value) ?? 0.0,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildStep3Budget() {
    final totalPercentage = _budgetAllocation.values.reduce((a, b) => a + b);
    final isValid = (totalPercentage * 100).round() == 100;
    
    return SingleChildScrollView(
      padding: const EdgeInsets.all(24.0),
      child: Form(
        key: _formKeyStep3,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const TrText(
              '📊 Plan Budgétaire',
              style: TextStyle(fontSize: 28, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 8),
            TrText(
              'Définissez votre allocation (doit totaliser 100%)',
              style: TextStyle(fontSize: 16, color: Colors.grey[600]),
            ),
            const SizedBox(height: 24),
            
            TextFormField(
              keyboardType: TextInputType.number,
              decoration: InputDecoration(
                labelText: t('Revenu Mensuel Prévu'),
                suffixText: _currency,
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                prefixIcon: const Icon(Icons.account_balance_wallet_outlined),
                filled: true,
                fillColor: Colors.grey[50],
              ),
              onChanged: (value) => setState(() => _monthlyIncome = double.tryParse(value) ?? 0.0),
              validator: (value) => (double.tryParse(value ?? '0') ?? 0) <= 0 
                  ? 'Montant requis' : null,
            ),
            
            const SizedBox(height: 32),
            
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: isValid ? Colors.green[50] : Colors.orange[50],
                borderRadius: BorderRadius.circular(12),
                border: Border.all(
                  color: isValid ? Colors.green : Colors.orange,
                  width: 2,
                ),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const TrText(
                    'Total de la Répartition',
                    style: TextStyle(fontWeight: FontWeight.bold),
                  ),
                  TrText(
                    '${(totalPercentage * 100).toStringAsFixed(0)}%',
                    style: TextStyle(
                      fontSize: 20,
                      fontWeight: FontWeight.bold,
                      color: isValid ? Colors.green : Colors.orange,
                    ),
                  ),
                ],
              ),
            ),
            
            const SizedBox(height: 24),
            
            ..._budgetAllocation.keys.map((category) {
              final percentage = _budgetAllocation[category]!;
              final amount = _monthlyIncome * percentage;
              
              return Card(
                margin: const EdgeInsets.only(bottom: 16),
                elevation: 0,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                  side: BorderSide(color: Colors.grey[200]!),
                ),
                child: Padding(
                  padding: const EdgeInsets.all(16.0),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          TrText(
                            category,
                            style: const TextStyle(
                              fontWeight: FontWeight.w600,
                              fontSize: 16,
                            ),
                          ),
                          TrText(
                            '${(percentage * 100).toStringAsFixed(0)}%',
                            style: const TextStyle(
                              fontWeight: FontWeight.bold,
                              fontSize: 18,
                              color: _brandPrimary,
                            ),
                          ),
                        ],
                      ),
                      if (_monthlyIncome > 0) ...[
                        const SizedBox(height: 4),
                        TrText(
                          '${amount.toStringAsFixed(2)} $_currency',
                          style: TextStyle(
                            color: Colors.grey[600],
                            fontSize: 14,
                          ),
                        ),
                      ],
                      Slider(
                        value: percentage,
                        min: 0.0,
                        max: 1.0,
                        divisions: 100,
                        activeColor: _brandPrimary,
                        inactiveColor: Colors.grey[200],
                        onChanged: (newValue) {
                          _updateAllocation(category, newValue);
                        },
                      ),
                    ],
                  ),
                ),
              );
            }),
          ],
        ),
      ),
    );
  }
}

// Classe helper pour les inputs de compte
class _AccountInput {
  String name;
  double balance;
  AccountType type;
  String icon;
  String color;

  _AccountInput({
    required this.name,
    required this.balance,
    required this.type,
    required this.icon,
    required this.color,
  });
}

// Écran de succès après l'onboarding
class _SuccessScreen extends StatelessWidget {
  const _SuccessScreen();

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(32.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Container(
                width: 120,
                height: 120,
                decoration: BoxDecoration(
                  color: Colors.green[50],
                  shape: BoxShape.circle,
                ),
                child: const Icon(
                  Icons.check_circle,
                  size: 80,
                  color: Colors.green,
                ),
              ),
              const SizedBox(height: 32),
              const TrText(
                '🎉 Félicitations !',
                style: TextStyle(
                  fontSize: 32,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 16),
              TrText(
                'Votre budget est configuré et prêt à l\'emploi',
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontSize: 16,
                  color: Colors.grey[600],
                ),
              ),
              const SizedBox(height: 48),
              ElevatedButton(
                onPressed: () {
                  // TODO: Navigation vers le dashboard principal
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: TrText('Redirection vers le dashboard...')),
                  );
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF6C5CF7),
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(horizontal: 48, vertical: 16),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                  elevation: 0,
                ),
                child: const TrText(
                  'Accéder au Dashboard',
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
