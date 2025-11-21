import 'transaction.dart' as app_transaction;

/// Résultat de projection de solde pour la fin du mois.
class ProjectionResult {
  final double estimatedEndOfMonthBalance;
  final double upcomingFixedExpensesTotal;
  final List<app_transaction.Transaction> exceptionalTransactions;

  const ProjectionResult({
    required this.estimatedEndOfMonthBalance,
    required this.upcomingFixedExpensesTotal,
    required this.exceptionalTransactions,
  });

  ProjectionResult copyWith({
    double? estimatedEndOfMonthBalance,
    double? upcomingFixedExpensesTotal,
    List<app_transaction.Transaction>? exceptionalTransactions,
  }) {
    return ProjectionResult(
      estimatedEndOfMonthBalance:
          estimatedEndOfMonthBalance ?? this.estimatedEndOfMonthBalance,
      upcomingFixedExpensesTotal:
          upcomingFixedExpensesTotal ?? this.upcomingFixedExpensesTotal,
      exceptionalTransactions:
          exceptionalTransactions ?? this.exceptionalTransactions,
    );
  }
}
