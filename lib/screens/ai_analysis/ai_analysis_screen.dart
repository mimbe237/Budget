import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

import '../../constants/app_design.dart';
import '../../models/budget_plan.dart';
import '../../models/goal.dart';
import '../../models/projection_result.dart';
import '../../models/transaction.dart' as app_transaction;
import '../../services/firestore_service.dart';
import '../../services/mock_data_service.dart';
import '../../widgets/revolutionary_logo.dart';
import '../transactions/transactions_list_screen.dart';
import 'package:budget/l10n/app_localizations.dart';
import 'package:budget/services/currency_service.dart';

/// Écran d'analyse intelligente des finances personnelles
/// Fournit des insights, détection d'anomalies et recommandations
class AIAnalysisScreen extends StatefulWidget {
  const AIAnalysisScreen({super.key});

  @override
  State<AIAnalysisScreen> createState() => _AIAnalysisScreenState();
}

class _AIAnalysisScreenState extends State<AIAnalysisScreen> {
  final FirestoreService _firestoreService = FirestoreService();
  final MockDataService _mockDataService = MockDataService();
  late final CurrencyService _currencyService;

  bool _isLoading = true;
  bool _usingMockData = false;
  String? _loadError;
  List<app_transaction.Transaction> _transactions = [];
  BudgetPlan? _currentBudget;
  List<Goal> _goals = [];
  ProjectionResult? _projectionResult;

  // Résultats d'analyse
  List<String> _anomalies = [];
  List<Map<String, dynamic>> _recommendations = [];

  @override
  void initState() {
    super.initState();
    _currencyService = CurrencyService();
    _currencyService.addListener(_onCurrencyChanged);
    _loadDataAndAnalyze();
  }

  /// Charge les données et lance les analyses
  Future<void> _loadDataAndAnalyze() async {
    setState(() {
      _isLoading = true;
      _loadError = null;
    });

    try {
      final userId = _firestoreService.currentUserId;
      final now = DateTime.now();
      final startWindow = DateTime(now.year, now.month - 2, 1);

      if (userId != null) {
        _transactions = await _firestoreService.getTransactions(
          userId,
          startDate: startWindow,
          endDate: now,
          limit: 800,
        );
        _goals = await _firestoreService.getGoals(userId);
        final budgetMap = await _firestoreService.getCurrentBudgetPlan(userId);
        _currentBudget = _mapBudgetPlanFromFirestore(userId, budgetMap);
        _projectionResult =
            await _firestoreService.predictEndOfMonthBalance(userId: userId);
        _usingMockData = false;
      } else {
        await _hydrateFromMock();
      }

      _anomalies = _detectAnomalies();
      _recommendations = _generateRecommendations();
    } catch (e) {
      _loadError = e.toString();
      await _hydrateFromMock();
      _anomalies = _detectAnomalies();
      _recommendations = _generateRecommendations();
    }

    if (mounted) {
      setState(() {
        _isLoading = false;
      });
    }
  }

  void _onCurrencyChanged() {
    if (!mounted || _isLoading) return;
    setState(() {
      _anomalies = _detectAnomalies();
      _recommendations = _generateRecommendations();
    });
  }

  String _formatAmount(double amount) {
    return _currencyService.formatAmount(amount);
  }

  Future<void> _hydrateFromMock() async {
    _transactions = await _mockDataService.getTransactions();
    _currentBudget = await _mockDataService.getCurrentBudgetPlan();
    _goals = await _mockDataService.getGoals();
    _projectionResult = await _mockDataService.getMockProjection();
    _usingMockData = true;
  }

  BudgetPlan? _mapBudgetPlanFromFirestore(
    String userId,
    Map<String, dynamic>? data,
  ) {
    if (data == null) return null;

    final allocations = <String, double>{};
    final rawAllocations =
        data['categoryAllocations'] as Map<String, dynamic>? ?? {};
    rawAllocations.forEach((key, value) {
      allocations[key] = (value as num).toDouble();
    });

    final totalIncome =
        (data['totalBudget'] ?? data['totalIncome'] ?? 0).toDouble();

    return BudgetPlan(
      budgetPlanId:
          data['id'] ?? 'budget_${DateTime.now().millisecondsSinceEpoch}',
      userId: userId,
      totalIncome: totalIncome,
      categoryAllocations: allocations,
      createdAt: DateTime.now(),
      updatedAt: DateTime.now(),
    );
  }

  // =========================================================================
  // ANALYSE 1 : DÉTECTION D'ANOMALIES
  // =========================================================================

  /// Détecte les dépenses inhabituelles par rapport aux tendances historiques
  List<String> _detectAnomalies() {
    final List<String> anomalies = [];
    final now = DateTime.now();

    // Transactions du mois en cours
    final currentMonthTransactions = _transactions.where((t) =>
        t.date.month == now.month &&
        t.date.year == now.year &&
        t.type == app_transaction.TransactionType.expense).toList();

    // Transactions des 3 derniers mois (hors mois actuel)
    final lastThreeMonths = _transactions.where((t) {
      final monthsAgo = (now.year - t.date.year) * 12 + (now.month - t.date.month);
      return monthsAgo > 0 && monthsAgo <= 3 && t.type == app_transaction.TransactionType.expense;
    }).toList();

    if (lastThreeMonths.isEmpty) {
      anomalies.add('Pas assez d\'historique pour détecter des anomalies.');
    } else {
      // Analyser par catégorie
      final currentSpendingByCategory = <String, double>{};
      for (var t in currentMonthTransactions) {
        final key = t.categoryId ?? 'Inconnu';
        currentSpendingByCategory[key] =
            (currentSpendingByCategory[key] ?? 0) + t.amount;
      }

      final historicalSpendingByCategory = <String, List<double>>{};
      for (var t in lastThreeMonths) {
        final key = t.categoryId ?? 'Inconnu';
        historicalSpendingByCategory.putIfAbsent(key, () => []);
        historicalSpendingByCategory[key]!.add(t.amount);
      }

      // Comparer les catégories
      currentSpendingByCategory.forEach((category, currentTotal) {
        if (historicalSpendingByCategory.containsKey(category)) {
          final historicalAmounts = historicalSpendingByCategory[category]!;
          final avgHistorical = historicalAmounts.reduce((a, b) => a + b) / historicalAmounts.length;

          if (avgHistorical > 0) {
            final percentDiff = ((currentTotal - avgHistorical) / avgHistorical * 100).round();

            if (percentDiff > 30) {
              anomalies.add(
                '⚠️ Votre budget "$category" est ${percentDiff}% supérieur à la moyenne des 3 derniers mois.'
              );
            } else if (percentDiff < -30) {
              anomalies.add(
                '✅ Excellente nouvelle ! Vos dépenses "$category" sont ${percentDiff.abs()}% inférieures à la moyenne.'
              );
            }
          }
        }
      });

      // Détecter les grosses transactions inhabituelles
      final currentMonthAmounts = currentMonthTransactions.map((t) => t.amount).toList();
      if (currentMonthAmounts.isNotEmpty) {
        currentMonthAmounts.sort();
        final maxCurrent = currentMonthAmounts.last;

        final historicalAmounts = lastThreeMonths.map((t) => t.amount).toList();
        historicalAmounts.sort();
        final avgMax = historicalAmounts.isEmpty ? 0.0 : historicalAmounts.last;

        if (maxCurrent > avgMax * 2) {
          anomalies.add(
            '🚨 Transaction inhabituelle détectée : ${_formatAmount(maxCurrent)} (2x supérieure à vos dépenses habituelles).'
          );
        }
      }
    }

    if (_projectionResult != null &&
        _projectionResult!.exceptionalTransactions.isNotEmpty) {
      for (final tx in _projectionResult!.exceptionalTransactions) {
        anomalies.add(
          '🚨 Dépense exceptionnelle détectée : ${tx.description ?? 'Transaction'} '
          '(${_formatAmount(tx.amount)}) le ${DateFormat('dd/MM').format(tx.date)}.',
        );
      }
    }

    // Si aucune anomalie
    if (anomalies.isEmpty) {
      anomalies.add('✅ Aucune anomalie détectée. Vos dépenses suivent vos habitudes normales.');
    }

    return anomalies;
  }

  // =========================================================================
  // ANALYSE 3 : RECOMMANDATIONS
  // =========================================================================

  /// Génère des recommandations personnalisées basées sur les données
  List<Map<String, dynamic>> _generateRecommendations() {
    final List<Map<String, dynamic>> recommendations = [];
    final now = DateTime.now();

    if (_projectionResult != null) {
      final projected = _projectionResult!;
      if (projected.estimatedEndOfMonthBalance < 0) {
        recommendations.add({
          'icon': '⚠️',
          'title': 'Risque de découvert',
          'description':
              'Ajustez vos dépenses variables : le solde projeté de fin de mois est '
              '${_formatAmount(projected.estimatedEndOfMonthBalance)}.',
          'type': 'danger',
        });
      } else {
        recommendations.add({
          'icon': '✅',
          'title': 'Projection saine',
          'description':
              'Le solde projeté de fin de mois reste positif. Pensez à renforcer votre épargne.',
          'type': 'success',
        });
      }

      if (projected.upcomingFixedExpensesTotal > 0) {
        recommendations.add({
          'icon': '📅',
          'title': 'Dépenses fixes à venir',
          'description':
              'Prévoir ${_formatAmount(projected.upcomingFixedExpensesTotal)} pour vos charges fixes restantes.',
          'type': 'info',
        });
      }
    }

    // 1. Analyser les objectifs
    for (var goal in _goals) {
      final progress = goal.targetAmount > 0
          ? (goal.currentAmount / goal.targetAmount * 100).round()
          : 0;

      if (progress >= 100) {
        recommendations.add({
          'icon': '🎉',
          'title': 'Objectif Atteint !',
          'description': 'Félicitations ! Vous avez atteint 100% de votre objectif "${goal.name}".',
          'type': 'success',
        });
      } else if (progress >= 80 && progress < 100) {
        recommendations.add({
          'icon': '🚀',
          'title': 'Presque Arrivé !',
          'description': 'Plus que ${100 - progress}% pour atteindre "${goal.name}". Continuez !',
          'type': 'info',
        });
      } else if (progress < 30 && goal.deadline != null) {
        final daysRemaining = goal.deadline!.difference(now).inDays;
        if (daysRemaining > 0 && daysRemaining < 90) {
          final amountNeeded = goal.targetAmount - goal.currentAmount;
          final monthlyRequired = amountNeeded / (daysRemaining / 30);
          recommendations.add({
            'icon': '⏰',
            'title': 'Accélérez vos Économies',
            'description':
                'Pour atteindre "${goal.name}", économisez ${_formatAmount(monthlyRequired)}/mois.',
            'type': 'warning',
          });
        }
      }
    }

    // 2. Analyser le budget
    if (_currentBudget != null) {
      final currentMonthTransactions = _transactions.where((t) =>
          t.date.month == now.month &&
          t.date.year == now.year &&
          t.type == app_transaction.TransactionType.expense).toList();

      final spendingByCategory = <String, double>{};
      for (var t in currentMonthTransactions) {
        final key = t.categoryId ?? 'Inconnu';
        spendingByCategory[key] = (spendingByCategory[key] ?? 0) + t.amount;
      }

      _currentBudget!.categoryAllocations.forEach((category, allocatedPercent) {
        final percent = allocatedPercent > 1 ? allocatedPercent / 100 : allocatedPercent;
        final allocatedAmount = _currentBudget!.totalIncome * percent;
        final spent = spendingByCategory[category] ?? 0.0;
        final percentUsed = allocatedAmount > 0 ? (spent / allocatedAmount * 100).round() : 0;

        if (percentUsed > 100) {
          recommendations.add({
            'icon': '🔴',
            'title': 'Budget Dépassé',
            'description': 'Vous avez dépassé votre budget "$category" de ${percentUsed - 100}%.',
            'type': 'danger',
          });
        } else if (percentUsed > 80 && percentUsed <= 100) {
          recommendations.add({
            'icon': '⚠️',
            'title': 'Attention au Budget',
            'description': 'Vous avez utilisé $percentUsed% de votre budget "$category".',
            'type': 'warning',
          });
        }
      });
    }

    // 3. Recommandations générales basées sur les tendances
    final currentMonthExpenses = _transactions
        .where((t) =>
            t.date.month == now.month &&
            t.date.year == now.year &&
            t.type == app_transaction.TransactionType.expense)
        .fold(0.0, (sum, t) => sum + t.amount);

    final lastMonthExpenses = _transactions
        .where((t) =>
            t.date.month == now.month - 1 &&
            t.date.year == now.year &&
            t.type == app_transaction.TransactionType.expense)
        .fold(0.0, (sum, t) => sum + t.amount);

    if (lastMonthExpenses > 0) {
      final changePct = ((currentMonthExpenses - lastMonthExpenses) / lastMonthExpenses * 100).round();

      if (changePct > 20) {
        recommendations.add({
          'icon': '📈',
          'title': 'Dépenses en Hausse',
          'description': 'Vos dépenses ont augmenté de $changePct% par rapport au mois dernier.',
          'type': 'warning',
        });
      } else if (changePct < -20) {
        recommendations.add({
          'icon': '💰',
          'title': 'Belles Économies',
          'description': 'Vous avez réduit vos dépenses de ${changePct.abs()}% ce mois-ci !',
          'type': 'success',
        });
      }
    }

    // 4. Recommandation générique si aucune
    if (recommendations.isEmpty) {
      recommendations.add({
        'icon': '💡',
        'title': 'Tout va Bien',
        'description': 'Votre gestion financière est équilibrée. Continuez comme ça !',
        'type': 'info',
      });
    }

    return recommendations;
  }

  // =========================================================================
  // UI
  // =========================================================================

  @override
  void dispose() {
    _currencyService.removeListener(_onCurrencyChanged);
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppDesign.backgroundGrey,
      appBar: AppBar(
        title: const TrText(
          'Analyses IA',
          style: TextStyle(
            fontWeight: FontWeight.bold,
            color: AppDesign.primaryIndigo,
          ),
        ),
        backgroundColor: Colors.white,
        elevation: 0,
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh, color: AppDesign.primaryIndigo),
            onPressed: _loadDataAndAnalyze,
          ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: _loadDataAndAnalyze,
              child: ListView(
                padding: const EdgeInsets.all(16),
                children: [
                  // Titre d'accueil
                  _buildWelcomeHeader(),
                  if (_usingMockData || _loadError != null) ...[
                    const SizedBox(height: 12),
                    _buildDataSourceBanner(),
                  ],
                  const SizedBox(height: 24),

                  // Section 1 : Détection d'anomalies
                  _buildSectionTitle('🔍 Détection d\'Anomalies', 'Analyse Rétrospective'),
                  const SizedBox(height: 12),
                  ..._anomalies.map((anomaly) => _buildAnomalyCard(anomaly)),
                  const SizedBox(height: 12),
                  _buildExceptionalTransactionsList(),
                  const SizedBox(height: 24),

                  // Section 2 : Projection future
                  _buildSectionTitle('🔮 Projection Future', 'Analyse Prédictive'),
                  const SizedBox(height: 12),
                  _buildPredictionCard(),
                  const SizedBox(height: 24),

                  // Section 3 : Recommandations
                  _buildSectionTitle('💡 Recommandations', 'Optimisation du Budget'),
                  const SizedBox(height: 12),
                  ..._recommendations.map((rec) => _buildRecommendationCard(rec)),
                  const SizedBox(height: 24),
                ],
              ),
            ),
    );
  }

  /// Header d'accueil engageant
  Widget _buildWelcomeHeader() {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [AppDesign.primaryIndigo, AppDesign.primaryPurple],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: AppDesign.primaryIndigo.withValues(alpha: 0.3),
            blurRadius: 12,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: Colors.white.withValues(alpha: 0.2),
              borderRadius: BorderRadius.circular(12),
            ),
            child: const Icon(
              Icons.smart_toy,
              color: Colors.white,
              size: 32,
            ),
          ),
          const SizedBox(width: 16),
          const Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                TrText(
                  'Conseils Financiers',
                  style: TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.bold,
                    color: Colors.white,
                  ),
                ),
                SizedBox(height: 4),
                TrText(
                  'Analyse intelligente de vos finances',
                  style: TextStyle(
                    fontSize: 14,
                    color: Colors.white70,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildDataSourceBanner() {
    final Color badgeColor = _usingMockData ? Colors.orange : AppDesign.primaryIndigo;
    final String message = _usingMockData
        ? 'Mode offline : données mockées utilisées pour la projection.'
        : 'Analyse réalisée avec vos données synchronisées.';
    final String? error = _loadError;

    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: badgeColor.withValues(alpha: 0.08),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: badgeColor.withValues(alpha: 0.4)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(
                _usingMockData ? Icons.cloud_off : Icons.cloud_done,
                color: badgeColor,
              ),
              const SizedBox(width: 8),
              Expanded(
                child: TrText(
                  message,
                  style: TextStyle(
                    color: badgeColor.withValues(alpha: 0.9),
                    fontSize: 13,
                  ),
                ),
              ),
            ],
          ),
          if (error != null) ...[
            const SizedBox(height: 6),
            TrText(
              'Dernière erreur : $error',
              style: const TextStyle(color: Colors.orange, fontSize: 11),
            ),
          ],
        ],
      ),
    );
  }

  /// Titre de section
  Widget _buildSectionTitle(String title, String subtitle) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        TrText(
          title,
          style: const TextStyle(
            fontSize: 20,
            fontWeight: FontWeight.bold,
            color: AppDesign.primaryIndigo,
          ),
        ),
        const SizedBox(height: 4),
        TrText(
          subtitle,
          style: TextStyle(
            fontSize: 13,
            color: Colors.grey[600],
          ),
        ),
      ],
    );
  }

  /// Carte d'anomalie
  Widget _buildAnomalyCard(String anomaly) {
    // Déterminer le type d'anomalie
    bool isWarning = anomaly.contains('⚠️') || anomaly.contains('🚨');
    bool isGood = anomaly.contains('✅') || anomaly.contains('Excellente');

    Color bgColor = isWarning
        ? AppDesign.expenseColor.withValues(alpha: 0.1)
        : isGood
            ? AppDesign.incomeColor.withValues(alpha: 0.1)
            : Colors.grey[100]!;

    Color borderColor = isWarning
        ? AppDesign.expenseColor
        : isGood
            ? AppDesign.incomeColor
            : Colors.grey[300]!;

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: bgColor,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: borderColor, width: 2),
      ),
      child: Row(
        children: [
          Icon(
            isWarning
                ? Icons.warning_amber_rounded
                : isGood
                    ? Icons.check_circle
                    : Icons.info,
            color: borderColor,
            size: 28,
          ),
          const SizedBox(width: 12),
          Expanded(
            child: TrText(
              anomaly,
              style: TextStyle(
                fontSize: 14,
                color: Colors.grey[800],
                height: 1.4,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildExceptionalTransactionsList() {
    final projection = _projectionResult;
    if (projection == null) {
      return const SizedBox.shrink();
    }

    if (projection.exceptionalTransactions.isEmpty) {
      return Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: Colors.grey[100],
          borderRadius: BorderRadius.circular(10),
        ),
        child: const TrText(
          'Aucune transaction exceptionnelle détectée pour le moment.',
          style: TextStyle(color: Colors.grey),
        ),
      );
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: projection.exceptionalTransactions.map((tx) {
        return Container(
          margin: const EdgeInsets.only(bottom: 10),
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: AppDesign.expenseColor.withValues(alpha: 0.05),
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: AppDesign.expenseColor.withValues(alpha: 0.3)),
          ),
          child: Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: AppDesign.expenseColor.withValues(alpha: 0.15),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: const Icon(Icons.error_outline, color: AppDesign.expenseColor),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    TrText(
                      tx.description ?? 'Transaction',
                      style: const TextStyle(
                        fontWeight: FontWeight.w600,
                        color: Colors.black87,
                      ),
                    ),
                    const SizedBox(height: 4),
                    TrText(
                      DateFormat('dd MMM').format(tx.date),
                      style: const TextStyle(color: Colors.grey, fontSize: 12),
                    ),
                  ],
                ),
              ),
              TrText(
                _formatAmount(tx.amount),
                style: const TextStyle(
                  color: AppDesign.expenseColor,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ],
          ),
        );
      }).toList(),
    );
  }

  /// Carte de prédiction du solde
  Widget _buildPredictionCard() {
    if (_projectionResult == null) {
      return Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: Colors.grey[300]!),
        ),
        child: const Center(
          child: TrText('Projection indisponible. Rafraîchissez pour relancer le calcul.'),
        ),
      );
    }

    final projection = _projectionResult!;
    final isPositive = projection.estimatedEndOfMonthBalance >= 0;
    final color = isPositive ? AppDesign.incomeColor : AppDesign.expenseColor;
    final icon = isPositive ? Icons.trending_up : Icons.trending_down;

    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: color, width: 2),
        boxShadow: [
          BoxShadow(
            color: color.withValues(alpha: 0.15),
            blurRadius: 12,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: color.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Icon(icon, color: color, size: 28),
              ),
              const SizedBox(width: 12),
              const Expanded(
                child: TrText(
                  'Solde de Fin de Mois Estimé',
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w600,
                    color: AppDesign.primaryIndigo,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 20),
          TrText(
            _formatAmount(projection.estimatedEndOfMonthBalance),
            style: TextStyle(
              fontSize: 42,
              fontWeight: FontWeight.bold,
              color: color,
              letterSpacing: -1,
            ),
          ),
          const SizedBox(height: 8),
          Column(
            children: [
              _buildProjectionDetail(
                label: t('Dépenses fixes restantes'),
                value: projection.upcomingFixedExpensesTotal,
                icon: Icons.calendar_month,
                color: AppDesign.expenseColor,
              ),
              const SizedBox(height: 8),
              _buildProjectionDetail(
                label: t('Transactions exceptionnelles surveillées'),
                value: projection.exceptionalTransactions.length.toDouble(),
                icon: Icons.report,
                color: AppDesign.primaryIndigo,
                isCount: true,
              ),
            ],
          ),
          const SizedBox(height: 12),
          TrText(
            isPositive
                ? 'Votre solde devrait rester positif en fin de mois ✅'
                : 'Attention : risque de solde négatif ⚠️',
            style: TextStyle(
              fontSize: 13,
              color: Colors.grey[700],
            ),
            textAlign: TextAlign.center,
          ),
          if (_usingMockData) ...[
            const SizedBox(height: 8),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
              decoration: BoxDecoration(
                color: Colors.orange.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(8),
              ),
              child: const TrText(
                'Projection basée sur des données mockées (offline)',
                style: TextStyle(color: Colors.orange, fontSize: 11),
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildProjectionDetail({
    required String label,
    required double value,
    required IconData icon,
    required Color color,
    bool isCount = false,
  }) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        Icon(icon, color: color, size: 18),
        const SizedBox(width: 8),
        Flexible(
          child: TrText(
            label,
            style: const TextStyle(fontSize: 13, color: Colors.grey),
            overflow: TextOverflow.ellipsis,
          ),
        ),
        const SizedBox(width: 8),
        TrText(
          isCount ? value.toInt().toString() : _formatAmount(value),
          style: TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.bold,
            color: color,
          ),
        ),
      ],
    );
  }

  /// Carte de recommandation
  Widget _buildRecommendationCard(Map<String, dynamic> recommendation) {
    final type = recommendation['type'] as String;
    Color cardColor;
    Color iconBgColor;

    switch (type) {
      case 'success':
        cardColor = AppDesign.incomeColor;
        iconBgColor = AppDesign.incomeColor.withValues(alpha: 0.1);
        break;
      case 'danger':
        cardColor = AppDesign.expenseColor;
        iconBgColor = AppDesign.expenseColor.withValues(alpha: 0.1);
        break;
      case 'warning':
        cardColor = const Color(0xFFFFA726);
        iconBgColor = const Color(0xFFFFA726).withValues(alpha: 0.1);
        break;
      default:
        cardColor = AppDesign.primaryIndigo;
        iconBgColor = AppDesign.primaryIndigo.withValues(alpha: 0.1);
    }

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: cardColor.withValues(alpha: 0.3), width: 1.5),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.05),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: iconBgColor,
              borderRadius: BorderRadius.circular(10),
            ),
            child: TrText(
              recommendation['icon'],
              style: const TextStyle(fontSize: 24),
            ),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                TrText(
                  recommendation['title'],
                  style: TextStyle(
                    fontSize: 15,
                    fontWeight: FontWeight.bold,
                    color: cardColor,
                  ),
                ),
                const SizedBox(height: 6),
                TrText(
                  recommendation['description'],
                  style: TextStyle(
                    fontSize: 13,
                    color: Colors.grey[700],
                    height: 1.4,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
