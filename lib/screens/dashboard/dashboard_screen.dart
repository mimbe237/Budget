import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

import '../../constants/app_design.dart';
import '../../models/models.dart';
import '../../services/firestore_service.dart';
import '../../services/mock_data_service.dart';
import '../accounts/account_management_screen.dart';
import '../budget/budget_planner_screen.dart';
import '../goals/goal_funding_screen.dart';
import '../ious/iou_tracking_screen.dart';

/// Dashboard principal affichant le solde global, les performances mensuelles
/// et l'historique récent des transactions en temps réel
class DashboardScreen extends StatelessWidget {
  const DashboardScreen({super.key});

  static final FirestoreService _firestoreService = FirestoreService();
  static final MockDataService _mockDataService = MockDataService();
  static final NumberFormat _currencyFormat =
      NumberFormat.currency(locale: 'fr_FR', symbol: '€', decimalDigits: 2);

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppDesign.backgroundGrey,
      appBar: AppBar(
        title: const Text(
          'Accueil & Dashboard',
          style: TextStyle(
            fontWeight: FontWeight.bold,
            color: AppDesign.primaryIndigo,
          ),
        ),
        backgroundColor: Colors.white,
        elevation: 0,
        actions: [
          IconButton(
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
            icon: const Icon(Icons.notifications_none, color: AppDesign.primaryIndigo),
            onPressed: () {
              // TODO: Navigation vers la page des notifications
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('Notifications à venir')),
              );
            },
          ),
        ],
      ),
      body: LayoutBuilder(
        builder: (context, constraints) {
          final isWide = constraints.maxWidth >= 600;
          if (!isWide) {
            return SingleChildScrollView(
              child: Padding(
                padding: const EdgeInsets.all(AppDesign.paddingMedium),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: _buildMobileSections(context),
                ),
              ),
            );
          }

          return Padding(
            padding: const EdgeInsets.all(AppDesign.paddingMedium),
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
                      children: _buildRightDesktopSections(),
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
      const Text(
        "Solde Global Actuel",
        style: TextStyle(fontSize: 18, color: Colors.grey),
      ),
      const SizedBox(height: AppDesign.spacingSmall),
      _buildTotalBalanceCard(),
      const SizedBox(height: AppDesign.spacingMedium),
      _buildNetProjectionSnippet(),
      const SizedBox(height: AppDesign.spacingLarge),
      _buildPerformanceHeader(context),
      const SizedBox(height: AppDesign.spacingSmall),
      _buildSpendingChartPlaceholder(),
      const SizedBox(height: AppDesign.spacingSmall),
      _buildMonthlyInsightCards(context),
      const SizedBox(height: AppDesign.spacingLarge),
      const Text(
        "Historique Récent",
        style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
      ),
      const SizedBox(height: AppDesign.spacingSmall),
      _buildRecentTransactionsList(),
      const SizedBox(height: AppDesign.spacingMedium),
      _buildNotificationsCard(),
    ];
  }

  List<Widget> _buildLeftDesktopSections(BuildContext context) {
    return [
      const Text(
        "Solde Global Actuel",
        style: TextStyle(fontSize: 18, color: Colors.grey),
      ),
      const SizedBox(height: AppDesign.spacingSmall),
      _buildTotalBalanceCard(),
      const SizedBox(height: AppDesign.spacingMedium),
      _buildNetProjectionSnippet(),
      const SizedBox(height: AppDesign.spacingLarge),
      _buildPerformanceHeader(context),
      const SizedBox(height: AppDesign.spacingSmall),
      _buildSpendingChartPlaceholder(),
      const SizedBox(height: AppDesign.spacingSmall),
      _buildMonthlyInsightCards(context),
    ];
  }

  List<Widget> _buildRightDesktopSections() {
    return [
      const Text(
        "Historique Récent",
        style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
      ),
      const SizedBox(height: AppDesign.spacingSmall),
      _buildRecentTransactionsList(),
      const SizedBox(height: AppDesign.spacingMedium),
      _buildNotificationsCard(),
    ];
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
    final accounts = _mockDataService.getMockAccounts();
    final totalBalance = _mockDataService.getTotalBalance();

    return Card(
      color: AppDesign.primaryIndigo,
      elevation: 8,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(AppDesign.borderRadiusLarge),
      ),
      child: Padding(
        padding: const EdgeInsets.all(AppDesign.paddingLarge),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Total Net',
                  style: TextStyle(color: Colors.white70, fontSize: 16),
                ),
                const SizedBox(height: 8),
                Text(
                  '${totalBalance.toStringAsFixed(2)} €',
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 36,
                    fontWeight: FontWeight.w900,
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  '${accounts.length} compte(s)',
                  style: const TextStyle(color: Colors.white60, fontSize: 14),
                ),
              ],
            ),
            const Icon(Icons.show_chart, color: Colors.white, size: 50),
          ],
        ),
      ),
    );
  }

  Widget _buildNetProjectionSnippet() {
    return FutureBuilder<ProjectionResult>(
      future: _fetchProjectionResult(),
      builder: (context, snapshot) {
        if (snapshot.connectionState == ConnectionState.waiting) {
          return Card(
            elevation: 4,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(AppDesign.borderRadiusLarge),
            ),
            child: const Padding(
              padding: EdgeInsets.all(AppDesign.paddingLarge),
              child: Center(child: CircularProgressIndicator()),
            ),
          );
        }

        if (!snapshot.hasData || snapshot.hasError) {
          return Card(
            elevation: 4,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(AppDesign.borderRadiusLarge),
            ),
            child: const Padding(
              padding: EdgeInsets.all(AppDesign.paddingLarge),
              child: Text(
                'Projection du solde net indisponible.',
                style: TextStyle(color: Colors.grey),
              ),
            ),
          );
        }

        final projection = snapshot.data!;
        final isPositive = projection.estimatedEndOfMonthBalance >= 0;
        final color = isPositive ? AppDesign.incomeColor : AppDesign.expenseColor;
        final icon = isPositive ? Icons.trending_up : Icons.trending_down;

        return Card(
          elevation: 6,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(AppDesign.borderRadiusLarge),
          ),
          child: Padding(
            padding: const EdgeInsets.all(AppDesign.paddingMedium),
            child: Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: color.withOpacity(0.12),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Icon(icon, color: color),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'Projection du solde net (fin de mois)',
                        style: TextStyle(
                          fontWeight: FontWeight.w700,
                          fontSize: 14,
                        ),
                      ),
                      const SizedBox(height: 6),
                      Text(
                        _currencyFormat.format(
                            projection.estimatedEndOfMonthBalance),
                        style: TextStyle(
                          color: color,
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(height: 6),
                      Text(
                        'Charges fixes restantes : ${_currencyFormat.format(projection.upcomingFixedExpensesTotal)}',
                        style: const TextStyle(color: Colors.grey, fontSize: 12),
                      ),
                    ],
                  ),
                ),
                Icon(Icons.chevron_right, color: color.withOpacity(0.6)),
              ],
            ),
          ),
        );
      },
    );
  }

  Future<ProjectionResult> _fetchProjectionResult() async {
    final userId = _firestoreService.currentUserId;
    if (userId != null) {
      return _firestoreService.predictEndOfMonthBalance(userId: userId);
    }
    return _mockDataService.getMockProjection();
  }

  /// Grille des indicateurs mensuels (revenus, dépenses, reste, objectifs)
  Widget _buildMonthlyInsightCards(BuildContext context) {
    final mockService = _mockDataService;
    final transactions = mockService.getMockTransactions();
    
    // Calcul des totaux du mois en cours
    final now = DateTime.now();
    final thisMonth = transactions.where((tx) => 
      tx.date.month == now.month && tx.date.year == now.year
    );
    
    double income = 0.0;
    double expense = 0.0;
    
    for (var tx in thisMonth) {
      if (tx.type == TransactionType.income) {
        income += tx.amount;
      } else if (tx.type == TransactionType.expense) {
        expense += tx.amount;
      }
    }
    
    final remaining = income - expense;
    final targetAmount = 2500.0; // TODO: Récupérer de la config utilisateur

    return GridView.count(
      crossAxisCount: 2,
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      childAspectRatio: 1.5,
      mainAxisSpacing: AppDesign.spacingSmall,
      crossAxisSpacing: AppDesign.spacingSmall,
      children: [
        _InsightCard(
          title: 'Revenu',
          amount: income,
          icon: Icons.add_circle_outline,
          color: AppDesign.incomeColor,
        ),
        _InsightCard(
          title: 'Dépense',
          amount: expense,
          icon: Icons.remove_circle_outline,
          color: AppDesign.expenseColor,
        ),
        _InsightCard(
          title: 'Reste à budgétiser',
          amount: remaining,
          icon: remaining >= 0 ? Icons.check_circle_outline : Icons.warning_amber,
          color: remaining >= 0 ? Colors.blueAccent : Colors.orange,
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
            icon: Icons.auto_graph,
            color: AppDesign.primaryPurple,
          ),
        ),
      ],
    );
  }

  /// Liste des transactions récentes avec icônes et montants colorés
  Widget _buildRecentTransactionsList() {
    final mockService = _mockDataService;
    final transactions = mockService.getRecentTransactions(limit: 5);

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

    final categories = mockService.getMockCategories();
    
    return Card(
      elevation: 4,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(AppDesign.borderRadiusLarge),
      ),
      child: Column(
        children: transactions.map((tx) {
          final isExpense = tx.type == TransactionType.expense;
          final isIncome = tx.type == TransactionType.income;
          
          // Trouver la catégorie pour l'icône
          final category = categories.firstWhere(
            (cat) => cat.categoryId == tx.categoryId,
            orElse: () => Category(
              categoryId: 'unknown',
              userId: '',
              name: 'Autre',
              icon: '❓',
              color: '#9E9E9E',
              type: CategoryType.expense,
              isDefault: false,
              createdAt: DateTime.now(),
              updatedAt: DateTime.now(),
            ),
          );
          
          Color txColor;
          IconData txIcon;
          String prefix;
          
          if (isIncome) {
            txColor = AppDesign.incomeColor;
            txIcon = Icons.arrow_upward;
            prefix = '+';
          } else if (tx.type == TransactionType.transfer) {
            txColor = AppDesign.transferColor;
            txIcon = Icons.swap_horiz;
            prefix = '';
          } else {
            txColor = AppDesign.expenseColor;
            txIcon = Icons.arrow_downward;
            prefix = '-';
          }
          
          return ListTile(
            leading: CircleAvatar(
              backgroundColor: txColor.withOpacity(0.1),
              child: Text(
                category.icon,
                style: const TextStyle(fontSize: 20),
              ),
            ),
            title: Text(
              tx.description ?? '',
              style: const TextStyle(fontWeight: FontWeight.w600),
            ),
            subtitle: Text(
              '${tx.date.day}/${tx.date.month}/${tx.date.year}',
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
  }

  /// Placeholder léger pour le graphique de répartition des dépenses
  Widget _buildSpendingChartPlaceholder() {
    return Card(
      elevation: 4,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(AppDesign.borderRadiusLarge),
      ),
      child: Padding(
        padding: const EdgeInsets.all(AppDesign.paddingMedium),
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

  Widget _buildNotificationsCard() {
    return Card(
      elevation: 4,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(AppDesign.borderRadiusLarge),
      ),
      child: Padding(
        padding: const EdgeInsets.all(AppDesign.paddingMedium),
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
  final IconData icon;
  final Color color;

  const _InsightCard({
    required this.title,
    required this.amount,
    required this.icon,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      elevation: 4,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(AppDesign.borderRadiusLarge),
      ),
      child: Padding(
        padding: const EdgeInsets.all(AppDesign.paddingMedium),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Flexible(
                  child: Text(
                    title,
                    style: const TextStyle(
                      color: Colors.grey,
                      fontSize: 14,
                    ),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
                Icon(icon, color: color, size: 24),
              ],
            ),
            const SizedBox(height: 8),
            Text(
              '${amount.toStringAsFixed(2)} €',
              style: TextStyle(
                color: color,
                fontSize: 22,
                fontWeight: FontWeight.bold,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
