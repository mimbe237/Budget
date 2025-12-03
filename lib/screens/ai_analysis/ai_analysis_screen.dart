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
  List<Map<String, dynamic>> _anomalies = [];
  List<Map<String, dynamic>> _recommendations = [];
  
  // Score de santé financière
  double _healthScore = 0.0;
  Map<String, dynamic> _healthDetails = {};
  
  // Gamification
  List<Map<String, dynamic>> _badges = [];
  Map<String, dynamic>? _currentChallenge;
  List<Map<String, dynamic>> _achievements = [];

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
      _calculateHealthScore();
      _calculateBadgesAndAchievements();
      _generateCurrentChallenge();
    } catch (e) {
      _loadError = e.toString();
      await _hydrateFromMock();
      _anomalies = _detectAnomalies();
      _recommendations = _generateRecommendations();
      _calculateHealthScore();
      _calculateBadgesAndAchievements();
      _generateCurrentChallenge();
    }

    if (mounted) {
      setState(() {
        _isLoading = false;
      });
    }
  void _onCurrencyChanged() {
    if (!mounted || _isLoading) return;
    setState(() {
      _anomalies = _detectAnomalies();
      _recommendations = _generateRecommendations();
      _calculateHealthScore();
      _calculateBadgesAndAchievements();
      _generateCurrentChallenge();
    });
  }   _recommendations = _generateRecommendations();
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
  /// Retourne une Map enrichie avec contexte et analyses détaillées
  List<Map<String, dynamic>> _detectAnomalies() {
    final List<Map<String, dynamic>> anomalies = [];
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
      anomalies.add({
        'type': 'info',
        'icon': '📊',
        'title': 'Historique limité',
        'description': 'Continuez à utiliser l\'app pour obtenir des analyses plus précises.',
        'advice': 'Plus vous enregistrez de transactions, plus nos analyses seront pertinentes.',
        'impact': 'neutral',
      });
      return anomalies;
    }

    // Analyser par catégorie avec contexte enrichi
    final currentSpendingByCategory = <String, double>{};
    final currentTxCountByCategory = <String, int>{};
    
    for (var t in currentMonthTransactions) {
      final key = t.category ?? t.categoryId ?? 'Inconnu';
      currentSpendingByCategory[key] = (currentSpendingByCategory[key] ?? 0) + t.amount;
      currentTxCountByCategory[key] = (currentTxCountByCategory[key] ?? 0) + 1;
    }

    final historicalSpendingByCategory = <String, List<double>>{};
    for (var t in lastThreeMonths) {
      final key = t.category ?? t.categoryId ?? 'Inconnu';
      historicalSpendingByCategory.putIfAbsent(key, () => []);
      historicalSpendingByCategory[key]!.add(t.amount);
    }

    // Analyser les transactions exceptionnelles en détail
    if (_projectionResult != null && _projectionResult!.exceptionalTransactions.isNotEmpty) {
      for (final tx in _projectionResult!.exceptionalTransactions) {
        final category = tx.category ?? 'Dépense';
        final currentCatTotal = currentSpendingByCategory[category] ?? 0;
        final avgHistorical = historicalSpendingByCategory[category]?.isEmpty ?? true
            ? 0.0
            : historicalSpendingByCategory[category]!.reduce((a, b) => a + b) / 
              historicalSpendingByCategory[category]!.length;
        
        final percentOfCategory = currentCatTotal > 0 ? (tx.amount / currentCatTotal * 100).round() : 0;
        final vsAverage = avgHistorical > 0 ? ((tx.amount / avgHistorical - 1) * 100).round() : 0;
        
        // Budget total du mois
        final totalMonthBudget = _currentBudget?.totalIncome ?? 0;
        final percentOfBudget = totalMonthBudget > 0 ? (tx.amount / totalMonthBudget * 100).round() : 0;
        
        anomalies.add({
          'type': 'exceptional',
          'icon': '🚨',
          'title': tx.description ?? category,
          'amount': tx.amount,
          'date': tx.date,
          'category': category,
          'description': '${_formatAmount(tx.amount)} le ${DateFormat('dd/MM/yyyy').format(tx.date)}',
          'analysis': vsAverage > 0 
              ? '+$vsAverage% vs votre moyenne habituelle pour "$category"'
              : 'Dépense inhabituelle dans cette catégorie',
          'impact': percentOfBudget >= 20 ? 'high' : percentOfBudget >= 10 ? 'medium' : 'low',
          'impactText': 'Représente $percentOfBudget% de votre budget mensuel',
          'advice': _getAdviceForException(tx.amount, category, percentOfBudget, totalMonthBudget),
          'contextStats': {
            'percentOfCategory': percentOfCategory,
            'percentOfBudget': percentOfBudget,
            'vsAverage': vsAverage,
          },
        });
      }
    }

    // Comparer les catégories avec analyse détaillée
    currentSpendingByCategory.forEach((category, currentTotal) {
      if (historicalSpendingByCategory.containsKey(category)) {
        final historicalAmounts = historicalSpendingByCategory[category]!;
        final avgHistorical = historicalAmounts.reduce((a, b) => a + b) / historicalAmounts.length;
        final txCount = currentTxCountByCategory[category] ?? 0;

        if (avgHistorical > 0) {
          final percentDiff = ((currentTotal - avgHistorical) / avgHistorical * 100).round();
          final diff = currentTotal - avgHistorical;

          if (percentDiff > 50) {
            anomalies.add({
              'type': 'warning',
              'icon': '⚠️',
              'title': 'Hausse significative : $category',
              'amount': currentTotal,
              'description': '+$percentDiff% vs moyenne (${_formatAmount(avgHistorical)})',
              'analysis': '$txCount transaction(s) ce mois pour un total de ${_formatAmount(currentTotal)}',
              'impact': percentDiff >= 100 ? 'high' : 'medium',
              'impactText': 'Dépassement de ${_formatAmount(diff)}',
              'advice': _getAdviceForIncrease(category, percentDiff, currentTotal, avgHistorical),
              'contextStats': {
                'current': currentTotal,
                'average': avgHistorical,
                'txCount': txCount,
                'percentDiff': percentDiff,
              },
            });
          } else if (percentDiff < -40) {
            anomalies.add({
              'type': 'success',
              'icon': '✅',
              'title': 'Excellente gestion : $category',
              'amount': currentTotal,
              'description': '${percentDiff.abs()}% d\'économies vs moyenne',
              'analysis': 'Vous avez économisé ${_formatAmount(avgHistorical - currentTotal)} ce mois',
              'impact': 'positive',
              'impactText': 'Économie de ${_formatAmount(diff.abs())}',
              'advice': 'Continuez comme ça ! Ces économies peuvent être transférées vers vos objectifs d\'épargne.',
              'contextStats': {
                'current': currentTotal,
                'average': avgHistorical,
                'saved': avgHistorical - currentTotal,
                'percentDiff': percentDiff,
              },
            });
          }
        }
      }
    });

    // Si aucune anomalie significative
    if (anomalies.isEmpty) {
      final totalCurrentMonth = currentMonthTransactions.fold<double>(0, (sum, t) => sum + t.amount);
      final totalLastMonths = lastThreeMonths.fold<double>(0, (sum, t) => sum + t.amount) / 3;
      final consistency = totalLastMonths > 0 ? (totalCurrentMonth / totalLastMonths * 100).round() : 100;
      
      anomalies.add({
        'type': 'success',
        'icon': '🎯',
        'title': 'Finances stables',
        'description': 'Vos dépenses suivent vos habitudes normales',
        'analysis': 'Cohérence de $consistency% avec votre moyenne mensuelle',
        'impact': 'neutral',
        'advice': 'Votre gestion est régulière. Pensez à optimiser certaines catégories pour augmenter votre épargne.',
      });
    }

    return anomalies;
  }

  String _getAdviceForException(double amount, String category, int percentOfBudget, double totalBudget) {
    if (percentOfBudget >= 30) {
      return 'Cette dépense impacte fortement votre budget. Vérifiez si elle était planifiée et ajustez votre budget si ce type de dépense est récurrent.';
    } else if (percentOfBudget >= 20) {
      return 'Dépense importante. Assurez-vous qu\'elle n\'affecte pas vos objectifs d\'épargne du mois.';
    } else if (percentOfBudget >= 10) {
      return 'Dépense notable. Surveillez le reste du mois pour rester dans votre budget "$category".';
    } else {
      return 'Dépense inhabituelle mais impact modéré sur votre budget global.';
    }
  }

  String _getAdviceForIncrease(String category, int percentDiff, double current, double avg) {
    final suggestions = {
      'Alimentation': 'Planifiez vos courses hebdomadaires et limitez les achats impulsifs. Cuisinez à la maison plus souvent.',
      'Transport': 'Envisagez le covoiturage ou les transports en commun. Regroupez vos déplacements.',
      'Loisirs': 'Identifiez les dépenses superflues et fixez-vous un budget "plaisir" hebdomadaire.',
      'Logement': 'Vérifiez les charges et comparez les fournisseurs d\'énergie pour optimiser.',
    };

    final defaultAdvice = 'Analysez les transactions de "$category" pour identifier les postes à optimiser. '
        'Fixez-vous un plafond mensuel de ${_formatAmount(avg * 1.2)} pour revenir à la normale.';

    for (final key in suggestions.keys) {
      if (category.toLowerCase().contains(key.toLowerCase())) {
        return suggestions[key]! + ' Objectif : revenir à ${_formatAmount(avg)}/mois.';
      }
    }

    return defaultAdvice;
  }

  // =========================================================================
  // ANALYSE 2 : SCORE DE SANTÉ FINANCIÈRE
  // =========================================================================

  /// Calcule un score de santé financière sur 10
  void _calculateHealthScore() {
    double score = 10.0;
    final strengths = <String>[];
    final weaknesses = <String>[];
    final now = DateTime.now();

    // Critère 1 : Solde projeté positif (2 points)
    if (_projectionResult != null) {
      if (_projectionResult!.estimatedEndOfMonthBalance >= 0) {
        strengths.add('Solde positif en fin de mois');
      } else {
        score -= 2.0;
        weaknesses.add('Risque de solde négatif');
      }
    }

    // Critère 2 : Respect du budget (3 points)
    if (_currentBudget != null) {
      final currentMonthExpenses = _transactions
          .where((t) =>
              t.date.month == now.month &&
              t.date.year == now.year &&
              t.type == app_transaction.TransactionType.expense)
          .fold<double>(0, (sum, t) => sum + t.amount);

      final budgetRatio = _currentBudget!.totalIncome > 0
          ? currentMonthExpenses / _currentBudget!.totalIncome
          : 0;

      if (budgetRatio <= 0.7) {
        strengths.add('Dépenses maîtrisées : ${(budgetRatio * 100).round()}% du budget');
      } else if (budgetRatio <= 0.9) {
        score -= 1.0;
        weaknesses.add('Budget utilisé à ${(budgetRatio * 100).round()}%');
      } else if (budgetRatio <= 1.0) {
        score -= 2.0;
        weaknesses.add('Budget presque épuisé');
      } else {
        score -= 3.0;
        weaknesses.add('Budget dépassé de ${((budgetRatio - 1) * 100).round()}%');
      }
    }

    // Critère 3 : Épargne régulière (2 points)
    final savings = _transactions
        .where((t) =>
            t.date.month == now.month &&
            t.date.year == now.year &&
            t.type == app_transaction.TransactionType.income)
        .fold<double>(0, (sum, t) => sum + t.amount);

    final expenses = _transactions
        .where((t) =>
            t.date.month == now.month &&
            t.date.year == now.year &&
            t.type == app_transaction.TransactionType.expense)
        .fold<double>(0, (sum, t) => sum + t.amount);

    if (savings > expenses) {
      final savingsRate = savings > 0 ? ((savings - expenses) / savings * 100).round() : 0;
      strengths.add('Taux d\'épargne : $savingsRate%');
    } else if (savings > 0 && expenses / savings <= 0.95) {
      strengths.add('Équilibre revenus/dépenses positif');
    } else {
      score -= 2.0;
      weaknesses.add('Dépenses = revenus, pas d\'épargne');
    }

    // Critère 4 : Progression des objectifs (1.5 points)
    if (_goals.isNotEmpty) {
      final activeGoals = _goals.where((g) => g.status == GoalStatus.active).toList();
      if (activeGoals.isNotEmpty) {
        final avgProgress = activeGoals
                .map((g) => g.targetAmount > 0 ? g.currentAmount / g.targetAmount : 0)
                .reduce((a, b) => a + b) /
            activeGoals.length;

        if (avgProgress >= 0.5) {
          strengths.add('Objectifs en bonne voie (${(avgProgress * 100).round()}%)');
        } else if (avgProgress >= 0.3) {
          score -= 0.5;
        } else {
          score -= 1.5;
          weaknesses.add('Objectifs peu avancés');
        }
      }
    }

    // Critère 5 : Pas de transactions exceptionnelles (1.5 points)
    if (_projectionResult != null &&
        _projectionResult!.exceptionalTransactions.isNotEmpty) {
      score -= 1.5;
      weaknesses.add('${_projectionResult!.exceptionalTransactions.length} dépense(s) exceptionnelle(s)');
    } else {
      strengths.add('Aucune dépense exceptionnelle');
    }

    // Limiter le score entre 0 et 10
    _healthScore = score.clamp(0.0, 10.0);
    _healthDetails = {
      'score': _healthScore,
      'strengths': strengths,
      'weaknesses': weaknesses,
      'rating': _getHealthRating(_healthScore),
    };
  }

  String _getHealthRating(double score) {
    if (score >= 9.0) return 'Excellent';
    if (score >= 7.5) return 'Très Bien';
    if (score >= 6.0) return 'Bien';
    if (score >= 4.0) return 'Moyen';
    return 'À Améliorer';
  }

  // =========================================================================
  // GAMIFICATION : BADGES ET ACHIEVEMENTS
  // =========================================================================

  /// Calcule les badges obtenus selon les performances
  void _calculateBadgesAndAchievements() {
    _badges.clear();
    _achievements.clear();
    final now = DateTime.now();

    // Badge 1 : Suivi régulier
    final txThisMonth = _transactions.where((t) => 
      t.date.month == now.month && t.date.year == now.year
    ).length;
    
    if (txThisMonth >= 20) {
      _badges.add({
        'icon': '📊',
        'name': 'Suivi Pro',
        'description': '$txThisMonth transactions ce mois',
        'color': Colors.blue,
        'level': 'gold',
      });
    } else if (txThisMonth >= 10) {
      _badges.add({
        'icon': '📊',
        'name': 'Suivi Régulier',
        'description': '$txThisMonth transactions ce mois',
        'color': Colors.blue,
        'level': 'silver',
      });
    } else if (txThisMonth >= 5) {
      _badges.add({
        'icon': '📊',
        'name': 'Premier Pas',
        'description': '$txThisMonth transactions ce mois',
        'color': Colors.blue,
        'level': 'bronze',
      });
    }

    // Badge 2 : Économe
    final currentIncome = _transactions.where((t) =>
      t.date.month == now.month && 
      t.date.year == now.year &&
      t.type == app_transaction.TransactionType.income
    ).fold<double>(0, (sum, t) => sum + t.amount);

    final currentExpense = _transactions.where((t) =>
      t.date.month == now.month && 
      t.date.year == now.year &&
      t.type == app_transaction.TransactionType.expense
    ).fold<double>(0, (sum, t) => sum + t.amount);

    if (currentIncome > 0 && currentExpense < currentIncome * 0.7) {
      _badges.add({
        'icon': '💰',
        'name': 'Super Économe',
        'description': '${((1 - currentExpense / currentIncome) * 100).round()}% d\'épargne',
        'color': AppDesign.incomeColor,
        'level': 'gold',
      });
    } else if (currentIncome > 0 && currentExpense < currentIncome * 0.85) {
      _badges.add({
        'icon': '💰',
        'name': 'Économe',
        'description': '${((1 - currentExpense / currentIncome) * 100).round()}% d\'épargne',
        'color': AppDesign.incomeColor,
        'level': 'silver',
      });
    }

    // Badge 3 : Maître du Budget
    if (_healthScore >= 8.5) {
      _badges.add({
        'icon': '👑',
        'name': 'Maître du Budget',
        'description': 'Score de santé : ${_healthScore.toStringAsFixed(1)}/10',
        'color': Colors.amber,
        'level': 'gold',
      });
    } else if (_healthScore >= 7.0) {
      _badges.add({
        'icon': '🎯',
        'name': 'Gestionnaire Avisé',
        'description': 'Score de santé : ${_healthScore.toStringAsFixed(1)}/10',
        'color': Colors.amber,
        'level': 'silver',
      });
    }

    // Badge 4 : Objectifs
    final completedGoals = _goals.where((g) => g.status == GoalStatus.completed).length;
    if (completedGoals >= 3) {
      _badges.add({
        'icon': '🏆',
        'name': 'Conquérant',
        'description': '$completedGoals objectifs atteints',
        'color': Colors.purple,
        'level': 'gold',
      });
    } else if (completedGoals >= 1) {
      _badges.add({
        'icon': '🎖️',
        'name': 'Déterminé',
        'description': '$completedGoals objectif(s) atteint(s)',
        'color': Colors.purple,
        'level': 'silver',
      });
    }

    // Badge 5 : Série de jours consécutifs (simulé)
    final daysWithTx = _transactions
      .where((t) => t.date.isAfter(now.subtract(const Duration(days: 7))))
      .map((t) => DateFormat('yyyy-MM-dd').format(t.date))
      .toSet()
      .length;

    if (daysWithTx >= 7) {
      _badges.add({
        'icon': '🔥',
        'name': 'Série de 7 jours',
        'description': 'Suivi quotidien parfait',
        'color': Colors.orange,
        'level': 'gold',
      });
    } else if (daysWithTx >= 5) {
      _badges.add({
        'icon': '🔥',
        'name': 'Série de $daysWithTx jours',
        'description': 'Bon rythme de suivi',
        'color': Colors.orange,
        'level': 'silver',
      });
    }

    // Badge 6 : Pas de découvert
    if (_projectionResult != null && _projectionResult!.estimatedEndOfMonthBalance >= 0) {
      _badges.add({
        'icon': '🛡️',
        'name': 'Solide',
        'description': 'Pas de risque de découvert',
        'color': AppDesign.incomeColor,
        'level': 'gold',
      });
    }

    // Achievements (liste des accomplissements)
    if (_badges.length >= 5) {
      _achievements.add({
        'title': 'Collectionneur',
        'description': 'Obtenez 5 badges',
        'progress': 1.0,
        'unlocked': true,
      });
    }

    if (_healthScore >= 9.0) {
      _achievements.add({
        'title': 'Perfection',
        'description': 'Atteignez un score de 9/10',
        'progress': 1.0,
        'unlocked': true,
      });
    }
  }

  /// Génère un défi du mois adapté à la situation
  void _generateCurrentChallenge() {
    final now = DateTime.now();
    final daysRemaining = DateTime(now.year, now.month + 1, 0).day - now.day;

    // Défi basé sur les faiblesses détectées
    final weaknesses = _healthDetails['weaknesses'] as List<String>? ?? [];
    
    if (weaknesses.any((w) => w.contains('Budget dépassé'))) {
      _currentChallenge = {
        'icon': '🎯',
        'title': 'Défi : Maîtriser le Budget',
        'description': 'Réduisez vos dépenses de 15% cette semaine',
        'target': 0.85,
        'current': 0.65,
        'reward': '🏆 Badge "Budget Master"',
        'daysLeft': daysRemaining,
      };
    } else if (weaknesses.any((w) => w.contains('épargne'))) {
      _currentChallenge = {
        'icon': '💰',
        'title': 'Défi : Épargne Boost',
        'description': 'Économisez 10% de plus que le mois dernier',
        'target': 1.0,
        'current': 0.45,
        'reward': '🏆 Badge "Super Épargnant"',
        'daysLeft': daysRemaining,
      };
    } else {
      _currentChallenge = {
        'icon': '📊',
        'title': 'Défi du Mois',
        'description': 'Enregistrez toutes vos transactions quotidiennement',
        'target': daysRemaining.toDouble(),
        'current': _transactions.where((t) => 
          t.date.month == now.month && t.date.year == now.year
        ).length.toDouble(),
        'reward': '🏆 Badge "Suivi Parfait"',
        'daysLeft': daysRemaining,
      };
    }
  }

  // =========================================================================
  // ANALYSE 3 : RECOMMANDATIONS
  // =========================================================================

  /// Génère des recommandations personnalisées basées sur les données
  /// Avec scoring pour identifier le Top 3
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
        'priority': 1,
      });
    }

    // Ajouter un score de priorité à toutes les recommandations
    for (var i = 0; i < recommendations.length; i++) {
      if (!recommendations[i].containsKey('priority')) {
        final type = recommendations[i]['type'] as String;
        recommendations[i]['priority'] = type == 'danger' ? 5 : type == 'warning' ? 4 : type == 'info' ? 3 : 2;
      }
    }

    // Trier par priorité décroissante
    recommendations.sort((a, b) => (b['priority'] as int).compareTo(a['priority'] as int));

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
}

/// Painter pour le motif décoratif du défi
class _PatternPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = Colors.white
      ..style = PaintingStyle.stroke
      ..strokeWidth = 2;

    // Dessiner des cercles décoratifs
    for (var i = 0; i < 5; i++) {
      canvas.drawCircle(
        Offset(size.width * (0.2 + i * 0.2), size.height * 0.3),
        20 + i * 5,
        paint,
      );
    }
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;

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
                padding: EdgeInsets.fromLTRB(
                  16,
                  16,
                  16,
                  16 + kBottomNavigationBarHeight,
                ),
                children: [
                  // Titre d'accueil
                  _buildWelcomeHeader(),
                  if (_usingMockData || _loadError != null) ...[
                    const SizedBox(height: 12),
                    _buildDataSourceBanner(),
                  ],
                  const SizedBox(height: 24),

                  // Nouveau : Dashboard de santé financière
                  _buildHealthScoreDashboard(),
                  const SizedBox(height: 24),

                  // Gamification : Badges
                  if (_badges.isNotEmpty) ...[
                    _buildSectionTitle('🏆 Vos Badges', 'Récompenses débloquées'),
                    const SizedBox(height: 12),
                    _buildBadgesGallery(),
                    const SizedBox(height: 24),
                  ],

                  // Gamification : Défi actuel
                  if (_currentChallenge != null) ...[
                    _buildSectionTitle('🎮 Défi Actif', 'Challenge du moment'),
                    const SizedBox(height: 12),
                    _buildChallengeCard(),
                    const SizedBox(height: 24),
                  ],

                  // Section 1 : Détection d'anomalies enrichies
                  _buildSectionTitle('🔍 Analyse Intelligente', 'Détection et contexte des dépenses'),
                  const SizedBox(height: 12),
                  ..._anomalies.map((anomaly) => _buildEnrichedAnomalyCard(anomaly)),
                  const SizedBox(height: 24),

                  // Section 2 : Projection future
                  _buildSectionTitle('🔮 Projection Future', 'Analyse Prédictive'),
                  const SizedBox(height: 12),
                  _buildPredictionCard(),
                  const SizedBox(height: 24),

                  // Section 3 : Top 3 Recommandations
                  _buildSectionTitle('🎯 Top 3 Actions Recommandées', 'Priorités pour améliorer votre situation'),
                  const SizedBox(height: 12),
                  _buildTop3Recommendations(),
                  const SizedBox(height: 24),

                  // Section 4 : Toutes les recommandations
                  if (_recommendations.length > 3) ...[
                    _buildSectionTitle('💡 Autres Recommandations', 'Suggestions complémentaires'),
                    const SizedBox(height: 12),
                    ..._recommendations.skip(3).map((rec) => _buildRecommendationCard(rec)),
                    const SizedBox(height: 24),
                  ],
                ],
              ),
            ),
    );
  }

  /// Dashboard de santé financière
  Widget _buildHealthScoreDashboard() {
    final score = _healthScore;
    final rating = _healthDetails['rating'] as String? ?? 'N/A';
    final strengths = _healthDetails['strengths'] as List<String>? ?? [];
    final weaknesses = _healthDetails['weaknesses'] as List<String>? ?? [];

    // Déterminer la couleur selon le score
    Color scoreColor;
    Color bgColor;
    if (score >= 7.5) {
      scoreColor = AppDesign.incomeColor;
      bgColor = AppDesign.incomeColor.withValues(alpha: 0.1);
    } else if (score >= 5.0) {
      scoreColor = Colors.orange;
      bgColor = Colors.orange.withValues(alpha: 0.1);
    } else {
      scoreColor = AppDesign.expenseColor;
      bgColor = AppDesign.expenseColor.withValues(alpha: 0.1);
    }

    return Container(
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [
            scoreColor.withValues(alpha: 0.15),
            Colors.white,
          ],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: scoreColor.withValues(alpha: 0.2),
            blurRadius: 12,
            offset: const Offset(0, 6),
          ),
        ],
      ),
      child: Column(
        children: [
          // En-tête avec score
          Container(
            padding: const EdgeInsets.all(24),
            child: Column(
              children: [
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(14),
                      decoration: BoxDecoration(
                        color: scoreColor.withValues(alpha: 0.2),
                        shape: BoxShape.circle,
                      ),
                      child: Icon(
                        Icons.health_and_safety,
                        color: scoreColor,
                        size: 32,
                      ),
                    ),
                    const SizedBox(width: 16),
                    const Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          TrText(
                            '🎯 Score de Santé Financière',
                            style: TextStyle(
                              fontSize: 18,
                              fontWeight: FontWeight.bold,
                              color: AppDesign.primaryIndigo,
                            ),
                          ),
                          SizedBox(height: 4),
                          TrText(
                            'Évaluation globale de votre situation',
                            style: TextStyle(
                              fontSize: 13,
                              color: Colors.grey,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 24),
                
                // Score circulaire
                SizedBox(
                  height: 140,
                  child: Stack(
                    alignment: Alignment.center,
                    children: [
                      SizedBox(
                        width: 140,
                        height: 140,
                        child: CircularProgressIndicator(
                          value: score / 10,
                          strokeWidth: 12,
                          backgroundColor: Colors.grey[200],
                          valueColor: AlwaysStoppedAnimation<Color>(scoreColor),
                        ),
                      ),
                      Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          TrText(
                            score.toStringAsFixed(1),
                            style: TextStyle(
                              fontSize: 48,
                              fontWeight: FontWeight.w900,
                              color: scoreColor,
                              letterSpacing: -2,
                            ),
                          ),
                          const TrText(
                            '/ 10',
                            style: TextStyle(
                              fontSize: 16,
                              color: Colors.grey,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 16),
                
                // Badge de notation
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
                  decoration: BoxDecoration(
                    color: bgColor,
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(color: scoreColor, width: 2),
                  ),
                  child: TrText(
                    rating,
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                      color: scoreColor,
                    ),
                  ),
                ),
              ],
            ),
          ),

          // Points forts et faibles
          Container(
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: const BorderRadius.only(
                bottomLeft: Radius.circular(20),
                bottomRight: Radius.circular(20),
              ),
            ),
            padding: const EdgeInsets.all(20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Points forts
                if (strengths.isNotEmpty) ...[
                  Row(
                    children: [
                      Icon(Icons.check_circle, color: AppDesign.incomeColor, size: 22),
                      const SizedBox(width: 8),
                      TrText(
                        'Points forts (${strengths.length})',
                        style: const TextStyle(
                          fontSize: 15,
                          fontWeight: FontWeight.bold,
                          color: AppDesign.incomeColor,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  ...strengths.map((strength) => Padding(
                        padding: const EdgeInsets.only(bottom: 8, left: 30),
                        child: Row(
                          children: [
                            const Text('• ', style: TextStyle(color: AppDesign.incomeColor, fontSize: 16)),
                            Expanded(
                              child: TrText(
                                strength,
                                style: TextStyle(
                                  fontSize: 13,
                                  color: Colors.grey[700],
                                ),
                              ),
                            ),
                          ],
                        ),
                      )),
                  const SizedBox(height: 16),
                ],

                // Points d'attention
                if (weaknesses.isNotEmpty) ...[
                  Row(
                    children: [
                      Icon(Icons.warning_amber_rounded, color: Colors.orange[700], size: 22),
                      const SizedBox(width: 8),
                      TrText(
                        'Points d\'attention (${weaknesses.length})',
                        style: TextStyle(
                          fontSize: 15,
                          fontWeight: FontWeight.bold,
                          color: Colors.orange[700],
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  ...weaknesses.map((weakness) => Padding(
                        padding: const EdgeInsets.only(bottom: 8, left: 30),
                        child: Row(
                          children: [
                            Text('• ', style: TextStyle(color: Colors.orange[700], fontSize: 16)),
                            Expanded(
                              child: TrText(
                                weakness,
                                style: TextStyle(
                                  fontSize: 13,
                                  color: Colors.grey[700],
                                ),
                              ),
                            ),
                          ],
                        ),
                      )),
                ],

                // Message d'encouragement
                if (strengths.isEmpty && weaknesses.isEmpty) ...[
                  Center(
                    child: TrText(
                      'Continuez à enregistrer vos transactions pour une analyse plus précise',
                      style: TextStyle(
                        fontSize: 13,
                        color: Colors.grey[600],
                        fontStyle: FontStyle.italic,
                      ),
                      textAlign: TextAlign.center,
                    ),
                  ),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }

  /// Galerie de badges
  Widget _buildBadgesGallery() {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [
            Colors.purple.withValues(alpha: 0.1),
            Colors.blue.withValues(alpha: 0.1),
          ],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.purple.withValues(alpha: 0.3)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: Colors.amber.withValues(alpha: 0.3),
                  shape: BoxShape.circle,
                ),
                child: const Icon(Icons.emoji_events, color: Colors.amber, size: 24),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    TrText(
                      '${_badges.length} badge${_badges.length > 1 ? 's' : ''} débloqué${_badges.length > 1 ? 's' : ''}',
                      style: const TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                        color: AppDesign.primaryIndigo,
                      ),
                    ),
                    const TrText(
                      'Continuez pour en gagner plus !',
                      style: TextStyle(fontSize: 12, color: Colors.grey),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          Wrap(
            spacing: 12,
            runSpacing: 12,
            children: _badges.map((badge) => _buildBadgeCard(badge)).toList(),
          ),
        ],
      ),
    );
  }

  /// Carte de badge individuelle
  Widget _buildBadgeCard(Map<String, dynamic> badge) {
    final level = badge['level'] as String;
    final color = badge['color'] as Color;
    
    Color levelColor;
    String levelLabel;
    switch (level) {
      case 'gold':
        levelColor = Colors.amber;
        levelLabel = 'OR';
        break;
      case 'silver':
        levelColor = Colors.grey[400]!;
        levelLabel = 'ARGENT';
        break;
      default:
        levelColor = Colors.brown[300]!;
        levelLabel = 'BRONZE';
    }

    return Container(
      width: 140,
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: levelColor, width: 2),
        boxShadow: [
          BoxShadow(
            color: levelColor.withValues(alpha: 0.3),
            blurRadius: 8,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        children: [
          Stack(
            clipBehavior: Clip.none,
            children: [
              Container(
                width: 60,
                height: 60,
                decoration: BoxDecoration(
                  color: color.withValues(alpha: 0.15),
                  shape: BoxShape.circle,
                ),
                child: Center(
                  child: TrText(
                    badge['icon'],
                    style: const TextStyle(fontSize: 32),
                  ),
                ),
              ),
              Positioned(
                top: -4,
                right: -4,
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                  decoration: BoxDecoration(
                    color: levelColor,
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: TrText(
                    levelLabel,
                    style: const TextStyle(
                      fontSize: 8,
                      fontWeight: FontWeight.bold,
                      color: Colors.white,
                    ),
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),
          TrText(
            badge['name'],
            style: const TextStyle(
              fontSize: 13,
              fontWeight: FontWeight.bold,
              color: AppDesign.primaryIndigo,
            ),
            textAlign: TextAlign.center,
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
          ),
          const SizedBox(height: 4),
          TrText(
            badge['description'],
            style: TextStyle(
              fontSize: 11,
              color: Colors.grey[600],
            ),
            textAlign: TextAlign.center,
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
          ),
        ],
      ),
    );
  }

  /// Carte du défi actuel
  Widget _buildChallengeCard() {
    if (_currentChallenge == null) return const SizedBox.shrink();

    final challenge = _currentChallenge!;
    final progress = (challenge['current'] as double) / (challenge['target'] as double);
    final progressPercent = (progress * 100).clamp(0, 100).round();
    final daysLeft = challenge['daysLeft'] as int;

    return Container(
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [
            Color(0xFF6366F1),
            Color(0xFF8B5CF6),
          ],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFF6366F1).withValues(alpha: 0.3),
            blurRadius: 16,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: Stack(
        children: [
          // Motif de fond décoratif
          Positioned.fill(
            child: Opacity(
              opacity: 0.1,
              child: CustomPaint(
                painter: _PatternPainter(),
              ),
            ),
          ),
          
          Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // En-tête
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: Colors.white.withValues(alpha: 0.2),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: TrText(
                        challenge['icon'],
                        style: const TextStyle(fontSize: 32),
                      ),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          TrText(
                            challenge['title'],
                            style: const TextStyle(
                              fontSize: 18,
                              fontWeight: FontWeight.bold,
                              color: Colors.white,
                            ),
                          ),
                          const SizedBox(height: 4),
                          Row(
                            children: [
                              const Icon(Icons.schedule, color: Colors.white70, size: 14),
                              const SizedBox(width: 4),
                              TrText(
                                '$daysLeft jours restants',
                                style: const TextStyle(
                                  fontSize: 12,
                                  color: Colors.white70,
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 20),

                // Description
                TrText(
                  challenge['description'],
                  style: const TextStyle(
                    fontSize: 14,
                    color: Colors.white,
                    height: 1.4,
                  ),
                ),
                const SizedBox(height: 20),

                // Barre de progression
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        TrText(
                          'Progression',
                          style: const TextStyle(
                            fontSize: 13,
                            fontWeight: FontWeight.w600,
                            color: Colors.white,
                          ),
                        ),
                        TrText(
                          '$progressPercent%',
                          style: const TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                            color: Colors.white,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 10),
                    ClipRRect(
                      borderRadius: BorderRadius.circular(10),
                      child: LinearProgressIndicator(
                        value: progress.clamp(0.0, 1.0),
                        minHeight: 12,
                        backgroundColor: Colors.white.withValues(alpha: 0.2),
                        valueColor: AlwaysStoppedAnimation<Color>(
                          progressPercent >= 100 ? Colors.amber : Colors.white,
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 20),

                // Récompense
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: Colors.white.withValues(alpha: 0.15),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(
                      color: Colors.white.withValues(alpha: 0.3),
                    ),
                  ),
                  child: Row(
                    children: [
                      const Icon(Icons.card_giftcard, color: Colors.amber, size: 20),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const TrText(
                              'Récompense',
                              style: TextStyle(
                                fontSize: 11,
                                color: Colors.white70,
                              ),
                            ),
                            const SizedBox(height: 2),
                            TrText(
                              challenge['reward'],
                              style: const TextStyle(
                                fontSize: 13,
                                fontWeight: FontWeight.bold,
                                color: Colors.white,
                              ),
                            ),
                          ],
                        ),
                      ),
                      if (progressPercent >= 100)
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                          decoration: BoxDecoration(
                            color: Colors.amber,
                            borderRadius: BorderRadius.circular(20),
                          ),
                          child: const TrText(
                            '🎉 Terminé !',
                            style: TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.bold,
                              color: Colors.white,
                            ),
                          ),
                        ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  /// Top 3 des recommandations prioritaires
  Widget _buildTop3Recommendations() {
    final top3 = _recommendations.take(3).toList();
    
    if (top3.isEmpty) {
      return const SizedBox.shrink();
    }

    return Column(
      children: top3.asMap().entries.map((entry) {
        final index = entry.key;
        final rec = entry.value;
        return _buildPriorityRecommendationCard(rec, index + 1);
      }).toList(),
    );
  }

  /// Carte de recommandation prioritaire avec numéro
  Widget _buildPriorityRecommendationCard(Map<String, dynamic> recommendation, int rank) {
    final type = recommendation['type'] as String;
    final priority = recommendation['priority'] as int? ?? 3;
    
    Color cardColor;
    Color badgeColor;
    IconData rankIcon;

    switch (type) {
      case 'success':
        cardColor = AppDesign.incomeColor;
        badgeColor = AppDesign.incomeColor.withValues(alpha: 0.15);
        break;
      case 'danger':
        cardColor = AppDesign.expenseColor;
        badgeColor = AppDesign.expenseColor.withValues(alpha: 0.15);
        break;
      case 'warning':
        cardColor = const Color(0xFFFFA726);
        badgeColor = const Color(0xFFFFA726).withValues(alpha: 0.15);
        break;
      default:
        cardColor = AppDesign.primaryIndigo;
        badgeColor = AppDesign.primaryIndigo.withValues(alpha: 0.15);
    }

    // Icône selon le rang
    switch (rank) {
      case 1:
        rankIcon = Icons.looks_one;
        break;
      case 2:
        rankIcon = Icons.looks_two;
        break;
      case 3:
        rankIcon = Icons.looks_3;
        break;
      default:
        rankIcon = Icons.circle;
    }

    // Impact stars
    final impactStars = priority >= 5 ? '⭐⭐⭐⭐⭐' : priority >= 4 ? '⭐⭐⭐⭐' : '⭐⭐⭐';

    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: cardColor.withValues(alpha: 0.4), width: 2),
        boxShadow: [
          BoxShadow(
            color: cardColor.withValues(alpha: 0.15),
            blurRadius: 12,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        children: [
          // En-tête avec rang et priorité
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: badgeColor,
              borderRadius: const BorderRadius.only(
                topLeft: Radius.circular(14),
                topRight: Radius.circular(14),
              ),
            ),
            child: Row(
              children: [
                Container(
                  width: 50,
                  height: 50,
                  decoration: BoxDecoration(
                    color: cardColor,
                    shape: BoxShape.circle,
                    boxShadow: [
                      BoxShadow(
                        color: cardColor.withValues(alpha: 0.3),
                        blurRadius: 8,
                        offset: const Offset(0, 2),
                      ),
                    ],
                  ),
                  child: Icon(rankIcon, color: Colors.white, size: 32),
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                            decoration: BoxDecoration(
                              color: cardColor.withValues(alpha: 0.2),
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: TrText(
                              'Action prioritaire #$rank',
                              style: TextStyle(
                                fontSize: 11,
                                fontWeight: FontWeight.bold,
                                color: cardColor,
                              ),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 6),
                      Row(
                        children: [
                          TrText(
                            'Impact : ',
                            style: TextStyle(
                              fontSize: 12,
                              color: Colors.grey[600],
                            ),
                          ),
                          TrText(
                            impactStars,
                            style: const TextStyle(fontSize: 12),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),

          // Corps de la recommandation
          Padding(
            padding: const EdgeInsets.all(18),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: badgeColor,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: TrText(
                    recommendation['icon'],
                    style: const TextStyle(fontSize: 28),
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      TrText(
                        recommendation['title'],
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                          color: cardColor,
                        ),
                      ),
                      const SizedBox(height: 8),
                      TrText(
                        recommendation['description'],
                        style: TextStyle(
                          fontSize: 14,
                          color: Colors.grey[700],
                          height: 1.5,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),

          // Action suggérée
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 14),
            decoration: BoxDecoration(
              color: Colors.grey[50],
              borderRadius: const BorderRadius.only(
                bottomLeft: Radius.circular(14),
                bottomRight: Radius.circular(14),
              ),
            ),
            child: Row(
              children: [
                Icon(Icons.touch_app, size: 18, color: cardColor),
                const SizedBox(width: 8),
                Expanded(
                  child: TrText(
                    _getActionSuggestion(recommendation),
                    style: TextStyle(
                      fontSize: 13,
                      color: Colors.grey[700],
                      fontStyle: FontStyle.italic,
                    ),
                  ),
                ),
                Icon(Icons.arrow_forward_ios, size: 14, color: Colors.grey[400]),
              ],
            ),
          ),
        ],
      ),
    );
  }

  String _getActionSuggestion(Map<String, dynamic> rec) {
    final title = rec['title'] as String;
    
    if (title.contains('découvert') || title.contains('Risque')) {
      return 'Consultez vos dépenses variables et réduisez-les dès maintenant';
    } else if (title.contains('Budget')) {
      return 'Ajustez votre budget dans Planificateur Budget';
    } else if (title.contains('Objectif')) {
      return 'Accédez à vos Objectifs pour voir les détails';
    } else if (title.contains('Économies') || title.contains('épargne')) {
      return 'Créez un objectif d\'épargne automatique';
    } else if (title.contains('Dépenses en Hausse')) {
      return 'Analysez l\'historique de vos transactions';
    } else {
      return 'Appliquer cette recommandation pour améliorer votre score';
    }
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

  /// Carte d'anomalie enrichie avec contexte et analyses détaillées
  Widget _buildEnrichedAnomalyCard(Map<String, dynamic> anomaly) {
    final type = anomaly['type'] as String;
    final icon = anomaly['icon'] as String;
    final title = anomaly['title'] as String;
    final description = anomaly['description'] as String;
    final analysis = anomaly['analysis'] as String?;
    final advice = anomaly['advice'] as String?;
    final impact = anomaly['impact'] as String?;
    final impactText = anomaly['impactText'] as String?;
    final amount = anomaly['amount'] as double?;
    final contextStats = anomaly['contextStats'] as Map<String, dynamic>?;

    // Déterminer les couleurs selon le type
    Color primaryColor;
    Color bgColor;
    Color badgeColor;
    IconData impactIcon;

    switch (type) {
      case 'warning':
        primaryColor = AppDesign.expenseColor;
        bgColor = AppDesign.expenseColor.withValues(alpha: 0.08);
        badgeColor = AppDesign.expenseColor.withValues(alpha: 0.2);
        impactIcon = Icons.trending_up;
        break;
      case 'exceptional':
        primaryColor = const Color(0xFFEF5350);
        bgColor = const Color(0xFFEF5350).withValues(alpha: 0.08);
        badgeColor = const Color(0xFFEF5350).withValues(alpha: 0.2);
        impactIcon = Icons.warning_amber_rounded;
        break;
      case 'success':
        primaryColor = AppDesign.incomeColor;
        bgColor = AppDesign.incomeColor.withValues(alpha: 0.08);
        badgeColor = AppDesign.incomeColor.withValues(alpha: 0.2);
        impactIcon = Icons.trending_down;
        break;
      default:
        primaryColor = AppDesign.primaryIndigo;
        bgColor = AppDesign.primaryIndigo.withValues(alpha: 0.08);
        badgeColor = AppDesign.primaryIndigo.withValues(alpha: 0.2);
        impactIcon = Icons.info_outline;
    }

    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: primaryColor.withValues(alpha: 0.3), width: 2),
        boxShadow: [
          BoxShadow(
            color: primaryColor.withValues(alpha: 0.1),
            blurRadius: 8,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // En-tête avec icône et titre
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: bgColor,
              borderRadius: const BorderRadius.only(
                topLeft: Radius.circular(14),
                topRight: Radius.circular(14),
              ),
            ),
            child: Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: badgeColor,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: TrText(
                    icon,
                    style: const TextStyle(fontSize: 28),
                  ),
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      TrText(
                        title,
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                          color: primaryColor,
                        ),
                      ),
                      if (amount != null) ...[
                        const SizedBox(height: 4),
                        TrText(
                          _formatAmount(amount),
                          style: TextStyle(
                            fontSize: 22,
                            fontWeight: FontWeight.w900,
                            color: primaryColor,
                            letterSpacing: -0.5,
                          ),
                        ),
                      ],
                    ],
                  ),
                ),
              ],
            ),
          ),

          // Corps avec détails
          Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Description principale
                Row(
                  children: [
                    Icon(Icons.notes, size: 16, color: Colors.grey[600]),
                    const SizedBox(width: 8),
                    Expanded(
                      child: TrText(
                        description,
                        style: TextStyle(
                          fontSize: 14,
                          color: Colors.grey[800],
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                  ],
                ),

                // Analyse contextuelle
                if (analysis != null) ...[
                  const SizedBox(height: 12),
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: primaryColor.withValues(alpha: 0.05),
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(
                        color: primaryColor.withValues(alpha: 0.2),
                      ),
                    ),
                    child: Row(
                      children: [
                        Icon(impactIcon, size: 18, color: primaryColor),
                        const SizedBox(width: 10),
                        Expanded(
                          child: TrText(
                            analysis,
                            style: TextStyle(
                              fontSize: 13,
                              color: Colors.grey[700],
                              height: 1.4,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],

                // Impact
                if (impactText != null) ...[
                  const SizedBox(height: 10),
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 10,
                          vertical: 6,
                        ),
                        decoration: BoxDecoration(
                          color: badgeColor,
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(
                              _getImpactIcon(impact),
                              size: 14,
                              color: primaryColor,
                            ),
                            const SizedBox(width: 6),
                            TrText(
                              impactText,
                              style: TextStyle(
                                fontSize: 12,
                                fontWeight: FontWeight.w700,
                                color: primaryColor,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ],

                // Statistiques contextuelles
                if (contextStats != null && contextStats.isNotEmpty) ...[
                  const SizedBox(height: 12),
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: _buildContextStats(contextStats, primaryColor),
                  ),
                ],

                // Conseil actionnable
                if (advice != null) ...[
                  const SizedBox(height: 14),
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        colors: [
                          Colors.amber.shade50,
                          Colors.orange.shade50,
                        ],
                      ),
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(color: Colors.orange.shade200),
                    ),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Icon(
                          Icons.lightbulb_outline,
                          color: Colors.orange.shade700,
                          size: 20,
                        ),
                        const SizedBox(width: 10),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              TrText(
                                'Conseil IA',
                                style: TextStyle(
                                  fontSize: 12,
                                  fontWeight: FontWeight.bold,
                                  color: Colors.orange.shade900,
                                ),
                              ),
                              const SizedBox(height: 4),
                              TrText(
                                advice,
                                style: TextStyle(
                                  fontSize: 13,
                                  color: Colors.grey[800],
                                  height: 1.4,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }

  IconData _getImpactIcon(String? impact) {
    switch (impact) {
      case 'high':
        return Icons.priority_high;
      case 'medium':
        return Icons.remove;
      case 'positive':
        return Icons.check_circle_outline;
      default:
        return Icons.info_outline;
    }
  }

  List<Widget> _buildContextStats(Map<String, dynamic> stats, Color color) {
    final widgets = <Widget>[];
    
    stats.forEach((key, value) {
      String label = '';
      String displayValue = '';
      
      switch (key) {
        case 'percentDiff':
          label = 'Variation';
          displayValue = '${value > 0 ? '+' : ''}$value%';
          break;
        case 'txCount':
          label = 'Transactions';
          displayValue = '$value';
          break;
        case 'percentOfBudget':
          label = 'Du budget';
          displayValue = '$value%';
          break;
        case 'percentOfCategory':
          label = 'De la catégorie';
          displayValue = '$value%';
          break;
        case 'vsAverage':
          if (value != 0) {
            label = 'vs Moyenne';
            displayValue = '${value > 0 ? '+' : ''}$value%';
          }
          break;
        case 'saved':
          label = 'Économisé';
          displayValue = _formatAmount(value as double);
          break;
      }
      
      if (label.isNotEmpty) {
        widgets.add(
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
            decoration: BoxDecoration(
              color: color.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(8),
              border: Border.all(color: color.withValues(alpha: 0.3)),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                TrText(
                  label,
                  style: TextStyle(
                    fontSize: 11,
                    color: Colors.grey[600],
                    fontWeight: FontWeight.w600,
                  ),
                ),
                const SizedBox(width: 6),
                TrText(
                  displayValue,
                  style: TextStyle(
                    fontSize: 12,
                    color: color,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ],
            ),
          ),
        );
      }
    });
    
    return widgets;
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
