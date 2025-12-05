import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

import '../../constants/app_design.dart';
import '../../models/models.dart';
import '../../services/firestore_service.dart';
import '../../widgets/revolutionary_logo.dart';
import '../accounts/account_management_screen.dart';
import '../budget/budget_planner_screen.dart';
import '../categories/category_management_screen.dart';
import '../goals/goal_funding_screen.dart';
import '../ious/iou_tracking_screen.dart';
import '../transactions/transaction_form_screen.dart';
import '../transactions/transactions_list_screen.dart';
import '../trash/trash_screen.dart';
import '../auth/auth_screen.dart';
import '../../models/transaction.dart' as app_transaction;
import 'package:rxdart/rxdart.dart';
import 'package:budget/l10n/localization_helpers.dart';
import 'package:provider/provider.dart';
import 'package:budget/services/currency_service.dart';
import 'package:budget/services/theme_service.dart';
import 'package:firebase_auth/firebase_auth.dart';
import '../onboarding/onboarding_wizard_screen.dart';
import '../settings/settings_hub_screen.dart';
import '../settings/notification_settings_screen.dart';
import '../ai_analysis/ai_analysis_screen.dart';
import '../../providers/locale_provider.dart';

/// Dashboard principal affichant le solde global, les performances mensuelles
/// et l'historique récent des transactions en temps réel
class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  final FirestoreService _firestoreService = FirestoreService();
  final Color _brandTeal = const Color(0xFF00796B);
  final Color _accentCoral = const Color(0xFFFF7A59);
  final Color _softBackground = const Color(0xFFF5F7FB);

  app_transaction.TransactionType? _recentFilter;

  @override
  void initState() {
    super.initState();
    // Nettoyage automatique de la corbeille (items > 3 jours)
    final userId = _firestoreService.currentUserId;
    if (userId != null) {
      _firestoreService.runTrashCleanup(userId);
    }
  }

  @override
  Widget build(BuildContext context) {
    final localeProvider = context.watch<LocaleProvider>();
    final currentLang = localeProvider.locale.languageCode;
    final targetLang = currentLang == 'fr' ? 'en' : 'fr';
    final targetLabel = targetLang == 'fr' ? 'FR 🇫🇷' : 'EN 🇬🇧';
    final selectedLabel = targetLang == 'fr' ? 'Français' : 'English';
    return Scaffold(
      backgroundColor: _softBackground,
      appBar: AppBar(
        toolbarHeight: 74,
        titleSpacing: 12,
        title: LayoutBuilder(
          builder: (context, constraints) {
            return Row(
              mainAxisSize: MainAxisSize.min,
              children: const [
                RevolutionaryLogo(size: 38),
              ],
            );
          },
        ),
        centerTitle: false,
        backgroundColor: Colors.white,
        elevation: 0,
        actions: [
          Padding(
            padding: const EdgeInsets.only(right: 12),
            child: SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  // Bloc 2 : dettes / objectifs / langue
                  Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      IconButton(
                        tooltip: t('Dettes / créances'),
                        icon: const Icon(Icons.handshake, color: AppDesign.primaryIndigo, size: 22),
                        onPressed: () {
                          Navigator.push(
                            context,
                            MaterialPageRoute(
                              builder: (context) => const IOUTrackingScreen(),
                            ),
                          );
                        },
                      ),
                      IconButton(
                        tooltip: t('Objectifs'),
                        icon: const Icon(Icons.flag_outlined, color: AppDesign.primaryIndigo, size: 22),
                        onPressed: () {
                          Navigator.push(
                            context,
                            MaterialPageRoute(
                              builder: (context) => const GoalFundingScreen(),
                            ),
                          );
                        },
                      ),
                      TextButton(
                        onPressed: () async {
                          await localeProvider.setLocale(Locale(targetLang));
                          if (!mounted) return;
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(content: TrText('Langue sélectionnée : $selectedLabel')),
                          );
                        },
                        style: TextButton.styleFrom(
                          padding: const EdgeInsets.symmetric(horizontal: 8),
                          minimumSize: const Size(40, 40),
                        ),
                        child: Text(
                          targetLabel,
                          style: const TextStyle(
                            color: AppDesign.primaryIndigo,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(width: 12),
                  // Bloc 3 : notifications + profil
                  Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      IconButton(
                        icon: const Icon(Icons.notifications_none, color: AppDesign.primaryIndigo, size: 22),
                        tooltip: t('Notifications'),
                        onPressed: () {
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(content: TrText('Notifications à venir')),
                          );
                        },
                      ),
                      const SizedBox(width: 10),
                      InkWell(
                        onTap: () {
                          Navigator.push(
                            context,
                            MaterialPageRoute(builder: (_) => const SettingsHubScreen()),
                          );
                        },
                        borderRadius: BorderRadius.circular(20),
                        child: CircleAvatar(
                          backgroundColor: AppDesign.primaryIndigo.withValues(alpha: 0.1),
                          child: const Icon(Icons.person_outline, color: AppDesign.primaryIndigo),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
      body: SafeArea(
        bottom: true,
        top: false,
        child: LayoutBuilder(
        builder: (context, constraints) {
          final isWide = constraints.maxWidth >= 600;
          if (!isWide) {
              return SingleChildScrollView(
                padding: EdgeInsets.only(
                  bottom: MediaQuery.of(context).padding.bottom + 96,
                ),
                child: Padding(
                  padding: const EdgeInsets.all(AppDesign.spacingLarge),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: _buildMobileSections(context),
                  ),
                ),
              );
          }

            return Padding(
              padding: const EdgeInsets.all(AppDesign.spacingLarge),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Expanded(
                    flex: 3,
                    child: SingleChildScrollView(
                      padding: EdgeInsets.only(
                        bottom: MediaQuery.of(context).padding.bottom + 96,
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: _buildLeftDesktopSections(context),
                      ),
                    ),
                  ),
                  const SizedBox(width: AppDesign.spacingMedium),
                  Expanded(
                    flex: 2,
                    child: SingleChildScrollView(
                      padding: EdgeInsets.only(
                        bottom: MediaQuery.of(context).padding.bottom + 96,
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: _buildRightDesktopSections(context),
                      ),
                    ),
                  ),
                ],
              ),
            );
        },
        ),
      ),
    );
  }

  List<Widget> _buildMobileSections(BuildContext context) {
    return [
      _buildHeroSection(context),
      const SizedBox(height: AppDesign.spacingMedium),
      _buildOnboardingChecklist(context),
      const SizedBox(height: AppDesign.spacingMedium),
      _buildQuickAccess(context),
      const SizedBox(height: AppDesign.spacingLarge),
      _buildBudgetExcellenceCard(),
      const SizedBox(height: AppDesign.spacingLarge),
      _buildPerformanceHeader(context),
      _buildMonthlyInsightCards(context),
      const SizedBox(height: AppDesign.spacingLarge),
      _buildRecentHistoryHeader(context),
      const SizedBox(height: AppDesign.spacingSmall),
      _buildRecentTransactionsList(),
      const SizedBox(height: AppDesign.spacingMedium),
      _buildSummaryByPocketCard(),
    ];
  }

  List<Widget> _buildLeftDesktopSections(BuildContext context) {
    return [
      _buildHeroSection(context),
      const SizedBox(height: AppDesign.spacingMedium),
      _buildOnboardingChecklist(context),
      const SizedBox(height: AppDesign.spacingMedium),
      _buildQuickAccess(context),
      const SizedBox(height: AppDesign.spacingLarge),
      _buildBudgetExcellenceCard(),
      const SizedBox(height: AppDesign.spacingLarge),
      _buildPerformanceHeader(context),
      _buildMonthlyInsightCards(context),
    ];
  }

  List<Widget> _buildRightDesktopSections(BuildContext context) {
    return [
      _buildRecentHistoryHeader(context),
      const SizedBox(height: AppDesign.spacingSmall),
      _buildRecentTransactionsList(),
      const SizedBox(height: AppDesign.spacingMedium),
      _buildSummaryByPocketCard(),
    ];
  }

  Future<bool> _ensureSetupForTransactions(BuildContext context) async {
    final userId = _firestoreService.currentUserId;
    if (userId == null) return true;

    try {
      final profile = await _firestoreService.getUserProfile(userId);
      final budget = await _firestoreService.getCurrentBudgetPlan(userId);
      final needsSetup = (profile?.needsOnboarding ?? true) || budget == null;

      if (!needsSetup) return true;
      if (!mounted) return false;

      await showDialog(
        context: context,
        builder: (ctx) => AlertDialog(
          title: const TrText('Configuration requise'),
          content: const TrText(
            'Définissez votre devise et votre budget avant d\'ajouter une transaction. '
            'Lancez l\'assistant pour renseigner ces paramètres.',
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(ctx),
              child: const TrText('Plus tard'),
            ),
            ElevatedButton(
              onPressed: () {
                Navigator.pop(ctx);
                Navigator.push(
                  context,
                  MaterialPageRoute(builder: (_) => const OnboardingWizardScreen()),
                );
              },
              style: ElevatedButton.styleFrom(backgroundColor: AppDesign.primaryIndigo),
              child: const TrText('Ouvrir l’assistant'),
            ),
          ],
        ),
      );

      return false;
    } catch (_) {
      return false;
    }
  }

  Future<void> _navigateToTransaction(
    BuildContext context,
    app_transaction.TransactionType type,
  ) async {
    final ok = await _ensureSetupForTransactions(context);
    if (!ok) return;
    if (!mounted) return;
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (_) => TransactionFormScreen(transactionType: type),
      ),
    );
  }

  Widget _buildOnboardingChecklist(BuildContext context) {
    final userId = _firestoreService.currentUserId;
    if (userId == null) return const SizedBox.shrink();

    final profile$ = _firestoreService.getUserProfileStream(userId);
    final budget$ = _firestoreService.getBudgetPlanStream(userId);
    final categories$ = _firestoreService.getCategoriesStream(userId);

    return StreamBuilder<List<dynamic>>(
      stream: CombineLatestStream.list([profile$, budget$, categories$]),
      builder: (context, snapshot) {
        if (!snapshot.hasData) {
          return const SizedBox.shrink();
        }

        final profile = snapshot.data![0] as UserProfile?;
        final budgetPlan = snapshot.data![1] as Map<String, dynamic>?;
        final categories = snapshot.data![2] as List<Category>;

        final hasCurrency =
            profile != null && !profile.needsOnboarding && (profile.currency).isNotEmpty;
        final onboardingDone = !(profile?.needsOnboarding ?? true);
        final hasBudget = budgetPlan != null && onboardingDone;
        final hasCategories = categories.isNotEmpty && onboardingDone;
        final completed = [hasCurrency, hasBudget, hasCategories].where((v) => v).length;

        if (completed == 3) return const SizedBox.shrink();

        final progress = completed / 3;

        return Card(
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(AppDesign.radiusLarge)),
          elevation: 0,
          color: AppDesign.primaryIndigo.withOpacity(0.06),
          child: Padding(
            padding: const EdgeInsets.all(AppDesign.paddingLarge),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Container(
                      width: 40,
                      height: 40,
                      decoration: BoxDecoration(
                        color: Colors.white,
                        shape: BoxShape.circle,
                        boxShadow: [
                          BoxShadow(
                            color: AppDesign.primaryIndigo.withOpacity(0.12),
                            blurRadius: 10,
                            offset: const Offset(0, 4),
                          ),
                        ],
                      ),
                      child: const Icon(Icons.rocket_launch_outlined, color: AppDesign.primaryIndigo),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: const [
                          TrText(
                            'Votre configuration de base',
                            style: TextStyle(fontSize: 16, fontWeight: FontWeight.w800),
                          ),
                          TrText(
                            'Devise, budget mensuel, catégories par défaut.',
                            style: TextStyle(fontSize: 13, color: Colors.black54),
                          ),
                        ],
                      ),
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(14),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          const Icon(Icons.check_circle, size: 16, color: AppDesign.primaryIndigo),
                          const SizedBox(width: 6),
                          TrText('${completed}/3 prêts'),
                        ],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 14),
                ClipRRect(
                  borderRadius: BorderRadius.circular(6),
                  child: LinearProgressIndicator(
                    value: progress,
                    backgroundColor: Colors.white,
                    color: AppDesign.primaryIndigo,
                    minHeight: 6,
                  ),
                ),
                const SizedBox(height: 16),
                _checklistItem(
                  title: 'Devise',
                  subtitle: hasCurrency ? 'Devise définie (${profile!.currency})' : 'Choisissez votre devise principale.',
                  done: hasCurrency,
                ),
                const SizedBox(height: 10),
                _checklistItem(
                  title: 'Budget mensuel',
                  subtitle: hasBudget ? 'Budget enregistré' : 'Fixez un budget pour activer les alertes.',
                  done: hasBudget,
                ),
                const SizedBox(height: 10),
                _checklistItem(
                  title: 'Catégories',
                  subtitle: hasCategories
                      ? 'Catégories prêtes (dont les par défaut).'
                      : 'Activez vos catégories par défaut avant de suivre vos dépenses.',
                  done: hasCategories,
                ),
                const SizedBox(height: 16),
                Wrap(
                  spacing: 10,
                  runSpacing: 10,
                  children: [
                    ElevatedButton.icon(
                      onPressed: () {
                        Navigator.push(
                          context,
                          MaterialPageRoute(builder: (_) => const OnboardingWizardScreen()),
                        );
                      },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppDesign.primaryIndigo,
                        foregroundColor: Colors.white,
                        elevation: 0,
                        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      ),
                      icon: const Icon(Icons.play_arrow, size: 18),
                      label: const TrText(
                        'Lancer la configuration',
                        style: TextStyle(fontWeight: FontWeight.w700),
                      ),
                    ),
                    TextButton(
                      onPressed: () {
                        Navigator.push(
                          context,
                          MaterialPageRoute(builder: (_) => const BudgetPlannerScreen()),
                        );
                      },
                      child: const TrText('Aller au budget'),
                    ),
                  ],
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _checklistItem({
    required String title,
    required String subtitle,
    required bool done,
  }) {
    final color = done ? Colors.green : Colors.orange;
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.only(top: 2.0),
          child: Icon(done ? Icons.check_circle : Icons.radio_button_unchecked, color: color, size: 20),
        ),
        const SizedBox(width: 10),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              TrText(
                title,
                style: const TextStyle(fontWeight: FontWeight.w700),
              ),
              const SizedBox(height: 2),
              TrText(
                subtitle,
                style: TextStyle(color: done ? Colors.green[700] : Colors.black54, fontSize: 13),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Row _buildRecentHistoryHeader(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        const TrText(
          "Historique Récent",
          style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
        ),
        TextButton.icon(
          onPressed: () {
            Navigator.push(
              context,
              MaterialPageRoute(builder: (_) => const TransactionsListScreen()),
            );
          },
          icon: const Icon(Icons.history_toggle_off_outlined),
          label: const TrText('Voir tout'),
        ),
      ],
    );
  }

  Widget _buildTransactionFilters() {
    final options = [
      {'label': t('Toutes'), 'value': null},
      {'label': t('Revenus'), 'value': TransactionType.income},
      {'label': t('Dépenses'), 'value': TransactionType.expense},
      {'label': t('Transferts'), 'value': TransactionType.transfer},
    ];

    return Wrap(
      spacing: 8,
      runSpacing: 8,
      children: options.map((opt) {
        final value = opt['value'] as TransactionType?;
        final label = opt['label'] as String;
        final selected = _recentFilter == value;
        return ChoiceChip(
          label: TrText(label),
          selected: selected,
          selectedColor: AppDesign.primaryIndigo.withValues(alpha: 0.16),
          labelStyle: TextStyle(
            color: selected ? AppDesign.primaryIndigo : Colors.grey[800],
            fontWeight: selected ? FontWeight.w800 : FontWeight.w600,
          ),
          onSelected: (_) {
            setState(() => _recentFilter = value);
          },
        );
      }).toList(),
    );
  }

  Widget _buildQuickAccess(BuildContext context) {
    final shortcuts = [
      _ShortcutAction(
        label: t('Alertes budget'),
        subtitle: t('Dépassements et notifications'),
        icon: Icons.notifications_active_rounded,
        color: AppDesign.expenseColor,
        onTap: () => Navigator.push(
          context,
          MaterialPageRoute(builder: (_) => const NotificationSettingsScreen()),
        ),
      ),
      _ShortcutAction(
        label: t('Analyses IA'),
        subtitle: t('Insights, anomalies, coaching'),
        icon: Icons.auto_graph_rounded,
        color: AppDesign.primaryPurple,
        onTap: () => Navigator.push(
          context,
          MaterialPageRoute(builder: (_) => const AIAnalysisScreen()),
        ),
      ),
      _ShortcutAction(
        label: t('Gérer budget'),
        subtitle: t('Suivi des poches et limites'),
        icon: Icons.pie_chart_outline_rounded,
        color: _brandTeal,
        onTap: () => Navigator.push(
          context,
          MaterialPageRoute(builder: (_) => const BudgetPlannerScreen()),
        ),
      ),
      _ShortcutAction(
        label: t('Gérer comptes'),
        subtitle: t('Soldes et transferts gérés.'),
        icon: Icons.account_balance_wallet_outlined,
        color: AppDesign.primaryIndigo,
        onTap: () => Navigator.push(
          context,
          MaterialPageRoute(builder: (_) => const AccountManagementScreen()),
        ),
      ),
      _ShortcutAction(
        label: t('Catégories'),
        subtitle: t('Gérer vos catégories'),
        icon: Icons.category_outlined,
        color: Colors.teal,
        onTap: () => Navigator.push(
          context,
          MaterialPageRoute(builder: (_) => const CategoryManagementScreen()),
        ),
      ),
      _ShortcutAction(
        label: t('Historique'),
        subtitle: t('Toutes vos transactions'),
        icon: Icons.history,
        color: AppDesign.primaryIndigo,
        onTap: () => Navigator.push(
          context,
          MaterialPageRoute(builder: (_) => const TransactionsListScreen()),
        ),
      ),
    ];

    return LayoutBuilder(
      builder: (context, constraints) {
        final available = constraints.maxWidth;
        final cardWidth = available < 520 ? available : 260.0;

        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const TrText(
              'Accès rapides',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 12),
            Wrap(
              spacing: 12,
              runSpacing: 12,
              children: shortcuts
                  .map(
                    (s) => SizedBox(
                          width: cardWidth,
                          height: 88,
                          child: _ShortcutCard(
                            action: s,
                            width: cardWidth,
                          ),
                        ),
                  )
                  .toList(),
            ),
          ],
        );
      },
    );
  }

  Row _buildPerformanceHeader(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        const TrText(
          "Statut dettes & objectifs",
          style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
        ),
        TextButton.icon(
          onPressed: () {
            Navigator.push(
              context,
              MaterialPageRoute(
                builder: (context) => const BudgetPlannerScreen(),
              ),
            );
          },
          icon: const Icon(Icons.pie_chart),
          label: const TrText('Budget'),
        ),
      ],
    );
  }

  /// Carte affichant le solde total de tous les comptes
  Widget _buildTotalBalanceCard() {
    final userId = _firestoreService.currentUserId;
    if (userId == null) {
      return _placeholderCard(
        title: t('Total Net'),
        message: 'Connectez-vous pour voir vos comptes.',
      );
    }

    return StreamBuilder<List<Account>>(
      stream: _firestoreService.getAccountsStream(userId),
      builder: (context, snapshot) {
        if (snapshot.hasError) {
          return _placeholderCard(
            title: t('Total Net'),
            message: 'Erreur lors du chargement des comptes.',
          );
        }
        if (!snapshot.hasData) {
          return const Center(child: CircularProgressIndicator());
        }

        final accounts = snapshot.data!;
        final totalBalance = accounts.fold<double>(0.0, (sum, acc) => sum + acc.balance);
        final currency = context.watch<CurrencyService>();

        return Container(
          decoration: BoxDecoration(
            gradient: LinearGradient(
              colors: [_brandTeal, _brandTeal.withValues(alpha: 0.85)],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
            borderRadius: BorderRadius.circular(AppDesign.radiusXLarge),
            boxShadow: AppDesign.mediumShadow,
          ),
          padding: const EdgeInsets.all(24),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    TrText(
                      'Total Net',
                      style: TextStyle(color: Colors.white.withValues(alpha: 0.8), fontSize: 16, fontWeight: FontWeight.w600),
                    ),
                    const SizedBox(height: 10),
                    LayoutBuilder(
                      builder: (context, constraints) {
                        // Formater le montant sans devise
                        final formatter = NumberFormat('#,##0.00', 'fr_FR');
                        final amountStr = formatter.format(totalBalance);
                        final currencySymbol = currency.currencySymbol;
                        
                        // Déterminer la taille adaptative selon la longueur
                        double fontSize;
                        if (amountStr.length > 15) {
                          fontSize = 24; // Très long
                        } else if (amountStr.length > 12) {
                          fontSize = 28; // Long
                        } else {
                          fontSize = 34; // Normal
                        }
                        
                        return Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            TrText(
                              amountStr,
                              maxLines: 1,
                              overflow: TextOverflow.visible,
                              style: TextStyle(
                                color: Colors.white,
                                fontSize: fontSize,
                                fontWeight: FontWeight.w900,
                                letterSpacing: -0.5,
                              ),
                            ),
                            const SizedBox(height: 4),
                            TrText(
                              currencySymbol,
                              style: TextStyle(
                                color: Colors.white.withValues(alpha: 0.85),
                                fontSize: 16,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ],
                        );
                      },
                    ),
                    const SizedBox(height: 8),
                    TrText(
                      '${accounts.length} compte(s)',
                      style: TextStyle(color: Colors.white.withValues(alpha: 0.7), fontSize: 14),
                    ),
                  ],
                ),
              ),
              Container(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: Colors.white.withValues(alpha: 0.15),
                  shape: BoxShape.circle,
                ),
                child: const Icon(Icons.show_chart, color: Colors.white, size: 44),
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildBudgetExcellenceCard() {
    final userId = _firestoreService.currentUserId;
    if (userId == null) {
      return _placeholderCard(
        title: t('Thermomètre budgétaire'),
        message: 'Connectez-vous pour voir votre rythme de dépenses.',
      );
    }

    final now = DateTime.now();
    final startOfMonth = DateTime(now.year, now.month, 1);
    final daysInMonth = DateTime(now.year, now.month + 1, 0).day;
    final daysElapsed = now.day;
    final idealRatio = daysElapsed / daysInMonth;

    return StreamBuilder<List<Transaction>>(
      stream: _firestoreService.getTransactionsStream(
        userId,
        startDate: startOfMonth,
        endDate: now,
        limit: 500,
      ),
      builder: (context, snapshot) {
        if (snapshot.connectionState == ConnectionState.waiting) {
          return const Center(child: CircularProgressIndicator());
        }

        final txs = snapshot.data ?? [];
        double income = 0;
        double expense = 0;
        for (final tx in txs) {
          if (tx.type == TransactionType.income) {
            income += tx.amount;
          } else if (tx.type == TransactionType.expense) {
            expense += tx.amount;
          }
        }

        final budgetConsumed = income > 0 ? (expense / income).clamp(0.0, 2.0) : 0.0;
        final isSafe = budgetConsumed <= idealRatio;
        final diffPercent = ((budgetConsumed - idealRatio).abs() * 100).toStringAsFixed(1);
        final gaugeColor = isSafe ? const Color(0xFF4CAF50) : const Color(0xFFEF5350);
        final label = 'Épuisement Budgétaire : ${(budgetConsumed * 100).toStringAsFixed(1)}%';
        final insight = isSafe
            ? 'Vous êtes en avance de $diffPercent % sur votre rythme idéal.'
            : 'Vous dépensez $diffPercent % plus vite que prévu ce mois-ci.';

        return Card(
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(AppDesign.radiusXLarge),
          ),
          elevation: 4,
          child: Padding(
            padding: const EdgeInsets.all(20),
            child: Row(
              children: [
                SizedBox(
                  height: 92,
                  width: 92,
                  child: Stack(
                    fit: StackFit.expand,
                    children: [
                      CircularProgressIndicator(
                        value: budgetConsumed > 1 ? 1 : budgetConsumed,
                        strokeWidth: 10,
                        backgroundColor: gaugeColor.withValues(alpha: 0.12),
                        valueColor: AlwaysStoppedAnimation<Color>(gaugeColor),
                      ),
                      Center(
                        child: TrText(
                          '${(budgetConsumed * 100).toStringAsFixed(0)}%',
                          style: TextStyle(
                            color: gaugeColor,
                            fontWeight: FontWeight.w800,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      TrText(
                        'Thermomètre Budgétaire',
                        style: TextStyle(
                          fontWeight: FontWeight.w800,
                          fontSize: 16,
                          color: _brandTeal,
                        ),
                      ),
                      const SizedBox(height: 6),
                      TrText(
                        label,
                        style: const TextStyle(
                          fontSize: 15,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                      const SizedBox(height: 6),
                      TrText(
                        'Jours écoulés : ${(idealRatio * 100).toStringAsFixed(1)}% • Dépenses : ${(budgetConsumed * 100).toStringAsFixed(1)}%',
                        style: TextStyle(color: Colors.grey[700], fontSize: 12),
                      ),
                      const SizedBox(height: 4),
                      TrText(
                        insight,
                        style: TextStyle(
                          color: gaugeColor,
                          fontWeight: FontWeight.w700,
                          fontSize: 12,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  /// Bloc des indicateurs avancés (dettes + objectifs) avec contexte et CTA
  Widget _buildMonthlyInsightCards(BuildContext context) {
    final now = DateTime.now();
    final startOfMonth = DateTime(now.year, now.month, 1);
    final startOfLastMonth = DateTime(now.year, now.month - 1, 1);
    final endOfLastMonth = DateTime(now.year, now.month, 0);
    final userId = _firestoreService.currentUserId;

    if (userId == null) {
      return _placeholderCard(
        title: t('Performance mensuelle'),
        message: 'Connectez-vous pour voir vos statistiques.',
      );
    }

    return StreamBuilder<List<dynamic>>(
      stream: CombineLatestStream.list([
        _firestoreService.getTransactionsStream(
          userId,
          startDate: startOfMonth,
          endDate: now,
          limit: 300,
        ),
        _firestoreService.getTransactionsStream(
          userId,
          startDate: startOfLastMonth,
          endDate: endOfLastMonth,
          limit: 300,
        ),
        _firestoreService.getIOUsStream(userId),
        _firestoreService.getGoalsStream(userId),
      ]),
      builder: (context, snapshot) {
        if (snapshot.hasError) {
          return _placeholderCard(
            title: t('Performance mensuelle'),
            message: 'Erreur de chargement des données.',
          );
        }
        if (!snapshot.hasData) {
          return const Center(child: CircularProgressIndicator());
        }

        final transactions = snapshot.data![0] as List<Transaction>;
        final transactionsLast = snapshot.data![1] as List<Transaction>;
        final ious = snapshot.data![2] as List<IOU>;
        final goals = snapshot.data![3] as List<Goal>;

        double income = 0.0;
        double expense = 0.0;
        double debtAmount = 0.0;
        double incomeLast = 0.0;
        double expenseLast = 0.0;

        // Calculer revenus et dépenses des transactions
        for (final tx in transactions) {
          if (tx.type == TransactionType.income) {
            income += tx.amount;
          } else if (tx.type == TransactionType.expense) {
            expense += tx.amount;
          }
        }

        for (final tx in transactionsLast) {
          if (tx.type == TransactionType.income) {
            incomeLast += tx.amount;
          } else if (tx.type == TransactionType.expense) {
            expenseLast += tx.amount;
          }
        }

        // Calculer le total des dettes actives (type payable - je dois)
        for (final iou in ious) {
          if (iou.type == IOUType.payable && 
              iou.status != IOUStatus.completed && 
              iou.status != IOUStatus.paid && 
              iou.status != IOUStatus.cancelled) {
            debtAmount += iou.currentBalance;
          }
        }

        // Dettes: filtrer payables/je dois actifs
        bool _isActive(IOUStatus status) =>
            status != IOUStatus.paid && status != IOUStatus.completed && status != IOUStatus.cancelled;
        final payable = ious.where((i) =>
            (i.type == IOUType.payable || i.type == IOUType.iOwe) && _isActive(i.status));

        final debtsThisMonth = payable.where((i) =>
            i.dueDate.month == now.month && i.dueDate.year == now.year);
        final debtsLastMonth = payable.where((i) =>
            i.dueDate.month == endOfLastMonth.month && i.dueDate.year == endOfLastMonth.year);

        double dueThisMonth = 0, paidThisMonth = 0;
        for (final d in debtsThisMonth) {
          dueThisMonth += d.amount;
          paidThisMonth += d.paidAmount;
        }
        final remainingThisMonth = (dueThisMonth - paidThisMonth).clamp(0, double.infinity);
        double dueLastMonth = 0;
        for (final d in debtsLastMonth) {
          dueLastMonth += d.amount;
        }
        final nextDue = payable
            .where((d) => d.remainingAmount > 0)
            .fold<DateTime?>(null, (min, d) => min == null || d.dueDate.isBefore(min) ? d.dueDate : min);
        String debtStatus;
        Color debtStatusColor;
        if (nextDue != null && nextDue.isBefore(now) && remainingThisMonth > 0) {
          debtStatus = t('En retard');
          debtStatusColor = AppDesign.expenseColor;
        } else if (remainingThisMonth > 0) {
          debtStatus = t('À surveiller');
          debtStatusColor = const Color(0xFFFFB300);
        } else {
          debtStatus = 'OK';
          debtStatusColor = AppDesign.incomeColor;
        }

        // Objectifs: progression agrégée, meilleur/pire objectif, reste et échéance
        final activeGoals = goals.where((g) => g.status == GoalStatus.active).toList();
        final totalTarget = activeGoals.fold<double>(0, (s, g) => s + g.targetAmount);
        final totalCurrent = activeGoals.fold<double>(0, (s, g) => s + g.currentAmount);
        final globalProgress = totalTarget > 0 ? (totalCurrent / totalTarget * 100).clamp(0, 100) : 0.0;
        Goal? topGoal;
        Goal? lagGoal;
        if (activeGoals.isNotEmpty) {
          activeGoals.sort((a, b) => b.progressPercentage.compareTo(a.progressPercentage));
          topGoal = activeGoals.first;
          lagGoal = activeGoals.last;
        }
        final remainingGoalsAmount = (totalTarget - totalCurrent).clamp(0, double.infinity);
        final closestDeadline = activeGoals.fold<DateTime?>(null, (min, g) {
          return min == null || g.targetDate.isBefore(min) ? g.targetDate : min;
        });

        return Column(
          children: [
            _DebtInsightCard(
              dueThisMonth: dueThisMonth,
              paidThisMonth: paidThisMonth,
              remaining: remainingThisMonth.toDouble(),
              dueLastMonth: dueLastMonth,
              nextDue: nextDue,
              statusLabel: debtStatus,
              statusColor: debtStatusColor,
              onViewDebts: () => Navigator.push(
                context,
                MaterialPageRoute(builder: (_) => const IOUTrackingScreen()),
              ),
              onPay: () => Navigator.push(
                context,
                MaterialPageRoute(builder: (_) => const IOUTrackingScreen()),
              ),
            ),
            const SizedBox(height: AppDesign.spacingMedium),
            _GoalsInsightCard(
              totalCurrent: totalCurrent,
              totalTarget: totalTarget,
              globalProgress: globalProgress.toDouble(),
              topGoal: topGoal,
              lagGoal: lagGoal,
              remainingAmount: remainingGoalsAmount.toDouble(),
              closestDeadline: closestDeadline,
              onViewGoals: () => Navigator.push(
                context,
                MaterialPageRoute(builder: (_) => const GoalFundingScreen()),
              ),
              onAddGoal: () => Navigator.push(
                context,
                MaterialPageRoute(builder: (_) => const GoalFundingScreen()),
              ),
            ),
          ],
        );
      },
    );
  }

  /// Liste des transactions récentes avec icônes et montants colorés
  Widget _buildRecentTransactionsList() {
    final userId = _firestoreService.currentUserId;

    if (userId == null) {
      return _placeholderCard(
        title: t('Transactions récentes'),
        message: 'Connectez-vous pour voir vos transactions.',
      );
    }

    return StreamBuilder<List<Category>>(
      stream: _firestoreService.getCategoriesStream(userId),
      builder: (context, categorySnapshot) {
        final categories = categorySnapshot.data ?? [];
        
        return StreamBuilder<List<Transaction>>(
          stream: _firestoreService.getTransactionsStream(
            userId,
            limit: 20,
          ),
          builder: (context, snapshot) {
            if (snapshot.hasError) {
              return _placeholderCard(
                title: t('Transactions récentes'),
                message: 'Erreur de chargement.',
              );
            }
            if (!snapshot.hasData) {
              return const Center(child: CircularProgressIndicator());
            }

            final transactions = snapshot.data!;
            final filtered = _recentFilter == null
                ? transactions
                : transactions.where((tx) => tx.type == _recentFilter).toList();

            if (filtered.isEmpty) {
              return Card(
                elevation: 4,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(AppDesign.borderRadiusLarge),
                ),
                child: Padding(
                  padding: const EdgeInsets.all(AppDesign.paddingLarge),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      _buildTransactionFilters(),
                      const SizedBox(height: 12),
                      const Center(
                        child: TrText("Aucune transaction récente. Ajoutez-en une !"),
                      ),
                    ],
                  ),
                ),
              );
            }

            return Card(
              elevation: 6,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(AppDesign.radiusXLarge),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Padding(
                    padding: const EdgeInsets.only(left: 12, right: 12, top: 12),
                    child: _buildTransactionFilters(),
                  ),
                  ...filtered.take(6).map((tx) {
                    final isExpense = tx.type == TransactionType.expense;
                    final isIncome = tx.type == TransactionType.income;
                    final isTransfer = tx.type == TransactionType.transfer;
                    final currencyService = context.watch<CurrencyService>();

                    Color txColor;
                    IconData txIcon;
                    String prefix;

                    if (isIncome) {
                      txColor = AppDesign.incomeColor;
                      txIcon = Icons.call_received_rounded;
                      prefix = '+';
                    } else if (isTransfer) {
                      txColor = AppDesign.transferColor;
                      txIcon = Icons.swap_horiz_rounded;
                      prefix = '';
                    } else {
                      txColor = AppDesign.expenseColor;
                      txIcon = Icons.call_made_rounded;
                      prefix = '-';
                    }

                    // Résoudre catégorie depuis categoryId
                    final txCategory = tx.categoryId != null && categories.isNotEmpty
                        ? categories.firstWhere(
                            (c) => c.categoryId == tx.categoryId,
                            orElse: () => categories.first,
                          )
                        : null;
                    final categoryLabel = _resolveCategoryLabel(txCategory, tx);
                    final formattedDate = DateFormat('dd/MM/yyyy').format(tx.date);

                    return Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                      child: Row(
                        children: [
                          Container(
                            width: 46,
                            height: 46,
                            decoration: BoxDecoration(
                              color: txColor.withValues(alpha: 0.12),
                              shape: BoxShape.circle,
                            ),
                            child: Icon(txIcon, color: txColor, size: 22),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                TrText(
                                  tx.description ?? '',
                                  style: const TextStyle(
                                    fontWeight: FontWeight.w600,
                                    fontSize: 15,
                                  ),
                                  maxLines: 2,
                                  overflow: TextOverflow.ellipsis,
                                ),
                                const SizedBox(height: 3),
                                TrText(
                                  '$formattedDate · $categoryLabel',
                                  style: const TextStyle(
                                    color: Colors.grey,
                                    fontSize: 12,
                                  ),
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                ),
                              ],
                            ),
                          ),
                          const SizedBox(width: 8),
                          Flexible(
                            flex: 0,
                            child: ConstrainedBox(
                              constraints: const BoxConstraints(maxWidth: 140),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.end,
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  TrText(
                                    '$prefix ${currencyService.formatAmountCompact(tx.amount)}',
                                    style: TextStyle(
                                      color: txColor,
                                      fontWeight: FontWeight.bold,
                                      fontSize: 15,
                                    ),
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                ],
                              ),
                            ),
                          ),
                        ],
                      ),
                    );
                  }).toList(),
                ],
              ),
            );
          },
        );
      },
    );
  }

  /// Placeholder léger pour le graphique de répartition des dépenses
  Widget _buildSpendingChartPlaceholder() {
    return Card(
      elevation: 6,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(AppDesign.radiusXLarge),
      ),
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Row(
          children: [
            Container(
              width: 62,
              height: 62,
              decoration: BoxDecoration(
                color: AppDesign.primaryIndigo.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(12),
              ),
              child: const Icon(Icons.pie_chart_outline, color: AppDesign.primaryIndigo, size: 34),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: const [
                  TrText(
                    'Répartition des dépenses',
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  SizedBox(height: 4),
                  TrText(
                    'Optimisez vos budgets par catégorie sur ce mois.',
                    style: TextStyle(color: Colors.grey),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildHeroSection(BuildContext context) {
    final userId = _firestoreService.currentUserId;
    final now = DateTime.now();
    final greeting = _greetingLabel(now.hour);
    final startOfMonth = DateTime(now.year, now.month, 1);
    final isCompact = MediaQuery.of(context).size.width < 430;

    if (userId == null) {
      return _placeholderCard(
        title: t('Bienvenue'),
        message: 'Connectez-vous pour personnaliser votre page d’accueil et suivre vos budgets.',
      );
    }

    final accounts$ = _firestoreService.getAccountsStream(userId);
    final tx$ = _firestoreService.getTransactionsStream(
      userId,
      startDate: startOfMonth,
      endDate: now,
      limit: 300,
    );

    return StreamBuilder<List<dynamic>>(
      stream: CombineLatestStream.list([accounts$, tx$]),
      builder: (context, snapshot) {
        if (!snapshot.hasData) {
          return _heroLoadingShell();
        }

        final accounts = snapshot.data![0] as List<Account>;
        final txs = snapshot.data![1] as List<Transaction>;
        final currency = context.watch<CurrencyService>();

        final totalBalance = accounts.fold<double>(0.0, (sum, acc) => sum + acc.balance);
        double income = 0;
        double expense = 0;
        for (final tx in txs) {
          if (tx.type == TransactionType.income) {
            income += tx.amount;
          } else if (tx.type == TransactionType.expense) {
            expense += tx.amount;
          }
        }
        final remaining = income - expense;
        final burnRate = income > 0 ? (expense / income).clamp(0.0, 2.0) : 0.0;
        final remainingPct = income > 0 ? (remaining / income).clamp(-1.0, 1.0) : 0.0;
        final daysInMonth = DateTime(now.year, now.month + 1, 0).day;
        final idealRatio = daysInMonth > 0 ? now.day / daysInMonth : 0.0;
        final delta = ((burnRate - idealRatio) * 100).toStringAsFixed(0);
        final isAhead = burnRate <= idealRatio;
        final coaching = isAhead
            ? 'Vous dépensez ${delta.replaceAll('-', '')}% plus lentement que prévu.'
            : 'Vous dépensez ${delta.replaceAll('-', '')}% plus vite que prévu.';

        return Container(
          width: double.infinity,
          decoration: BoxDecoration(
            gradient: LinearGradient(
              colors: [_brandTeal, _accentCoral.withValues(alpha: 0.9)],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
            borderRadius: BorderRadius.circular(AppDesign.radiusXLarge),
            boxShadow: AppDesign.mediumShadow,
          ),
          padding: const EdgeInsets.all(AppDesign.paddingLarge),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        TrText(
                          '$greeting 👋',
                          style: TextStyle(
                            color: Colors.white.withValues(alpha: 0.9),
                            fontWeight: FontWeight.w700,
                            fontSize: 16,
                          ),
                        ),
                        const SizedBox(height: 6),
                        TrText(
                          'Votre argent sous contrôle. Continuez sur cette lancée.',
                          style: TextStyle(
                            color: Colors.white.withValues(alpha: 0.75),
                            fontSize: 13,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ],
                    ),
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                    decoration: BoxDecoration(
                      color: Colors.white.withValues(alpha: 0.16),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(
                          burnRate <= 0.6 ? Icons.check_circle : Icons.warning_amber_rounded,
                          color: Colors.white,
                          size: 18,
                        ),
                        const SizedBox(width: 8),
                        TrText(
                          'Rythme ${ (burnRate * 100).toStringAsFixed(0)}%',
                          style: const TextStyle(
                            color: Colors.white,
                            fontWeight: FontWeight.w800,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 18),
              if (isCompact) ...[
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    TrText(
                      currency.formatAmount(totalBalance),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.w900,
                        fontSize: 26,
                      ),
                    ),
                    const SizedBox(height: 4),
                    TrText(
                      'Solde global net',
                      style: TextStyle(
                        color: Colors.white.withValues(alpha: 0.8),
                        fontSize: 13,
                      ),
                    ),
                    const SizedBox(height: 6),
                    TrText(
                      coaching,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: TextStyle(
                        color: Colors.white.withValues(alpha: 0.78),
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    const SizedBox(height: 10),
                    Row(
                      children: [
                        _BudgetGauge(
                          value: burnRate.clamp(0.0, 1.5),
                          ideal: idealRatio.clamp(0.0, 1.0),
                          label: 'Rythme ${(burnRate * 100).toStringAsFixed(0)}%',
                          coaching: isAhead ? 'Dans le rythme' : 'Au-dessus',
                          color: isAhead ? AppDesign.incomeColor : AppDesign.expenseColor,
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            children: [
                              _HeroCTAButton(
                                label: 'Ajuster budget',
                                icon: Icons.tune_rounded,
                                onTap: () => Navigator.push(
                                  context,
                                  MaterialPageRoute(builder: (_) => const BudgetPlannerScreen()),
                                ),
                              ),
                              const SizedBox(height: 8),
                              _HeroCTAButton(
                                label: 'Voir alertes',
                                icon: Icons.notifications_active_rounded,
                                outlined: true,
                                onTap: () => Navigator.push(
                                  context,
                                  MaterialPageRoute(builder: (_) => const NotificationSettingsScreen()),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    Wrap(
                      spacing: 10,
                      runSpacing: 8,
                      children: [
                        ElevatedButton.icon(
                          onPressed: () => _navigateToTransaction(context, TransactionType.expense),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: Colors.white.withValues(alpha: 0.14),
                            foregroundColor: Colors.white,
                            elevation: 0,
                            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                          ),
                          icon: const Icon(Icons.south_west_rounded, size: 18),
                          label: const TrText(
                            'Ajouter dépense',
                            style: TextStyle(fontWeight: FontWeight.w800),
                          ),
                        ),
                        ElevatedButton.icon(
                          onPressed: () => _navigateToTransaction(context, TransactionType.income),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: Colors.white,
                            foregroundColor: _brandTeal,
                            elevation: 0,
                            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                          ),
                          icon: const Icon(Icons.north_east_rounded, size: 18),
                          label: const TrText(
                            'Ajouter revenu',
                            style: TextStyle(fontWeight: FontWeight.w800),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ] else ...[
                Row(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          TrText(
                            currency.formatAmount(totalBalance),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: const TextStyle(
                              color: Colors.white,
                              fontWeight: FontWeight.w900,
                              fontSize: 28,
                            ),
                          ),
                          const SizedBox(height: 4),
                          TrText(
                            'Solde global net',
                            style: TextStyle(
                              color: Colors.white.withValues(alpha: 0.8),
                              fontSize: 13,
                            ),
                          ),
                          const SizedBox(height: 6),
                          TrText(
                            coaching,
                            maxLines: 2,
                            overflow: TextOverflow.ellipsis,
                            style: TextStyle(
                              color: Colors.white.withValues(alpha: 0.78),
                              fontSize: 12,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ],
                      ),
                    ),
                    Wrap(
                      spacing: 10,
                      runSpacing: 8,
                      children: [
                        ElevatedButton.icon(
                          onPressed: () => _navigateToTransaction(context, TransactionType.expense),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: Colors.white.withValues(alpha: 0.14),
                            foregroundColor: Colors.white,
                            elevation: 0,
                            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                          ),
                          icon: const Icon(Icons.south_west_rounded, size: 18),
                          label: const TrText(
                            'Ajouter dépense',
                            style: TextStyle(fontWeight: FontWeight.w800),
                          ),
                        ),
                        ElevatedButton.icon(
                          onPressed: () => _navigateToTransaction(context, TransactionType.income),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: Colors.white,
                            foregroundColor: _brandTeal,
                            elevation: 0,
                            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                          ),
                          icon: const Icon(Icons.north_east_rounded, size: 18),
                          label: const TrText(
                            'Ajouter revenu',
                            style: TextStyle(fontWeight: FontWeight.w800),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                Row(
                  children: [
                    _BudgetGauge(
                      value: burnRate.clamp(0.0, 1.5),
                      ideal: idealRatio.clamp(0.0, 1.0),
                      label: 'Rythme ${(burnRate * 100).toStringAsFixed(0)}%',
                      coaching: isAhead ? 'Dans le rythme' : 'Au-dessus',
                      color: isAhead ? AppDesign.incomeColor : AppDesign.expenseColor,
                    ),
                    const SizedBox(width: 14),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          _HeroCTAButton(
                            label: 'Ajuster budget',
                            icon: Icons.tune_rounded,
                            compact: true,
                            onTap: () => Navigator.push(
                              context,
                              MaterialPageRoute(builder: (_) => const BudgetPlannerScreen()),
                            ),
                          ),
                          const SizedBox(height: 8),
                          _HeroCTAButton(
                            label: 'Voir alertes',
                            icon: Icons.notifications_active_rounded,
                            outlined: true,
                            compact: true,
                            onTap: () => Navigator.push(
                              context,
                              MaterialPageRoute(builder: (_) => const NotificationSettingsScreen()),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ],
              const SizedBox(height: 18),
              Wrap(
                spacing: 12,
                runSpacing: 12,
                children: [
                  _HeroStatPill(
                    label: t('Revenus du mois'),
                    value: currency.formatAmount(income),
                    badge: 'Flux entrant',
                    color: Colors.white,
                    background: Colors.white.withValues(alpha: 0.08),
                  ),
                  _HeroStatPill(
                    label: t('Dépenses du mois'),
                    value: currency.formatAmount(expense),
                    badge: 'Sorties',
                    color: Colors.white,
                    background: Colors.white.withValues(alpha: 0.08),
                  ),
                  _HeroStatPill(
                    label: t('Restant'),
                    value: currency.formatAmount(remaining),
                    badge: '${(remainingPct * 100).toStringAsFixed(0)}% du revenu',
                    color: Colors.white,
                    background: Colors.white.withValues(alpha: 0.08),
                  ),
                ],
              ),
            ],
          ),
        );
      },
    );
  }

  String _greetingLabel(int hour) {
    if (hour < 12) return t('Bonjour');
    if (hour < 18) return t('Bon après-midi');
    return t('Bonsoir');
  }

  Widget _heroLoadingShell() {
    return Container(
      height: 210,
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [_brandTeal.withValues(alpha: 0.7), _accentCoral.withValues(alpha: 0.7)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(AppDesign.radiusXLarge),
      ),
      alignment: Alignment.center,
      child: const CircularProgressIndicator(
        valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
      ),
    );
  }

  Card _placeholderCard({required String title, required String message}) {
    return Card(
      elevation: 6,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(AppDesign.radiusXLarge),
      ),
      child: Padding(
        padding: const EdgeInsets.all(AppDesign.spacingLarge),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            TrText(
              title,
              style: const TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 8),
            TrText(
              message,
              style: const TextStyle(color: Colors.grey),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildNotificationsCard() {
    // Conservé pour compatibilité, non utilisé après remplacement
    return const SizedBox.shrink();
  }

  /// Carte "Summary by pocket" – synthèse des poches avec Prévu / Engagé
  Widget _buildSummaryByPocketCard() {
    final userId = _firestoreService.currentUserId;
    if (userId == null) {
      return CategoryBudgetProgressBlock._placeholderStaticCard(
        title: t('Synthèse par poche'),
        message: 'Connectez-vous pour voir vos poches.',
      );
    }

    final now = DateTime.now();
    final startOfMonth = DateTime(now.year, now.month, 1);

    final categories$ = _firestoreService.getCategoriesStream(userId, type: null);
    final transactions$ = _firestoreService.getTransactionsStream(
      userId,
      startDate: startOfMonth,
      endDate: now,
      limit: 500,
    );
    final budget$ = _firestoreService.getBudgetPlanStream(userId);

    return StreamBuilder<List<dynamic>>(
      stream: CombineLatestStream.list([categories$, transactions$, budget$]),
      builder: (context, snapshot) {
        if (!snapshot.hasData) {
          return const Padding(
            padding: EdgeInsets.all(12),
            child: Center(child: CircularProgressIndicator()),
          );
        }

        final categories = snapshot.data![0] as List<Category>;
        final txs = snapshot.data![1] as List<Transaction>;
        final budgetPlan = snapshot.data![2] as Map<String, dynamic>?;
        final Map<String, String> catNames = {
          for (final c in categories) c.categoryId: c.name,
        };

        // Préparation des allocations/plafonds
        Map<String, double> allocations = Map.from(DEFAULT_ALLOCATION);
        double totalBudget = 0;
        if (budgetPlan != null) {
          final rawAlloc = budgetPlan['categoryAllocations'] as Map<String, dynamic>?;
          if (rawAlloc != null && rawAlloc.isNotEmpty) {
            final mapped = {
              for (final key in DEFAULT_ALLOCATION.keys) key: 0.0,
            };
            bool hasMapped = false;
            rawAlloc.forEach((key, value) {
              final pct = (value as num?)?.toDouble() ?? 0.0;
              if (pct <= 0) return;

              if (DEFAULT_ALLOCATION.containsKey(key)) {
                mapped[key] = pct;
                hasMapped = true;
                return;
              }

              final categoryName = catNames[key] ?? key;
              final pocket = _mapPocket(categoryName);
              mapped[pocket] = (mapped[pocket] ?? 0.0) + pct;
              hasMapped = true;
            });
            if (hasMapped) {
              allocations = mapped;
            }
          }
          final tb = budgetPlan['totalBudget'];
          if (tb is num) totalBudget = tb.toDouble();
        }
        final incomeTotal = txs.where((t) => t.type == TransactionType.income).fold<double>(0, (s, t) => s + t.amount);
        if (totalBudget <= 0 && incomeTotal > 0) {
          totalBudget = incomeTotal;
        }
        if (totalBudget <= 0) totalBudget = 1; // éviter div/0

        final items = categories
            .where((c) => c.type == CategoryType.expense && c.isActive)
            .map((cat) {
          final pocket = _mapPocket(cat.name);
          final planned = (allocations[pocket] ?? DEFAULT_ALLOCATION[pocket] ?? 0) * totalBudget;
          
          // Calculer le montant engagé en vérifiant categoryId OU category (nom)
          final engaged = txs
              .where((t) {
                if (t.type != TransactionType.expense) return false;
                
                // Vérifier par ID (prioritaire)
                if (t.categoryId != null && t.categoryId == cat.categoryId) {
                  return true;
                }
                
                // Vérifier par nom (fallback si categoryId est null)
                if (t.category != null && 
                    t.category!.toLowerCase().trim() == cat.name.toLowerCase().trim()) {
                  return true;
                }
                
                return false;
              })
              .fold<double>(0, (sum, t) => sum + t.amount);
          
          return _PocketSummaryItem(
            name: cat.name,
            icon: cat.icon,
            planned: planned,
            engaged: engaged,
          );
        }).toList();

        if (items.isEmpty) {
          return CategoryBudgetProgressBlock._placeholderStaticCard(
            title: t('Synthèse par poche'),
            message: 'Aucune catégorie de dépense active.',
          );
        }

        final overflowCount = items.where((i) => i.engaged > i.planned).length;
        final isHealthy = overflowCount == 0;
        final footerColor = isHealthy
            ? const Color(0xFF4CAF50).withValues(alpha: 0.08)
            : const Color(0xFFEF5350).withValues(alpha: 0.08);
        final footerTextColor = isHealthy ? const Color(0xFF2E7D32) : const Color(0xFFC62828);
        final footerIcon = isHealthy ? Icons.check_circle_rounded : Icons.warning_amber_rounded;
        final footerText = isHealthy
            ? 'Tout est sous contrôle. Excellente gestion !'
            : 'Attention : $overflowCount poches budgétaires sont en alerte rouge.';

        return Card(
          elevation: 6,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(AppDesign.radiusXLarge),
          ),
          child: Padding(
            padding: const EdgeInsets.all(AppDesign.paddingMedium),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const TrText(
                  'Summary by pocket',
                  style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 12),
                ...items.map((e) => _PocketSummaryRow(item: e)),
                const SizedBox(height: 16),
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: footerColor,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Row(
                    children: [
                      Icon(footerIcon, color: footerTextColor),
                      const SizedBox(width: 8),
                      Expanded(
                        child: TrText(
                          footerText,
                          style: TextStyle(
                            color: footerTextColor,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 12),
              ],
            ),
          ),
        );
      },
    );
  }

  /// Ligne d'une poche avec libellés "Prévu" et "Engagé" et barre de progression
  // ignore: unused_element
  Widget _buildPocketRowForPreview(_PocketSummaryItem item) => _PocketSummaryRow(item: item);

  String _mapPocket(String name) {
    final n = name.toLowerCase();
    if (n.contains('logement') || n.contains('rent')) return 'Logement';
    if (n.contains('aliment') || n.contains('nourr') || n.contains('food')) return 'Nourriture';
    if (n.contains('transport') || n.contains('taxi') || n.contains('carbur')) return 'Transport';
    if (n.contains('fact') || n.contains('abo') || n.contains('abonnement')) return 'Factures';
    if (n.contains('sant')) return 'Santé';
    if (n.contains('eparg') || n.contains('saving')) return 'Épargne';
    if (n.contains('invest')) return 'Investissement';
    if (n.contains('loisir') || n.contains('fun') || n.contains('divert')) return 'Loisirs';
    if (n.contains('famill') || n.contains('don')) return 'Famille';
    return name.isNotEmpty ? name : 'Autres';
  }

  String _resolveCategoryLabel(Category? category, Transaction tx) {
    final fromCategory = category?.name;
    if (fromCategory != null && fromCategory.trim().isNotEmpty) return fromCategory;
    final fromTx = tx.category;
    if (fromTx != null && fromTx.trim().isNotEmpty) return fromTx;
    switch (tx.type) {
      case TransactionType.income:
        return t('Revenu');
      case TransactionType.expense:
        return t('Dépense');
      case TransactionType.transfer:
        return t('Transfert');
    }
  }
}

class _HeroStatPill extends StatelessWidget {
  final String label;
  final String value;
  final String badge;
  final Color color;
  final Color background;

  const _HeroStatPill({
    required this.label,
    required this.value,
    required this.badge,
    required this.color,
    required this.background,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      decoration: BoxDecoration(
        color: background,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: color.withValues(alpha: 0.2)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(
            badge,
            style: TextStyle(
              color: color.withValues(alpha: 0.8),
              fontSize: 11,
              fontWeight: FontWeight.w700,
            ),
          ),
          const SizedBox(height: 6),
          Text(
            value,
            style: TextStyle(
              color: color,
              fontSize: 16,
              fontWeight: FontWeight.w900,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            label,
            style: TextStyle(
              color: color.withValues(alpha: 0.8),
              fontSize: 12,
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
      ),
    );
  }
}

/// Jauge circulaire (thermomètre budgétaire) utilisée dans le hero.
class _BudgetGauge extends StatelessWidget {
  final double value;
  final double ideal;
  final String label;
  final String coaching;
  final Color color;

  const _BudgetGauge({
    required this.value,
    required this.ideal,
    required this.label,
    required this.coaching,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    final clampedValue = value.clamp(0.0, 1.5);
    return SizedBox(
      width: 96,
      height: 96,
      child: Stack(
        alignment: Alignment.center,
        children: [
          CircularProgressIndicator(
            value: clampedValue > 1 ? 1 : clampedValue,
            strokeWidth: 9,
            backgroundColor: Colors.white.withValues(alpha: 0.18),
            valueColor: AlwaysStoppedAnimation<Color>(color),
          ),
          Positioned(
            top: 10,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              decoration: BoxDecoration(
                color: Colors.white.withValues(alpha: 0.16),
                borderRadius: BorderRadius.circular(8),
              ),
              child: TrText(
                '${(ideal * 100).toStringAsFixed(0)}%',
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 11,
                  fontWeight: FontWeight.w700,
                ),
              ),
            ),
          ),
          Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              TrText(
                label,
                style: const TextStyle(
                  color: Colors.white,
                  fontWeight: FontWeight.w800,
                  fontSize: 13,
                ),
              ),
              const SizedBox(height: 4),
              TrText(
                coaching,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: TextStyle(
                  color: Colors.white.withValues(alpha: 0.8),
                  fontSize: 11,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

/// Boutons CTA compacts du hero (primaire ou outline).
class _HeroCTAButton extends StatelessWidget {
  final String label;
  final IconData icon;
  final VoidCallback onTap;
  final bool outlined;
  final bool compact;

  const _HeroCTAButton({
    required this.label,
    required this.icon,
    required this.onTap,
    this.outlined = false,
    this.compact = false,
  });

  @override
  Widget build(BuildContext context) {
    final bg = outlined ? Colors.white.withValues(alpha: 0.08) : Colors.white;
    final fg = outlined ? Colors.white : AppDesign.primaryIndigo;
    return TextButton.icon(
      onPressed: onTap,
      style: TextButton.styleFrom(
        backgroundColor: bg,
        foregroundColor: fg,
        padding: EdgeInsets.symmetric(
          horizontal: compact ? 10 : 14,
          vertical: compact ? 10 : 12,
        ),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(14),
          side: outlined
              ? BorderSide(color: Colors.white.withValues(alpha: 0.3))
              : BorderSide.none,
        ),
      ),
      icon: Icon(icon, size: compact ? 16 : 18),
      label: TrText(
        label,
        style: TextStyle(
          fontWeight: FontWeight.w800,
          fontSize: compact ? 12 : 13,
        ),
      ),
    );
  }
}

class _DebtInsightCard extends StatelessWidget {
  final double dueThisMonth;
  final double paidThisMonth;
  final double remaining;
  final double dueLastMonth;
  final DateTime? nextDue;
  final String statusLabel;
  final Color statusColor;
  final VoidCallback onViewDebts;
  final VoidCallback onPay;

  const _DebtInsightCard({
    required this.dueThisMonth,
    required this.paidThisMonth,
    required this.remaining,
    required this.dueLastMonth,
    required this.nextDue,
    required this.statusLabel,
    required this.statusColor,
    required this.onViewDebts,
    required this.onPay,
  });

  @override
  Widget build(BuildContext context) {
    final currency = context.watch<CurrencyService>();
    final trendText = dueLastMonth > 0
        ? '${((dueThisMonth - dueLastMonth) / dueLastMonth * 100).toStringAsFixed(0)}% vs mois dernier'
        : 'N/A';
    final trendColor = dueLastMonth == 0
        ? Colors.grey[600]
        : (dueThisMonth <= dueLastMonth ? AppDesign.incomeColor : AppDesign.expenseColor);

    return Container(
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [AppDesign.expenseColor.withValues(alpha: 0.12), Colors.white],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(AppDesign.radiusXLarge),
        boxShadow: AppDesign.mediumShadow,
      ),
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: AppDesign.expenseColor.withValues(alpha: 0.14),
                  shape: BoxShape.circle,
                ),
                child: const Icon(Icons.request_quote_rounded, color: AppDesign.expenseColor),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const TrText(
                      'Dettes du mois',
                      style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700),
                    ),
                    Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                          decoration: BoxDecoration(
                            color: statusColor.withValues(alpha: 0.12),
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: TrText(
                            statusLabel,
                            style: TextStyle(
                              color: statusColor,
                              fontWeight: FontWeight.w800,
                              fontSize: 12,
                            ),
                          ),
                        ),
                        const SizedBox(width: 8),
                        TrText(
                          trendText,
                          style: TextStyle(
                            color: trendColor,
                            fontSize: 12,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              _metric(currency.formatAmount(dueThisMonth), t('Dû ce mois')),
              _metric(currency.formatAmount(paidThisMonth), t('Déjà payé')),
              _metric(currency.formatAmount(remaining), t('Reste à payer')),
            ],
          ),
          const SizedBox(height: 12),
          if (nextDue != null)
            TrText(
              '${t('Prochaine échéance')} : ${nextDue!.day}/${nextDue!.month} · ${nextDue!.year}',
              style: const TextStyle(fontSize: 12, color: Colors.black87, fontWeight: FontWeight.w600),
            ),
          const SizedBox(height: 12),
          LinearProgressIndicator(
            value: dueThisMonth > 0 ? (paidThisMonth / dueThisMonth).clamp(0, 1) : 0,
            minHeight: 8,
            backgroundColor: Colors.grey[200],
            valueColor: AlwaysStoppedAnimation<Color>(statusColor),
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              OutlinedButton(
                onPressed: onViewDebts,
                style: OutlinedButton.styleFrom(
                  foregroundColor: AppDesign.expenseColor,
                  side: BorderSide(color: AppDesign.expenseColor.withValues(alpha: 0.4)),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                ),
                child: TrText(t('Voir les dettes')),
              ),
              const SizedBox(width: 12),
              ElevatedButton(
                onPressed: onPay,
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppDesign.expenseColor,
                  foregroundColor: Colors.white,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                  elevation: 0,
                ),
                child: TrText(t('Payer une échéance')),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _metric(String value, String label) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        TrText(
          value,
          style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w900, color: Colors.black87),
        ),
        const SizedBox(height: 4),
        TrText(
          label,
          style: TextStyle(fontSize: 12, color: Colors.grey[700]),
        ),
      ],
    );
  }
}

class _GoalsInsightCard extends StatelessWidget {
  final double totalCurrent;
  final double totalTarget;
  final double globalProgress;
  final Goal? topGoal;
  final Goal? lagGoal;
  final double remainingAmount;
  final DateTime? closestDeadline;
  final VoidCallback onViewGoals;
  final VoidCallback onAddGoal;

  const _GoalsInsightCard({
    required this.totalCurrent,
    required this.totalTarget,
    required this.globalProgress,
    required this.topGoal,
    required this.lagGoal,
    required this.remainingAmount,
    required this.closestDeadline,
    required this.onViewGoals,
    required this.onAddGoal,
  });

  @override
  Widget build(BuildContext context) {
    final currency = context.watch<CurrencyService>();
    final deadlineText = closestDeadline != null
        ? 'Prochaine échéance : ${closestDeadline!.day}/${closestDeadline!.month}'
        : 'Pas d’échéance proche';

    return Container(
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [AppDesign.primaryPurple.withValues(alpha: 0.12), Colors.white],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(AppDesign.radiusXLarge),
        boxShadow: AppDesign.mediumShadow,
      ),
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: AppDesign.primaryPurple.withValues(alpha: 0.14),
                  shape: BoxShape.circle,
                ),
                child: const Icon(Icons.flag_rounded, color: AppDesign.primaryPurple),
              ),
              const SizedBox(width: 12),
              const Expanded(
                child: TrText(
                  'Objectifs financés',
                  style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700),
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                decoration: BoxDecoration(
                  color: AppDesign.primaryPurple.withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: TrText(
                  '${globalProgress.toStringAsFixed(0)}% global',
                  style: const TextStyle(
                    color: AppDesign.primaryPurple,
                    fontWeight: FontWeight.w800,
                    fontSize: 12,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              _metric(currency.formatAmount(totalCurrent), 'Déjà financé'),
              _metric(currency.formatAmount(totalTarget), 'Cible totale'),
              _metric(currency.formatAmount(remainingAmount), 'Reste à financer'),
            ],
          ),
          const SizedBox(height: 12),
          LinearProgressIndicator(
            value: totalTarget > 0 ? (totalCurrent / totalTarget).clamp(0, 1) : 0,
            minHeight: 8,
            backgroundColor: Colors.grey[200],
            valueColor: const AlwaysStoppedAnimation<Color>(AppDesign.primaryPurple),
          ),
          const SizedBox(height: 12),
          if (topGoal != null || lagGoal != null)
            Row(
              children: [
                if (topGoal != null)
                  Expanded(
                    child: _goalBadge(
                      t('Top'),
                      topGoal!.name,
                      '${topGoal!.progressPercentage.toStringAsFixed(0)}%',
                      AppDesign.incomeColor,
                    ),
                  ),
                const SizedBox(width: 8),
                if (lagGoal != null)
                  Expanded(
                    child: _goalBadge(
                      t('En retard (objectif)'),
                      lagGoal!.name,
                      '${lagGoal!.progressPercentage.toStringAsFixed(0)}%',
                      AppDesign.expenseColor,
                    ),
                  ),
              ],
            ),
          const SizedBox(height: 8),
          TrText(
            deadlineText,
            style: const TextStyle(fontSize: 12, color: Colors.black87, fontWeight: FontWeight.w600),
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              OutlinedButton(
                onPressed: onViewGoals,
                style: OutlinedButton.styleFrom(
                  foregroundColor: AppDesign.primaryPurple,
                  side: BorderSide(color: AppDesign.primaryPurple.withValues(alpha: 0.4)),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                ),
                child: TrText(t('Voir mes objectifs')),
              ),
              const SizedBox(width: 12),
              TextButton.icon(
                onPressed: onAddGoal,
                icon: const Icon(Icons.add, size: 16, color: AppDesign.primaryPurple),
                label: TrText(
                  t('Ajouter un objectif'),
                  style: const TextStyle(
                    color: AppDesign.primaryPurple,
                    fontWeight: FontWeight.w800,
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _metric(String value, String label) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        TrText(
          value,
          style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w900, color: Colors.black87),
        ),
        const SizedBox(height: 4),
        TrText(
          label,
          style: TextStyle(fontSize: 12, color: Colors.grey[700]),
        ),
      ],
    );
  }

  Widget _goalBadge(String title, String name, String value, Color color) {
    return Container(
      padding: const EdgeInsets.all(10),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.08),
        borderRadius: BorderRadius.circular(14),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          TrText(
            title,
            style: TextStyle(
              color: color,
              fontWeight: FontWeight.w800,
              fontSize: 12,
            ),
          ),
          const SizedBox(height: 4),
          TrText(
            name,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: const TextStyle(fontWeight: FontWeight.w700),
          ),
          TrText(
            value,
            style: TextStyle(
              color: color,
              fontWeight: FontWeight.w900,
            ),
          ),
        ],
      ),
    );
  }
}

class _ShortcutAction {
  final String label;
  final String subtitle;
  final IconData icon;
  final Color color;
  final VoidCallback onTap;

  _ShortcutAction({
    required this.label,
    required this.subtitle,
    required this.icon,
    required this.color,
    required this.onTap,
  });
}

class _ShortcutCard extends StatelessWidget {
  final _ShortcutAction action;
  final double width;

  const _ShortcutCard({required this.action, required this.width});

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: action.onTap,
      borderRadius: BorderRadius.circular(16),
      child: Container(
        width: width,
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: action.color.withValues(alpha: 0.08),
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: action.color.withValues(alpha: 0.18)),
          boxShadow: [
            BoxShadow(
              color: action.color.withValues(alpha: 0.08),
              blurRadius: 12,
              offset: const Offset(0, 6),
            ),
          ],
        ),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: action.color.withValues(alpha: 0.16),
                shape: BoxShape.circle,
              ),
              child: Icon(action.icon, color: action.color, size: 22),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  TrText(
                    action.label,
                    style: const TextStyle(
                      fontWeight: FontWeight.w800,
                      fontSize: 14,
                    ),
                  ),
                  const SizedBox(height: 2),
                  TrText(
                    action.subtitle,
                    style: TextStyle(
                      color: Colors.grey[700],
                      fontSize: 12,
                    ),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    textAlign: TextAlign.start,
                  ),
                ],
              ),
            ),
            const Icon(Icons.arrow_forward_ios_rounded, size: 14, color: Colors.black38),
          ],
        ),
      ),
    );
  }
}

class CategoryBudgetProgressBlock extends StatelessWidget {
  final FirestoreService firestoreService;

  const CategoryBudgetProgressBlock({super.key, required this.firestoreService});

  @override
  Widget build(BuildContext context) {
    final userId = firestoreService.currentUserId;
    if (userId == null) {
      return _placeholderStaticCard(
        title: t('Budget par catégorie'),
        message: 'Connectez-vous pour voir vos catégories.',
      );
    }

    final now = DateTime.now();
    final startOfMonth = DateTime(now.year, now.month, 1);

    final categories$ = firestoreService.getCategoriesStream(userId, type: null);
    final transactions$ = firestoreService.getTransactionsStream(
      userId,
      startDate: startOfMonth,
      endDate: now,
      limit: 500,
    );
    final budget$ = firestoreService.getBudgetPlanStream(userId);

    return StreamBuilder<List<dynamic>>(
      stream: CombineLatestStream.list([categories$, transactions$, budget$]),
      builder: (context, snapshot) {
        if (!snapshot.hasData) {
          return const Padding(
            padding: EdgeInsets.all(12),
            child: Center(child: CircularProgressIndicator()),
          );
        }
        final categories = snapshot.data![0] as List<Category>;
        final txs = snapshot.data![1] as List<Transaction>;
        final budgetPlan = snapshot.data![2] as Map<String, dynamic>?;

        final Map<String, String> catNames = {
          for (final c in categories) c.categoryId: c.name,
        };

        Map<String, double> allocations = Map.from(DEFAULT_ALLOCATION);
        double totalBudget = 0;
        if (budgetPlan != null) {
          final rawAlloc = budgetPlan['categoryAllocations'] as Map<String, dynamic>?;
          if (rawAlloc != null && rawAlloc.isNotEmpty) {
            final mapped = {
              for (final key in DEFAULT_ALLOCATION.keys) key: 0.0,
            };
            bool hasMapped = false;
            rawAlloc.forEach((key, value) {
              final pct = (value as num?)?.toDouble() ?? 0.0;
              if (pct <= 0) return;

              if (DEFAULT_ALLOCATION.containsKey(key)) {
                mapped[key] = pct;
                hasMapped = true;
                return;
              }

              final categoryName = catNames[key] ?? key;
              final pocket = _mapPocket(categoryName);
              mapped[pocket] = (mapped[pocket] ?? 0.0) + pct;
              hasMapped = true;
            });

            if (hasMapped) {
              allocations = mapped;
            }
          }
          final tb = budgetPlan['totalBudget'];
          if (tb is num) totalBudget = tb.toDouble();
        }
        final incomeTotal = txs.where((t) => t.type == TransactionType.income).fold<double>(0, (s, t) => s + t.amount);
        if (totalBudget <= 0 && incomeTotal > 0) {
          totalBudget = incomeTotal;
        }
        if (totalBudget <= 0) totalBudget = 1;

        final items = categories.where((c) => c.type == CategoryType.expense && c.isActive).map((cat) {
          final pocket = _mapPocket(cat.name);
          final allocatedShare = allocations[pocket] ?? DEFAULT_ALLOCATION[pocket] ?? 0;
          final allocated = allocatedShare * totalBudget;
          
          // Calculer le montant dépensé en vérifiant categoryId OU category (nom)
          final spent = txs
              .where((t) {
                if (t.type != TransactionType.expense) return false;
                
                // Vérifier par ID (prioritaire)
                if (t.categoryId != null && t.categoryId == cat.categoryId) {
                  return true;
                }
                
                // Vérifier par nom (fallback si categoryId est null)
                if (t.category != null && 
                    t.category!.toLowerCase().trim() == cat.name.toLowerCase().trim()) {
                  return true;
                }
                
                return false;
              })
              .fold<double>(0, (sum, t) => sum + t.amount);
          
          return _CategoryBudgetItem(
            name: cat.name,
            icon: cat.icon,
            allocated: allocated,
            spent: spent,
          );
        }).toList()
          ..sort((a, b) => b.spent.compareTo(a.spent));

        if (items.isEmpty) {
          return _placeholderStaticCard(
            title: t('Budget par catégorie'),
            message: 'Aucune catégorie de dépense active.',
          );
        }

        final overflowCount = items.where((i) => i.spent > i.allocated).length;
        final isHealthy = overflowCount == 0;
        final footerColor =
            isHealthy ? const Color(0xFF4CAF50).withValues(alpha: 0.08) : const Color(0xFFEF5350).withValues(alpha: 0.08);
        final footerTextColor = isHealthy ? const Color(0xFF2E7D32) : const Color(0xFFC62828);
        final footerIcon = isHealthy ? Icons.check_circle_rounded : Icons.warning_amber_rounded;
        final footerText = isHealthy
            ? 'Tout est sous contrôle. Excellente gestion !'
            : 'Attention : $overflowCount poches budgétaires sont en alerte rouge.';

        return Card(
          elevation: 4,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(AppDesign.radiusXLarge),
          ),
          child: Padding(
            padding: const EdgeInsets.all(AppDesign.paddingMedium),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const TrText(
                  'Budget par catégorie',
                  style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 12),
                ...items.map((item) => _CategoryProgressRow(item: item)).toList(),
                const SizedBox(height: 16),
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: footerColor,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Row(
                    children: [
                      Icon(footerIcon, color: footerTextColor),
                      const SizedBox(width: 8),
                      Expanded(
                        child: TrText(
                          footerText,
                          style: TextStyle(
                            color: footerTextColor,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  static Card _placeholderStaticCard({required String title, required String message}) {
    return Card(
      elevation: 4,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(AppDesign.radiusXLarge),
      ),
      child: Padding(
        padding: const EdgeInsets.all(AppDesign.paddingLarge),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            TrText(
              title,
              style: const TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 8),
            TrText(
              message,
              style: const TextStyle(color: Colors.grey),
            ),
          ],
        ),
      ),
    );
  }

  static String _mapPocket(String name) {
    final n = name.toLowerCase();
    if (n.contains('logement') || n.contains('rent')) return 'Logement';
    if (n.contains('aliment') || n.contains('nourr') || n.contains('food')) return 'Nourriture';
    if (n.contains('transport') || n.contains('taxi') || n.contains('carbur')) return 'Transport';
    if (n.contains('fact') || n.contains('abo') || n.contains('abonnement')) return 'Factures';
    if (n.contains('sant')) return 'Santé';
    if (n.contains('eparg') || n.contains('saving')) return 'Épargne';
    if (n.contains('invest')) return 'Investissement';
    if (n.contains('loisir') || n.contains('fun') || n.contains('divert')) return 'Loisirs';
    if (n.contains('famill') || n.contains('don')) return 'Famille';
    return 'Autres';
  }
}

class _CategoryBudgetItem {
  final String name;
  final String icon;
  final double allocated;
  final double spent;

  _CategoryBudgetItem({
    required this.name,
    required this.icon,
    required this.allocated,
    required this.spent,
  });
}

class _CategoryProgressRow extends StatelessWidget {
  final _CategoryBudgetItem item;

  const _CategoryProgressRow({required this.item});

  @override
  Widget build(BuildContext context) {
    final ratio = item.allocated > 0 ? item.spent / item.allocated : 0;
    Color barColor;
    if (ratio >= 1) {
      barColor = const Color(0xFFEF5350);
    } else if (ratio >= 0.75) {
      barColor = const Color(0xFFFFC107);
    } else {
      barColor = const Color(0xFF4CAF50);
    }

    final progressValue = ratio >= 1 ? 1.0 : ratio;
    final spentStyle = TextStyle(
      color: ratio >= 1 ? const Color(0xFFEF5350) : Colors.black87,
      fontWeight: ratio >= 1 ? FontWeight.bold : FontWeight.w600,
    );

    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 10),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                      color: Colors.grey.shade200,
                      shape: BoxShape.circle,
                    ),
                    child: TrText(item.icon, style: const TextStyle(fontSize: 16)),
                  ),
                  const SizedBox(width: 10),
                  TrText(
                    item.name,
                    style: const TextStyle(fontWeight: FontWeight.w700),
                  ),
                ],
              ),
              Builder(
                builder: (context) {
                  final currencyService = context.watch<CurrencyService>();
                  return TrText(
                    '${currencyService.formatAmountCompact(item.spent, null, false)} / ${currencyService.formatAmountCompact(item.allocated)}',
                    style: spentStyle,
                  );
                },
              ),
            ],
          ),
          const SizedBox(height: 8),
          ClipRRect(
            borderRadius: BorderRadius.circular(8),
            child: LinearProgressIndicator(
              value: progressValue.clamp(0.0, 1.0).toDouble(),
              minHeight: 9,
              backgroundColor: Colors.grey.shade200,
              valueColor: AlwaysStoppedAnimation<Color>(barColor),
            ),
          ),
        ],
      ),
    );
  }
}

class _PocketSummaryItem {
  final String name;
  final String icon;
  final double planned;
  final double engaged;

  _PocketSummaryItem({
    required this.name,
    required this.icon,
    required this.planned,
    required this.engaged,
  });
}

class _PocketSummaryRow extends StatelessWidget {
  final _PocketSummaryItem item;

  const _PocketSummaryRow({required this.item});

  @override
  Widget build(BuildContext context) {
    final ratio = item.planned > 0 ? (item.engaged / item.planned) : 0.0;
    final currencyService = context.watch<CurrencyService>();
    final targetCurrency = currencyService.currentCurrency;
    // Montants déjà dans la devise courante : ne pas reconvertir
    final plannedConverted = item.planned;
    final engagedConverted = item.engaged;
    final remaining = plannedConverted - engagedConverted;
    final statusColor = ratio >= 1
        ? const Color(0xFFEF5350)
        : ratio >= 0.75
            ? const Color(0xFFFFB300)
            : const Color(0xFF26A69A);
    final statusLabel = ratio >= 1
        ? t('Dépassement')
        : ratio >= 0.75
            ? t('À surveiller')
            : t('OK');
    Color barColor;
    if (ratio >= 1) {
      barColor = const Color(0xFFEF5350);
    } else if (ratio >= 0.75) {
      barColor = const Color(0xFF26A69A); // teal-ish like screenshot
    } else {
      barColor = const Color(0xFF26A69A);
    }

    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 10),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                      color: Colors.grey.shade200,
                      shape: BoxShape.circle,
                    ),
                    child: TrText(item.icon, style: const TextStyle(fontSize: 16)),
                  ),
                  const SizedBox(width: 10),
                  TrText(
                    item.name,
                    style: const TextStyle(fontWeight: FontWeight.w700),
                  ),
                ],
              ),
              Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  TrText(
                    '${t('Prévu')} ${currencyService.formatAmount(plannedConverted, targetCurrency)}',
                    style: const TextStyle(color: Colors.grey, fontSize: 12),
                  ),
                  TrText(
                    '${t('Engagé')} ${currencyService.formatAmount(engagedConverted, targetCurrency)}',
                    style: const TextStyle(
                      color: AppDesign.incomeColor,
                      fontWeight: FontWeight.w700,
                      fontSize: 13,
                    ),
                  ),
                  TrText(
                    '${t('Reste')} ${currencyService.formatAmount(remaining, targetCurrency)}',
                    style: TextStyle(
                      color: statusColor,
                      fontWeight: FontWeight.w700,
                      fontSize: 12,
                    ),
                  ),
                  Container(
                    margin: const EdgeInsets.only(top: 4),
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: statusColor.withValues(alpha: 0.12),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: TrText(
                      statusLabel,
                      style: TextStyle(
                        color: statusColor,
                        fontWeight: FontWeight.w700,
                        fontSize: 11,
                      ),
                    ),
                  ),
                ],
              ),
            ],
          ),
          const SizedBox(height: 8),
          ClipRRect(
            borderRadius: BorderRadius.circular(8),
            child: LinearProgressIndicator(
              value: ratio.clamp(0.0, 1.0),
              minHeight: 9,
              backgroundColor: Colors.grey.shade200,
              valueColor: AlwaysStoppedAnimation<Color>(barColor),
            ),
          ),
        ],
      ),
    );
  }
}
