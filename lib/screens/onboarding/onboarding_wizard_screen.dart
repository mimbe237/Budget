import 'package:flutter/material.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import '../../models/account.dart';
import '../../services/firestore_service.dart';
import 'package:budget/l10n/app_localizations.dart';
import '../../constants/default_categories.dart';
import '../../services/currency_service.dart';
import '../../models/budget_plan.dart';
import 'package:provider/provider.dart';

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
  String? _userId; // UID pour autosave
  
  // Liste des comptes initiaux
  final List<_AccountInput> _initialAccounts = [
    _AccountInput(name: 'Compte Courant', balance: 0.0, type: AccountType.checking, icon: '💳', color: '#6366F1'),
    _AccountInput(name: 'Épargne', balance: 0.0, type: AccountType.savings, icon: '🐷', color: '#4CAF50'),
    _AccountInput(name: 'Espèces', balance: 0.0, type: AccountType.cash, icon: '💵', color: '#FF9800'),
    _AccountInput(name: 'Mobile Money', balance: 0.0, type: AccountType.mobileWallet, icon: '📱', color: '#9C27B0'),
  ];
  
  // Allocation budgétaire (initialisée depuis les catégories par défaut)
  late Map<String, double> _budgetAllocation;

  @override
  void initState() {
    super.initState();
    _budgetAllocation = _buildDefaultAllocation();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _prefillCurrencyFromProfileOrLocale();
      _ensureUserAndProfile();
    });
  }

  Future<void> _ensureUserAndProfile() async {
    try {
      final existingUserId = _firestoreService.currentUserId;
      _userId = existingUserId ?? await _firestoreService.signInAnonymously();
      // Créer le profil si manquant dès le départ (merge)
      await _firestoreService.updateUserProfile(_userId!, {
        'displayName': _name.isNotEmpty ? _name : 'Utilisateur',
        'currency': _currency,
        'languageCode': Localizations.localeOf(context).languageCode,
        'needsOnboarding': true,
        'updatedAt': Timestamp.fromDate(DateTime.now()),
      });
    } catch (e) {
      debugPrint('Onboarding init failed: $e');
    }
  }

  Map<String, double> _buildDefaultAllocation() {
    final expenseCategories = DefaultCategories.expenseCategories;
    if (expenseCategories.isEmpty) return {};

    // Mapping des noms de catégories par défaut vers le plan recommandé
    const Map<String, String> synonymToDefault = {
      'Alimentation': 'Nourriture',
      'Restaurant': 'Nourriture',
      'Logement': 'Logement',
      'Transport': 'Transport',
      'Santé': 'Santé',
      'Loisirs': 'Loisirs',
      'Shopping': 'Loisirs',
      'Services': 'Factures',
      'Abonnements': 'Factures',
      'Éducation': 'Famille',
    };

    // Grouper les catégories qui pointent vers la même clé de répartition
    final Map<String, List<String>> byDefaultKey = {};
    for (final cat in expenseCategories) {
      final name = cat['name'] as String;
      final icon = cat['icon'] as String;
      final key = '$icon $name';
      final defaultKey = synonymToDefault[name] ?? name;
      if (DEFAULT_ALLOCATION.containsKey(defaultKey)) {
        byDefaultKey.putIfAbsent(defaultKey, () => []).add(key);
      }
    }

    final Map<String, double> allocations = {};
    double assignedTotal = 0.0;

    // Répartir l'allocation recommandée entre les catégories liées
    DEFAULT_ALLOCATION.forEach((defaultKey, percentage) {
      final list = byDefaultKey[defaultKey];
      if (list == null || list.isEmpty) return;
      final share = percentage / list.length;
      for (final key in list) {
        allocations[key] = share;
        assignedTotal += share;
      }
    });

    // Si des catégories restent non mappées, leur donner une part égale du reliquat
    final Set<String> allKeys = expenseCategories
        .map((c) => '${c['icon']} ${c['name']}')
        .toSet();
    final unmapped = allKeys.difference(allocations.keys.toSet()).toList();
    final remaining = (1.0 - assignedTotal).clamp(0.0, 1.0);
    if (remaining > 0 && unmapped.isNotEmpty) {
      final share = remaining / unmapped.length;
      for (final key in unmapped) {
        allocations[key] = share;
      }
    }

    return allocations;
  }

  Future<void> _prefillCurrencyFromProfileOrLocale() async {
    String? inferredCurrency;

    try {
      final userId = _firestoreService.currentUserId;
      if (userId != null) {
        final profile = await _firestoreService.getUserProfile(userId);

        if (profile != null) {
          if (!profile.needsOnboarding && profile.currency.isNotEmpty) {
            inferredCurrency = profile.currency;
          } else {
            inferredCurrency = CurrencyService.guessCurrencyFromCountry(profile.countryCode);
          }
        }
      }
    } catch (_) {
      // En cas d'échec, on passera au fallback locale
    }

    inferredCurrency ??=
        CurrencyService.guessCurrencyFromLocale(Localizations.localeOf(context));

    if (inferredCurrency != null &&
        CurrencyService.supportedCurrencies.containsKey(inferredCurrency) &&
        mounted) {
      setState(() {
        _currency = inferredCurrency!;
      });
    }
  }

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
    final totalAllocation = _budgetAllocation.values.isEmpty
        ? 0.0
        : _budgetAllocation.values.reduce((a, b) => a + b);

    if (totalAllocation > 1.0 + 0.0001) {
      final overflowPercent = (totalAllocation - 1.0) * 100;
      final overflowAmount = (_monthlyIncome * (totalAllocation - 1.0)).abs();
      final overflowAmountText =
          overflowAmount > 0 ? ' (+${overflowAmount.toStringAsFixed(2)} $_currency)' : '';

      await showDialog(
        context: context,
        builder: (context) => AlertDialog(
          title: const TrText('Budget dépassé'),
          content: TrText(
            'Le total atteint ${(totalAllocation * 100).toStringAsFixed(1)}% '
            '(+${overflowPercent.toStringAsFixed(1)}%)$overflowAmountText.\n'
            'Réduisez certaines lignes pour revenir à 100% avant de terminer.',
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: const TrText('Ajuster le budget'),
            ),
          ],
        ),
      );
      return;
    }
    
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: TrText('Sauvegarde en cours...'), duration: Duration(seconds: 1)),
    );

    try {
      // 1. Utilisateur courant ou anonyme
      final existingUserId = _firestoreService.currentUserId;
      final userId = existingUserId ?? await _firestoreService.signInAnonymously();
      final langCode = Localizations.localeOf(context).languageCode;

      // 2. Créer ou mettre à jour le profil
      if (existingUserId == null) {
        await _firestoreService.createUserProfile(
          userId: userId,
          displayName: _name.isEmpty ? 'Utilisateur' : _name,
          currency: _currency,
          languageCode: langCode,
          needsOnboarding: false,
        );
      } else {
        final profile = await _firestoreService.getUserProfile(userId);
        if (profile == null) {
          await _firestoreService.createUserProfile(
            userId: userId,
            displayName: _name.isEmpty ? 'Utilisateur' : _name,
            currency: _currency,
            languageCode: langCode,
            needsOnboarding: false,
          );
        } else {
          await _firestoreService.updateUserProfile(userId, {
            'currency': _currency,
            'languageCode': langCode,
            'needsOnboarding': false,
          });
        }
      }

      // 2.1 Garantir la présence des catégories par défaut
      await _firestoreService.createDefaultCategories(userId);
      
      // 3. Créer les comptes s'il n'en existe pas déjà
      final existingAccounts = await _firestoreService.getAccounts(userId);
      if (existingAccounts.isEmpty) {
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
      }
      
      // 4. Sauvegarder le budget (Module 5)
      await _firestoreService.saveBudgetPlan(
        userId: userId,
        totalBudget: _monthlyIncome,
        categoryAllocations: _budgetAllocation,
      );
      await CurrencyService().setCurrency(_currency);
      
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
    final clamped = newPercentage.clamp(0.0, 1.0).toDouble();
    setState(() {
      _budgetAllocation[category] = clamped;
    });
  }

  @override
  Widget build(BuildContext context) {
    final progress = (_currentPage + 1) / 3.0;

    return Scaffold(
      resizeToAvoidBottomInset: false,
      appBar: AppBar(
        leading: const SizedBox.shrink(),
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
            
            TextFormField(
              decoration: InputDecoration(
                labelText: t('Votre prénom'),
                hintText: t('ex: Marie'),
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                prefixIcon: const Icon(Icons.person_outline),
                filled: true,
                fillColor: Colors.grey[50],
              ),
              onChanged: (value) async {
                _name = value;
                if (_userId != null) {
                  await _firestoreService.updateUserProfile(_userId!, {
                    'displayName': _name.isNotEmpty ? _name : 'Utilisateur',
                  });
                }
              },
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
            'Vos comptes par défaut sont prêts. Renseignez le solde de l’un d’eux ou ajoutez un compte si besoin.',
            style: TextStyle(fontSize: 16, color: Colors.grey[600], fontWeight: FontWeight.w600),
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
                suffixText: CurrencyService.supportedCurrencies[_currency] ?? _currency,
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                filled: true,
                fillColor: Colors.grey[50],
              ),
              onChanged: (value) async {
                account.balance = double.tryParse(value) ?? 0.0;
                // Autosave: créer/mettre à jour des comptes par défaut dès saisie
                if (_userId != null) {
                  final existingAccounts = await _firestoreService.getAccounts(_userId!);
                  if (existingAccounts.isEmpty) {
                    // Créer si inexistant
                    for (var a in _initialAccounts) {
                      await _firestoreService.addAccount(
                        userId: _userId!,
                        name: a.name.isNotEmpty ? a.name : 'Compte',
                        type: a.type,
                        balance: a.balance,
                        currency: _currency,
                        icon: a.icon,
                        color: a.color,
                      );
                    }
                  }
                }
              },
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildStep3Budget() {
    final totalPercentage = _budgetAllocation.values.isEmpty
        ? 0.0
        : _budgetAllocation.values.reduce((a, b) => a + b);
    final isOver = totalPercentage > 1.0;
    final isBalanced = !isOver && (totalPercentage - 1.0).abs() < 0.01;
    final statusColor = isOver
        ? Colors.red
        : isBalanced
            ? Colors.green
            : Colors.orange;
    final overflowPercent = isOver ? (totalPercentage - 1.0) * 100 : 0.0;
    final overflowAmount = (isOver && _monthlyIncome > 0)
        ? _monthlyIncome * (totalPercentage - 1.0)
        : 0.0;
    
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
              'Définissez votre allocation (100% recommandé, en dessous c\'est OK; au-dessus sera bloqué).',
              style: TextStyle(fontSize: 16, color: Colors.grey[600]),
            ),
            const SizedBox(height: 8),
            TrText(
              'Nous avons pré-chargé vos catégories par défaut; ajustez chaque ligne librement.',
              style: TextStyle(fontSize: 13, color: Colors.grey[600], fontWeight: FontWeight.w600),
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
              onChanged: (value) async {
                setState(() => _monthlyIncome = double.tryParse(value) ?? 0.0);
                // Autosave budget draft (not blocking)
                if (_userId != null && _monthlyIncome > 0) {
                  try {
                    await _firestoreService.saveBudgetPlan(
                      userId: _userId!,
                      totalBudget: _monthlyIncome,
                      categoryAllocations: _budgetAllocation,
                    );
                  } catch (_) {}
                }
              },
              validator: (value) => (double.tryParse(value ?? '0') ?? 0) <= 0 
                  ? 'Montant requis' : null,
            ),
            
            const SizedBox(height: 32),
            
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: statusColor.withOpacity(0.08),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(
                  color: statusColor,
                  width: 2,
                ),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const TrText(
                          'Total de la répartition',
                          style: TextStyle(fontWeight: FontWeight.bold),
                        ),
                        const SizedBox(height: 4),
                        TrText(
                          isOver
                              ? 'Dépassement de +${overflowPercent.toStringAsFixed(1)}%'
                                  '${overflowAmount > 0 ? ' (+${overflowAmount.toStringAsFixed(2)} $_currency)' : ''}'
                              : isBalanced
                                  ? 'Total à 100% - prêt à enregistrer'
                                  : 'Total actuel ${(totalPercentage * 100).toStringAsFixed(0)}% (vous pourrez compléter plus tard)',
                          style: TextStyle(
                            color: statusColor,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(width: 12),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                    decoration: BoxDecoration(
                      color: statusColor.withOpacity(0.12),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: TrText(
                      '${(totalPercentage * 100).toStringAsFixed(0)}%',
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                        color: statusColor,
                      ),
                    ),
                  )
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
