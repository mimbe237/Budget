import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:fl_chart/fl_chart.dart';
import 'package:characters/characters.dart';
import 'package:rxdart/rxdart.dart';
import 'package:provider/provider.dart';
import '../../models/budget_plan.dart';
import '../../models/transaction.dart';
import '../../models/category.dart';
import '../../services/firestore_service.dart';
import '../../services/mock_data_service.dart';
import '../../services/currency_service.dart';
import '../../constants/app_design.dart';
import '../../widgets/revolutionary_logo.dart';
import '../transactions/transaction_form_screen.dart';
import '../transactions/transactions_list_screen.dart';
import '../categories/category_management_screen.dart';
import '../profile/profile_settings_screen.dart';
import '../settings/notification_settings_screen.dart';
import '../auth/auth_screen.dart';
import '../../services/theme_service.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:budget/l10n/app_localizations.dart';
import '../../widgets/modern_page_app_bar.dart';

/// Écran de planification budgétaire avec répartition intelligente
class BudgetPlannerScreen extends StatefulWidget {
  const BudgetPlannerScreen({super.key});

  @override
  State<BudgetPlannerScreen> createState() => _BudgetPlannerScreenState();
}

class _BudgetPlannerScreenState extends State<BudgetPlannerScreen> {
  final TextEditingController _incomeController = TextEditingController(text: '3000');
  final MockDataService _mockService = MockDataService();
  final FirestoreService _firestoreService = FirestoreService();
  
  double _totalIncome = 3000.0;
  Map<String, double> _allocations = Map.from(DEFAULT_ALLOCATION);
  Map<String, double> _actualSpending = {}; // Dépenses réelles par catégorie
  Stream<List<Transaction>> _transactionsStream = const Stream.empty();
  TransactionType? _txFilter;
  DateTimeRange? _txRange;
  
  // Contrôleurs pour chaque champ de montant
  final Map<String, TextEditingController> _amountControllers = {};
  final Map<String, TextEditingController> _percentageControllers = {};

  // Couleurs fixes pour les catégories pour une cohérence visuelle
  final Map<String, Color> _categoryColors = {
    'Logement': const Color(0xFF1E88E5),      // Blue 600
    'Nourriture': const Color(0xFF43A047),    // Green 600
    'Transport': const Color(0xFFFB8C00),     // Orange 600
    'Factures': const Color(0xFFE53935),      // Red 600
    'Santé': const Color(0xFF00897B),         // Teal 600
    'Épargne': const Color(0xFF3949AB),       // Indigo 600
    'Investissement': const Color(0xFF8E24AA), // Purple 600
    'Loisirs': const Color(0xFFFFB300),       // Amber 600
    'Famille': const Color(0xFF00ACC1),       // Cyan 600
  };

  @override
  void initState() {
    super.initState();
    _loadActualSpending();
    _initializeControllers();
    _initTransactionsStream();
  }

  Widget _placeholderCard({
    String title = 'Fonctionnalité à venir',
    String message = 'Cette section est en cours de développement.',
  }) {
    return Card(
      elevation: 2,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: Container(
        height: 100,
        alignment: Alignment.center,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TrText(
              title,
              style: TextStyle(
                color: Colors.black87,
                fontWeight: FontWeight.w600,
                fontSize: 16,
              ),
            ),
            const SizedBox(height: 4),
            TrText(
              message,
              style: TextStyle(color: Colors.grey[600]),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildIncomeCategoriesRecap() {
    final userId = _firestoreService.currentUserId;
    if (userId == null) {
      return _placeholderCard(
        title: t('Revenus par catégorie'),
        message: 'Connectez-vous pour voir vos revenus par catégorie.',
      );
    }

    final now = DateTime.now();
    final startOfMonth = DateTime(now.year, now.month, 1);

    final categories$ = _firestoreService.getCategoriesStream(userId, type: CategoryType.income);
    final transactions$ = _firestoreService.getTransactionsStream(
      userId,
      type: TransactionType.income,
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

        if (categories.isEmpty) {
          return _placeholderCard(
            title: t('Revenus par catégorie'),
            message: 'Aucune catégorie de revenu active.',
          );
        }

        final totals = <String, double>{};
        double totalIncome = 0;
        for (final cat in categories) {
          totals[cat.categoryId] = 0;
        }
        for (final tx in txs) {
          if (tx.categoryId != null && totals.containsKey(tx.categoryId)) {
            totals[tx.categoryId!] = (totals[tx.categoryId!] ?? 0) + tx.amount;
            totalIncome += tx.amount;
          }
        }
        totalIncome = totalIncome <= 0 ? 1 : totalIncome;

        final items = categories.map((c) {
          final amount = totals[c.categoryId] ?? 0;
          final ratio = amount / totalIncome;
          return _IncomeCategoryItem(
            name: c.name,
            icon: c.icon,
            amount: amount,
            ratio: ratio,
          );
        }).toList();

        return Card(
          elevation: 4,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(AppDesign.radiusXLarge)),
          child: Padding(
            padding: const EdgeInsets.all(AppDesign.paddingMedium),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const TrText(
                  'Revenus par catégorie (mois)',
                  style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 12),
                ...items.map((i) => _IncomeCategoryRow(item: i)).toList(),
              ],
            ),
          ),
        );
      },
    );
  }

  void _initializeControllers() {
    for (var category in DEFAULT_BUDGET_CATEGORIES.keys) {
      final percentage = _allocations[category] ?? 0.0;
      final amount = _totalIncome * percentage;
      
      _percentageControllers[category] = TextEditingController(
        text: (percentage * 100).toStringAsFixed(1),
      );
      _amountControllers[category] = TextEditingController(
        text: amount.toStringAsFixed(2),
      );
    }
  }

  void _loadActualSpending() {
    // Simuler les dépenses réelles du mois en cours
    final transactions = _mockService.getMockTransactions();
    final now = DateTime.now();
    
    final Map<String, double> spending = {};
    
    for (var tx in transactions) {
      if (tx.date.month == now.month && tx.date.year == now.year) {
        final categories = _mockService.getMockCategories();
        final category = categories.firstWhere(
          (cat) => cat.categoryId == tx.categoryId,
          orElse: () => categories.first,
        );
        
        final categoryKey = _findCategoryKey(category.name);
        if (categoryKey != null) {
          spending[categoryKey] = (spending[categoryKey] ?? 0.0) + tx.amount;
        }
      }
    }
    
    setState(() {
      _actualSpending = spending;
    });
  }

  void _initTransactionsStream() {
    final userId = _firestoreService.currentUserId;
    if (userId == null) {
      setState(() {
        _transactionsStream = Stream.value(_mockService.getMockTransactions());
      });
      return;
    }

    setState(() {
      _transactionsStream = _firestoreService.getTransactionsStream(
        userId,
        type: _txFilter,
        startDate: _txRange?.start,
        endDate: _txRange?.end,
        limit: 200,
      );
    });
  }

  Future<void> _pickTxDateRange() async {
    final now = DateTime.now();
    final result = await showDateRangePicker(
      context: context,
      firstDate: DateTime(now.year - 2),
      lastDate: DateTime(now.year + 1),
      initialDateRange: _txRange ??
          DateTimeRange(
            start: DateTime(now.year, now.month, 1),
            end: now,
          ),
    );
    if (result != null) {
      setState(() {
        _txRange = result;
      });
      _initTransactionsStream();
    }
  }

  String? _findCategoryKey(String categoryName) {
    for (var entry in DEFAULT_BUDGET_CATEGORIES.entries) {
      if (entry.value['name']!.toLowerCase().contains(categoryName.toLowerCase()) ||
          categoryName.toLowerCase().contains(entry.value['name']!.toLowerCase())) {
        return entry.key;
      }
    }
    return null;
  }

  @override
  void dispose() {
    _incomeController.dispose();
    for (var controller in _amountControllers.values) {
      controller.dispose();
    }
    for (var controller in _percentageControllers.values) {
      controller.dispose();
    }
    super.dispose();
  }

  void _setTxFilter(TransactionType? type) {
    setState(() {
      _txFilter = type;
    });
    _initTransactionsStream();
  }

  @override
  Widget build(BuildContext context) {
    final isMobile = MediaQuery.of(context).size.width < 600;
    return Scaffold(
      backgroundColor: AppDesign.backgroundGrey,
      appBar: ModernPageAppBar(
        title: t('Gestion Budget'),
        subtitle: t('Votre argent sous contrôle'),
        icon: Icons.savings_outlined,
        backgroundColor: Colors.white,
        showHome: !isMobile,
        hideLogoOnMobile: true,
        actions: [
          IconButton(
            tooltip: t('Historique des transactions'),
            icon: const Icon(Icons.history, color: AppDesign.primaryIndigo),
            onPressed: () {
              Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (context) => const TransactionsListScreen(),
                ),
              );
            },
          ),
        ],
      ),
      body: SingleChildScrollView(
        child: LayoutBuilder(
          builder: (context, constraints) {
            final isWide = constraints.maxWidth >= 900;
            return Padding(
              padding: const EdgeInsets.all(AppDesign.paddingMedium),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _buildQuickActions(context, isWide: isWide),
                  const SizedBox(height: AppDesign.spacingLarge),
                  Align(
                    alignment: Alignment.center,
                    child: TextButton.icon(
                      onPressed: () {
                        Navigator.push(
                          context,
                          MaterialPageRoute(
                            builder: (context) => const CategoryManagementScreen(),
                          ),
                        );
                      },
                      style: TextButton.styleFrom(
                        foregroundColor: AppDesign.primaryIndigo,
                      ),
                      icon: const Icon(Icons.category_outlined),
                      label: const TrText(
                        'Gérer les catégories',
                        style: TextStyle(fontWeight: FontWeight.w700),
                      ),
                    ),
                  ),
                  const SizedBox(height: AppDesign.spacingLarge),
                  if (isWide)
                    Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Expanded(
                          child: Column(
                            children: [
                              _buildIncomeSection(),
                              const SizedBox(height: AppDesign.spacingLarge),
                              _buildHealthIndicator(),
                            ],
                          ),
                        ),
                        const SizedBox(width: AppDesign.spacingLarge),
                        Expanded(child: _buildDonutChart()),
                      ],
                    )
                  else ...[
                    _buildIncomeSection(),
                    const SizedBox(height: AppDesign.spacingLarge),
                    _buildHealthIndicator(),
                    const SizedBox(height: AppDesign.spacingLarge),
                    _buildDonutChart(),
                  ],
                  const SizedBox(height: AppDesign.spacingLarge),
                  if (isWide)
                    Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Expanded(
                          flex: 3,
                          child: _buildAllocationList(),
                        ),
                        const SizedBox(width: AppDesign.spacingLarge),
                        Expanded(
                          flex: 2,
                          child: _buildBudgetSummaryPanel(),
                        ),
                      ],
                    )
                  else ...[
                    _buildAllocationList(),
                    const SizedBox(height: AppDesign.spacingLarge),
                    _buildBudgetSummaryPanel(),
                  ],
                  const SizedBox(height: AppDesign.spacingLarge),
                  _buildIncomeCategoriesRecap(),
                  const SizedBox(height: AppDesign.spacingLarge),
                  _buildTransactionsSection(),
                  const SizedBox(height: 80),
                ],
              ),
            );
          },
        ),
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: _saveBudgetPlan,
        backgroundColor: AppDesign.primaryIndigo,
        foregroundColor: Colors.white,
        icon: const Icon(Icons.save),
        label: const TrText(
          'Enregistrer',
          style: TextStyle(
            color: Colors.white,
            fontWeight: FontWeight.w700,
          ),
        ),
      ),
      floatingActionButtonLocation: FloatingActionButtonLocation.centerFloat,
    );
  }

  /// Actions rapides pour ajouter une dépense ou un revenu depuis la page budget
  Widget _buildQuickActions(BuildContext context, {required bool isWide}) {
    final actions = [
      _budgetActionButton(
        label: t('Ajouter une dépense'),
        helper: 'Factures, courses, loisirs',
        icon: Icons.south_west_rounded,
        colors: [
          AppDesign.expenseColor.withValues(alpha: 0.9),
          AppDesign.expenseColor,
        ],
        onTap: () {
          Navigator.of(context).push(
            MaterialPageRoute(
              builder: (ctx) => TransactionFormScreen(
                transactionType: TransactionType.expense,
              ),
            ),
          );
        },
      ),
      _budgetActionButton(
        label: t('Ajouter un revenu'),
        helper: 'Salaire, primes, bonus',
        icon: Icons.north_east_rounded,
        colors: [
          AppDesign.incomeColor.withValues(alpha: 0.95),
          AppDesign.incomeColor,
        ],
        onTap: () {
          Navigator.of(context).push(
            MaterialPageRoute(
              builder: (ctx) => TransactionFormScreen(
                transactionType: TransactionType.income,
              ),
            ),
          );
        },
      ),
    ];

    if (isWide) {
      return Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Expanded(
            child: Align(
              alignment: Alignment.centerRight,
              child: ConstrainedBox(
                constraints: const BoxConstraints(maxWidth: 420),
                child: actions.first,
              ),
            ),
          ),
          const SizedBox(width: AppDesign.spacingMedium),
          Expanded(
            child: Align(
              alignment: Alignment.centerLeft,
              child: ConstrainedBox(
                constraints: const BoxConstraints(maxWidth: 420),
                child: actions.last,
              ),
            ),
          ),
        ],
      );
    }

    return Wrap(
      spacing: AppDesign.spacingMedium,
      runSpacing: AppDesign.spacingMedium,
      children: actions,
    );
  }

  Widget _budgetActionButton({
    required String label,
    required String helper,
    required IconData icon,
    required List<Color> colors,
    required VoidCallback onTap,
  }) {
    final Color base = colors.last;
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(AppDesign.radiusXLarge),
      child: Container(
        constraints: const BoxConstraints(minWidth: 240, maxWidth: 380),
        padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 16),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(AppDesign.radiusXLarge),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.05),
              blurRadius: 10,
              offset: const Offset(0, 4),
            ),
          ],
          border: Border.all(color: base.withValues(alpha: 0.18)),
        ),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: base.withValues(alpha: 0.12),
                shape: BoxShape.circle,
              ),
              child: Icon(icon, color: base, size: 22),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  TrText(
                    label,
                    style: TextStyle(
                      color: Colors.black87,
                      fontWeight: FontWeight.w800,
                      fontSize: 15,
                      letterSpacing: -0.1,
                    ),
                  ),
                  const SizedBox(height: 4),
                  TrText(
                    helper,
                    style: const TextStyle(
                      color: Colors.black54,
                      fontSize: 12,
                    ),
                  ),
                ],
              ),
            ),
            Icon(Icons.arrow_forward_ios_rounded, color: Colors.grey.shade500, size: 16),
          ],
        ),
      ),
    );
  }

  Widget _buildIncomeSection() {
    return Card(
      elevation: 4,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(AppDesign.borderRadiusLarge),
      ),
      child: Padding(
            padding: const EdgeInsets.all(AppDesign.paddingLarge),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
            const TrText(
              'Budget mensuel total',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 12),
            TextFormField(
              controller: _incomeController,
              decoration: InputDecoration(
                prefixIcon: Icon(Icons.euro, color: AppDesign.incomeColor),
                suffixText: context.watch<CurrencyService>().getCurrencySymbol(context.watch<CurrencyService>().currentCurrency),
                hintText: t('Ex: 3000'),
              ),
              keyboardType: const TextInputType.numberWithOptions(decimal: true),
              inputFormatters: [
                FilteringTextInputFormatter.allow(RegExp(r'^\d+\.?\d{0,2}')),
              ],
              onChanged: (value) {
                final newIncome = double.tryParse(value);
                if (newIncome != null && newIncome > 0) {
                  setState(() {
                    _totalIncome = newIncome;
                    _updateAmountsFromPercentages();
                  });
                }
              },
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildHealthIndicator() {
    final totalPercentage = _getTotalAllocation();
    final isBalanced = (totalPercentage - 1.0).abs() < 0.001;
    final isOver = totalPercentage > 1.0;

    Color indicatorColor;
    String message;
    IconData icon;
    List<Color> gradient;

    if (isBalanced) {
      indicatorColor = AppDesign.incomeColor;
      message = 'Budget équilibré à 100% !';
      icon = Icons.verified_rounded;
      gradient = [Colors.white, Colors.white];
    } else if (isOver) {
      indicatorColor = AppDesign.expenseColor;
      message = 'Dépassement : ${(totalPercentage * 100).toStringAsFixed(1)}%';
      icon = Icons.warning_amber_rounded;
      gradient = [Colors.white, Colors.white];
    } else {
      indicatorColor = Colors.orange;
      message = 'Reste à allouer : ${((1.0 - totalPercentage) * 100).toStringAsFixed(1)}%';
      icon = Icons.info_rounded;
      gradient = [Colors.white, Colors.white];
    }

    final allocated = (totalPercentage * 100).clamp(0, 999).toStringAsFixed(1);
    final remaining = ((1 - totalPercentage) * 100).clamp(-999, 999).abs().toStringAsFixed(1);
    final progressValue = totalPercentage.clamp(0.0, 1.0);

    return Card(
      elevation: 3,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(AppDesign.radiusXLarge),
      ),
      child: Container(
        decoration: BoxDecoration(
          gradient: LinearGradient(
            colors: gradient,
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
          borderRadius: BorderRadius.circular(AppDesign.radiusXLarge),
        ),
        padding: const EdgeInsets.all(AppDesign.paddingLarge),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  width: 52,
                  height: 52,
                  decoration: BoxDecoration(
                    color: indicatorColor.withValues(alpha: 0.12),
                    shape: BoxShape.circle,
                  ),
                  child: Icon(icon, color: indicatorColor, size: 28),
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const TrText(
                        'Santé financière',
                        style: TextStyle(
                          color: Colors.black54,
                          fontSize: 13,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                      TrText(
                        message,
                        style: const TextStyle(
                          color: Colors.black87,
                          fontSize: 18,
                          fontWeight: FontWeight.w800,
                        ),
                      ),
                    ],
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                  decoration: BoxDecoration(
                    color: indicatorColor.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(14),
                  ),
                  child: TrText(
                    '$allocated% alloué',
                    style: TextStyle(
                      color: indicatorColor,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            ClipRRect(
              borderRadius: BorderRadius.circular(10),
              child: LinearProgressIndicator(
                value: isOver ? 1 : progressValue,
                minHeight: 10,
                backgroundColor: Colors.grey.shade200,
                valueColor: AlwaysStoppedAnimation<Color>(indicatorColor),
              ),
            ),
            const SizedBox(height: 10),
            Row(
              children: [
                _healthChip(
                  label: isOver ? 'Dépassement' : 'Reste à allouer',
                  value: '$remaining%',
                  color: indicatorColor,
                  icon: isOver ? Icons.arrow_upward_rounded : Icons.arrow_downward_rounded,
                ),
                const SizedBox(width: 8),
                _healthChip(
                  label: t('Total prévu'),
                  value: context.watch<CurrencyService>().formatAmount(_totalIncome),
                  color: Colors.black54,
                  icon: Icons.stacked_bar_chart_rounded,
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _healthChip({
    required String label,
    required String value,
    required Color color,
    required IconData icon,
  }) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        color: Colors.grey.shade100,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, color: color, size: 16),
          const SizedBox(width: 6),
          TrText(
            label,
            style: TextStyle(
              color: color.withValues(alpha: 0.9),
              fontWeight: FontWeight.w600,
            ),
          ),
          const SizedBox(width: 8),
          TrText(
            value,
            style: const TextStyle(
              color: Colors.white,
              fontWeight: FontWeight.w800,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildDonutChart() {
    final totalPercentage = _getTotalAllocation();
    final isOver = totalPercentage > 1.0;

    return Card(
      elevation: 4,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(AppDesign.borderRadiusLarge),
      ),
      child: Padding(
        padding: const EdgeInsets.all(AppDesign.paddingLarge),
        child: Column(
          children: [
            const TrText(
              'Répartition Visuelle',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 20),
            SizedBox(
              height: 250,
              child: PieChart(
                PieChartData(
                  sectionsSpace: 2,
                  centerSpaceRadius: 60,
                  sections: _buildPieChartSections(isOver),
                ),
              ),
            ),
            const SizedBox(height: 16),
            TrText(
              'Total: ${(totalPercentage * 100).toStringAsFixed(1)}%',
              style: TextStyle(
                fontSize: 24,
                fontWeight: FontWeight.bold,
                color: isOver ? AppDesign.expenseColor : AppDesign.primaryIndigo,
              ),
            ),
            const SizedBox(height: 24),
            const Divider(),
            const SizedBox(height: 16),
            _buildChartLegend(),
          ],
        ),
      ),
    );
  }

  Widget _buildChartLegend() {
    return Wrap(
      spacing: 16,
      runSpacing: 12,
      alignment: WrapAlignment.center,
      children: _allocations.entries.map((entry) {
        final name = entry.key;
        final percentage = entry.value;
        final color = _categoryColors[name] ?? Colors.grey;
        
        return Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 12,
              height: 12,
              decoration: BoxDecoration(
                color: color,
                shape: BoxShape.circle,
              ),
            ),
            const SizedBox(width: 6),
            TrText(
              name,
              style: const TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w600,
                color: Colors.black87,
              ),
            ),
            const SizedBox(width: 4),
            TrText(
              '${(percentage * 100).toStringAsFixed(0)}%',
              style: TextStyle(
                fontSize: 12,
                color: Colors.grey[600],
                fontWeight: FontWeight.w500,
              ),
            ),
          ],
        );
      }).toList(),
    );
  }

  List<PieChartSectionData> _buildPieChartSections(bool isOver) {
    return _allocations.entries.map((entry) {
      final name = entry.key;
      final percentage = entry.value;
      final color = isOver 
          ? AppDesign.expenseColor 
          : (_categoryColors[name] ?? Colors.grey);

      return PieChartSectionData(
        value: percentage * 100,
        title: '${(percentage * 100).toStringAsFixed(0)}%',
        radius: 80,
        titleStyle: const TextStyle(
          fontSize: 14,
          fontWeight: FontWeight.bold,
          color: Colors.white,
        ),
        color: color,
      );
    }).toList();
  }

  Widget _buildAllocationList() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            const TrText(
              'Poches Budgétaires',
              style: TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.bold,
              ),
            ),
            TextButton.icon(
              onPressed: _resetToDefaultAllocation,
              icon: const Icon(Icons.refresh),
              label: const TrText('Par Défaut'),
            ),
          ],
        ),
        const SizedBox(height: 12),
        ...DEFAULT_BUDGET_CATEGORIES.entries.map((entry) {
          return _buildAllocationItem(
            entry.key,
            entry.value['icon']!,
            entry.value['name']!,
          );
        }).toList(),
      ],
    );
  }

  Widget _buildBudgetSummaryPanel() {
    final entries = DEFAULT_BUDGET_CATEGORIES.entries.map((entry) {
      final key = entry.key;
      final name = entry.value['name']!;
      final icon = entry.value['icon']!;
      final planned = (_allocations[key] ?? 0.0) * _totalIncome;
      final engaged = _actualSpending[key] ?? 0.0;
      final ratio = planned > 0 ? (engaged / planned).clamp(0.0, 1.2) : 0.0;
      final barColor = ratio < 0.6
          ? AppDesign.incomeColor
          : ratio < 0.85
              ? Colors.amber.shade700
              : AppDesign.expenseColor;
      return Padding(
        padding: const EdgeInsets.only(bottom: 12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(
                        color: barColor.withValues(alpha: 0.12),
                        shape: BoxShape.circle,
                      ),
                      child: TrText(icon, style: const TextStyle(fontSize: 16)),
                    ),
                    const SizedBox(width: 10),
                    TrText(
                      name,
                      style: const TextStyle(
                        fontWeight: FontWeight.w700,
                        fontSize: 14,
                      ),
                    ),
                  ],
                ),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    TrText(
                      'Prévu ${context.watch<CurrencyService>().formatAmount(planned)}',
                      style: const TextStyle(color: Colors.grey, fontSize: 12),
                    ),
                    TrText(
                      'Engagé ${context.watch<CurrencyService>().formatAmount(engaged)}',
                      style: TextStyle(
                        color: barColor,
                        fontWeight: FontWeight.w700,
                        fontSize: 13,
                      ),
                    ),
                  ],
                ),
              ],
            ),
            const SizedBox(height: 6),
            ClipRRect(
              borderRadius: BorderRadius.circular(10),
              child: LinearProgressIndicator(
                value: ratio > 1 ? 1 : ratio,
                minHeight: 10,
                backgroundColor: Colors.grey[200],
                valueColor: AlwaysStoppedAnimation<Color>(barColor),
              ),
            ),
          ],
        ),
      );
    }).toList();

    return Card(
      elevation: 4,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(AppDesign.borderRadiusLarge),
      ),
      child: Padding(
        padding: const EdgeInsets.all(AppDesign.paddingMedium),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const TrText(
              'Synthèse par poche',
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 12),
            ...entries,
          ],
        ),
      ),
    );
  }

  Widget _buildTransactionsSection() {
    return Card(
      elevation: 4,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(AppDesign.borderRadiusLarge),
      ),
      child: Padding(
        padding: const EdgeInsets.all(AppDesign.paddingMedium),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const TrText(
                  'Transactions (Budget)',
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                TextButton(
                  onPressed: _pickTxDateRange,
                  child: TrText(
                    _txRange == null
                        ? 'Période'
                        : '${_txRange!.start.day}/${_txRange!.start.month} → ${_txRange!.end.day}/${_txRange!.end.month}',
                  ),
                ),
              ],
            ),
            const SizedBox(height: 8),
            Wrap(
              spacing: 10,
              runSpacing: 8,
              children: [
                _txFilterChip('Toutes', null),
                _txFilterChip('Revenus', TransactionType.income),
                _txFilterChip('Dépenses', TransactionType.expense),
                _txFilterChip('Transferts', TransactionType.transfer),
                ActionChip(
                  label: const TrText('Reset'),
                  avatar: const Icon(Icons.refresh, size: 16),
                  onPressed: () {
                    setState(() {
                      _txRange = null;
                      _txFilter = null;
                    });
                    _initTransactionsStream();
                  },
                ),
              ],
            ),
            const SizedBox(height: 12),
            StreamBuilder<List<Transaction>>(
              stream: _transactionsStream,
              builder: (context, snapshot) {
                if (snapshot.connectionState == ConnectionState.waiting) {
                  return const Padding(
                    padding: EdgeInsets.all(12),
                    child: Center(child: CircularProgressIndicator()),
                  );
                }
                final transactions = snapshot.data ?? [];
                if (transactions.isEmpty) {
                  return const Padding(
                    padding: EdgeInsets.all(12),
                    child: TrText(
                      'Aucune transaction pour cette période.',
                      style: TextStyle(color: Colors.grey),
                    ),
                  );
                }

                return Column(
                  children: [
                    ...transactions.take(5).map((tx) {
                      final isIncome = tx.type == TransactionType.income;
                      final isExpense = tx.type == TransactionType.expense;
                      final color = isIncome
                          ? AppDesign.incomeColor
                          : isExpense
                              ? AppDesign.expenseColor
                              : Colors.blueGrey;
                      final prefix = isIncome ? '+' : isExpense ? '-' : '';
                      return ListTile(
                        contentPadding: EdgeInsets.zero,
                        leading: CircleAvatar(
                          backgroundColor: color.withValues(alpha: 0.12),
                          child: TrText(
                            (tx.category ?? '💳').isNotEmpty
                                ? (tx.category ?? '💳').characters.first
                                : '💳',
                            style: const TextStyle(fontSize: 18),
                          ),
                        ),
                        title: TrText(
                          tx.description?.isNotEmpty == true ? tx.description! : 'Transaction',
                          style: const TextStyle(fontWeight: FontWeight.w700),
                        ),
                        subtitle: TrText(
                          '${tx.date.day}/${tx.date.month}/${tx.date.year} · ${tx.category ?? 'Sans catégorie'}',
                          style: const TextStyle(color: Colors.grey),
                        ),
                        trailing: TrText(
                          '$prefix${context.watch<CurrencyService>().formatAmount(tx.amount, null, false)}',
                          style: TextStyle(
                            color: color,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      );
                    }).toList(),
                    if (transactions.length > 5) ...[
                      const SizedBox(height: 8),
                      Center(
                        child: TextButton.icon(
                          onPressed: () {
                            Navigator.push(
                              context,
                              MaterialPageRoute(
                                builder: (context) => const TransactionsListScreen(),
                              ),
                            );
                          },
                          style: TextButton.styleFrom(
                            foregroundColor: AppDesign.primaryIndigo,
                            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
                          ),
                          icon: const Icon(Icons.arrow_forward_rounded, size: 20),
                          label: TrText(
                            'Voir l\'historique complet (${transactions.length})',
                            style: const TextStyle(
                              fontWeight: FontWeight.w700,
                              fontSize: 14,
                            ),
                          ),
                        ),
                      ),
                    ],
                  ],
                );
              },
            ),
          ],
        ),
      ),
    );
  }

  Widget _txFilterChip(String label, TransactionType? value) {
    final selected = _txFilter == value;
    return ChoiceChip(
      label: TrText(label),
      selected: selected,
      selectedColor: AppDesign.primaryIndigo.withValues(alpha: 0.15),
      labelStyle: TextStyle(
        color: selected ? AppDesign.primaryIndigo : Colors.grey[800],
        fontWeight: selected ? FontWeight.w700 : FontWeight.w500,
      ),
      onSelected: (_) => _setTxFilter(value),
    );
  }

  Widget _buildAllocationItem(String categoryKey, String icon, String name) {
    final currency = context.watch<CurrencyService>();
    final percentage = _allocations[categoryKey] ?? 0.0;
    final amount = _totalIncome * percentage;
    final actualSpent = _actualSpending[categoryKey] ?? 0.0;
    final isOverBudget = actualSpent > amount;
    final spentPercentage = amount > 0 ? (actualSpent / amount).clamp(0.0, 1.0) : 0.0;

    return Card(
      elevation: 2,
      margin: const EdgeInsets.only(bottom: AppDesign.spacingMedium),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(AppDesign.borderRadiusLarge),
      ),
      child: Padding(
        padding: const EdgeInsets.all(AppDesign.paddingMedium),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // En-tête avec icône et nom
            Row(
              children: [
                Container(
                  width: 50,
                  height: 50,
                  decoration: BoxDecoration(
                    color: AppDesign.primaryIndigo.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Center(
                    child: TrText(icon, style: const TextStyle(fontSize: 24)),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      TrText(
                        name,
                        style: const TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                      ),
                    ),
                    if (actualSpent > 0)
                      TrText(
                        'Dépensé: ${currency.formatAmount(actualSpent)}',
                        style: TextStyle(
                          fontSize: 12,
                          color: isOverBudget ? AppDesign.expenseColor : Colors.grey[600],
                        ),
                      ),
                    ],
                  ),
                ),
                if (isOverBudget)
                  const Icon(
                    Icons.warning_amber_rounded,
                    color: AppDesign.expenseColor,
                    size: 28,
                  ),
              ],
            ),
            const SizedBox(height: 12),
            
            // Slider
            Slider(
              value: percentage,
              min: 0.0,
              max: 1.0,
              divisions: 100,
              label: '${(percentage * 100).toStringAsFixed(0)}%',
              activeColor: isOverBudget ? AppDesign.expenseColor : AppDesign.primaryIndigo,
              onChanged: (value) {
                setState(() {
                  _adjustAllocations(categoryKey, value);
                });
              },
            ),
            
            // Champs de saisie
            Row(
              children: [
                // Pourcentage
                Expanded(
                  flex: 2,
                  child: TextFormField(
                    controller: _percentageControllers[categoryKey],
                    decoration: InputDecoration(
                      suffixText: t('%'),
                      contentPadding: EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                    ),
                    keyboardType: const TextInputType.numberWithOptions(decimal: true),
                    inputFormatters: [
                      FilteringTextInputFormatter.allow(RegExp(r'^\d+\.?\d{0,1}')),
                    ],
                    onChanged: (value) {
                      final newPercentage = double.tryParse(value);
                      if (newPercentage != null) {
                        setState(() {
                          _adjustAllocations(categoryKey, newPercentage / 100.0);
                        });
                      }
                    },
                  ),
                ),
                const SizedBox(width: 8),
                // Montant
                Expanded(
                  flex: 3,
                  child: TextFormField(
                    controller: _amountControllers[categoryKey],
                    decoration: InputDecoration(
                      suffixText: currency.currencySymbol,
                      contentPadding: EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                    ),
                    keyboardType: const TextInputType.numberWithOptions(decimal: true),
                    inputFormatters: [
                      FilteringTextInputFormatter.allow(RegExp(r'^\d+\.?\d{0,2}')),
                    ],
                    onChanged: (value) {
                      final newAmount = double.tryParse(value);
                      if (newAmount != null && _totalIncome > 0) {
                        setState(() {
                          _adjustAllocations(categoryKey, newAmount / _totalIncome);
                        });
                      }
                    },
                  ),
                ),
              ],
            ),
            
            // Barre de progression des dépenses
              if (actualSpent > 0) ...[
                const SizedBox(height: 8),
                ClipRRect(
                  borderRadius: BorderRadius.circular(8),
                  child: LinearProgressIndicator(
                  value: spentPercentage,
                  minHeight: 8,
                  backgroundColor: Colors.grey[300],
                  valueColor: AlwaysStoppedAnimation<Color>(
                    isOverBudget ? AppDesign.expenseColor : AppDesign.incomeColor,
                  ),
                ),
              ),
              const SizedBox(height: 4),
              TrText(
                '${currency.formatAmount(actualSpent)} / ${currency.formatAmount(amount)} (${(spentPercentage * 100).toStringAsFixed(0)}%)',
                style: TextStyle(
                  fontSize: 12,
                  color: isOverBudget ? AppDesign.expenseColor : Colors.grey[600],
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }

  void _adjustAllocations(String changedKey, double newValue) {
    // 1. Calculer la différence
    final oldValue = _allocations[changedKey] ?? 0.0;
    final diff = newValue - oldValue;
    
    // Si pas de changement, on sort
    if (diff.abs() < 0.0001) return;

    // 2. Mettre à jour la valeur modifiée
    _allocations[changedKey] = newValue;
    _updateController(changedKey, newValue);

    // 3. Calculer le reste à distribuer (pour que total = 1.0)
    // On veut réduire les autres catégories de 'diff'
    // Ex: Si on augmente de +0.10, on doit retirer 0.10 aux autres
    
    final otherKeys = _allocations.keys.where((k) => k != changedKey).toList();
    if (otherKeys.isEmpty) return;

    // Calculer le total des autres catégories
    double othersTotal = 0.0;
    for (var key in otherKeys) {
      othersTotal += _allocations[key]!;
    }

    // Si les autres sont à 0, on ne peut rien retirer -> on force le dépassement (ou on tape dans une catégorie tampon si on en avait une)
    // Ici, on va essayer de répartir proportionnellement
    
    if (othersTotal > 0) {
      for (var key in otherKeys) {
        final currentVal = _allocations[key]!;
        // Part de cette catégorie dans le total des "autres"
        final share = currentVal / othersTotal;
        
        // On retire proportionnellement la différence
        // Si diff est positif (augmentation), on retire. Si négatif (baisse), on ajoute.
        double newVal = currentVal - (diff * share);
        
        // Protection contre les valeurs négatives
        if (newVal < 0) newVal = 0;
        
        _allocations[key] = newVal;
        _updateController(key, newVal);
      }
    }
    
    // Petit fix final pour les erreurs d'arrondi si besoin (optionnel)
  }

  void _updateController(String key, double value) {
    _percentageControllers[key]!.text = (value * 100).toStringAsFixed(1);
    _amountControllers[key]!.text = (_totalIncome * value).toStringAsFixed(2);
  }

  void _updateAmountsFromPercentages() {
    for (var entry in _allocations.entries) {
      final amount = _totalIncome * entry.value;
      _amountControllers[entry.key]!.text = amount.toStringAsFixed(2);
    }
  }

  double _getTotalAllocation() {
    return _allocations.values.fold(0.0, (sum, value) => sum + value);
  }

  void _resetToDefaultAllocation() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const TrText('Réinitialiser le Budget'),
        content: const TrText(
          'Voulez-vous appliquer la répartition par défaut (30/15/10/5/5/10/10/10/5) ?\n\nCela remplacera votre configuration actuelle.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const TrText('Annuler'),
          ),
          ElevatedButton(
            onPressed: () {
              setState(() {
                _allocations = Map.from(DEFAULT_ALLOCATION);
                for (var entry in _allocations.entries) {
                  _percentageControllers[entry.key]!.text = (entry.value * 100).toStringAsFixed(1);
                  _amountControllers[entry.key]!.text = (_totalIncome * entry.value).toStringAsFixed(2);
                }
              });
              Navigator.pop(context);
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: TrText('Budget réinitialisé avec succès !')),
              );
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: AppDesign.primaryIndigo,
            ),
            child: const TrText('Appliquer'),
          ),
        ],
      ),
    );
  }

  void _saveBudgetPlan() {
    final totalPercentage = _getTotalAllocation();
    
    if ((totalPercentage - 1.0).abs() > 0.01) {
      showDialog(
        context: context,
        builder: (context) => AlertDialog(
          title: const TrText('Budget Déséquilibré'),
          content: TrText(
            'Le total de votre budget est de ${(totalPercentage * 100).toStringAsFixed(1)}%.\n\n'
            'Voulez-vous enregistrer quand même ou ajuster pour atteindre 100% ?',
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: const TrText('Annuler'),
            ),
            ElevatedButton(
              onPressed: () {
                Navigator.pop(context);
                _performSave();
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: AppDesign.primaryIndigo,
              ),
              child: const TrText('Enregistrer'),
            ),
          ],
        ),
      );
    } else {
      _performSave();
    }
  }

  void _performSave() {
    // TODO: Sauvegarder dans Firestore
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: TrText('Budget enregistré avec succès !'),
        backgroundColor: AppDesign.incomeColor,
      ),
    );
  }
}

class _IncomeCategoryItem {
  final String name;
  final String icon;
  final double amount;
  final double ratio;

  _IncomeCategoryItem({
    required this.name,
    required this.icon,
    required this.amount,
    required this.ratio,
  });
}

class _IncomeCategoryRow extends StatelessWidget {
  final _IncomeCategoryItem item;

  const _IncomeCategoryRow({required this.item});

  @override
  Widget build(BuildContext context) {
    final barColor = AppDesign.incomeColor;
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: AppDesign.incomeColor.withValues(alpha: 0.12),
                  shape: BoxShape.circle,
                ),
                child: TrText(item.icon, style: const TextStyle(fontSize: 16)),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: TrText(
                  item.name,
                  style: const TextStyle(fontWeight: FontWeight.w700),
                ),
              ),
              TrText(
                context.watch<CurrencyService>().formatAmount(item.amount),
                style: const TextStyle(fontWeight: FontWeight.bold, color: Colors.black87),
              ),
            ],
          ),
          const SizedBox(height: 8),
          ClipRRect(
            borderRadius: BorderRadius.circular(8),
            child: LinearProgressIndicator(
              value: item.ratio.clamp(0.0, 1.0),
              minHeight: 8,
              backgroundColor: Colors.grey.shade200,
              valueColor: AlwaysStoppedAnimation<Color>(barColor),
            ),
          ),
        ],
      ),
    );
  }
}
