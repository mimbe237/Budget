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
import 'package:budget/l10n/localization_helpers.dart';
import '../../widgets/modern_page_app_bar.dart';
import '../settings/notification_settings_screen.dart';
import '../ai_analysis/ai_analysis_screen.dart';
import 'package:budget/l10n/app_localizations.dart';

/// Écran de planification budgétaire avec répartition intelligente
class BudgetPlannerScreen extends StatefulWidget {
  const BudgetPlannerScreen({super.key});

  @override
  State<BudgetPlannerScreen> createState() => _BudgetPlannerScreenState();
}

class _BudgetPlannerScreenState extends State<BudgetPlannerScreen> {
  final TextEditingController _incomeController = TextEditingController(text: '3000');
  final TextEditingController _expectedIncomeController = TextEditingController(text: '3000');
  final MockDataService _mockService = MockDataService();
  final FirestoreService _firestoreService = FirestoreService();
  
  double _totalIncome = 3000.0;
  double _expectedIncome = 3000.0;
  Map<String, double> _allocations = Map.from(DEFAULT_ALLOCATION);
  Map<String, double> _actualSpending = {}; // Dépenses réelles par catégorie
  Stream<List<Transaction>> _transactionsStream = const Stream.empty();
  TransactionType? _txFilter;
  DateTimeRange? _txRange;
  bool _usePreviousIncomePeriod = false;
  bool _fieldsLocked = false;
  
  // Contrôleurs pour chaque champ de montant
  final Map<String, TextEditingController> _amountControllers = {};
  final Map<String, TextEditingController> _percentageControllers = {};
  
  // Track which row is being edited
  String? _editingRowKey;

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
    _initializeControllers();
    _loadBudgetData();
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

  Widget _buildBudgetHero({required bool isWide}) {
    final currency = context.watch<CurrencyService>();
    final totalAllocated = _totalIncome * _getTotalAllocation();
    final totalSpent = _actualSpending.values.fold<double>(0, (s, v) => s + v);
    final allocationPct = (_getTotalAllocation() * 100).clamp(0.0, 999.0);
    final isCompact = MediaQuery.of(context).size.width < 430;
    final statusOver = allocationPct > 100.1;
    final statusUnder = allocationPct < 99.9;
    final statusColor = statusOver
        ? AppDesign.expenseColor
        : statusUnder
            ? Colors.amber.shade700
            : AppDesign.incomeColor;
    final statusLabel = statusOver
        ? AppLocalizations.of(context)!.overspend
        : statusUnder
            ? AppLocalizations.of(context)!.incomplete
            : AppLocalizations.of(context)!.balanced;
    final coaching = statusOver
        ? 'Risque de dépassement, ajustez vos poches.'
        : statusUnder
            ? 'Allocations incomplètes, allouez le budget restant.'
            : 'Budget équilibré, continuez ainsi.';

    return Container(
      width: double.infinity,
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [AppDesign.primaryIndigo.withValues(alpha: 0.92), AppDesign.incomeColor.withValues(alpha: 0.9)],
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
                          t('Plan Budgétaire'),
                          style: TextStyle(
                            color: Colors.white.withValues(alpha: 0.85),
                            fontSize: 14,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                        const SizedBox(height: 8),
                        Row(
                          children: [
                            Expanded(
                              child: TrText(
                                currency.formatAmount(_totalIncome),
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                                style: TextStyle(
                                  color: Colors.white,
                                  fontSize: isCompact ? 24 : 26,
                                  fontWeight: FontWeight.w900,
                                ),
                              ),
                            ),
                            const SizedBox(width: 10),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 7),
                              decoration: BoxDecoration(
                                color: Colors.white.withValues(alpha: 0.16),
                                borderRadius: BorderRadius.circular(12),
                                border: Border.all(color: statusColor.withValues(alpha: 0.35)),
                              ),
                              child: TrText(
                                '$statusLabel · ${allocationPct.toStringAsFixed(0)}%',
                                style: TextStyle(
                                  color: Colors.white,
                                  fontWeight: FontWeight.w900,
                                  fontSize: 12,
                                ),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 6),
                        TrText(
                          t('Solde budgété pour ce mois'),
                          style: TextStyle(
                            color: Colors.white.withValues(alpha: 0.75),
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
                  if (!isCompact)
                    Wrap(
                      spacing: 10,
                      runSpacing: 8,
                      children: [
                        ElevatedButton.icon(
                          onPressed: () {
                            Navigator.of(context).push(
                              MaterialPageRoute(
                                builder: (ctx) => TransactionFormScreen(
                                  transactionType: TransactionType.expense,
                                ),
                              ),
                            );
                          },
                          style: ElevatedButton.styleFrom(
                            backgroundColor: Colors.white.withValues(alpha: 0.12),
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
                          onPressed: () {
                            Navigator.of(context).push(
                              MaterialPageRoute(
                                builder: (ctx) => TransactionFormScreen(
                                  transactionType: TransactionType.income,
                                ),
                              ),
                            );
                          },
                          style: ElevatedButton.styleFrom(
                            backgroundColor: Colors.white,
                            foregroundColor: AppDesign.incomeColor,
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
              if (isCompact) ...[
                const SizedBox(height: 12),
                Wrap(
                  spacing: 10,
                  runSpacing: 8,
                  children: [
                    ElevatedButton.icon(
                      onPressed: () {
                        Navigator.of(context).push(
                          MaterialPageRoute(
                            builder: (ctx) => TransactionFormScreen(
                              transactionType: TransactionType.expense,
                            ),
                          ),
                        );
                      },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.white.withValues(alpha: 0.12),
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
                      onPressed: () {
                        Navigator.of(context).push(
                          MaterialPageRoute(
                            builder: (ctx) => TransactionFormScreen(
                              transactionType: TransactionType.income,
                            ),
                          ),
                        );
                      },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.white,
                        foregroundColor: AppDesign.incomeColor,
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
              const SizedBox(height: 16),
              Wrap(
                spacing: 12,
                runSpacing: 12,
                children: [
              _budgetHeroPill(
                label: t('Total alloué'),
                value: currency.formatAmount(totalAllocated),
                helper: '${allocationPct.toStringAsFixed(0)}%',
              ),
              _budgetHeroPill(
                label: t('Dépensé'),
                value: currency.formatAmount(totalSpent),
                helper: t('vs budget'),
              ),
              _budgetHeroPill(
                label: t('Restant théorique'),
                value: currency.formatAmount(totalAllocated - totalSpent),
                helper: t('Après allocations'),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _budgetHeroPill({
    required String label,
    required String value,
    required String helper,
  }) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: Colors.white.withValues(alpha: 0.16)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisSize: MainAxisSize.min,
        children: [
          TrText(
            value,
            style: const TextStyle(
              color: Colors.white,
              fontWeight: FontWeight.w900,
              fontSize: 16,
            ),
          ),
          const SizedBox(height: 4),
          TrText(
            label,
            style: TextStyle(
              color: Colors.white.withValues(alpha: 0.8),
              fontWeight: FontWeight.w600,
              fontSize: 12,
            ),
          ),
          TrText(
            helper,
            style: TextStyle(
              color: Colors.white.withValues(alpha: 0.7),
              fontSize: 11,
            ),
          ),
        ],
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
    final startOfMonth = _usePreviousIncomePeriod
        ? DateTime(now.year, now.month - 1, 1)
        : DateTime(now.year, now.month, 1);
    final endDate = _usePreviousIncomePeriod
        ? DateTime(now.year, now.month, 0)
        : now;

    final categories$ = _firestoreService.getCategoriesStream(userId, type: CategoryType.income);
    final transactions$ = _firestoreService.getTransactionsStream(
      userId,
      type: TransactionType.income,
      startDate: startOfMonth,
      endDate: endDate,
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
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const TrText(
                      'Revenus par catégorie (mois)',
                      style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                    ),
                    ChoiceChip(
                      label: TrText(_usePreviousIncomePeriod ? 'Mois précédent' : 'Mois en cours'),
                      selected: _usePreviousIncomePeriod,
                      selectedColor: AppDesign.primaryIndigo.withValues(alpha: 0.14),
                      onSelected: (_) {
                        setState(() => _usePreviousIncomePeriod = !_usePreviousIncomePeriod);
                      },
                    ),
                  ],
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
        text: amount.toStringAsFixed(amount % 1 == 0 ? 0 : 2),
      );
    }
    _expectedIncomeController.text = _expectedIncome.toStringAsFixed(_expectedIncome % 1 == 0 ? 0 : 2);
  }

  Future<void> _loadBudgetData() async {
    final userId = _firestoreService.currentUserId;
    if (userId == null) {
      // Fallback démo
      final spending = <String, double>{};
      final now = DateTime.now();
      for (final tx in _mockService.getMockTransactions()) {
        if (tx.date.month == now.month && tx.date.year == now.year && tx.type == TransactionType.expense) {
          final categoryKey = _mapPocket(tx.category ?? '');
          spending[categoryKey] = (spending[categoryKey] ?? 0) + tx.amount;
        }
      }
      setState(() {
        _allocations = Map.from(DEFAULT_ALLOCATION);
        _actualSpending = spending;
        _initializeControllers();
      });
      return;
    }

    final now = DateTime.now();
    final startOfMonth = DateTime(now.year, now.month, 1);

    try {
      final results = await Future.wait([
        _firestoreService.getTransactions(
          userId,
          startDate: startOfMonth,
          endDate: now,
          limit: 1000,
        ),
        _firestoreService.getCategories(userId),
        _firestoreService.getCurrentBudgetPlan(userId),
      ]);

      final txs = results[0] as List<Transaction>;
      final categories = results[1] as List<Category>;
      final budgetPlan = results[2] as Map<String, dynamic>?;

      final incomeTotal = txs
          .where((t) => t.type == TransactionType.income)
          .fold<double>(0, (sum, t) => sum + t.amount);

      final Map<String, double> spending = {};
      final Map<String, String> catNames = {
        for (final c in categories) c.categoryId: c.name,
      };

      for (final tx in txs.where((t) => t.type == TransactionType.expense)) {
        final name = catNames[tx.categoryId] ?? tx.category ?? '';
        final pocket = _mapPocket(name);
        spending[pocket] = (spending[pocket] ?? 0) + tx.amount;
      }

      Map<String, double> allocations = Map.from(DEFAULT_ALLOCATION);
      double totalBudget = _totalIncome;
      double? expectedIncomeFromPlan;

      if (budgetPlan != null) {
        final rawAlloc = (budgetPlan['categoryAllocations'] as Map<String, dynamic>?);
        if (rawAlloc != null && rawAlloc.isNotEmpty && rawAlloc.values.any((v) => ((v as num?)?.toDouble() ?? 0) > 0)) {
          // Map Firestore allocations (stockées par catégorie) vers les poches affichées
          final pocketAllocations = {
            for (final key in DEFAULT_BUDGET_CATEGORIES.keys) key: 0.0,
          };
          bool hasMappedAllocation = false;

          rawAlloc.forEach((key, value) {
            final percentage = (value as num?)?.toDouble() ?? 0.0;
            if (percentage <= 0) return;

            if (DEFAULT_BUDGET_CATEGORIES.containsKey(key)) {
              pocketAllocations[key] = percentage;
              hasMappedAllocation = true;
              return;
            }

            final categoryName = catNames[key] ?? key;
            final pocket = _mapPocket(categoryName);
            pocketAllocations[pocket] = (pocketAllocations[pocket] ?? 0.0) + percentage;
            hasMappedAllocation = true;
          });

          if (hasMappedAllocation) {
            allocations = pocketAllocations;
          }
        }
        final tb = budgetPlan['totalBudget'];
        if (tb is num) totalBudget = tb.toDouble();
        final ei = budgetPlan['expectedIncome'];
        if (ei is num) expectedIncomeFromPlan = ei.toDouble();
      }

      if (totalBudget <= 0 && incomeTotal > 0) {
        totalBudget = incomeTotal;
      }

      setState(() {
        _allocations = allocations;
        _totalIncome = totalBudget > 0 ? totalBudget : _totalIncome;
        _expectedIncome = expectedIncomeFromPlan ?? _totalIncome;
        _actualSpending = spending;
        _incomeController.text = _totalIncome.toStringAsFixed(0);
        _expectedIncomeController.text = _expectedIncome.toStringAsFixed(_expectedIncome % 1 == 0 ? 0 : 2);
        _fieldsLocked = budgetPlan != null;
        _initializeControllers();
      });
    } catch (_) {
      // En cas d'erreur, ne bloque pas l'affichage
      _initializeControllers();
    }
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

  @override
  void dispose() {
    _incomeController.dispose();
    _expectedIncomeController.dispose();
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
      resizeToAvoidBottomInset: false,
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
      body: SafeArea(
        bottom: true,
        top: false,
        child: SingleChildScrollView(
          padding: EdgeInsets.only(
            bottom: MediaQuery.of(context).padding.bottom + 96,
          ),
          child: LayoutBuilder(
          builder: (context, constraints) {
            final isWide = constraints.maxWidth >= 900;
            return Padding(
              padding: const EdgeInsets.all(AppDesign.paddingMedium),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _buildBudgetHero(isWide: isWide),
                  const SizedBox(height: AppDesign.spacingMedium),
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
                  const SizedBox(height: AppDesign.spacingMedium),
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
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              _buildBudgetSummaryPanel(),
                              const SizedBox(height: AppDesign.spacingLarge),
                              _buildIncomeCategoriesRecap(),
                            ],
                          ),
                        ),
                      ],
                    )
                  else ...[
                    _buildAllocationList(),
                    const SizedBox(height: AppDesign.spacingLarge),
                    _buildBudgetSummaryPanel(),
                    const SizedBox(height: AppDesign.spacingLarge),
                    _buildIncomeCategoriesRecap(),
                  ],
                  const SizedBox(height: AppDesign.spacingLarge),
                  _buildTransactionsSection(),
                  const SizedBox(height: 120),
                ],
              ),
            );
          },
          ),
        ),
      ),

    );
  }

  /// Actions rapides pour ajouter une dépense ou un revenu depuis la page budget
  Widget _buildQuickActions(BuildContext context, {required bool isWide}) {
    final actions = [
      _budgetActionButton(
        label: t('Alertes budget'),
        helper: t('Dépassements et notifications'),
        icon: Icons.notifications_active_rounded,
        colors: [
          AppDesign.expenseColor.withValues(alpha: 0.9),
          AppDesign.expenseColor,
        ],
        onTap: () {
          Navigator.of(context).push(
            MaterialPageRoute(
              builder: (ctx) => const NotificationSettingsScreen(),
            ),
          );
        },
      ),
      _budgetActionButton(
        label: t('Analyses IA'),
        helper: t('Insights, anomalies, coaching'),
        icon: Icons.auto_graph_rounded,
        colors: [
          AppDesign.primaryPurple.withValues(alpha: 0.9),
          AppDesign.primaryPurple,
        ],
        onTap: () {
          Navigator.of(context).push(
            MaterialPageRoute(
              builder: (ctx) => const AIAnalysisScreen(),
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
    final currency = context.watch<CurrencyService>();
    final currencySymbol = currency.getCurrencySymbol(currency.currentCurrency);

    return Card(
      elevation: 4,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(AppDesign.borderRadiusLarge),
      ),
      child: LayoutBuilder(
        builder: (context, constraints) {
          final isCompact = constraints.maxWidth < 640;

          final header = Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              const TrText(
                'Budget mensuel total',
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 6),
              TrText(
                'Calculez et enregistrez le montant global avant la répartition.',
                style: TextStyle(
                  color: Colors.grey[700],
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ],
          );

          final incomeField = ConstrainedBox(
            constraints: const BoxConstraints(minWidth: 140, maxWidth: 220),
            child: TextFormField(
              controller: _incomeController,
              readOnly: _fieldsLocked,
              decoration: InputDecoration(
                prefixIcon: Icon(Icons.euro, color: AppDesign.incomeColor),
                suffixText: currencySymbol,
                hintText: t('Ex: 3000'),
                contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
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
                    if (_expectedIncomeController.text.trim().isEmpty) {
                      _expectedIncome = newIncome;
                      _expectedIncomeController.text = newIncome.toStringAsFixed(newIncome % 1 == 0 ? 0 : 2);
                    }
                  });
                }
              },
            ),
          );

          final saveButton = ElevatedButton.icon(
            onPressed: _saveBudgetPlan,
            style: ElevatedButton.styleFrom(
              backgroundColor: AppDesign.primaryIndigo,
              foregroundColor: Colors.white,
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
              elevation: 0,
              minimumSize: const Size(148, 52),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
            ),
            icon: const Icon(Icons.save, size: 18),
            label: const TrText(
              'Enregistrer',
              style: TextStyle(
                fontWeight: FontWeight.w700,
                fontSize: 14,
              ),
            ),
          );

          return Padding(
            padding: const EdgeInsets.all(AppDesign.paddingLarge),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                if (isCompact)
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      header,
                      const SizedBox(height: 12),
                      SizedBox(width: double.infinity, child: incomeField),
                      const SizedBox(height: 12),
                      SizedBox(width: double.infinity, child: saveButton),
                    ],
                  )
                else
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.center,
                    children: [
                      Expanded(child: header),
                      const SizedBox(width: 12),
                      Flexible(flex: 0, child: incomeField),
                      const SizedBox(width: 12),
                      Flexible(flex: 0, child: saveButton),
                    ],
                  ),
                const SizedBox(height: 12),
                TrText(
                  'Prévision de revenus (obligatoire)',
                  style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w700),
                ),
                const SizedBox(height: 6),
                TextFormField(
                  controller: _expectedIncomeController,
                  keyboardType: const TextInputType.numberWithOptions(decimal: true),
                  inputFormatters: [
                    FilteringTextInputFormatter.allow(RegExp(r'^-?\d*\.?\d{0,2}')),
                  ],
                  readOnly: _fieldsLocked,
                  decoration: InputDecoration(
                    hintText: 'Ex: ${_totalIncome.toStringAsFixed(0)}',
                    suffixText: currencySymbol,
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                    filled: true,
                    fillColor: AppDesign.backgroundGrey,
                    contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                  ),
                  onChanged: (value) {
                    final newVal = double.tryParse(value);
                    if (newVal != null) {
                      setState(() => _expectedIncome = newVal);
                    }
                  },
                ),
                const SizedBox(height: 10),
                TextButton.icon(
                  onPressed: _fieldsLocked ? _unlockFieldsWithConfirm : _resetToDefaultAllocation,
                  icon: Icon(_fieldsLocked ? Icons.edit : Icons.tune),
                  label: TrText(_fieldsLocked ? 'Modifier montants' : 'Rééquilibrer'),
                  style: TextButton.styleFrom(
                    foregroundColor: AppDesign.primaryIndigo,
                  ),
                ),
              ],
            ),
          );
        },
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
                Expanded(
                  child: _healthChip(
                    label: isOver ? 'Dépassement' : 'Reste à allouer',
                    value: '$remaining%',
                    color: indicatorColor,
                    icon: isOver ? Icons.arrow_upward_rounded : Icons.arrow_downward_rounded,
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: _healthChip(
                    label: t('Total prévu'),
                    value: context.watch<CurrencyService>().formatAmount(_totalIncome),
                    color: Colors.black54,
                    icon: Icons.stacked_bar_chart_rounded,
                  ),
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
          Flexible(
            fit: FlexFit.loose,
            child: TrText(
              label,
              style: TextStyle(
                color: color.withValues(alpha: 0.9),
                fontWeight: FontWeight.w600,
              ),
              overflow: TextOverflow.ellipsis,
            ),
          ),
          const SizedBox(width: 8),
          Flexible(
            fit: FlexFit.loose,
            child: TrText(
              value,
              style: const TextStyle(
                // Use dark text to stay legible on light chips
                color: Colors.black87,
                fontWeight: FontWeight.w800,
              ),
              overflow: TextOverflow.ellipsis,
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
              child: Stack(
                alignment: Alignment.center,
                children: [
                  PieChart(
                    PieChartData(
                      sectionsSpace: 2,
                      centerSpaceRadius: 64,
                      sections: _buildPieChartSections(isOver),
                    ),
                  ),
                  Builder(
                    builder: (context) {
                      final topCategory = _allocations.entries.isNotEmpty
                          ? _allocations.entries
                              .reduce((a, b) => a.value >= b.value ? a : b)
                          : null;
                      final topLabel = topCategory?.key ?? 'N/A';
                      final pct = totalPercentage * 100;
                      return Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          TrText(
                            '${pct.toStringAsFixed(1)}%',
                            style: TextStyle(
                              fontSize: 18,
                              fontWeight: FontWeight.w900,
                              color: isOver ? AppDesign.expenseColor : AppDesign.primaryIndigo,
                            ),
                          ),
                          const SizedBox(height: 6),
                          TrText(
                            'Plus lourde : $topLabel',
                            style: const TextStyle(
                              fontSize: 11,
                              color: Colors.black87,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ],
                      );
                    },
                  ),
                ],
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
            const SizedBox(height: 12),
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
    return _allocations.entries.where((entry) => entry.value > 0.001).map((entry) {
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
    final totalPercent = (_getTotalAllocation() * 100).clamp(0.0, 999.0);
    final isOver = totalPercent > 100.0 + 0.1;
    final isUnder = totalPercent < 99.9;
    final badgeColor = isOver
        ? AppDesign.expenseColor
        : isUnder
            ? Colors.amber.shade700
            : AppDesign.incomeColor;
    final badgeLabel = isOver
        ? 'Dépassement'
        : isUnder
            ? 'Incomplet'
            : 'Équilibré';

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    const TrText(
                      'Poches Budgétaires',
                      style: TextStyle(
                        fontSize: 20,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(width: 12),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                      decoration: BoxDecoration(
                        color: badgeColor.withValues(alpha: 0.14),
                        borderRadius: BorderRadius.circular(14),
                      ),
                      child: TrText(
                        '${totalPercent.toStringAsFixed(1)}% · $badgeLabel',
                        style: TextStyle(
                          color: badgeColor,
                          fontWeight: FontWeight.w800,
                          fontSize: 12,
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 4),
                TrText(
                  'Alertes: ${_countOverBudgetPockets()} dépassement(s) · ${_countWatchPockets()} à surveiller',
                  style: const TextStyle(fontSize: 12, color: Colors.grey),
                ),
              ],
            ),
            TextButton.icon(
              onPressed: _resetToDefaultAllocation,
              icon: const Icon(Icons.refresh),
              label: const TrText('Par Défaut'),
            ),
          ],
        ),
        const SizedBox(height: 8),
        _buildCriticalPocketsChips(),
        const SizedBox(height: 12),
        ...() {
          final sortedKeys = DEFAULT_BUDGET_CATEGORIES.keys.toList();
          sortedKeys.sort((a, b) {
            final plannedA = (_allocations[a] ?? 0.0) * _totalIncome;
            final plannedB = (_allocations[b] ?? 0.0) * _totalIncome;
            final engagedA = _actualSpending[a] ?? 0.0;
            final engagedB = _actualSpending[b] ?? 0.0;
            final ratioA = plannedA > 0 ? engagedA / plannedA : 0.0;
            final ratioB = plannedB > 0 ? engagedB / plannedB : 0.0;
            return ratioB.compareTo(ratioA); // highest first
          });
          return sortedKeys.map((key) {
            final entry = DEFAULT_BUDGET_CATEGORIES[key]!;
            return _buildAllocationItem(
              key,
              entry['icon']!,
              entry['name']!,
            );
          }).toList();
        }(),
      ],
    );
  }

  Widget _buildBudgetSummaryPanel() {
    final sortedKeys = DEFAULT_BUDGET_CATEGORIES.keys.toList()
      ..sort((a, b) {
        final plannedA = (_allocations[a] ?? 0.0) * _totalIncome;
        final plannedB = (_allocations[b] ?? 0.0) * _totalIncome;
        final engagedA = _actualSpending[a] ?? 0.0;
        final engagedB = _actualSpending[b] ?? 0.0;
        final ratioA = plannedA > 0 ? engagedA / plannedA : 0.0;
        final ratioB = plannedB > 0 ? engagedB / plannedB : 0.0;
        return ratioB.compareTo(ratioA);
      });

    final entries = sortedKeys.map((key) {
      final name = DEFAULT_BUDGET_CATEGORIES[key]!['name']!;
      final icon = DEFAULT_BUDGET_CATEGORIES[key]!['icon']!;
      final planned = (_allocations[key] ?? 0.0) * _totalIncome;
      final engaged = _actualSpending[key] ?? 0.0;
      final ratio = (planned > 0 && engaged > 0) ? (engaged / planned).clamp(0.0, 1.2) : 0.0;
      final barColor = ratio < 0.6
          ? AppDesign.incomeColor
          : ratio < 0.85
              ? Colors.amber.shade700
              : AppDesign.expenseColor;
      final badgeColor = ratio >= 1
          ? AppDesign.expenseColor
          : ratio >= 0.8
              ? Colors.amber.shade700
              : AppDesign.incomeColor;
      final badgeLabel = ratio >= 1
          ? 'Dépassement'
          : ratio >= 0.8
              ? 'À surveiller'
              : 'OK';
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
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        TrText(
                          name,
                          style: const TextStyle(
                            fontWeight: FontWeight.w700,
                            fontSize: 14,
                          ),
                        ),
                        TrText(
                          'Reste : ${context.watch<CurrencyService>().formatAmount(planned - engaged)}',
                          style: TextStyle(
                            color: barColor,
                            fontSize: 12,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
                Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                      decoration: BoxDecoration(
                        color: badgeColor.withValues(alpha: 0.12),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: TrText(
                        badgeLabel,
                        style: TextStyle(
                          color: badgeColor,
                          fontWeight: FontWeight.w700,
                          fontSize: 11,
                        ),
                      ),
                    ),
                    const SizedBox(width: 10),
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
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: const [
                    TrText(
                      'Synthèse par poche',
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    SizedBox(height: 4),
                    TrText(
                      'Top 3 poches en tension en premier',
                      style: TextStyle(fontSize: 12, color: Colors.grey),
                    ),
                  ],
                ),
                const SizedBox.shrink(),
              ],
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
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const TrText(
                      'Transactions (Budget)',
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 4),
                    TrText(
                      'Met en avant les lignes qui font dépasser une poche.',
                      style: TextStyle(fontSize: 12, color: Colors.grey[600]),
                    ),
                  ],
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
                      final categoryName = _resolveTxCategoryLabel(tx);
                      bool pocketOver = false;
                      if (isExpense && DEFAULT_BUDGET_CATEGORIES.containsKey(categoryName)) {
                        final planned = (_allocations[categoryName] ?? 0.0) * _totalIncome;
                        final spent = _actualSpending[categoryName] ?? 0.0;
                        pocketOver = planned > 0 && spent > planned;
                      }
                      return ListTile(
                        contentPadding: EdgeInsets.zero,
                        leading: CircleAvatar(
                          backgroundColor: color.withValues(alpha: 0.12),
                          child: Icon(
                            isIncome ? Icons.trending_up : isExpense ? Icons.trending_down : Icons.swap_horiz,
                            color: color,
                            size: 18,
                          ),
                        ),
                        title: TrText(
                          tx.description?.isNotEmpty == true ? tx.description! : 'Transaction',
                          style: const TextStyle(fontWeight: FontWeight.w700),
                        ),
                        subtitle: Row(
                          children: [
                            TrText(
                              '${tx.date.day}/${tx.date.month}/${tx.date.year} · $categoryName',
                              style: const TextStyle(color: Colors.grey),
                            ),
                            if (pocketOver) ...[
                              const SizedBox(width: 8),
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                decoration: BoxDecoration(
                                  color: AppDesign.expenseColor.withValues(alpha: 0.12),
                                  borderRadius: BorderRadius.circular(12),
                                ),
                                child: const TrText(
                                  'Poche dépassée',
                                  style: TextStyle(
                                    color: AppDesign.expenseColor,
                                    fontSize: 11,
                                    fontWeight: FontWeight.w800,
                                  ),
                                ),
                              ),
                            ],
                          ],
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
    final isOverBudget = amount > 0 && actualSpent > amount;
    final spentPercentage = (amount > 0 && actualSpent > 0) ? (actualSpent / amount).clamp(0.0, 2.0) : 0.0;
    final remaining = (amount - actualSpent).clamp(0, double.infinity);
    final badgeColor = isOverBudget
        ? AppDesign.expenseColor
        : spentPercentage > 0.85
            ? Colors.amber.shade700
            : AppDesign.incomeColor;
    final badgeLabel = isOverBudget
        ? 'Dépassement'
        : spentPercentage > 0.85
            ? 'À surveiller'
            : 'OK';

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
                      TrText(
                        'Reste : ${currency.formatAmount(remaining.toDouble())}',
                        style: TextStyle(
                          fontSize: 12,
                          color: badgeColor,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
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
                const SizedBox(width: 8),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                  decoration: BoxDecoration(
                    color: badgeColor.withValues(alpha: 0.12),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: TrText(
                    badgeLabel,
                    style: TextStyle(
                      color: badgeColor,
                      fontWeight: FontWeight.w700,
                      fontSize: 12,
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                if (_editingRowKey == categoryKey)
                  Padding(
                    padding: const EdgeInsets.only(right: 8),
                    child: ElevatedButton.icon(
                      onPressed: () {
                        _saveBudgetPlan();
                        setState(() {
                          _editingRowKey = null;
                        });
                      },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppDesign.primaryIndigo,
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                        elevation: 0,
                        minimumSize: Size.zero,
                      ),
                      icon: const Icon(Icons.save, size: 16),
                      label: const TrText(
                        'OK',
                        style: TextStyle(
                          fontWeight: FontWeight.w700,
                          fontSize: 12,
                        ),
                      ),
                    ),
                  ),
                if (isOverBudget && _editingRowKey != categoryKey)
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
                  _editingRowKey = categoryKey;
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
                      FilteringTextInputFormatter.allow(RegExp(r'^\d*\.?\d{0,1}')),
                    ],
                    onTap: () {
                      setState(() {
                        _editingRowKey = categoryKey;
                      });
                    },
                    onChanged: (value) {
                      final newPercentage = double.tryParse(value);
                      if (newPercentage != null) {
                        setState(() {
                          _editingRowKey = categoryKey;
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
                      FilteringTextInputFormatter.allow(RegExp(r'^\d*\.?\d{0,2}')),
                    ],
                    onTap: () {
                      setState(() {
                        _editingRowKey = categoryKey;
                      });
                    },
                    onChanged: (value) {
                      final newAmount = double.tryParse(value);
                      if (newAmount != null && _totalIncome > 0) {
                        setState(() {
                          _editingRowKey = categoryKey;
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
                amount > 0 
                  ? '${currency.formatAmount(actualSpent)} / ${currency.formatAmount(amount)} (${(spentPercentage * 100).toStringAsFixed(0)}%)'
                  : '${currency.formatAmount(actualSpent)} (pas de budget alloué)',
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
    final clampedValue = newValue.clamp(0.0, 1.0).toDouble();
    _allocations[changedKey] = clampedValue;
    _updateController(changedKey, clampedValue);
  }

  void _updateController(String key, double value) {
    _percentageControllers[key]!.text = (value * 100).toStringAsFixed(1);
    final amt = _totalIncome * value;
    _amountControllers[key]!.text = amt.toStringAsFixed(amt % 1 == 0 ? 0 : 2);
  }

  void _updateAmountsFromPercentages() {
    for (var entry in _allocations.entries) {
      final amount = _totalIncome * entry.value;
      if (_amountControllers.containsKey(entry.key)) {
        _amountControllers[entry.key]!.text = amount.toStringAsFixed(amount % 1 == 0 ? 0 : 2);
      }
    }
  }

  double _getTotalAllocation() {
    return _allocations.values.fold(0.0, (sum, value) => sum + value);
  }

  int _countOverBudgetPockets() {
    int count = 0;
    for (final key in DEFAULT_BUDGET_CATEGORIES.keys) {
      final planned = (_allocations[key] ?? 0.0) * _totalIncome;
      final spent = _actualSpending[key] ?? 0.0;
      if (planned > 0 && spent > planned) count++;
    }
    return count;
  }

  int _countWatchPockets() {
    int count = 0;
    for (final key in DEFAULT_BUDGET_CATEGORIES.keys) {
      final planned = (_allocations[key] ?? 0.0) * _totalIncome;
      final spent = _actualSpending[key] ?? 0.0;
      final ratio = planned > 0 ? spent / planned : 0.0;
      if (ratio >= 0.85 && spent <= planned) count++;
    }
    return count;
  }

  List<String> _topTensionPockets({int limit = 3}) {
    final entries = DEFAULT_BUDGET_CATEGORIES.keys.map((key) {
      final planned = (_allocations[key] ?? 0.0) * _totalIncome;
      final spent = _actualSpending[key] ?? 0.0;
      final ratio = planned > 0 ? spent / planned : 0.0;
      return MapEntry(key, ratio);
    }).toList()
      ..sort((a, b) => b.value.compareTo(a.value));
    return entries.take(limit).map((e) => e.key).toList();
  }

  /// Affiche des puces des poches les plus critiques (ratio le plus élevé).
  Widget _buildCriticalPocketsChips() {
    final critical = _topTensionPockets();
    if (critical.isEmpty) return const SizedBox.shrink();

    return Wrap(
      spacing: 8,
      runSpacing: 8,
      children: critical.map((key) {
        final planned = (_allocations[key] ?? 0.0) * _totalIncome;
        final spent = _actualSpending[key] ?? 0.0;
        final ratio = planned > 0 ? spent / planned : 0.0;
        final color = ratio >= 1
            ? AppDesign.expenseColor
            : ratio >= 0.85
                ? Colors.amber.shade700
                : AppDesign.incomeColor;
        return Container(
          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
          decoration: BoxDecoration(
            color: color.withValues(alpha: 0.12),
            borderRadius: BorderRadius.circular(12),
          ),
          child: TrText(
            '$key · ${(ratio * 100).toStringAsFixed(0)}%',
            style: TextStyle(
              color: color,
              fontWeight: FontWeight.w700,
              fontSize: 12,
            ),
          ),
        );
      }).toList(),
    );
  }

  void _resetToDefaultAllocation() {
    const defaultPattern = '30/15/10/5/5/10/10/10/5 (100%)';

    showDialog(
      context: context,
      builder: (context) {
        return AlertDialog(
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(18)),
          titlePadding: const EdgeInsets.fromLTRB(24, 22, 24, 8),
          contentPadding: const EdgeInsets.fromLTRB(24, 0, 24, 8),
          actionsPadding: const EdgeInsets.fromLTRB(16, 0, 16, 12),
          title: const TrText(
            'Réinitialiser le budget ?',
            style: TextStyle(fontSize: 20, fontWeight: FontWeight.w800),
          ),
          content: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 520),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: const [
                SizedBox(height: 6),
                TrText(
                  'Appliquer la répartition par défaut : $defaultPattern',
                  style: TextStyle(fontSize: 15, height: 1.4),
                ),
                SizedBox(height: 10),
                TrText(
                  'Cette action écrase vos réglages actuels. Aucune sauvegarde automatique.',
                  style: TextStyle(fontSize: 13, color: Colors.black54, height: 1.4),
                ),
              ],
            ),
          ),
          actionsAlignment: MainAxisAlignment.end,
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              style: TextButton.styleFrom(
                foregroundColor: Colors.grey[700],
              ),
              child: const TrText(
                'Annuler',
                style: TextStyle(fontWeight: FontWeight.w700),
              ),
            ),
            ElevatedButton(
              onPressed: () {
                setState(() {
                  _allocations = Map.from(DEFAULT_ALLOCATION);
                  for (var entry in _allocations.entries) {
                    _percentageControllers[entry.key]!.text = (entry.value * 100).toStringAsFixed(1);
                    final amt = _totalIncome * entry.value;
                    _amountControllers[entry.key]!.text = amt.toStringAsFixed(amt % 1 == 0 ? 0 : 2);
                  }
                });
                Navigator.pop(context);
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: TrText('Budget réinitialisé avec succès !')),
                );
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: AppDesign.primaryIndigo,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 12),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
              ),
              child: const TrText(
                'Appliquer',
                style: TextStyle(fontWeight: FontWeight.w800),
              ),
            ),
          ],
        );
      },
    );
  }

  void _saveBudgetPlan() {
    final totalPercentage = _getTotalAllocation();
    final parsedIncome = double.tryParse(_incomeController.text.trim()) ?? 0;
    if (parsedIncome <= 0) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: TrText('Le budget mensuel doit être supérieur à 0.'),
          backgroundColor: AppDesign.expenseColor,
        ),
      );
      return;
    }
    _totalIncome = parsedIncome;
    if (_expectedIncomeController.text.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: TrText('Veuillez saisir une prévision de revenus.'),
          backgroundColor: AppDesign.expenseColor,
        ),
      );
      return;
    }

    final parsedExpected = double.tryParse(_expectedIncomeController.text.trim()) ?? 0;
    if (parsedExpected <= 0) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: TrText('La prévision de revenus doit être supérieure à 0.'),
          backgroundColor: AppDesign.expenseColor,
        ),
      );
      return;
    }
    _expectedIncome = parsedExpected;

    if (totalPercentage > 1.0 + 0.0001) {
      final overflowPercent = (totalPercentage - 1.0) * 100;
      final overflowAmount = (_totalIncome * (totalPercentage - 1.0)).abs();
      final currency = context.read<CurrencyService>();
      final overflowAmountText = currency.formatAmount(overflowAmount);

      showDialog(
        context: context,
        builder: (context) => AlertDialog(
          title: const TrText('Budget dépassé'),
          content: TrText(
            'Le total atteint ${(totalPercentage * 100).toStringAsFixed(1)}% (+${overflowPercent.toStringAsFixed(1)}%). '
            'Vous débordez de $overflowAmountText. '
            'Réduisez certaines lignes pour revenir à 100% avant d’enregistrer.',
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

    _performSave();
  }

  Future<void> _unlockFieldsWithConfirm() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const TrText('Modifier les montants ?'),
        content: const TrText('Déverrouiller les champs budget et prévision pour les ajuster ?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const TrText('Annuler'),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(ctx, true),
            style: ElevatedButton.styleFrom(
              backgroundColor: AppDesign.primaryIndigo,
              foregroundColor: Colors.white,
            ),
            child: const TrText('Modifier'),
          ),
        ],
      ),
    );

    if (confirmed == true && mounted) {
      setState(() => _fieldsLocked = false);
    }
  }

  Future<void> _performSave() async {
    final userId = _firestoreService.currentUserId;
    if (userId == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: TrText('Connectez-vous pour enregistrer votre budget.'),
          backgroundColor: AppDesign.expenseColor,
        ),
      );
      return;
    }

    // Préparer les allocations (poche -> pourcentage)
    final allocations = {
      for (final entry in _allocations.entries) entry.key: (entry.value)
    };

    try {
      final existingPlan = await _firestoreService.getCurrentBudgetPlan(userId);
      if (existingPlan != null && existingPlan['id'] != null) {
        await _firestoreService.updateBudgetPlan(
          userId: userId,
          budgetId: existingPlan['id'] as String,
          categoryAllocations: allocations,
          totalBudget: _totalIncome,
          expectedIncome: _expectedIncome,
        );
      } else {
        await _firestoreService.saveBudgetPlan(
          userId: userId,
          totalBudget: _totalIncome,
          expectedIncome: _expectedIncome,
          categoryAllocations: allocations,
        );
      }

      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: TrText('Budget enregistré avec succès !'),
          backgroundColor: AppDesign.incomeColor,
        ),
      );
      setState(() {
        _fieldsLocked = true;
      });
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: TrText('Erreur lors de l’enregistrement: $e'),
          backgroundColor: AppDesign.expenseColor,
        ),
      );
    }
  }

  String _resolveTxCategoryLabel(Transaction tx) {
    if (tx.category != null && tx.category!.trim().isNotEmpty) return tx.category!;
    switch (tx.type) {
      case TransactionType.income:
        return AppLocalizations.of(context)!.income;
      case TransactionType.expense:
        return AppLocalizations.of(context)!.expense;
      case TransactionType.transfer:
        return AppLocalizations.of(context)!.transfer;
    }
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
