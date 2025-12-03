import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:characters/characters.dart';
import '../../models/transaction.dart' as app_transaction;
import '../../models/category.dart';
import '../../services/firestore_service.dart';
import '../../constants/app_design.dart';
import 'package:budget/l10n/app_localizations.dart';

class ComparativeFinancialMatrix extends StatefulWidget {
  final String userId;

  const ComparativeFinancialMatrix({super.key, required this.userId});

  @override
  State<ComparativeFinancialMatrix> createState() => _ComparativeFinancialMatrixState();
}

class _ComparativeFinancialMatrixState extends State<ComparativeFinancialMatrix> {
  final FirestoreService _firestoreService = FirestoreService();
  
  // State
  bool _isIncome = false; // false = Dépenses, true = Revenus
  int _selectedYear = DateTime.now().year;
  bool _isLoading = false;
  Map<String, Map<int, double>> _matrixData = {};
  Map<String, String> _categoryIcons = {}; // Cache pour les icônes
  
  // Constantes de design
  final double _categoryColumnWidth = 140.0;
  final double _monthColumnWidth = 70.0;
  final double _totalColumnWidth = 80.0;

  @override
  void initState() {
    super.initState();
    _fetchAndProcessData();
  }

  Future<void> _fetchAndProcessData() async {
    setState(() => _isLoading = true);

    try {
      final startOfYear = DateTime(_selectedYear, 1, 1);
      final endOfYear = DateTime(_selectedYear, 12, 31, 23, 59, 59);

      // Récupération des catégories pour avoir toutes les catégories même sans transactions
      final categories = await _firestoreService.getCategories(
        widget.userId,
        type: _isIncome ? CategoryType.income : CategoryType.expense,
      );

      // Récupération des transactions pour l'année sélectionnée
      final transactions = await _firestoreService.getTransactions(
        widget.userId,
        startDate: startOfYear,
        endDate: endOfYear,
        limit: 2000, // Large limit for full year
        type: _isIncome ? app_transaction.TransactionType.income : app_transaction.TransactionType.expense,
      );

      _processTransactionsToMatrix(transactions, categories);
    } catch (e) {
      debugPrint('Erreur lors du chargement de la matrice: $e');
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  void _processTransactionsToMatrix(List<app_transaction.Transaction> transactions, List<Category> categories) {
    final Map<String, Map<int, double>> matrix = {};
    final Map<String, String> icons = {};
    
    // Créer un map categoryId -> categoryName pour le lookup rapide
    final Map<String, String> categoryIdToName = {};
    final Map<String, String> categoryIdToIcon = {};
    
    // Initialiser toutes les catégories avec des valeurs nulles
    for (var category in categories) {
      if (category.isActive) {
        final categoryName = category.name;
        matrix[categoryName] = {};
        icons[categoryName] = category.icon;
        categoryIdToName[category.categoryId] = categoryName;
        categoryIdToIcon[category.categoryId] = category.icon;
      }
    }

    // Remplir avec les transactions réelles
    for (var tx in transactions) {
      // Essayer d'abord avec categoryId, puis fallback sur category name
      String categoryName = 'Autre';
      
      if (tx.categoryId != null && categoryIdToName.containsKey(tx.categoryId)) {
        categoryName = categoryIdToName[tx.categoryId]!;
      } else if (tx.category != null && tx.category!.isNotEmpty) {
        // Fallback: chercher une catégorie qui correspond au nom
        final matchingCategory = categories.firstWhere(
          (cat) => cat.name.toLowerCase().trim() == tx.category!.toLowerCase().trim(),
          orElse: () => categories.firstWhere(
            (cat) => cat.categoryId == 'autre',
            orElse: () => categories.first,
          ),
        );
        categoryName = matchingCategory.name;
      }
      
      final monthIndex = tx.date.month; // 1..12
      
      // S'assurer que la catégorie existe dans la matrice
      if (!matrix.containsKey(categoryName)) {
        matrix[categoryName] = {};
        icons[categoryName] = _extractIcon(categoryName);
      }

      matrix[categoryName]![monthIndex] = (matrix[categoryName]![monthIndex] ?? 0) + tx.amount;
    }

    setState(() {
      _matrixData = matrix;
      _categoryIcons = icons;
    });
  }

  String _extractIcon(String categoryName) {
    // Logique simplifiée pour extraire un emoji ou retourner une icône par défaut
    if (categoryName.isEmpty) return '🏷️';
    final firstChar = categoryName.characters.first;
    // Vérification basique si c'est un emoji (plage Unicode approximative)
    if (firstChar.runes.first > 1000) {
      return firstChar;
    }
    return '🏷️';
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: AppDesign.mediumShadow,
      ),
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _buildHeader(),
          const SizedBox(height: 16),
          _isLoading
              ? const Center(child: Padding(padding: EdgeInsets.all(32), child: CircularProgressIndicator()))
              : _buildMatrixBody(),
        ],
      ),
    );
  }

  void _openFullScreenMatrix(BuildContext context) {
    Navigator.of(context).push(
      MaterialPageRoute(
        builder: (context) => _FullScreenMatrixView(
          isIncome: _isIncome,
          selectedYear: _selectedYear,
          matrixData: _matrixData,
          categoryIcons: _categoryIcons,
          onToggleType: () {
            setState(() {
              _isIncome = !_isIncome;
            });
            _fetchAndProcessData();
          },
          onYearChanged: (year) {
            setState(() {
              _selectedYear = year;
            });
            _fetchAndProcessData();
          },
        ),
      ),
    );
  }

  Widget _buildHeader() {
    final isMobile = MediaQuery.of(context).size.width < 600;
    
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        // Toggle Switch
        Flexible(
          child: Container(
            decoration: BoxDecoration(
              color: Colors.grey[100],
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: Colors.grey[300]!),
            ),
            padding: const EdgeInsets.all(4),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                _buildToggleOption('Dépenses', !_isIncome, AppDesign.expenseColor),
                _buildToggleOption('Revenus', _isIncome, AppDesign.incomeColor),
              ],
            ),
          ),
        ),
        
        const SizedBox(width: 8),
        
        // Year Selector
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
          decoration: BoxDecoration(
            color: Colors.grey[100],
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: Colors.grey[300]!),
          ),
          child: DropdownButton<int>(
            value: _selectedYear,
            underline: const SizedBox(),
            icon: const Icon(Icons.keyboard_arrow_down, size: 20),
            style: const TextStyle(fontWeight: FontWeight.bold, color: Colors.black87),
            items: List.generate(5, (index) {
              final year = DateTime.now().year - index;
              return DropdownMenuItem(value: year, child: TrText(year.toString()));
            }),
            onChanged: (year) {
              if (year != null) {
                setState(() => _selectedYear = year);
                _fetchAndProcessData();
              }
            },
          ),
        ),
        
        // Bouton plein écran (mobile uniquement)
        if (isMobile) ...[
          const SizedBox(width: 8),
          IconButton(
            icon: const Icon(Icons.fullscreen, color: AppDesign.primaryIndigo),
            onPressed: () => _openFullScreenMatrix(context),
            tooltip: t('Plein écran'),
            padding: EdgeInsets.zero,
            constraints: const BoxConstraints(),
          ),
        ],
      ],
    );
  }

  Widget _buildToggleOption(String label, bool isSelected, Color activeColor) {
    return GestureDetector(
      onTap: () {
        if (!isSelected) {
          setState(() {
            _isIncome = !_isIncome;
          });
          _fetchAndProcessData();
        }
      },
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        decoration: BoxDecoration(
          color: isSelected ? Colors.white : Colors.transparent,
          borderRadius: BorderRadius.circular(8),
          boxShadow: isSelected ? [BoxShadow(color: Colors.black.withValues(alpha: 0.05), blurRadius: 4)] : [],
        ),
        child: TrText(
          label,
          style: TextStyle(
            color: isSelected ? activeColor : Colors.grey[600],
            fontWeight: FontWeight.bold,
            fontSize: 13,
          ),
        ),
      ),
    );
  }

  Widget _buildMatrixBody() {
    if (_matrixData.isEmpty) {
      return _buildEmptyState();
    }

    // Déterminer les mois à afficher
    final now = DateTime.now();
    final isCurrentYear = _selectedYear == now.year;
    final maxMonth = isCurrentYear ? now.month : 12;
    final months = List.generate(maxMonth, (index) => index + 1);

    // Calculer le max global pour la heatmap
    double maxAmount = 0;
    for (var row in _matrixData.values) {
      for (var amount in row.values) {
        if (amount > maxAmount) maxAmount = amount;
      }
    }

    // Trier les catégories par total annuel décroissant
    final sortedCategories = _matrixData.keys.toList()
      ..sort((a, b) {
        final totalA = _matrixData[a]!.values.fold(0.0, (sum, v) => sum + v);
        final totalB = _matrixData[b]!.values.fold(0.0, (sum, v) => sum + v);
        return totalB.compareTo(totalA);
      });

    // Calcul des totaux mensuels (dernière ligne)
    final Map<int, double> monthlyTotals = {};
    for (var m in months) {
      monthlyTotals[m] = 0;
      for (var cat in sortedCategories) {
        monthlyTotals[m] = (monthlyTotals[m] ?? 0) + (_matrixData[cat]![m] ?? 0);
      }
    }
    final grandTotal = monthlyTotals.values.fold(0.0, (sum, v) => sum + v);

    return AnimatedSwitcher(
      duration: const Duration(milliseconds: 300),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // 1. Colonne Sticky (Catégories)
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _buildStickyCell('Catégorie', isHeader: true),
              ...sortedCategories.map((cat) => _buildStickyCell(cat, icon: _categoryIcons[cat])),
              Container(
                decoration: const BoxDecoration(
                  border: Border(top: BorderSide(color: Colors.black12, width: 2)),
                ),
                child: _buildStickyCell('TOTAL', isBold: true),
              ),
            ],
          ),

          // 2. Zone Scrollable (Mois + Total Annuel)
          Expanded(
            child: SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Header Row
                  Row(
                    children: [
                      ...months.map((m) => _buildMonthHeaderCell(m)),
                      _buildTotalHeaderCell(),
                    ],
                  ),
                  
                  // Data Rows
                  ...sortedCategories.map((cat) {
                    final rowTotal = _matrixData[cat]!.values.fold(0.0, (sum, v) => sum + v);
                    return Row(
                      children: [
                        ...months.map((m) {
                          final amount = _matrixData[cat]![m] ?? 0;
                          return _buildHeatmapCell(amount, maxAmount);
                        }),
                        _buildTotalCell(rowTotal),
                      ],
                    );
                  }),

                  // Footer Row (Totals)
                  Container(
                    decoration: const BoxDecoration(
                      border: Border(top: BorderSide(color: Colors.black12, width: 2)),
                    ),
                    child: Row(
                      children: [
                        ...months.map((m) => _buildTotalCell(monthlyTotals[m] ?? 0, isFooter: true)),
                        _buildTotalCell(grandTotal, isFooter: true, isBold: true),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStickyCell(String text, {String? icon, bool isHeader = false, bool isBold = false}) {
    return Container(
      width: _categoryColumnWidth,
      height: 48,
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
      alignment: Alignment.centerLeft,
      decoration: BoxDecoration(
        color: isHeader ? Colors.grey[50] : Colors.white,
        border: Border(
          right: BorderSide(color: Colors.grey[200]!),
          bottom: BorderSide(color: Colors.grey[100]!),
        ),
      ),
      child: Row(
        children: [
          if (icon != null) ...[
            TrText(icon, style: const TextStyle(fontSize: 16)),
            const SizedBox(width: 8),
          ],
          Expanded(
            child: TrText(
              text,
              style: TextStyle(
                fontWeight: isHeader || isBold ? FontWeight.bold : FontWeight.normal,
                color: isHeader ? Colors.grey[600] : Colors.black87,
                fontSize: 13,
              ),
              overflow: TextOverflow.ellipsis,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildMonthHeaderCell(int monthIndex) {
    final monthName = DateFormat('MMM', 'fr_FR').format(DateTime(2024, monthIndex));
    return Container(
      width: _monthColumnWidth,
      height: 48,
      alignment: Alignment.center,
      decoration: BoxDecoration(
        color: Colors.grey[50],
        border: Border(
          right: BorderSide(color: Colors.grey[200]!),
          bottom: BorderSide(color: Colors.grey[100]!),
        ),
      ),
      child: TrText(
        monthName.toUpperCase(),
        style: TextStyle(
          fontWeight: FontWeight.bold,
          color: Colors.grey[600],
          fontSize: 11,
        ),
      ),
    );
  }

  Widget _buildTotalHeaderCell() {
    return Container(
      width: _totalColumnWidth,
      height: 48,
      alignment: Alignment.center,
      decoration: BoxDecoration(
        color: Colors.grey[100],
        border: Border(
          bottom: BorderSide(color: Colors.grey[100]!),
        ),
      ),
      child: TrText(
        'TOTAL',
        style: TextStyle(
          fontWeight: FontWeight.bold,
          color: Colors.grey[800],
          fontSize: 11,
        ),
      ),
    );
  }

  Widget _buildHeatmapCell(double amount, double maxAmount) {
    if (amount == 0) {
      return Container(
        width: _monthColumnWidth,
        height: 48,
        alignment: Alignment.center,
        decoration: BoxDecoration(
          border: Border(
            right: BorderSide(color: Colors.grey[100]!),
            bottom: BorderSide(color: Colors.grey[100]!),
          ),
        ),
        child: TrText(
          '-',
          style: TextStyle(color: Colors.grey[300], fontSize: 12),
        ),
      );
    }

    // Logique Heatmap
    final ratio = maxAmount > 0 ? (amount / maxAmount) : 0.0;
    final baseColor = _isIncome ? AppDesign.incomeColor : AppDesign.expenseColor;
    // Opacité min 0.05, max 0.3 pour rester lisible
    final opacity = 0.05 + (ratio * 0.25);
    
    return Container(
      width: _monthColumnWidth,
      height: 48,
      alignment: Alignment.center,
      decoration: BoxDecoration(
        color: baseColor.withValues(alpha: opacity),
        border: Border(
          right: BorderSide(color: Colors.grey[100]!),
          bottom: BorderSide(color: Colors.grey[100]!),
        ),
      ),
      child: TrText(
        amount >= 1000 ? '${(amount/1000).toStringAsFixed(1)}k' : amount.toStringAsFixed(0),
        style: TextStyle(
          color: Colors.black87,
          fontSize: 12,
          fontWeight: ratio > 0.7 ? FontWeight.bold : FontWeight.normal,
        ),
      ),
    );
  }

  Widget _buildTotalCell(double amount, {bool isFooter = false, bool isBold = false}) {
    return Container(
      width: _totalColumnWidth,
      height: 48,
      alignment: Alignment.center,
      decoration: BoxDecoration(
        color: isFooter ? Colors.grey[50] : Colors.white,
        border: Border(
          bottom: BorderSide(color: Colors.grey[100]!),
        ),
      ),
      child: TrText(
        amount >= 10000 ? '${(amount/1000).toStringAsFixed(1)}k' : amount.toStringAsFixed(0),
        style: TextStyle(
          fontWeight: FontWeight.bold,
          color: isBold ? (_isIncome ? AppDesign.incomeColor : AppDesign.expenseColor) : Colors.black87,
          fontSize: 12,
        ),
      ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 40),
        child: Column(
          children: [
            Icon(
              _isIncome ? Icons.savings_outlined : Icons.receipt_long_outlined,
              size: 48,
              color: Colors.grey[300],
            ),
            const SizedBox(height: 16),
            TrText(
              'Aucune donnée pour $_selectedYear',
              style: TextStyle(color: Colors.grey[500], fontSize: 16),
            ),
            const SizedBox(height: 8),
            TrText(
              'Commencez à ajouter des transactions !',
              style: TextStyle(color: Colors.grey[400], fontSize: 12),
            ),
          ],
        ),
      ),
    );
  }
}

// Widget pour afficher la matrice en plein écran
class _FullScreenMatrixView extends StatefulWidget {
  final bool isIncome;
  final int selectedYear;
  final Map<String, Map<int, double>> matrixData;
  final Map<String, String> categoryIcons;
  final VoidCallback onToggleType;
  final Function(int) onYearChanged;

  const _FullScreenMatrixView({
    required this.isIncome,
    required this.selectedYear,
    required this.matrixData,
    required this.categoryIcons,
    required this.onToggleType,
    required this.onYearChanged,
  });

  @override
  State<_FullScreenMatrixView> createState() => _FullScreenMatrixViewState();
}

class _FullScreenMatrixViewState extends State<_FullScreenMatrixView> {
  final double _categoryColumnWidth = 140.0;
  final double _monthColumnWidth = 70.0;
  final double _totalColumnWidth = 80.0;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        title: TrText(widget.isIncome ? 'Revenus ${widget.selectedYear}' : 'Dépenses ${widget.selectedYear}'),
        backgroundColor: AppDesign.primaryIndigo,
        foregroundColor: Colors.white,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.close),
          onPressed: () => Navigator.of(context).pop(),
        ),
      ),
      body: widget.matrixData.isEmpty
          ? _buildEmptyState()
          : _buildFullScreenMatrix(),
    );
  }

  Widget _buildFullScreenMatrix() {
    final now = DateTime.now();
    final isCurrentYear = widget.selectedYear == now.year;
    final maxMonth = isCurrentYear ? now.month : 12;
    final months = List.generate(maxMonth, (index) => index + 1);

    // Calculer le max global pour la heatmap
    double maxAmount = 0;
    for (var row in widget.matrixData.values) {
      for (var amount in row.values) {
        if (amount > maxAmount) maxAmount = amount;
      }
    }

    // Trier les catégories par total annuel décroissant
    final sortedCategories = widget.matrixData.keys.toList()
      ..sort((a, b) {
        final totalA = widget.matrixData[a]!.values.fold(0.0, (sum, v) => sum + v);
        final totalB = widget.matrixData[b]!.values.fold(0.0, (sum, v) => sum + v);
        return totalB.compareTo(totalA);
      });

    // Calcul des totaux mensuels
    final Map<int, double> monthlyTotals = {};
    for (var m in months) {
      monthlyTotals[m] = 0;
      for (var cat in sortedCategories) {
        monthlyTotals[m] = (monthlyTotals[m] ?? 0) + (widget.matrixData[cat]![m] ?? 0);
      }
    }
    final grandTotal = monthlyTotals.values.fold(0.0, (sum, v) => sum + v);

    return SingleChildScrollView(
      child: SingleChildScrollView(
        scrollDirection: Axis.horizontal,
        child: Padding(
          padding: const EdgeInsets.all(16.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Header Row
              Row(
                children: [
                  _buildStickyCell('Catégorie', isHeader: true),
                  ...months.map((m) => _buildMonthHeaderCell(m)),
                  _buildTotalHeaderCell(),
                ],
              ),

              // Data Rows
              ...sortedCategories.map((cat) {
                final rowTotal = widget.matrixData[cat]!.values.fold(0.0, (sum, v) => sum + v);
                return Row(
                  children: [
                    _buildStickyCell(cat, icon: widget.categoryIcons[cat]),
                    ...months.map((m) {
                      final amount = widget.matrixData[cat]![m] ?? 0;
                      return _buildHeatmapCell(amount, maxAmount);
                    }),
                    _buildTotalCell(rowTotal),
                  ],
                );
              }),

              // Footer Row (Totals)
              Container(
                decoration: const BoxDecoration(
                  border: Border(top: BorderSide(color: Colors.black12, width: 2)),
                ),
                child: Row(
                  children: [
                    _buildStickyCell('TOTAL', isBold: true),
                    ...months.map((m) => _buildTotalCell(monthlyTotals[m] ?? 0, isFooter: true)),
                    _buildTotalCell(grandTotal, isFooter: true, isBold: true),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildStickyCell(String text, {String? icon, bool isHeader = false, bool isBold = false}) {
    return Container(
      width: _categoryColumnWidth,
      height: 48,
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
      alignment: Alignment.centerLeft,
      decoration: BoxDecoration(
        color: isHeader ? Colors.grey[50] : Colors.white,
        border: Border(
          right: BorderSide(color: Colors.grey[200]!),
          bottom: BorderSide(color: Colors.grey[100]!),
        ),
      ),
      child: Row(
        children: [
          if (icon != null) ...[
            TrText(icon, style: const TextStyle(fontSize: 16)),
            const SizedBox(width: 8),
          ],
          Expanded(
            child: TrText(
              text,
              style: TextStyle(
                fontWeight: isHeader || isBold ? FontWeight.bold : FontWeight.normal,
                color: isHeader ? Colors.grey[600] : Colors.black87,
                fontSize: 13,
              ),
              overflow: TextOverflow.ellipsis,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildMonthHeaderCell(int monthIndex) {
    final monthName = DateFormat('MMM', 'fr_FR').format(DateTime(2024, monthIndex));
    return Container(
      width: _monthColumnWidth,
      height: 48,
      alignment: Alignment.center,
      decoration: BoxDecoration(
        color: Colors.grey[50],
        border: Border(
          right: BorderSide(color: Colors.grey[200]!),
          bottom: BorderSide(color: Colors.grey[100]!),
        ),
      ),
      child: TrText(
        monthName.toUpperCase(),
        style: TextStyle(
          fontWeight: FontWeight.bold,
          color: Colors.grey[600],
          fontSize: 11,
        ),
      ),
    );
  }

  Widget _buildTotalHeaderCell() {
    return Container(
      width: _totalColumnWidth,
      height: 48,
      alignment: Alignment.center,
      decoration: BoxDecoration(
        color: Colors.grey[100],
        border: Border(
          bottom: BorderSide(color: Colors.grey[100]!),
        ),
      ),
      child: const TrText(
        'TOTAL',
        style: TextStyle(
          fontWeight: FontWeight.bold,
          color: Colors.black87,
          fontSize: 11,
        ),
      ),
    );
  }

  Widget _buildHeatmapCell(double amount, double maxAmount) {
    if (amount == 0) {
      return Container(
        width: _monthColumnWidth,
        height: 48,
        alignment: Alignment.center,
        decoration: BoxDecoration(
          border: Border(
            right: BorderSide(color: Colors.grey[100]!),
            bottom: BorderSide(color: Colors.grey[100]!),
          ),
        ),
        child: TrText(
          '-',
          style: TextStyle(color: Colors.grey[300], fontSize: 12),
        ),
      );
    }

    final ratio = maxAmount > 0 ? (amount / maxAmount) : 0.0;
    final baseColor = widget.isIncome ? AppDesign.incomeColor : AppDesign.expenseColor;
    final opacity = 0.05 + (ratio * 0.25);

    return Container(
      width: _monthColumnWidth,
      height: 48,
      alignment: Alignment.center,
      decoration: BoxDecoration(
        color: baseColor.withValues(alpha: opacity),
        border: Border(
          right: BorderSide(color: Colors.grey[100]!),
          bottom: BorderSide(color: Colors.grey[100]!),
        ),
      ),
      child: TrText(
        amount >= 1000 ? '${(amount / 1000).toStringAsFixed(1)}k' : amount.toStringAsFixed(0),
        style: TextStyle(
          color: Colors.black87,
          fontSize: 12,
          fontWeight: ratio > 0.7 ? FontWeight.bold : FontWeight.normal,
        ),
      ),
    );
  }

  Widget _buildTotalCell(double amount, {bool isFooter = false, bool isBold = false}) {
    return Container(
      width: _totalColumnWidth,
      height: 48,
      alignment: Alignment.center,
      decoration: BoxDecoration(
        color: isFooter ? Colors.grey[50] : Colors.white,
        border: Border(
          bottom: BorderSide(color: Colors.grey[100]!),
        ),
      ),
      child: TrText(
        amount >= 10000 ? '${(amount / 1000).toStringAsFixed(1)}k' : amount.toStringAsFixed(0),
        style: TextStyle(
          fontWeight: FontWeight.bold,
          color: isBold ? (widget.isIncome ? AppDesign.incomeColor : AppDesign.expenseColor) : Colors.black87,
          fontSize: 12,
        ),
      ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 40),
        child: Column(
          children: [
            Icon(
              widget.isIncome ? Icons.savings_outlined : Icons.receipt_long_outlined,
              size: 64,
              color: Colors.grey[300],
            ),
            const SizedBox(height: 16),
            TrText(
              'Aucune donnée pour ${widget.selectedYear}',
              style: TextStyle(color: Colors.grey[500], fontSize: 16),
            ),
            const SizedBox(height: 8),
            const TrText(
              'Commencez à ajouter des transactions !',
              style: TextStyle(color: Colors.grey, fontSize: 12),
            ),
          ],
        ),
      ),
    );
  }
}
