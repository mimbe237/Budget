import 'package:flutter/material.dart';
import '../../models/user_profile.dart';
import '../../models/account.dart';
import '../../services/mock_data_service.dart';
// import '../services/firestore_service.dart'; // Décommenter quand Firebase est prêt

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
  final PageController _pageController = PageController();
  int _currentPage = 0;
  
  // Service (basculer entre Mock et Firestore)
  final _mockService = MockDataService();
  // final _firestoreService = FirestoreService(); // Décommenter pour Firebase
  
  final _formKeyStep1 = GlobalKey<FormState>();
  final _formKeyStep3 = GlobalKey<FormState>();

  // États globaux de l'onboarding
  String _name = '';
  String _currency = 'EUR';
  double _monthlyIncome = 0.0;
  
  // Liste des comptes initiaux
  List<_AccountInput> _initialAccounts = [
    _AccountInput(name: 'Compte Courant', balance: 0.0, type: AccountType.checking, icon: '💳', color: '#4CAF50')
  ];
  
  // Allocation budgétaire (total doit faire 100%)
  Map<String, double> _budgetAllocation = {
    '🏠 Logement': 0.30,
    '🛒 Nourriture': 0.15,
    '🚘 Transport': 0.10,
    '🎉 Loisirs': 0.10,
    '🪙 Épargne': 0.10,
    '💡 Investissements': 0.10,
    '🚨 Autres': 0.15
  };

  void _nextPage() {
    // Validation de l'étape 1
    if (_currentPage == 0 && !_formKeyStep1.currentState!.validate()) return;
    
    // Validation de l'étape 2
    if (_currentPage == 1 && _initialAccounts.any((a) => a.name.isEmpty || a.balance.isNaN)) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Veuillez renseigner tous les champs')),
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
        const SnackBar(content: Text('L\'allocation budgétaire doit totaliser 100%')),
      );
      return;
    }
    
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Sauvegarde en cours...'), duration: Duration(seconds: 1)),
    );

    try {
      // MODE MOCK (pour développement sans Firebase)
      // En production, utiliser FirestoreService à la place
      
      // Simuler un délai de sauvegarde
      await Future.delayed(const Duration(seconds: 1));
      
      /* MODE FIREBASE (décommenter quand prêt)
      // 1. Connexion anonyme
      final userId = await _firestoreService.signInAnonymously();
      if (userId == null) {
        throw Exception('Erreur de connexion');
      }
      
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
      
      // 4. Sauvegarder le budget (à implémenter dans FirestoreService)
      // await _firestoreService.saveBudgetPlan(userId, _monthlyIncome, _budgetAllocation);
      */
      
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
          SnackBar(content: Text('Erreur: $e'), duration: const Duration(seconds: 4)),
        );
      }
    }
  }

  void _updateAllocation(String category, double newPercentage) {
    // Logique Smart 100% : ajuste automatiquement "Autres"
    double oldPercentage = _budgetAllocation[category] ?? 0.0;
    double difference = newPercentage - oldPercentage;
    
    String adjustKey = '🚨 Autres';
    if (category == adjustKey) {
      setState(() => _budgetAllocation[category] = newPercentage);
      return;
    }

    double adjustValue = _budgetAllocation[adjustKey]! - difference;

    // Ne pas autoriser si ça met "Autres" en négatif
    if (adjustValue < 0 || adjustValue > 1.0) return;

    setState(() {
      _budgetAllocation[category] = newPercentage;
      _budgetAllocation[adjustKey] = adjustValue;
    });
  }

  @override
  Widget build(BuildContext context) {
    final progress = (_currentPage + 1) / 3.0;

    return Scaffold(
      appBar: AppBar(
        title: Column(
          children: [
            Text(
              'Configuration ${_currentPage + 1}/3',
              style: const TextStyle(fontSize: 14),
            ),
            const SizedBox(height: 4),
            ClipRRect(
              borderRadius: BorderRadius.circular(10),
              child: LinearProgressIndicator(
                value: progress,
                backgroundColor: Colors.grey[200],
                valueColor: const AlwaysStoppedAnimation<Color>(Color(0xFF6366F1)),
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
            color: Colors.black.withOpacity(0.05),
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
              label: const Text('Précédent'),
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
              backgroundColor: const Color(0xFF6366F1),
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 16),
              elevation: 0,
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
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
            const Text(
              '👋 Bienvenue !',
              style: TextStyle(fontSize: 32, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 8),
            Text(
              'Commençons par quelques informations de base',
              style: TextStyle(fontSize: 16, color: Colors.grey[600]),
            ),
            const SizedBox(height: 40),
            
            TextFormField(
              decoration: InputDecoration(
                labelText: 'Votre prénom',
                hintText: 'ex: Marie',
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                prefixIcon: const Icon(Icons.person_outline),
                filled: true,
                fillColor: Colors.grey[50],
              ),
              onChanged: (value) => _name = value,
              validator: (value) => value!.isEmpty ? 'Prénom requis' : null,
            ),
            
            const SizedBox(height: 32),
            const Text(
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
          color: isSelected ? const Color(0xFF6366F1).withOpacity(0.1) : Colors.grey[100],
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: isSelected ? const Color(0xFF6366F1) : Colors.transparent,
            width: 2,
          ),
        ),
        child: Column(
          children: [
            Text(
              symbol,
              style: TextStyle(
                fontSize: 28,
                fontWeight: FontWeight.bold,
                color: isSelected ? const Color(0xFF6366F1) : Colors.black87,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              code,
              style: TextStyle(
                fontSize: 12,
                color: isSelected ? const Color(0xFF6366F1) : Colors.grey[600],
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
          const Text(
            '💰 Vos Comptes',
            style: TextStyle(fontSize: 28, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 8),
          Text(
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
              label: const Text('Ajouter un Compte', style: TextStyle(fontSize: 16)),
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
                foregroundColor: const Color(0xFF6366F1),
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
                Text(account.icon, style: const TextStyle(fontSize: 32)),
                const SizedBox(width: 12),
                Expanded(
                  child: TextFormField(
                    initialValue: account.name,
                    decoration: const InputDecoration(
                      labelText: 'Nom du compte',
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
                labelText: 'Solde initial',
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
            const Text(
              '📊 Plan Budgétaire',
              style: TextStyle(fontSize: 28, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 8),
            Text(
              'Définissez votre allocation (doit totaliser 100%)',
              style: TextStyle(fontSize: 16, color: Colors.grey[600]),
            ),
            const SizedBox(height: 24),
            
            TextFormField(
              keyboardType: TextInputType.number,
              decoration: InputDecoration(
                labelText: 'Revenu Mensuel Prévu',
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
                  const Text(
                    'Total de la Répartition',
                    style: TextStyle(fontWeight: FontWeight.bold),
                  ),
                  Text(
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
                          Text(
                            category,
                            style: const TextStyle(
                              fontWeight: FontWeight.w600,
                              fontSize: 16,
                            ),
                          ),
                          Text(
                            '${(percentage * 100).toStringAsFixed(0)}%',
                            style: const TextStyle(
                              fontWeight: FontWeight.bold,
                              fontSize: 18,
                              color: Color(0xFF6366F1),
                            ),
                          ),
                        ],
                      ),
                      if (_monthlyIncome > 0) ...[
                        const SizedBox(height: 4),
                        Text(
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
                        activeColor: const Color(0xFF6366F1),
                        inactiveColor: Colors.grey[200],
                        onChanged: (newValue) {
                          _updateAllocation(category, newValue);
                        },
                      ),
                    ],
                  ),
                ),
              );
            }).toList(),
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
              const Text(
                '🎉 Félicitations !',
                style: TextStyle(
                  fontSize: 32,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 16),
              Text(
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
                    const SnackBar(content: Text('Redirection vers le dashboard...')),
                  );
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF6366F1),
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(horizontal: 48, vertical: 16),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                  elevation: 0,
                ),
                child: const Text(
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
