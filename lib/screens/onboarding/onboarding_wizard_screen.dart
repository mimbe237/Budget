import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import 'package:budget/l10n/localization_helpers.dart';

import '../../models/account.dart';
import '../../services/firestore_service.dart';
import '../../widgets/discovery_tutorial.dart';
import '../navigation/main_navigation_shell.dart';
import '../../providers/locale_provider.dart';

/// Écran d'onboarding simplifié en 3 étapes
/// Étape 1: Bienvenue (nom + devise + revenu mensuel)
/// Étape 2: Tutoriel de découverte (fonctionnalités principales)
/// Étape 3: Configuration rapide (1 compte + optionnel budget/objectif)
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

  final _firestoreService = FirestoreService();

  final _formKeyStep1 = GlobalKey<FormState>();
  final _formKeyStep3 = GlobalKey<FormState>();
  
  String? _userId;
  final TextEditingController _nameController = TextEditingController();
  final TextEditingController _incomeController = TextEditingController();
  String _currency = 'XAF';

  final TextEditingController _accountNameController = TextEditingController();
  final TextEditingController _accountBalanceController = TextEditingController(text: '0');
  final List<String> _accountIcons = ['💳','🏦','💰','📱'];
  String _selectedAccountIcon = '💳';

  bool _wantsBudget = false;
  final TextEditingController _budgetAmountController = TextEditingController();

  bool _wantsGoal = false;
  final TextEditingController _goalNameController = TextEditingController();
  final TextEditingController _goalAmountController = TextEditingController();

  String t(String key) {
    // Fallback simple localizer; AppLocalizations may replace this via TrText
    return key;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: _brandSurface,
      appBar: AppBar(
        title: const TrText('Configuration de démarrage'),
        backgroundColor: Colors.white,
        foregroundColor: Colors.black,
        elevation: 0,
      ),
      body: Column(
        children: [
          Expanded(
            child: PageView(
              controller: _pageController,
              physics: const ClampingScrollPhysics(),
              onPageChanged: (index) => setState(() => _currentPage = index),
              children: [
                _buildStep1Welcome(),
                _buildStep2Discovery(),
                _buildStep3QuickSetup(),
              ],
            ),
          ),
          _buildBottomControls(),
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 0, 16, 12),
            child: ClipRRect(
              borderRadius: BorderRadius.circular(10),
              child: LinearProgressIndicator(
                value: (_currentPage + 1) / 3,
                minHeight: 6,
                backgroundColor: Colors.white,
                valueColor: AlwaysStoppedAnimation<Color>(_brandPrimary),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildBottomControls() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: BoxDecoration(
        color: Colors.white,
        border: Border(top: BorderSide(color: Colors.grey[200]!)),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          if (_currentPage > 0)
            TextButton.icon(
              onPressed: _previousPage,
              icon: const Icon(Icons.arrow_back),
              label: const TrText('Précédent'),
              style: TextButton.styleFrom(foregroundColor: Colors.grey[600]),
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

  // Étape 1: Bienvenue avec nom, devise et revenu
  Widget _buildStep1Welcome() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(24.0),
      child: Form(
        key: _formKeyStep1,
        child: Card(
          elevation: 2,
          shadowColor: Colors.black.withOpacity(0.05),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(18)),
          child: Padding(
            padding: const EdgeInsets.all(16.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Center(
                  child: Column(
                    children: [
                      TrText(
                        AppLocalizations.of(context)!.tr('onboarding_welcome_title'),
                        style: const TextStyle(fontSize: 26, fontWeight: FontWeight.w800),
                      ),
                      const SizedBox(height: 6),
                      TrText(
                        AppLocalizations.of(context)!.tr('onboarding_welcome_subtitle'),
                        textAlign: TextAlign.center,
                        style: TextStyle(fontSize: 14, color: Colors.grey[700]),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 24),

                        // Sélecteur de langue
            Row(
              mainAxisAlignment: MainAxisAlignment.end,
              children: [
                ChoiceChip(
                  label: const TrText('FR'),
                  selected: context.watch<LocaleProvider>().locale.languageCode == 'fr',
                  onSelected: (_) async {
                    context.read<LocaleProvider>().setLocale(const Locale('fr'));
                    if (_userId != null) {
                      await _firestoreService.updateUserProfile(_userId!, {
                        'languageCode': 'fr',
                      });
                    }
                  },
                ),
                const SizedBox(width: 8),
                ChoiceChip(
                  label: const TrText('EN'),
                  selected: context.watch<LocaleProvider>().locale.languageCode == 'en',
                  onSelected: (_) async {
                    context.read<LocaleProvider>().setLocale(const Locale('en'));
                    if (_userId != null) {
                      await _firestoreService.updateUserProfile(_userId!, {
                        'languageCode': 'en',
                      });
                    }
                  },
                ),
              ],
            ),
            const SizedBox(height: 16),

            // Nom d'utilisateur
            TrText(
              AppLocalizations.of(context)!.tr('your_name_label'),
              style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
            ),
            const SizedBox(height: 8),
            TextFormField(
              controller: _nameController,
              decoration: InputDecoration(
                hintText: AppLocalizations.of(context)!.tr('name_hint'),
                prefixIcon: const Icon(Icons.person_outline),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
                filled: true,
                fillColor: _brandSurface,
              ),
              validator: (value) {
                if (value == null || value.trim().isEmpty) {
                  return AppLocalizations.of(context)!.tr('enter_name_error');
                }
                return null;
              },
            ),

                        // Devise
            const SizedBox(height: 32),
            TrText(
              AppLocalizations.of(context)!.tr('default_currency_label'),
              style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
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
            const SizedBox(height: 32),
            // Revenu mensuel
            TrText(
              AppLocalizations.of(context)!.tr('monthly_income_label'),
              style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
            ),
            const SizedBox(height: 8),
            TextFormField(
              controller: _incomeController,
              keyboardType: TextInputType.number,
              inputFormatters: [
                FilteringTextInputFormatter.allow(RegExp(r'^\d+\.?\d{0,2}')),
              ],
              decoration: InputDecoration(
                hintText: '0',
                prefixIcon: const Icon(Icons.attach_money),
                suffixText: _currency,
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
                filled: true,
                fillColor: _brandSurface,
              ),
            ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildCurrencyOption(String code, String symbol) {
    final isSelected = _currency == code;
    return GestureDetector(
      onTap: () async {
        setState(() => _currency = code);
        if (_userId != null) {
          await _firestoreService.updateUserProfile(_userId!, {
            'currency': _currency,
          });
        }
      },
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

  // Étape 2: Tutoriel de découverte
  Widget _buildStep2Discovery() {
    return DiscoveryTutorial(
      onComplete: () {
        _nextPage();
      },
      onSkip: () {
        _nextPage();
      },
    );
  }

  // Étape 3: Configuration rapide
  Widget _buildStep3QuickSetup() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(24.0),
      child: Form(
        key: _formKeyStep3,
        child: Card(
          elevation: 2,
          shadowColor: Colors.black.withOpacity(0.05),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(18)),
          child: Padding(
            padding: const EdgeInsets.all(16.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Center(
                  child: Column(
                    children: [
                      const TrText(
                        '⚡ Configuration Rapide',
                        style: TextStyle(fontSize: 28, fontWeight: FontWeight.w800),
                      ),
                      const SizedBox(height: 6),
                      TrText(
                        'Ajoutez un compte, un budget et un objectif en quelques secondes',
                        style: TextStyle(fontSize: 15, color: Colors.grey[700]),
                        textAlign: TextAlign.center,
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 32),

                // Compte principal (obligatoire)
                _buildSectionHeader('💳 Votre premier compte', required: true),
                const SizedBox(height: 16),

                TextFormField(
                  controller: _accountNameController,
                  decoration: InputDecoration(
                    labelText: t('Nom du compte'),
                    hintText: t('Ex: Compte Courant'),
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                    filled: true,
                    fillColor: _brandSurface,
                  ),
                  validator: (value) {
                    if (value == null || value.trim().isEmpty) {
                      return t('Nom requis');
                    }
                    return null;
                  },
                ),
                const SizedBox(height: 12),

                TextFormField(
                  controller: _accountBalanceController,
                  keyboardType: TextInputType.number,
                  inputFormatters: [
                    FilteringTextInputFormatter.allow(RegExp(r'^\d+\.?\d{0,2}')),
                  ],
                  decoration: InputDecoration(
                    labelText: t('Solde actuel'),
                    hintText: '0',
                    suffixText: _currency,
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                    filled: true,
                    fillColor: _brandSurface,
                  ),
                  validator: (value) {
                    if (value == null || value.isEmpty) {
                      return t('Solde requis');
                    }
                    final amount = double.tryParse(value);
                    if (amount == null) {
                      return t('Montant invalide');
                    }
                    return null;
                  },
                ),
                const SizedBox(height: 12),

                // Sélecteur d'icône et couleur
                Row(
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          TrText(
                            'Icône',
                            style: TextStyle(fontSize: 12, color: Colors.grey[600]),
                          ),
                          const SizedBox(height: 8),
                          Wrap(
                            spacing: 8,
                            children: _accountIcons.map((icon) {
                              final isSelected = _selectedAccountIcon == icon;
                              return GestureDetector(
                                onTap: () {
                                  setState(() {
                                    _selectedAccountIcon = icon;
                                  });
                                },
                                child: Container(
                                  padding: const EdgeInsets.all(8),
                                  decoration: BoxDecoration(
                                    color: isSelected ? _brandSurface : Colors.grey[100],
                                    borderRadius: BorderRadius.circular(8),
                                    border: Border.all(
                                      color: isSelected ? _brandPrimary : Colors.transparent,
                                      width: 2,
                                    ),
                                  ),
                                  child: Text(icon, style: const TextStyle(fontSize: 24)),
                                ),
                              );
                            }).toList(),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 32),

                // Budget mensuel (optionnel)
                _buildSectionHeader('🎯 Budget mensuel', required: false),
                const SizedBox(height: 8),
                SwitchListTile(
                  title: const TrText('Définir un budget'),
                  subtitle: const TrText('Contrôlez vos dépenses mensuelles'),
                  value: _wantsBudget,
                  onChanged: (value) {
                    setState(() {
                      _wantsBudget = value;
                      if (value && _incomeController.text.isNotEmpty) {
                        _budgetAmountController.text = _incomeController.text;
                      }
                    });
                  },
                  activeColor: _brandPrimary,
                  contentPadding: EdgeInsets.zero,
                ),
                if (_wantsBudget) ...[
                  const SizedBox(height: 12),
                  TextFormField(
                    controller: _budgetAmountController,
                    keyboardType: TextInputType.number,
                    inputFormatters: [
                      FilteringTextInputFormatter.allow(RegExp(r'^\d+\.?\d{0,2}')),
                    ],
                    decoration: InputDecoration(
                      labelText: t('Montant du budget'),
                      hintText: '0',
                      suffixText: _currency,
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                      filled: true,
                      fillColor: _brandSurface,
                    ),
                  ),
                ],
                const SizedBox(height: 24),

                // Premier objectif (optionnel)
                _buildSectionHeader('🏆 Premier objectif', required: false),
                const SizedBox(height: 8),
                SwitchListTile(
                  title: const TrText('Créer un objectif d\'épargne'),
                  subtitle: const TrText('Définissez une cible à atteindre'),
                  value: _wantsGoal,
                  onChanged: (value) {
                    setState(() {
                      _wantsGoal = value;
                    });
                  },
                  activeColor: _brandPrimary,
                  contentPadding: EdgeInsets.zero,
                ),
                if (_wantsGoal) ...[
                  const SizedBox(height: 12),
                  TextFormField(
                    controller: _goalNameController,
                    decoration: InputDecoration(
                      labelText: t('Nom de l\'objectif'),
                      hintText: t('Ex: Vacances, Voiture'),
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                      filled: true,
                      fillColor: _brandSurface,
                    ),
                  ),
                  const SizedBox(height: 12),
                  TextFormField(
                    controller: _goalAmountController,
                    keyboardType: TextInputType.number,
                    inputFormatters: [
                      FilteringTextInputFormatter.allow(RegExp(r'^\d+\.?\d{0,2}')),
                    ],
                    decoration: InputDecoration(
                      labelText: t('Montant cible'),
                      hintText: '0',
                      suffixText: _currency,
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                      filled: true,
                      fillColor: _brandSurface,
                    ),
                  ),
                ],
                const SizedBox(height: 32),

                // Note
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: Colors.blue[50],
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: Colors.blue[200]!),
                  ),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Icon(Icons.info_outline, color: Colors.blue[700], size: 20),
                      const SizedBox(width: 12),
                      Expanded(
                        child: TrText(
                          'Vous pourrez ajouter plus de comptes, catégories et objectifs depuis le tableau de bord.',
                          style: TextStyle(fontSize: 13, color: Colors.blue[900]),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildSectionHeader(String title, {required bool required}) {
    return Row(
      children: [
        TrText(
          title,
          style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
        ),
        if (required) ...[
          const SizedBox(width: 8),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
            decoration: BoxDecoration(
              color: Colors.red[50],
              borderRadius: BorderRadius.circular(4),
              border: Border.all(color: Colors.red[200]!),
            ),
            child: TrText(
              'Requis',
              style: TextStyle(fontSize: 10, color: Colors.red[700]),
            ),
          ),
        ] else ...[
          const SizedBox(width: 8),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
            decoration: BoxDecoration(
              color: Colors.grey[200],
              borderRadius: BorderRadius.circular(4),
            ),
            child: TrText(
              'Optionnel',
              style: TextStyle(fontSize: 10, color: Colors.grey[700]),
            ),
          ),
        ],
      ],
    );
  }

  @override
  void dispose() {
    _pageController.dispose();
    _nameController.dispose();
    _incomeController.dispose();
    _accountNameController.dispose();
    _accountBalanceController.dispose();
    _budgetAmountController.dispose();
    _goalNameController.dispose();
    _goalAmountController.dispose();
    super.dispose();
  }

  void _previousPage() {
    final prev = (_currentPage - 1).clamp(0, 2);
    _pageController.animateToPage(prev, duration: const Duration(milliseconds: 300), curve: Curves.easeOut);
  }

  void _nextPage() {
    if (_currentPage == 0) {
      if (_formKeyStep1.currentState?.validate() != true) return;
    }
    if (_currentPage == 2) return;
    final next = (_currentPage + 1).clamp(0, 2);
    _pageController.animateToPage(next, duration: const Duration(milliseconds: 300), curve: Curves.easeOut);
  }

  Future<void> _completeOnboarding() async {
    if (_formKeyStep3.currentState?.validate() != true) {
      // Even if optional parts, the account is required
      return;
    }

    final userId = _firestoreService.currentUserId;
    if (userId == null) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: TrText('Connexion requise pour finaliser.')),
      );
      return;
    }

    try {
      // Save basic profile
      await _firestoreService.updateUserProfile(userId, {
        'displayName': _nameController.text.trim(),
        'currency': _currency,
        'monthlyIncome': double.tryParse(_incomeController.text.trim()) ?? 0,
        'languageCode': context.read<LocaleProvider>().locale.languageCode,
        'onboardingCompleted': true,
      });

      // Default categories
      await _firestoreService.createDefaultCategories(_currency);

      // Create first account
      final balance = double.tryParse(_accountBalanceController.text.trim()) ?? 0;
      await _firestoreService.addAccount(
        userId: userId,
        name: _accountNameController.text.trim(),
        type: AccountType.checking,
        balance: balance,
        currency: _currency,
        icon: _selectedAccountIcon,
        color: '#6C5CF7',
      );

      // Optional budget
      if (_wantsBudget && _budgetAmountController.text.trim().isNotEmpty) {
        final budgetAmount = double.tryParse(_budgetAmountController.text.trim()) ?? 0;
        await _firestoreService.saveBudgetPlan(
          userId: userId,
          totalBudget: budgetAmount,
          categoryAllocations: {'general': budgetAmount},
        );
      }

      // Optional goal
      if (_wantsGoal && _goalNameController.text.trim().isNotEmpty && _goalAmountController.text.trim().isNotEmpty) {
        final goalAmount = double.tryParse(_goalAmountController.text.trim()) ?? 0;
        await _firestoreService.addGoal(
          userId: userId,
          name: _goalNameController.text.trim(),
          targetAmount: goalAmount,
          targetDate: DateTime.now().add(const Duration(days: 90)),
          color: '#6C5CF7',
        );
      }

      if (!mounted) return;
      Navigator.of(context).pushReplacement(
        MaterialPageRoute(builder: (_) => const _SuccessScreen()),
      );
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: TrText('Erreur: ${e.toString()}')),
      );
    }
  }
}

// Classe helper pour les inputs de compte
// Ancien modèle _AccountInput supprimé dans le flux simplifié

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
                  Navigator.of(context, rootNavigator: true).pushAndRemoveUntil(
                    MaterialPageRoute(builder: (_) => const MainNavigationShell()),
                    (route) => false,
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
