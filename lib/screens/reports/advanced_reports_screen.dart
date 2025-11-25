import 'package:flutter/material.dart';
import 'package:fl_chart/fl_chart.dart';
import 'package:intl/intl.dart';
import 'comparative_financial_matrix.dart';
import '../../models/transaction.dart' as app_transaction;
import '../../services/firestore_service.dart';
import '../../constants/app_design.dart';
import 'global_financial_flow_block.dart';
import 'package:budget/l10n/app_localizations.dart';

enum ReportPeriod { currentMonth, lastMonth, quarter, year, custom }

class AdvancedReportsScreen extends StatefulWidget {
  const AdvancedReportsScreen({super.key});

  @override
  State<AdvancedReportsScreen> createState() => _AdvancedReportsScreenState();
}

class _AdvancedReportsScreenState extends State<AdvancedReportsScreen> {
  final FirestoreService _firestoreService = FirestoreService();
  ReportPeriod _selectedPeriod = ReportPeriod.currentMonth;
  DateTimeRange? _customDateRange;
  
  // Cache pour éviter les recalculs inutiles
  List<app_transaction.Transaction> _transactions = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _fetchData();
  }

  DateTimeRange _getDateRange() {
    final now = DateTime.now();
    switch (_selectedPeriod) {
      case ReportPeriod.currentMonth:
        return DateTimeRange(
          start: DateTime(now.year, now.month, 1),
          end: now,
        );
      case ReportPeriod.lastMonth:
        final start = DateTime(now.year, now.month - 1, 1);
        final end = DateTime(now.year, now.month, 0);
        return DateTimeRange(start: start, end: end);
      case ReportPeriod.quarter:
        final start = DateTime(now.year, now.month - 3, 1);
        return DateTimeRange(start: start, end: now);
      case ReportPeriod.year:
        final start = DateTime(now.year, 1, 1);
        return DateTimeRange(start: start, end: now);
      case ReportPeriod.custom:
        return _customDateRange ?? DateTimeRange(
          start: DateTime(now.year, now.month, 1),
          end: now,
        );
    }
  }

  Future<void> _fetchData() async {
    setState(() => _isLoading = true);
    final userId = _firestoreService.currentUserId;
    if (userId == null) {
      setState(() => _isLoading = false);
      return;
    }

    final range = _getDateRange();
    try {
      final transactions = await _firestoreService.getTransactions(
        userId,
        startDate: range.start,
        endDate: range.end,
        limit: 1000, // Limite haute pour les rapports
      );
      
      if (mounted) {
        setState(() {
          _transactions = transactions;
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() => _isLoading = false);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: TrText('Erreur de chargement: $e')),
        );
      }
    }
  }

  void _onPeriodChanged(ReportPeriod? period) {
    if (period == null) return;
    if (period == ReportPeriod.custom) {
      _selectCustomDateRange();
    } else {
      setState(() {
        _selectedPeriod = period;
      });
      _fetchData();
    }
  }

  Future<void> _selectCustomDateRange() async {
    final picked = await showDateRangePicker(
      context: context,
      firstDate: DateTime(2020),
      lastDate: DateTime.now(),
      initialDateRange: _getDateRange(),
      builder: (context, child) {
        return Theme(
          data: ThemeData.light().copyWith(
            colorScheme: ColorScheme.light(primary: AppDesign.primaryIndigo),
          ),
          child: child!,
        );
      },
    );

    if (picked != null) {
      setState(() {
        _selectedPeriod = ReportPeriod.custom;
        _customDateRange = picked;
      });
      _fetchData();
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppDesign.backgroundGrey,
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: _fetchData,
              child: LayoutBuilder(
                builder: (context, constraints) {
                  final isWide = constraints.maxWidth >= 800;
                  return SingleChildScrollView(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        _buildPeriodSelector(),
                        const SizedBox(height: 20),
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            // Vue 360° en pleine largeur
                            if (_firestoreService.currentUserId != null)
                              GlobalFinancialFlowBlock(
                                userId: _firestoreService.currentUserId!,
                                transactions: _transactions,
                                dateRange: _getDateRange(),
                              ),
                            const SizedBox(height: 20),
                            // Évolution du Cashflow en pleine largeur
                            _buildTrendChart(),
                            const SizedBox(height: 20),
                            // Synthèse en pleine largeur
                            const TrText(
                              'Synthèse des dépenses et revenus',
                              style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                            ),
                            const SizedBox(height: 12),
                            if (_firestoreService.currentUserId != null)
                              ComparativeFinancialMatrix(
                                userId: _firestoreService.currentUserId!,
                              ),
                            // Padding supplémentaire pour éviter que le tableau soit collé au menu
                            const SizedBox(height: 100),
                          ],
                        ),
                      ],
                    ),
                  );
                },
              ),
            ),
    );
  }

  Widget _buildPeriodSelector() {
    final range = _getDateRange();
    final dateFormat = DateFormat('dd/MM/yyyy');
    final dateRangeString = '${dateFormat.format(range.start)} - ${dateFormat.format(range.end)}';

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.05),
            blurRadius: 10,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const TrText(
                'Période :',
                style: TextStyle(fontWeight: FontWeight.bold, color: Colors.grey),
              ),
              Row(
                children: [
                  DropdownButton<ReportPeriod>(
                    value: _selectedPeriod,
                    underline: const SizedBox(),
                    icon: const Icon(Icons.keyboard_arrow_down, color: AppDesign.primaryIndigo),
                    style: const TextStyle(
                      color: AppDesign.primaryIndigo,
                      fontWeight: FontWeight.w600,
                      fontSize: 15,
                    ),
                    items: const [
                      DropdownMenuItem(value: ReportPeriod.currentMonth, child: TrText('Mois en cours')),
                      DropdownMenuItem(value: ReportPeriod.lastMonth, child: TrText('Dernier mois')),
                      DropdownMenuItem(value: ReportPeriod.quarter, child: TrText('Trimestre')),
                      DropdownMenuItem(value: ReportPeriod.year, child: TrText('Année')),
                      DropdownMenuItem(value: ReportPeriod.custom, child: TrText('Personnalisé')),
                    ],
                    onChanged: _onPeriodChanged,
                  ),
                  if (_selectedPeriod == ReportPeriod.custom) ...[
                    const SizedBox(width: 4),
                    IconButton(
                      icon: const Icon(Icons.edit_calendar, color: AppDesign.primaryIndigo, size: 20),
                      onPressed: _selectCustomDateRange,
                      tooltip: t('Modifier les dates'),
                      padding: EdgeInsets.zero,
                      constraints: const BoxConstraints(),
                    ),
                  ],
                ],
              ),
            ],
          ),
          if (_selectedPeriod == ReportPeriod.custom)
            Padding(
              padding: const EdgeInsets.only(top: 8),
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                decoration: BoxDecoration(
                  color: AppDesign.primaryIndigo.withValues(alpha: 0.05),
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: AppDesign.primaryIndigo.withValues(alpha: 0.1)),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Icon(Icons.date_range, size: 14, color: AppDesign.primaryIndigo),
                    const SizedBox(width: 8),
                    TrText(
                      dateRangeString,
                      style: const TextStyle(
                        fontSize: 13,
                        color: AppDesign.primaryIndigo,
                        fontWeight: FontWeight.w600,
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

  Widget _buildTrendChart() {
    // Préparation des données pour le graphique
    // On groupe par jour et on calcule le solde cumulé
    final Map<int, double> dailyBalance = {};
    final sortedTransactions = List<app_transaction.Transaction>.from(_transactions)
      ..sort((a, b) => a.date.compareTo(b.date));

    double runningBalance = 0;
    
    // Initialiser tous les jours de la période à 0 (ou solde précédent si on l'avait)
    final range = _getDateRange();
    final daysCount = range.end.difference(range.start).inDays + 1;
    
    // Pour simplifier, on montre l'évolution du cashflow sur la période (pas le solde total du compte)
    for (int i = 0; i < daysCount; i++) {
      final day = range.start.add(Duration(days: i));
      // Trouver les transactions de ce jour
      final dayTransactions = sortedTransactions.where((t) => 
        t.date.year == day.year && t.date.month == day.month && t.date.day == day.day
      );
      
      for (var t in dayTransactions) {
        if (t.type == app_transaction.TransactionType.income) runningBalance += t.amount;
        if (t.type == app_transaction.TransactionType.expense) runningBalance -= t.amount;
      }
      
      dailyBalance[i] = runningBalance;
    }

    final spots = dailyBalance.entries
        .map((e) => FlSpot(e.key.toDouble(), e.value))
        .toList();

    return Container(
      height: 300,
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: AppDesign.mediumShadow,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const TrText(
            'Évolution du Cashflow',
            style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 20),
          Expanded(
            child: spots.isEmpty
                ? const Center(child: TrText('Pas assez de données'))
                : LineChart(
                    LineChartData(
                      gridData: FlGridData(show: false),
                      titlesData: FlTitlesData(
                        leftTitles: AxisTitles(sideTitles: SideTitles(showTitles: false)),
                        topTitles: AxisTitles(sideTitles: SideTitles(showTitles: false)),
                        rightTitles: AxisTitles(sideTitles: SideTitles(showTitles: false)),
                        bottomTitles: AxisTitles(
                          sideTitles: SideTitles(
                            showTitles: true,
                            getTitlesWidget: (value, meta) {
                              if (value % 5 != 0) return const SizedBox.shrink();
                              final date = range.start.add(Duration(days: value.toInt()));
                              return Padding(
                                padding: const EdgeInsets.only(top: 8.0),
                                child: TrText(
                                  DateFormat('dd/MM').format(date),
                                  style: const TextStyle(fontSize: 10, color: Colors.grey),
                                ),
                              );
                            },
                          ),
                        ),
                      ),
                      borderData: FlBorderData(show: false),
                      lineBarsData: [
                        LineChartBarData(
                          spots: spots,
                          isCurved: true,
                          color: AppDesign.primaryIndigo,
                          barWidth: 3,
                          isStrokeCapRound: true,
                          dotData: FlDotData(show: false),
                          belowBarData: BarAreaData(
                            show: true,
                            color: AppDesign.primaryIndigo.withValues(alpha: 0.1),
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

  // Les blocs "Top Dépenses" et "Détail par Catégorie" ont été supprimés selon demande.
}
