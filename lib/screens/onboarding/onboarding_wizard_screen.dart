import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import 'package:budget/l10n/localization_helpers.dart';
import 'package:budget/l10n/app_localizations.dart';

import '../../models/account.dart';
import '../../services/firestore_service.dart';
import '../../widgets/discovery_tutorial.dart';
import '../navigation/main_navigation_shell.dart';
import '../../providers/locale_provider.dart';
import '../../l10n/app_localizations.dart';

class _AccountTemplate {
  final String name;
  final AccountType type;
  final String icon;
  final String color;

  const _AccountTemplate({
    required this.name,
    required this.type,
    required this.icon,
    required this.color,
  });
}

class _AccountDraft {
  _AccountDraft({
    required this.type,
    required this.icon,
    required this.color,
    String name = '',
    double balance = 0,
  })  : nameController = TextEditingController(text: name),
        balanceController = TextEditingController(
          text: balance == 0 ? '0' : balance.toStringAsFixed(balance.truncateToDouble() == balance ? 0 : 2),
        );

  final TextEditingController nameController;
  final TextEditingController balanceController;
  final AccountType type;
  final String icon;
  final String color;

  void dispose() {
    nameController.dispose();
    balanceController.dispose();
  }
}

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
  static const Color _brandAccent = Color(0xFF00D9FF);

  final PageController _pageController = PageController();
  int _currentPage = 0;

  final _firestoreService = FirestoreService();

  final _formKeyStep1 = GlobalKey<FormState>();
  final _formKeyStep3 = GlobalKey<FormState>();
  
  String? _userId;
  final TextEditingController _nameController = TextEditingController();
  String _currency = 'XAF';

  final List<_AccountTemplate> _suggestedAccountTemplates = const [
    _AccountTemplate(
      name: 'Compte principal',
      type: AccountType.checking,
      icon: '💳',
      color: '#6366F1',
    ),
    _AccountTemplate(
      name: 'Épargne',
      type: AccountType.savings,
      icon: '🐷',
      color: '#4CAF50',
    ),
    _AccountTemplate(
      name: 'Carte',
      type: AccountType.creditCard,
      icon: '💳',
      color: '#9C27B0',
    ),
    _AccountTemplate(
      name: 'Espèces',
      type: AccountType.cash,
      icon: '💵',
      color: '#FF9800',
    ),
  ];

  late List<_AccountDraft> _accountDrafts;

  final TextEditingController _budgetAmountController = TextEditingController();

  bool _wantsGoal = false;
  final TextEditingController _goalNameController = TextEditingController();
  final TextEditingController _goalAmountController = TextEditingController();

  String t(String key) {
    // Fallback simple localizer; AppLocalizations may replace this via TrText
    return key;
  }

  @override
  void initState() {
    super.initState();
    _accountDrafts = _buildSuggestedDrafts();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      extendBodyBehindAppBar: true,
      backgroundColor: _brandSurface,
      appBar: AppBar(
        title: const TrText('Configuration immersive'),
        backgroundColor: Colors.transparent,
        foregroundColor: Colors.white,
        elevation: 0,
      ),
      body: Stack(
        children: [
          // Fond vibrant
          Positioned.fill(
            child: Container(
              decoration: const BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                  colors: [
                    Color(0xFF1C1A33),
                    Color(0xFF100F2A),
                    Color(0xFF0F1424),
                  ],
                ),
              ),
            ),
          ),
          Positioned(
            top: -80,
            left: -40,
            child: _blurredCircle(180, _brandPrimary.withOpacity(0.35)),
          ),
          Positioned(
            top: 40,
            right: -50,
            child: _blurredCircle(160, _brandSecondary.withOpacity(0.3)),
          ),
          Positioned(
            bottom: -60,
            left: 20,
            child: _blurredCircle(200, _brandAccent.withOpacity(0.25)),
          ),
          SafeArea(
            child: LayoutBuilder(
              builder: (context, constraints) {
                return SingleChildScrollView(
                  padding: EdgeInsets.zero,
                  child: ConstrainedBox(
                    constraints: BoxConstraints(minHeight: constraints.maxHeight),
                    child: Column(
                      children: [
                        const SizedBox(height: 12),
                        _buildHeroBanner(),
                        const SizedBox(height: 12),
                        _buildStepBadges(),
                        const SizedBox(height: 8),
                        SizedBox(
                          height: constraints.maxHeight * 0.55,
                          child: PageView(
                            controller: _pageController,
                            physics: const ClampingScrollPhysics(),
                            onPageChanged: (index) {
                              if (!mounted) return;
                              setState(() => _currentPage = index);
                            },
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
                              backgroundColor: Colors.white.withOpacity(0.2),
                              valueColor: AlwaysStoppedAnimation<Color>(_brandPrimary),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }

  Widget _blurredCircle(double size, Color color) {
    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        color: color,
        boxShadow: [
          BoxShadow(
            color: color,
            blurRadius: 60,
            spreadRadius: 30,
          ),
        ],
      ),
    );
  }

  Widget _buildHeroBanner() {
    final titles = [
      'Bienvenue',
      'Découverte',
      'Configuration',
    ];
    final subtitles = [
      'Personnalisez votre profil en 2 minutes.',
      'Explorez les super-pouvoirs Budget Pro.',
      'Activez comptes, budgets et objectifs.',
    ];

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Container(
        padding: const EdgeInsets.all(18),
        decoration: BoxDecoration(
          gradient: LinearGradient(
            colors: [
              Colors.white.withOpacity(0.12),
              Colors.white.withOpacity(0.06),
            ],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
          borderRadius: BorderRadius.circular(18),
          border: Border.all(color: Colors.white.withOpacity(0.2)),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.25),
              blurRadius: 18,
              offset: const Offset(0, 12),
            ),
          ],
        ),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: Colors.white.withOpacity(0.12),
                border: Border.all(color: Colors.white.withOpacity(0.3)),
              ),
              child: const Icon(Icons.bolt, color: Colors.white, size: 26),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  TrText(
                    'Parcours express',
                    style: TextStyle(
                      color: Colors.white.withOpacity(0.9),
                      fontSize: 14,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                  const SizedBox(height: 4),
                  TrText(
                    titles[_currentPage],
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 18,
                      fontWeight: FontWeight.w900,
                      letterSpacing: -0.3,
                    ),
                  ),
                  const SizedBox(height: 4),
                  TrText(
                    subtitles[_currentPage],
                    style: TextStyle(
                      color: Colors.white.withOpacity(0.8),
                      fontSize: 12,
                    ),
                  ),
                ],
              ),
            ),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              decoration: BoxDecoration(
                color: Colors.white.withOpacity(0.08),
                borderRadius: BorderRadius.circular(14),
                border: Border.all(color: Colors.white.withOpacity(0.2)),
              ),
              child: Row(
                children: [
                  const Icon(Icons.timelapse, color: Colors.white, size: 16),
                  const SizedBox(width: 6),
                  TrText(
                    '${_currentPage + 1}/3',
                    style: const TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildStepBadges() {
    final steps = [
      {'icon': Icons.person, 'label': 'Profil'},
      {'icon': Icons.auto_graph, 'label': 'Découverte'},
      {'icon': Icons.flag, 'label': 'Activation'},
    ];

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: steps.asMap().entries.map((entry) {
          final idx = entry.key;
          final data = entry.value;
          final bool active = idx <= _currentPage;
          return Expanded(
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 250),
              margin: EdgeInsets.only(right: idx == steps.length - 1 ? 0 : 8),
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(14),
                gradient: active
                    ? LinearGradient(
                        colors: [_brandPrimary, _brandSecondary.withOpacity(0.9)],
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                      )
                    : null,
                color: active ? null : Colors.white.withOpacity(0.08),
                border: Border.all(
                  color: active ? Colors.white.withOpacity(0.1) : Colors.white.withOpacity(0.2),
                ),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(
                    data['icon'] as IconData,
                    size: 18,
                    color: active ? Colors.white : Colors.white70,
                  ),
                  const SizedBox(width: 6),
                  TrText(
                    data['label'] as String,
                    style: TextStyle(
                      color: active ? Colors.white : Colors.white70,
                      fontWeight: FontWeight.w700,
                      fontSize: 12,
                    ),
                  ),
                ],
              ),
            ),
          );
        }).toList(),
      ),
    );
  }

  Widget _buildBottomControls() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.04),
        border: Border(
          top: BorderSide(color: Colors.white.withOpacity(0.12)),
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.25),
            blurRadius: 18,
            offset: const Offset(0, -6),
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
              style: TextButton.styleFrom(foregroundColor: Colors.white70),
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

  List<_AccountDraft> _buildSuggestedDrafts() {
    return _suggestedAccountTemplates
        .map(
          (template) => _AccountDraft(
            name: template.name,
            type: template.type,
            icon: template.icon,
            color: template.color,
          ),
        )
        .toList();
  }

  _AccountDraft _createEmptyAccountDraft() {
    return _AccountDraft(
      type: AccountType.other,
      icon: '💠',
      color: '#6C5CF7',
      name: '',
    );
  }

  void _resetDraftsToSuggested() {
    _disposeAccountDrafts();
    _accountDrafts = _buildSuggestedDrafts();
  }

  void _disposeAccountDrafts() {
    for (final draft in _accountDrafts) {
      draft.dispose();
    }
    _accountDrafts = [];
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

                _buildAccountsSection(),
                const SizedBox(height: 32),

                // Budget mensuel (obligatoire)
                _buildSectionHeader('💰 Budget mensuel', required: true),
                const SizedBox(height: 8),
                const TrText(
                  'Définissez votre enveloppe mensuelle pour contrôler vos dépenses',
                  style: TextStyle(fontSize: 13, color: Colors.grey),
                ),
                const SizedBox(height: 12),
                if (true) ...[
                  const SizedBox(height: 12),
                  TextFormField(
                    controller: _budgetAmountController,
                    keyboardType: TextInputType.number,
                    inputFormatters: [
                      FilteringTextInputFormatter.allow(RegExp(r'^\d+\.?\d{0,2}')),
                    ],
                    validator: (value) {
                      if (value == null || value.trim().isEmpty) {
                        return t('Le budget est obligatoire');
                      }
                      final amount = double.tryParse(value);
                      if (amount == null || amount <= 0) {
                        return t('Veuillez entrer un montant valide');
                      }
                      return null;
                    },
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

  Widget _buildAccountsSection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _buildSectionHeader('💳 Vos comptes', required: true),
        const SizedBox(height: 8),
        Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: _brandSurface,
            borderRadius: BorderRadius.circular(12),
          ),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Icon(Icons.lightbulb_outline, color: Colors.amber, size: 18),
              const SizedBox(width: 8),
              Expanded(
                child: TrText(
                  'Au moins 1 compte est obligatoire. Créez votre compte principal, épargne, carte ou espèces.',
                  style: TextStyle(fontSize: 13, color: Colors.grey[800]),
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 10),
        TrText(
          'Solde initial : 0 $_currency par défaut',
          style: TextStyle(fontSize: 12, color: Colors.grey[700]),
        ),
        const SizedBox(height: 12),
        ..._accountDrafts.asMap().entries.map((entry) {
          final index = entry.key;
          final draft = entry.value;
          return Padding(
            padding: EdgeInsets.only(bottom: index == _accountDrafts.length - 1 ? 0 : 12),
            child: _buildAccountDraftCard(draft, index),
          );
        }),
        const SizedBox(height: 12),
        OutlinedButton.icon(
          onPressed: () {
            setState(() {
              _accountDrafts.add(_createEmptyAccountDraft());
            });
          },
          style: OutlinedButton.styleFrom(
            foregroundColor: _brandPrimary,
            side: BorderSide(color: _brandPrimary.withOpacity(0.4)),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          ),
          icon: const Icon(Icons.add),
          label: const TrText('Ajouter un compte'),
        ),
      ],
    );
  }

  Widget _buildAccountDraftCard(_AccountDraft draft, int index) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: Colors.grey.shade200),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.04),
            blurRadius: 8,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: _brandSurface,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Text(draft.icon, style: const TextStyle(fontSize: 20)),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: TextFormField(
                  controller: draft.nameController,
                  decoration: InputDecoration(
                    labelText: t('Nom du compte'),
                    hintText: t('Ex: Compte principal'),
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                    filled: true,
                    fillColor: _brandSurface,
                  ),
                ),
              ),
              const SizedBox(width: 8),
              if (_accountDrafts.length > 1)
                IconButton(
                  onPressed: () {
                    setState(() {
                      draft.dispose();
                      _accountDrafts.removeAt(index);
                    });
                  },
                  icon: const Icon(Icons.close, color: Colors.redAccent),
                  tooltip: 'Supprimer',
                ),
            ],
          ),
          const SizedBox(height: 10),
          TextFormField(
            controller: draft.balanceController,
            keyboardType: TextInputType.number,
            inputFormatters: [
              FilteringTextInputFormatter.allow(RegExp(r'^-?\d+\.?\d{0,2}')),
            ],
            decoration: InputDecoration(
              labelText: t('Solde initial (optionnel)'),
              hintText: '0',
              suffixText: _currency,
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
              ),
              filled: true,
              fillColor: _brandSurface,
            ),
          ),
          const SizedBox(height: 6),
          TrText(
            'Par défaut, on utilise 0. Vous pourrez mettre à jour le solde après connexion.',
            style: TextStyle(fontSize: 12, color: Colors.grey[600]),
          ),
        ],
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
    _disposeAccountDrafts();
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
      return;
    }
    
    // Vérifier qu'au moins 1 compte est défini
    final activeDrafts = _accountDrafts.where((draft) => draft.nameController.text.trim().isNotEmpty).toList();
    if (activeDrafts.isEmpty) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: TrText('Au moins 1 compte est obligatoire')),
      );
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
        'languageCode': context.read<LocaleProvider>().locale.languageCode,
        'onboardingCompleted': true,
        'needsOnboarding': false,
      });

      // Default categories
      await _firestoreService.createDefaultCategories(_currency);

      // Build accounts to create (au moins 1 compte est obligatoire)
      final List<Map<String, dynamic>> accountsToSave = [];

      final activeDrafts = _accountDrafts.where((draft) => draft.nameController.text.trim().isNotEmpty).toList();
      for (final draft in activeDrafts) {
        final rawBalance = draft.balanceController.text.trim();
        final parsedBalance = double.tryParse(rawBalance.isEmpty ? '0' : rawBalance) ?? 0;
        accountsToSave.add({
          'name': draft.nameController.text.trim(),
          'type': draft.type,
          'balance': parsedBalance,
          'icon': draft.icon,
          'color': draft.color,
        });
      }

      for (final account in accountsToSave) {
        await _firestoreService.addAccount(
          userId: userId,
          name: account['name'] as String,
          type: account['type'] as AccountType,
          balance: (account['balance'] as double?) ?? 0,
          currency: _currency,
          icon: account['icon'] as String?,
          color: account['color'] as String?,
        );
      }

      // Budget obligatoire avec répartition par défaut
      if (_budgetAmountController.text.trim().isNotEmpty) {
        final budgetAmount = double.tryParse(_budgetAmountController.text.trim()) ?? 0;
          if (budgetAmount > 0) {
            // Répartition par défaut équilibrée des poches budgétaires
            final defaultAllocations = {
              'alimentation': budgetAmount * 0.25,      // 25%
              'transport': budgetAmount * 0.15,         // 15%
            'logement': budgetAmount * 0.30,          // 30%
            'loisirs': budgetAmount * 0.10,           // 10%
            'sante': budgetAmount * 0.08,             // 8%
            'autre': budgetAmount * 0.12,             // 12%
            };
            await _firestoreService.saveBudgetPlan(
              userId: userId,
              totalBudget: budgetAmount,
              expectedIncome: budgetAmount,
              categoryAllocations: defaultAllocations,
            );
          }
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
