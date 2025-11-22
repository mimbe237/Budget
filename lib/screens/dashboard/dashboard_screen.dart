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
import 'package:rxdart/rxdart.dart';

/// Dashboard principal affichant le solde global, les performances mensuelles
/// et l'historique récent des transactions en temps réel
class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  final FirestoreService _firestoreService = FirestoreService();
  final NumberFormat _currencyFormat =
      NumberFormat.currency(locale: 'fr_FR', symbol: '€', decimalDigits: 2);
  final Color _brandTeal = const Color(0xFF00796B);
  String _currentLang = 'fr';

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
                Text(
                  'Budget',
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w900,
                    color: Colors.black87,
                    height: 1.0,
                  ),
                ),
                Text(
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
          ],
        ),
        centerTitle: false,
        backgroundColor: Colors.white,
        elevation: 0,
        actions: [
          IconButton(
            tooltip: 'Comptes',
            icon: const Icon(Icons.account_balance_wallet, color: AppDesign.primaryIndigo),
            onPressed: () {
              Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (context) => const AccountManagementScreen(),
                ),
              );
            },
          ),
          IconButton(
            tooltip: 'Dettes / créances',
            icon: const Icon(Icons.handshake, color: AppDesign.primaryIndigo),
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
            tooltip: 'Objectifs',
            icon: const Icon(Icons.flag_outlined, color: AppDesign.primaryIndigo),
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
            onPressed: () {
              setState(() {
                _currentLang = _currentLang == 'fr' ? 'en' : 'fr';
              });
              final selectedLabel = _currentLang == 'fr' ? 'Français' : 'English';
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(content: Text('Langue sélectionnée : $selectedLabel')),
              );
            },
            style: TextButton.styleFrom(
              padding: const EdgeInsets.symmetric(horizontal: 10),
              minimumSize: const Size(44, 44),
            ),
            child: Text(
              _currentLang == 'fr' ? 'EN 🇬🇧' : 'FR 🇫🇷',
              style: const TextStyle(
                color: AppDesign.primaryIndigo,
                fontWeight: FontWeight.w700,
              ),
            ),
          ),
          Padding(
            padding: const EdgeInsets.only(right: 12, top: 4, bottom: 4),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                IconButton(
                  icon: const Icon(Icons.notifications_none, color: AppDesign.primaryIndigo),
                  tooltip: 'Notifications',
                  onPressed: () {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: Text('Notifications à venir')),
                    );
                  },
                ),
                const SizedBox(width: 10),
                PopupMenuButton<int>(
                  tooltip: 'Profil',
                  offset: const Offset(0, 42),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  itemBuilder: (context) => const [
                    PopupMenuItem<int>(
                      value: 0,
                      child: Text('Profil'),
                    ),
                    PopupMenuItem<int>(
                      value: 1,
                      child: Text('Paramètres'),
                    ),
                  ],
                  onSelected: (_) {},
                  child: CircleAvatar(
                    backgroundColor: AppDesign.primaryIndigo.withOpacity(0.1),
                    child: const Icon(Icons.person_outline, color: AppDesign.primaryIndigo),
                  ),
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
      const Text(
        "Solde Global Actuel",
        style: TextStyle(fontSize: 18, color: Colors.grey),
      ),
      const SizedBox(height: AppDesign.spacingSmall),
      _buildTotalBalanceCard(),
      const SizedBox(height: AppDesign.spacingMedium),
      _buildBudgetExcellenceCard(),
      const SizedBox(height: AppDesign.spacingMedium),
      CategoryBudgetProgressBlock(
        firestoreService: _firestoreService,
      ),
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
      _buildNotificationsCard(),
    ];
  }

  List<Widget> _buildLeftDesktopSections(BuildContext context) {
    return [
      _buildQuickAccess(context),
      const SizedBox(height: AppDesign.spacingLarge),
      const Text(
        "Solde Global Actuel",
        style: TextStyle(fontSize: 18, color: Colors.grey),
      ),
      const SizedBox(height: AppDesign.spacingSmall),
      _buildTotalBalanceCard(),
      const SizedBox(height: AppDesign.spacingMedium),
      _buildBudgetExcellenceCard(),
      const SizedBox(height: AppDesign.spacingMedium),
      CategoryBudgetProgressBlock(
        firestoreService: _firestoreService,
      ),
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
      _buildNotificationsCard(),
    ];
  }

  Row _buildRecentHistoryHeader(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        const Text(
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
          label: const Text('Voir tout'),
        ),
      ],
    );
  }

  Widget _buildQuickAccess(BuildContext context) {
    final shortcuts = [
      _ShortcutAction(
        label: 'Ajouter dépense',
        subtitle: 'Achats, factures et sorties',
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
        label: 'Ajouter revenu',
        subtitle: 'Salaires, primes et entrées',
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
        label: 'Gérer budget',
        subtitle: 'Suivi des poches et limites',
        icon: Icons.pie_chart_outline_rounded,
        color: _brandTeal,
        onTap: () => Navigator.push(
          context,
          MaterialPageRoute(builder: (_) => const BudgetPlannerScreen()),
        ),
      ),
      _ShortcutAction(
        label: 'Gérer comptes',
        subtitle: 'Soldes et transferts gérés.',
        icon: Icons.account_balance_wallet_outlined,
        color: AppDesign.primaryIndigo,
        onTap: () => Navigator.push(
          context,
          MaterialPageRoute(builder: (_) => const AccountManagementScreen()),
        ),
      ),
      _ShortcutAction(
        label: 'Suivre objectifs',
        subtitle: 'Épargne et projets d\'avenir',
        icon: Icons.flag_outlined,
        color: AppDesign.primaryPurple,
        onTap: () => Navigator.push(
          context,
          MaterialPageRoute(builder: (_) => const GoalFundingScreen()),
        ),
      ),
      _ShortcutAction(
        label: 'Gérer dettes',
        subtitle: 'Emprunts et crédits réglés.',
        icon: Icons.handshake_outlined,
        color: Colors.deepOrange,
        onTap: () => Navigator.push(
          context,
          MaterialPageRoute(builder: (_) => const IOUTrackingScreen()),
        ),
      ),
      _ShortcutAction(
        label: 'Catégories',
        subtitle: 'Gérer vos catégories',
        icon: Icons.category_outlined,
        color: Colors.teal,
        onTap: () => Navigator.push(
          context,
          MaterialPageRoute(builder: (_) => const CategoryManagementScreen()),
        ),
      ),
      _ShortcutAction(
        label: 'Corbeille',
        subtitle: 'Restaurer ou supprimer',
        icon: Icons.delete_outline,
        color: Colors.grey,
        onTap: () => Navigator.push(
          context,
          MaterialPageRoute(builder: (_) => const TrashScreen()),
        ),
      ),
    ];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
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
                      height: 120,
                      child: _ShortcutCard(action: s),
                    ),
              )
              .toList(),
        ),
      ],
    );
  }

  Row _buildPerformanceHeader(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        const Text(
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
          label: const Text('Budget'),
        ),
      ],
    );
  }

  /// Carte affichant le solde total de tous les comptes
  Widget _buildTotalBalanceCard() {
    final userId = _firestoreService.currentUserId;
    if (userId == null) {
      return _placeholderCard(
        title: 'Total Net',
        message: 'Connectez-vous pour voir vos comptes.',
      );
    }

    return StreamBuilder<List<Account>>(
      stream: _firestoreService.getAccountsStream(userId),
      builder: (context, snapshot) {
        if (snapshot.hasError) {
          return _placeholderCard(
            title: 'Total Net',
            message: 'Erreur lors du chargement des comptes.',
          );
        }
        if (!snapshot.hasData) {
          return const Center(child: CircularProgressIndicator());
        }

        final accounts = snapshot.data!;
        final totalBalance = accounts.fold<double>(0.0, (sum, acc) => sum + acc.balance);

        return Container(
          decoration: BoxDecoration(
            gradient: LinearGradient(
              colors: [_brandTeal, _brandTeal.withOpacity(0.85)],
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
                  Text(
                    'Total Net',
                    style: TextStyle(color: Colors.white.withOpacity(0.8), fontSize: 16, fontWeight: FontWeight.w600),
                  ),
                  const SizedBox(height: 10),
                  Text(
                    '${totalBalance.toStringAsFixed(2)} €',
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 38,
                      fontWeight: FontWeight.w900,
                      letterSpacing: -0.5,
                    ),
                  ),
                  const SizedBox(height: 10),
                  Text(
                    '${accounts.length} compte(s)',
                    style: TextStyle(color: Colors.white.withOpacity(0.7), fontSize: 14),
                  ),
                ],
              ),
              Container(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: Colors.white.withOpacity(0.15),
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
        title: 'Thermomètre budgétaire',
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
                        backgroundColor: gaugeColor.withOpacity(0.12),
                        valueColor: AlwaysStoppedAnimation<Color>(gaugeColor),
                      ),
                      Center(
                        child: Text(
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
                      Text(
                        'Thermomètre Budgétaire',
                        style: TextStyle(
                          fontWeight: FontWeight.w800,
                          fontSize: 16,
                          color: _brandTeal,
                        ),
                      ),
                      const SizedBox(height: 6),
                      Text(
                        label,
                        style: const TextStyle(
                          fontSize: 15,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                      const SizedBox(height: 6),
                      Text(
                        'Jours écoulés : ${(idealRatio * 100).toStringAsFixed(1)}% • Dépenses : ${(budgetConsumed * 100).toStringAsFixed(1)}%',
                        style: TextStyle(color: Colors.grey[700], fontSize: 12),
                      ),
                      const SizedBox(height: 4),
                      Text(
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
        title: 'Performance mensuelle',
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
            title: 'Performance mensuelle',
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

        return GridView.count(
          crossAxisCount: 2,
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          childAspectRatio: 1.35,
          mainAxisSpacing: AppDesign.spacingMedium,
          crossAxisSpacing: AppDesign.spacingMedium,
          children: [
            _InsightCard(
              title: 'Revenu du mois',
              amount: income,
              emoji: '💰',
              color: AppDesign.incomeColor,
              subtitle: 'Total encaissé',
            ),
            _InsightCard(
              title: 'Dépenses du mois',
              amount: expense,
              emoji: '💸',
              color: AppDesign.expenseColor,
              subtitle: 'Total déboursé',
            ),
            _InsightCard(
              title: 'Dettes du mois',
              amount: debtAmount,
              emoji: '💳',
              color: AppDesign.expenseColor,
              subtitle: 'Remboursements & échéances',
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
                title: 'Objectifs financés',
                amount: targetAmount,
                emoji: '🎯',
                color: AppDesign.primaryPurple,
                subtitle: 'Progression',
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
        title: 'Transactions récentes',
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
            title: 'Transactions récentes',
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
                child: Text("Aucune transaction récente. Ajoutez-en une !"),
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
                    color: txColor.withOpacity(0.12),
                    shape: BoxShape.circle,
                  ),
                  child: Icon(txIcon, color: txColor),
                ),
                title: Text(
                  tx.description ?? '',
                  style: const TextStyle(fontWeight: FontWeight.w600),
                ),
                subtitle: Text(
                  '$formattedDate · $categoryLabel',
                  style: const TextStyle(color: Colors.grey),
                ),
                trailing: Text(
                  '$prefix ${tx.amount.toStringAsFixed(2)} €',
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
                color: AppDesign.primaryIndigo.withOpacity(0.1),
                borderRadius: BorderRadius.circular(12),
              ),
              child: const Icon(Icons.pie_chart_outline, color: AppDesign.primaryIndigo, size: 34),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: const [
                  Text(
                    'Répartition des dépenses',
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  SizedBox(height: 4),
                  Text(
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
            Text(
              title,
              style: const TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              message,
              style: const TextStyle(color: Colors.grey),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildNotificationsCard() {
    return Card(
      elevation: 6,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(AppDesign.radiusXLarge),
      ),
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: const [
            Text(
              'Notifications',
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.bold,
              ),
            ),
            SizedBox(height: 8),
            Text(
              'Aucune notification pour le moment.',
              style: TextStyle(color: Colors.grey),
            ),
          ],
        ),
      ),
    );
  }
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
            color.withOpacity(0.18),
            Colors.white,
          ],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(AppDesign.radiusXLarge),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 14,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      padding: const EdgeInsets.all(18),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: color.withOpacity(0.18),
                  shape: BoxShape.circle,
                ),
                child: Text(
                  emoji,
                  style: const TextStyle(fontSize: 18),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      title,
                      style: const TextStyle(
                        color: Colors.black87,
                        fontSize: 15,
                        fontWeight: FontWeight.w800,
                      ),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                    if (subtitle.isNotEmpty)
                      Text(
                        subtitle,
                        style: TextStyle(
                          color: Colors.grey[700],
                          fontSize: 12,
                        ),
                      ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Text(
            '${amount.toStringAsFixed(2)} €',
            style: TextStyle(
              color: color,
              fontSize: 22,
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

  const _ShortcutCard({required this.action});

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: action.onTap,
      borderRadius: BorderRadius.circular(16),
      child: Container(
        width: 210,
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: action.color.withOpacity(0.08),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: action.color.withOpacity(0.18)),
          boxShadow: [
            BoxShadow(
              color: action.color.withOpacity(0.08),
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
                color: action.color.withOpacity(0.16),
                shape: BoxShape.circle,
              ),
              child: Icon(action.icon, color: action.color, size: 22),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    action.label,
                    style: const TextStyle(
                      fontWeight: FontWeight.w800,
                      fontSize: 14,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
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
        title: 'Budget par catégorie',
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
            title: 'Budget par catégorie',
            message: 'Aucune catégorie de dépense active.',
          );
        }

        final overflowCount = items.where((i) => i.spent > i.allocated).length;
        final isHealthy = overflowCount == 0;
        final footerColor =
            isHealthy ? const Color(0xFF4CAF50).withOpacity(0.08) : const Color(0xFFEF5350).withOpacity(0.08);
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
                const Text(
                  'Budget par catégorie',
                  style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 12),
                ...items.map((item) => _CategoryProgressRow(item: item)).toList(),
                const SizedBox(height: 12),
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
                        child: Text(
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
            Text(
              title,
              style: const TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 8),
            Text(
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
                    child: Text(item.icon, style: const TextStyle(fontSize: 16)),
                  ),
                  const SizedBox(width: 10),
                  Text(
                    item.name,
                    style: const TextStyle(fontWeight: FontWeight.w700),
                  ),
                ],
              ),
              Text(
                '${item.spent.toStringAsFixed(0)}€ / ${item.allocated.toStringAsFixed(0)}€',
                style: spentStyle,
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
