/// Configuration centralisée des allocations budgétaires par défaut
class DefaultBudgetAllocations {
  DefaultBudgetAllocations._();

  /// Pourcentages par défaut pour chaque catégorie budgétaire
  /// Total doit être égal à 1.0 (100%)
  static const Map<String, double> defaultAllocations = {
    'alimentation': 0.25,  // 25%
    'transport': 0.15,     // 15%
    'logement': 0.30,      // 30%
    'loisirs': 0.10,       // 10%
    'sante': 0.08,         // 8%
    'autre': 0.12,         // 12%
  };

  /// Calcule les montants réels basés sur le budget total
  static Map<String, double> calculateAllocationAmounts(
    double totalBudget,
    Map<String, double> allocations,
  ) {
    final result = <String, double>{};
    for (final entry in allocations.entries) {
      result[entry.key] = totalBudget * entry.value;
    }
    return result;
  }

  /// Vérifie que la somme des allocations est égale à 100%
  static bool isValid(Map<String, double> allocations) {
    final sum = allocations.values.fold<double>(0.0, (a, b) => a + b);
    return (sum - 1.0).abs() < 0.001; // Tolérance de 0.1%
  }
}
