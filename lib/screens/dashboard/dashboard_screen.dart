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
import '../profile/profile_settings_screen.dart';
import '../settings/notification_settings_screen.dart';
import 'package:rxdart/rxdart.dart';
import 'package:budget/l10n/app_localizations.dart';
import 'package:provider/provider.dart';
import 'package:budget/services/currency_service.dart';
import 'package:budget/services/theme_service.dart';
import 'package:firebase_auth/firebase_auth.dart';

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
      backgroundColor: const Color(0xFFFAFAFA),
      appBar: AppBar(
        toolbarHeight: 74,
        titleSpacing: 12,
        title: Row(
          children: [
            const RevolutionaryLogo(size: 38),
            const SizedBox(width: 10),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: const [
                TrText(
                  'Budget',
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w900,
                    color: Colors.black87,
                    height: 1.0,
                  ),
                ),
                TrText(
                  'Pro',
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w900,
                    color: AppDesign.primaryIndigo,
                    height: 1.0,
                  ),
                ),
              ],
            ),
            const Spacer(),
          ],
        ),
        centerTitle: false,
        backgroundColor: Colors.white,
        elevation: 0,
        actions: [
          Padding(
            padding: const EdgeInsets.only(right: 12),
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
                    PopupMenuButton<int>(
                      tooltip: t('Profil'),
                      offset: const Offset(0, 42),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      itemBuilder: (context) => const [
                        PopupMenuItem<int>(value: 0, child: TrText('Profil')),
                        PopupMenuItem<int>(value: 1, child: TrText('Paramètres')),
                        PopupMenuItem<int>(value: 2, child: TrText('Déconnexion')),
                        PopupMenuItem<int>(value: 3, child: TrText('Basculer le thème')),
                      ],
                      onSelected: (value) async {
                        if (value == 0) {
                          Navigator.push(
                            context,
                            MaterialPageRoute(builder: (_) => const ProfileSettingsScreen()),
                          );
                        } else if (value == 1) {
                          Navigator.push(
                            context,
                            MaterialPageRoute(builder: (_) => const NotificationSettingsScreen()),
                          );
                        } else if (value == 2) {
                          await FirestoreService().cleanupDemoDataOnLogout();
                          await FirebaseAuth.instance.signOut();
                          if (!context.mounted) return;
                          Navigator.of(context, rootNavigator: true).pushAndRemoveUntil(
                            MaterialPageRoute(builder: (_) => const AuthScreen()),
                            (route) => false,
                          );
                        } else if (value == 3) {
                          if (!context.mounted) return;
                          await context.read<ThemeProvider>().toggleTheme();
                        }
                      },
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
        ],
      ),
      body: LayoutBuilder(
        builder: (context, constraints) {
          final isWide = constraints.maxWidth >= 600;
          if (!isWide) {
            return SingleChildScrollView(
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
    );
  }

  List<Widget> _buildMobileSections(BuildContext context) {
    return [
      _buildQuickAccess(context),
      const SizedBox(height: AppDesign.spacingLarge),
      const TrText(
        "Solde Global Actuel",
        style: TextStyle(fontSize: 18, color: Colors.grey),
      ),
      const SizedBox(height: AppDesign.spacingSmall),
      _buildTotalBalanceCard(),
      const SizedBox(height: AppDesign.spacingMedium),
      _buildBudgetExcellenceCard(),
      const SizedBox(height: AppDesign.spacingLarge),
      _buildPerformanceHeader(context),
      const SizedBox(height: AppDesign.spacingSmall),
      _buildSpendingChartPlaceholder(),
      const SizedBox(height: AppDesign.spacingSmall),
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
      _buildQuickAccess(context),
      const SizedBox(height: AppDesign.spacingLarge),
      const TrText(
        "Solde Global Actuel",
        style: TextStyle(fontSize: 18, color: Colors.grey),
      ),
      const SizedBox(height: AppDesign.spacingSmall),
      _buildTotalBalanceCard(),
      const SizedBox(height: AppDesign.spacingMedium),
      _buildBudgetExcellenceCard(),
      const SizedBox(height: AppDesign.spacingLarge),
      _buildPerformanceHeader(context),
      const SizedBox(height: AppDesign.spacingSmall),
      _buildSpendingChartPlaceholder(),
      const SizedBox(height: AppDesign.spacingSmall),
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

  Widget _buildQuickAccess(BuildContext context) {
    final shortcuts = [
      _ShortcutAction(
        label: t('Ajouter dépense'),
        subtitle: t('Achats, factures et sorties'),
        icon: Icons.remove_circle_outline,
        color: AppDesign.expenseColor,
        onTap: () => Navigator.push(
          context,
          MaterialPageRoute(
            builder: (_) => const TransactionFormScreen(transactionType: TransactionType.expense),
          ),
        ),
      ),
      _ShortcutAction(
        label: t('Ajouter revenu'),
        subtitle: t('Salaires, primes et entrées'),
        icon: Icons.add_circle_outline,
        color: AppDesign.incomeColor,
        onTap: () => Navigator.push(
          context,
          MaterialPageRoute(
            builder: (_) => const TransactionFormScreen(transactionType: TransactionType.income),
          ),
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
        label: t('Suivre objectifs'),
        subtitle: t("Épargne et projets d'avenir"),
        icon: Icons.flag_outlined,
        color: AppDesign.primaryPurple,
        onTap: () => Navigator.push(
          context,
          MaterialPageRoute(builder: (_) => const GoalFundingScreen()),
        ),
      ),
      _ShortcutAction(
        label: t('Gérer dettes'),
        subtitle: t('Emprunts et crédits réglés.'),
        icon: Icons.handshake_outlined,
        color: Colors.deepOrange,
        onTap: () => Navigator.push(
          context,
          MaterialPageRoute(builder: (_) => const IOUTrackingScreen()),
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
                          height: 120,
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
          "Performance Mensuelle",
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
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  TrText(
                    'Total Net',
                    style: TextStyle(color: Colors.white.withValues(alpha: 0.8), fontSize: 16, fontWeight: FontWeight.w600),
                  ),
                  const SizedBox(height: 10),
                  TrText(
                    currency.formatAmount(totalBalance),
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 38,
                      fontWeight: FontWeight.w900,
                      letterSpacing: -0.5,
                    ),
                  ),
                  const SizedBox(height: 10),
                  TrText(
                    '${accounts.length} compte(s)',
                    style: TextStyle(color: Colors.white.withValues(alpha: 0.7), fontSize: 14),
                  ),
                ],
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

  /// Grille des indicateurs mensuels (revenus, dépenses, reste, objectifs)
  Widget _buildMonthlyInsightCards(BuildContext context) {
    final now = DateTime.now();
    final startOfMonth = DateTime(now.year, now.month, 1);
    final userId = _firestoreService.currentUserId;

    if (userId == null) {
      return _placeholderCard(
        title: t('Performance mensuelle'),
        message: 'Connectez-vous pour voir vos statistiques.',
      );
    }

    return StreamBuilder<List<Transaction>>(
      stream: _firestoreService.getTransactionsStream(
        userId,
        startDate: startOfMonth,
        endDate: now,
        limit: 300,
      ),
      builder: (context, snapshot) {
        if (snapshot.hasError) {
          return _placeholderCard(
            title: t('Performance mensuelle'),
            message: 'Erreur de chargement des transactions.',
          );
        }
        if (!snapshot.hasData) {
          return const Center(child: CircularProgressIndicator());
        }

        double income = 0.0;
        double expense = 0.0;
        double debtAmount = 0.0;
        final debtKeywords = ['dette', 'prêt', 'loan', 'debt'];

        for (final tx in snapshot.data!) {
          if (tx.type == TransactionType.income) {
            income += tx.amount;
          } else if (tx.type == TransactionType.expense) {
            expense += tx.amount;
            if (tx.category != null &&
                debtKeywords.any((k) => tx.category!.toLowerCase().contains(k))) {
              debtAmount += tx.amount;
            }
          }
        }

        final remaining = income - expense;
        const targetAmount = 2500.0; // TODO: Récupérer de la config utilisateur

        return LayoutBuilder(
          builder: (context, constraints) {
            final isNarrow = constraints.maxWidth < 620;
            final crossAxisCount = isNarrow ? 1 : 2;
            final aspectRatio = isNarrow ? 2.8 : 1.35;

            return GridView.count(
              crossAxisCount: crossAxisCount,
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              childAspectRatio: aspectRatio,
              mainAxisSpacing: AppDesign.spacingMedium,
              crossAxisSpacing: AppDesign.spacingMedium,
              children: [
                _InsightCard(
                  title: t('Revenu du mois'),
                  amount: income,
                  emoji: '💰',
                  color: AppDesign.incomeColor,
                  subtitle: t('Total encaissé'),
                ),
                _InsightCard(
                  title: t('Dépenses du mois'),
                  amount: expense,
                  emoji: '💸',
                  color: AppDesign.expenseColor,
                  subtitle: t('Total déboursé'),
                ),
                _InsightCard(
                  title: t('Dettes du mois'),
                  amount: debtAmount,
                  emoji: '💳',
                  color: AppDesign.expenseColor,
                  subtitle: t('Remboursements & échéances'),
                ),
                InkWell(
                  onTap: () {
                    Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (context) => const GoalFundingScreen(),
                      ),
                    );
                  },
                  child: _InsightCard(
                    title: t('Objectifs financés'),
                    amount: targetAmount,
                    emoji: '🎯',
                    color: AppDesign.primaryPurple,
                    subtitle: t('Progression'),
                  ),
                ),
              ],
            );
          },
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
        if (transactions.isEmpty) {
          return Card(
            elevation: 4,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(AppDesign.borderRadiusLarge),
            ),
            child: const Padding(
              padding: EdgeInsets.all(AppDesign.paddingLarge),
              child: Center(
                child: TrText("Aucune transaction récente. Ajoutez-en une !"),
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
            children: transactions.take(5).map((tx) {
              final isExpense = tx.type == TransactionType.expense;
              final isIncome = tx.type == TransactionType.income;
              final isTransfer = tx.type == TransactionType.transfer;

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

              final categoryLabel = tx.category?.isNotEmpty == true ? tx.category! : 'Sans catégorie';
              final formattedDate = DateFormat('dd/MM/yyyy').format(tx.date);

              return ListTile(
                leading: Container(
                  width: 46,
                  height: 46,
                  decoration: BoxDecoration(
                    color: txColor.withValues(alpha: 0.12),
                    shape: BoxShape.circle,
                  ),
                  child: Icon(txIcon, color: txColor),
                ),
                title: TrText(
                  tx.description ?? '',
                  style: const TextStyle(fontWeight: FontWeight.w600),
                ),
                subtitle: TrText(
                  '$formattedDate · $categoryLabel',
                  style: const TextStyle(color: Colors.grey),
                ),
                trailing: TrText(
                  '$prefix ${context.watch<CurrencyService>().formatAmount(tx.amount)}',
                  style: TextStyle(
                    color: txColor,
                    fontWeight: FontWeight.bold,
                    fontSize: 16,
                  ),
                ),
              );
            }).toList(),
          ),
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

    return StreamBuilder<List<dynamic>>(
      stream: CombineLatestStream.list([categories$, transactions$]),
      builder: (context, snapshot) {
        if (!snapshot.hasData) {
          return const Padding(
            padding: EdgeInsets.all(12),
            child: Center(child: CircularProgressIndicator()),
          );
        }

        final categories = snapshot.data![0] as List<Category>;
        final txs = snapshot.data![1] as List<Transaction>;

        const defaultAllocation = 200.0;

        final items = categories
            .where((c) => c.type == CategoryType.expense && c.isActive)
            .map((cat) {
          final engaged = txs
              .where((t) => t.categoryId == cat.categoryId && t.type == TransactionType.expense)
              .fold<double>(0, (sum, t) => sum + t.amount);
          return _PocketSummaryItem(
            name: cat.name,
            icon: cat.icon,
            planned: defaultAllocation,
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
}

/// Widget réutilisable pour les cartes d'insights financiers
class _InsightCard extends StatelessWidget {
  final String title;
  final double amount;
  final String emoji;
  final Color color;
  final String subtitle;

  const _InsightCard({
    required this.title,
    required this.amount,
    required this.color,
    required this.emoji,
    this.subtitle = '',
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [
            color.withValues(alpha: 0.18),
            Colors.white,
          ],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(AppDesign.radiusXLarge),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.05),
            blurRadius: 14,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisSize: MainAxisSize.min,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: color.withValues(alpha: 0.18),
                  shape: BoxShape.circle,
                ),
                child: TrText(
                  emoji,
                  style: const TextStyle(fontSize: 16),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    TrText(
                      title,
                      style: const TextStyle(
                        color: Colors.black87,
                        fontSize: 14,
                        fontWeight: FontWeight.w800,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                    if (subtitle.isNotEmpty)
                      TrText(
                        subtitle,
                        style: TextStyle(
                          color: Colors.grey[700],
                          fontSize: 11,
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                  ],
                ),
              ),
            ],
          ),
          const Spacer(),
          Builder(
            builder: (context) => TrText(
              context.watch<CurrencyService>().formatAmount(amount, null, false),
              style: TextStyle(
                color: color,
                fontSize: 18,
                fontWeight: FontWeight.w900,
              ),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
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
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: action.color.withValues(alpha: 0.08),
          borderRadius: BorderRadius.circular(16),
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

    return StreamBuilder<List<dynamic>>(
      stream: CombineLatestStream.list([categories$, transactions$]),
      builder: (context, snapshot) {
        if (!snapshot.hasData) {
          return const Padding(
            padding: EdgeInsets.all(12),
            child: Center(child: CircularProgressIndicator()),
          );
        }
        final categories = snapshot.data![0] as List<Category>;
        final txs = snapshot.data![1] as List<Transaction>;

        const defaultAllocation = 200.0;

        final items = categories.where((c) => c.type == CategoryType.expense && c.isActive).map((cat) {
          final spent = txs
              .where((t) => t.categoryId == cat.categoryId && t.type == TransactionType.expense)
              .fold<double>(0, (sum, t) => sum + t.amount);
          return _CategoryBudgetItem(
            name: cat.name,
            icon: cat.icon,
            allocated: defaultAllocation,
            spent: spent,
          );
        }).toList();

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
                    '${currencyService.formatAmount(item.spent, null, false)} / ${currencyService.formatAmount(item.allocated)}',
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
    Color barColor;
    if (ratio >= 1) {
      barColor = const Color(0xFFEF5350);
    } else if (ratio >= 0.75) {
      barColor = const Color(0xFF26A69A); // teal-ish like screenshot
    } else {
      barColor = const Color(0xFF26A69A);
    }

    final currency = context.watch<CurrencyService>();

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
                    '${t('Prévu')} ${currency.formatAmount(item.planned)}',
                    style: const TextStyle(color: Colors.grey, fontSize: 12),
                  ),
                  TrText(
                    '${t('Engagé')} ${currency.formatAmount(item.engaged)}',
                    style: const TextStyle(
                      color: AppDesign.incomeColor,
                      fontWeight: FontWeight.w700,
                      fontSize: 13,
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
