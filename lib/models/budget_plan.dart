import '../models/models.dart';

/// Plan budgétaire avec répartition des revenus par catégorie
class BudgetPlan {
  final String budgetPlanId;
  final String userId;
  final double totalIncome;
  
  /// Map où la clé est l'ID de catégorie et la valeur est le pourcentage (0.0 à 1.0)
  /// Exemple: {'cat_1': 0.30} = 30% pour la catégorie cat_1
  final Map<String, double> categoryAllocations;
  
  final DateTime createdAt;
  final DateTime updatedAt;

  BudgetPlan({
    required this.budgetPlanId,
    required this.userId,
    required this.totalIncome,
    required this.categoryAllocations,
    required this.createdAt,
    required this.updatedAt,
  });

  /// Convertit l'objet en Map pour Firestore
  Map<String, dynamic> toMap() {
    return {
      'userId': userId,
      'totalIncome': totalIncome,
      'categoryAllocations': categoryAllocations,
      'createdAt': createdAt,
      'updatedAt': updatedAt,
    };
  }

  /// Crée un BudgetPlan depuis une Map Firestore
  factory BudgetPlan.fromMap(String id, Map<String, dynamic> map) {
    return BudgetPlan(
      budgetPlanId: id,
      userId: map['userId'] ?? '',
      totalIncome: (map['totalIncome'] ?? 0).toDouble(),
      categoryAllocations: Map<String, double>.from(map['categoryAllocations'] ?? {}),
      createdAt: map['createdAt']?.toDate() ?? DateTime.now(),
      updatedAt: map['updatedAt']?.toDate() ?? DateTime.now(),
    );
  }

  /// Crée une copie avec des modifications
  BudgetPlan copyWith({
    String? budgetPlanId,
    String? userId,
    double? totalIncome,
    Map<String, double>? categoryAllocations,
    DateTime? createdAt,
    DateTime? updatedAt,
  }) {
    return BudgetPlan(
      budgetPlanId: budgetPlanId ?? this.budgetPlanId,
      userId: userId ?? this.userId,
      totalIncome: totalIncome ?? this.totalIncome,
      categoryAllocations: categoryAllocations ?? this.categoryAllocations,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }

  /// Calcule le total des allocations en pourcentage
  double getTotalAllocation() {
    return categoryAllocations.values.fold(0.0, (sum, value) => sum + value);
  }

  /// Vérifie si le budget est équilibré (total = 100%)
  bool isBalanced({double tolerance = 0.001}) {
    final total = getTotalAllocation();
    return (total - 1.0).abs() <= tolerance;
  }

  /// Obtient le montant alloué pour une catégorie
  double getAmountForCategory(String categoryId) {
    final percentage = categoryAllocations[categoryId] ?? 0.0;
    return totalIncome * percentage;
  }
}

/// Répartition budgétaire par défaut (30/15/10/5/5/10/10/10/5)
const Map<String, double> DEFAULT_ALLOCATION = {
  'Logement': 0.30,      // 30%
  'Nourriture': 0.15,    // 15%
  'Transport': 0.10,     // 10%
  'Factures': 0.05,      // 5%
  'Santé': 0.05,         // 5%
  'Épargne': 0.10,       // 10%
  'Investissement': 0.10, // 10%
  'Loisirs': 0.10,       // 10%
  'Famille': 0.05,       // 5%
};

/// Catégories budgétaires par défaut avec leurs noms et icônes
const Map<String, Map<String, String>> DEFAULT_BUDGET_CATEGORIES = {
  'Logement': {'icon': '🏠', 'name': 'Logement'},
  'Nourriture': {'icon': '🍽️', 'name': 'Nourriture'},
  'Transport': {'icon': '🚗', 'name': 'Transport'},
  'Factures': {'icon': '📄', 'name': 'Factures/Abo'},
  'Santé': {'icon': '🏥', 'name': 'Santé'},
  'Épargne': {'icon': '💰', 'name': 'Épargne Sécurité'},
  'Investissement': {'icon': '📈', 'name': 'Investissements'},
  'Loisirs': {'icon': '🎮', 'name': 'Loisirs'},
  'Famille': {'icon': '👨‍👩‍👧', 'name': 'Famille/Dons'},
};
