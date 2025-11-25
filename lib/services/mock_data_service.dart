import '../models/account.dart';
import '../models/transaction.dart' as app_transaction;
import '../models/category.dart';
import '../models/user_profile.dart';
import '../models/goal.dart';
import '../models/budget_plan.dart';
import '../models/projection_result.dart';

/// Service de données mockées pour développer l'UI sans Firebase
/// À utiliser pendant le développement de l'interface
class MockDataService {
  static final MockDataService _instance = MockDataService._internal();
  factory MockDataService() => _instance;
  MockDataService._internal();

  // Données mockées
  final String mockUserId = 'mock_user_123';

  // Profil utilisateur mocké
  UserProfile getMockUserProfile() {
    return UserProfile(
      userId: mockUserId,
      displayName: 'Jean Dupont',
      email: 'jean.dupont@example.com',
      currency: 'EUR',
      createdAt: DateTime.now().subtract(const Duration(days: 30)),
      updatedAt: DateTime.now(),
    );
  }

  Future<UserProfile> getUserProfile() async {
    return getMockUserProfile();
  }

  // Comptes mockés
  List<Account> getMockAccounts() {
    final now = DateTime.now();
    return [
      // Compte Demo avec données de test
      Account(
        accountId: 'acc_demo',
        userId: mockUserId,
        name: 'Demo',
        type: AccountType.checking,
        balance: 2450.50,
        currency: 'EUR',
        icon: '🎯',
        color: '#4CAF50',
        sharedWithUIDs: const [],
        createdAt: now.subtract(const Duration(days: 30)),
        updatedAt: now,
      ),
      // Autres comptes avec solde à 0
      Account(
        accountId: 'acc_1',
        userId: mockUserId,
        name: 'Compte Courant',
        type: AccountType.checking,
        balance: 0.0,
        currency: 'EUR',
        icon: '💳',
        color: '#4CAF50',
        sharedWithUIDs: const [],
        createdAt: now.subtract(const Duration(days: 30)),
        updatedAt: now,
      ),
      Account(
        accountId: 'acc_2',
        userId: mockUserId,
        name: 'Épargne',
        type: AccountType.savings,
        balance: 0.0,
        currency: 'EUR',
        icon: '🏦',
        color: '#2196F3',
        sharedWithUIDs: const [],
        createdAt: now.subtract(const Duration(days: 25)),
        updatedAt: now,
      ),
      Account(
        accountId: 'acc_3',
        userId: mockUserId,
        name: 'Espèces',
        type: AccountType.cash,
        balance: 0.0,
        currency: 'EUR',
        icon: '💵',
        color: '#FF9800',
        sharedWithUIDs: const [],
        createdAt: now.subtract(const Duration(days: 20)),
        updatedAt: now,
      ),
      Account(
        accountId: 'acc_4',
        userId: mockUserId,
        name: 'Mobile Money',
        type: AccountType.mobileWallet,
        balance: 0.0,
        currency: 'EUR',
        icon: '📱',
        color: '#9C27B0',
        sharedWithUIDs: const [],
        createdAt: now.subtract(const Duration(days: 15)),
        updatedAt: now,
      ),
    ];
  }

  // Transactions mockées - uniquement pour le compte Demo
  List<app_transaction.Transaction> getMockTransactions() {
    final now = DateTime.now();
    return [
      app_transaction.Transaction(
        transactionId: 'trans_1',
        userId: mockUserId,
        accountId: 'acc_demo',
        categoryId: 'cat_1',
        type: app_transaction.TransactionType.expense,
        amount: 45.50,
        description: 'Courses supermarché',
        note: 'Carrefour',
        date: now.subtract(const Duration(hours: 2)),
        createdAt: now.subtract(const Duration(hours: 2)),
        updatedAt: now.subtract(const Duration(hours: 2)),
      ),
      app_transaction.Transaction(
        transactionId: 'trans_2',
        userId: mockUserId,
        accountId: 'acc_demo',
        categoryId: 'cat_2',
        type: app_transaction.TransactionType.expense,
        amount: 25.00,
        description: 'Essence',
        date: now.subtract(const Duration(days: 1)),
        createdAt: now.subtract(const Duration(days: 1)),
        updatedAt: now.subtract(const Duration(days: 1)),
      ),
      app_transaction.Transaction(
        transactionId: 'trans_3',
        userId: mockUserId,
        accountId: 'acc_demo',
        categoryId: 'cat_income_1',
        type: app_transaction.TransactionType.income,
        amount: 2500.00,
        description: 'Salaire',
        date: now.subtract(const Duration(days: 2)),
        createdAt: now.subtract(const Duration(days: 2)),
        updatedAt: now.subtract(const Duration(days: 2)),
      ),
      app_transaction.Transaction(
        transactionId: 'trans_4',
        userId: mockUserId,
        accountId: 'acc_demo',
        categoryId: 'cat_4',
        type: app_transaction.TransactionType.expense,
        amount: 89.99,
        description: 'Restaurant',
        note: 'Dîner avec amis',
        date: now.subtract(const Duration(days: 3)),
        createdAt: now.subtract(const Duration(days: 3)),
        updatedAt: now.subtract(const Duration(days: 3)),
      ),
      app_transaction.Transaction(
        transactionId: 'trans_5',
        userId: mockUserId,
        accountId: 'acc_demo',
        categoryId: 'cat_income_1',
        type: app_transaction.TransactionType.income,
        amount: 500.00,
        description: 'Virement épargne',
        date: now.subtract(const Duration(days: 5)),
        createdAt: now.subtract(const Duration(days: 5)),
        updatedAt: now.subtract(const Duration(days: 5)),
      ),
    ];
  }

  // Catégories mockées (Dépenses et Revenus)
  List<Category> getMockCategories() {
    final now = DateTime.now();
    return [
      // Catégories de dépenses
      Category(
        categoryId: 'cat_1',
        userId: mockUserId,
        name: 'Alimentation',
        type: CategoryType.expense,
        icon: '🍔',
        color: '#EF4444',
        isDefault: true,
        createdAt: now.subtract(const Duration(days: 30)),
        updatedAt: now,
      ),
      Category(
        categoryId: 'cat_2',
        userId: mockUserId,
        name: 'Transport',
        type: CategoryType.expense,
        icon: '🚗',
        color: '#3B82F6',
        isDefault: true,
        createdAt: now.subtract(const Duration(days: 30)),
        updatedAt: now,
      ),
      Category(
        categoryId: 'cat_4',
        userId: mockUserId,
        name: 'Restaurant',
        type: CategoryType.expense,
        icon: '🍽️',
        color: '#F97316',
        isDefault: true,
        createdAt: now.subtract(const Duration(days: 30)),
        updatedAt: now,
      ),
      Category(
        categoryId: 'cat_5',
        userId: mockUserId,
        name: 'Logement',
        type: CategoryType.expense,
        icon: '🏠',
        color: '#8B5CF6',
        isDefault: true,
        createdAt: now.subtract(const Duration(days: 30)),
        updatedAt: now,
      ),
      Category(
        categoryId: 'cat_6',
        userId: mockUserId,
        name: 'Loisirs',
        type: CategoryType.expense,
        icon: '🎮',
        color: '#F59E0B',
        isDefault: true,
        createdAt: now.subtract(const Duration(days: 30)),
        updatedAt: now,
      ),
      Category(
        categoryId: 'cat_7',
        userId: mockUserId,
        name: 'Santé',
        type: CategoryType.expense,
        icon: '🏥',
        color: '#10B981',
        isDefault: true,
        createdAt: now.subtract(const Duration(days: 30)),
        updatedAt: now,
      ),
      
      // Catégories de revenus
      Category(
        categoryId: 'cat_income_1',
        userId: mockUserId,
        name: 'Salaire',
        type: CategoryType.income,
        icon: '💰',
        color: '#10B981',
        isDefault: true,
        createdAt: now.subtract(const Duration(days: 30)),
        updatedAt: now,
      ),
      Category(
        categoryId: 'cat_income_2',
        userId: mockUserId,
        name: 'Freelance',
        type: CategoryType.income,
        icon: '💼',
        color: '#3B82F6',
        isDefault: true,
        createdAt: now.subtract(const Duration(days: 30)),
        updatedAt: now,
      ),
      Category(
        categoryId: 'cat_income_3',
        userId: mockUserId,
        name: 'Investissement',
        type: CategoryType.income,
        icon: '📈',
        color: '#8B5CF6',
        isDefault: true,
        createdAt: now.subtract(const Duration(days: 30)),
        updatedAt: now,
      ),
      Category(
        categoryId: 'cat_income_4',
        userId: mockUserId,
        name: 'Cadeau',
        type: CategoryType.income,
        icon: '🎁',
        color: '#EC4899',
        isDefault: true,
        createdAt: now.subtract(const Duration(days: 30)),
        updatedAt: now,
      ),
    ];
  }

  // Expositions asynchrones pour refléter l'API FirestoreService
  Future<List<app_transaction.Transaction>> getTransactions() async {
    return getMockTransactions();
  }

  Future<List<Account>> getAccounts() async {
    return getMockAccounts();
  }

  Future<BudgetPlan?> getCurrentBudgetPlan() async {
    final now = DateTime.now();
    return BudgetPlan(
      budgetPlanId: 'budget_mock',
      userId: mockUserId,
      totalIncome: 2500,
      categoryAllocations: {
        'Logement': 0.30,
        'Nourriture': 0.15,
        'Transport': 0.10,
        'Loisirs': 0.10,
        'Santé': 0.05,
        'Épargne': 0.10,
      },
      createdAt: now,
      updatedAt: now,
    );
  }

  // Objectifs mockés - vide par défaut (peuvent être ajoutés par l'utilisateur)
  Future<List<Goal>> getGoals() async {
    return [];
  }

  Future<ProjectionResult> getMockProjection() async {
    final accounts = await getAccounts();
    final transactions = await getTransactions();
    final now = DateTime.now();
    final daysInMonth = DateTime(now.year, now.month + 1, 0).day;
    final daysElapsed = now.day;
    final daysRemaining = (daysInMonth - daysElapsed).clamp(0, daysInMonth);

    final currentBalance = accounts.fold(0.0, (sum, a) => sum + a.balance);
    final currentMonthTx = transactions
        .where((t) => t.date.month == now.month && t.date.year == now.year)
        .toList();

    final expenses = currentMonthTx
        .where((t) => t.type == app_transaction.TransactionType.expense)
        .toList();
    final incomes = currentMonthTx
        .where((t) => t.type == app_transaction.TransactionType.income)
        .toList();

    final totalIncome = incomes.fold(0.0, (sum, t) => sum + t.amount);
    final totalExpense = expenses.fold(0.0, (sum, t) => sum + t.amount);

    final avgDailyExpense = daysElapsed > 0 ? totalExpense / daysElapsed : 0.0;
    final projectedVariable = avgDailyExpense * daysRemaining;
    final simulatedFixedExpenses = totalExpense * 0.6;
    final simulatedFixedIncome = totalIncome * 0.2;

    final projection = currentBalance +
        simulatedFixedIncome -
        simulatedFixedExpenses -
        projectedVariable;

    final sortedExpenses = [...expenses]..sort((a, b) => b.amount.compareTo(a.amount));

    return ProjectionResult(
      estimatedEndOfMonthBalance: projection,
      upcomingFixedExpensesTotal: simulatedFixedExpenses,
      exceptionalTransactions: sortedExpenses.take(2).toList(),
    );
  }

  // Calculer le solde total
  double getTotalBalance() {
    return getMockAccounts().fold(0.0, (sum, account) => sum + account.balance);
  }

  // Obtenir les transactions récentes (5 dernières)
  List<app_transaction.Transaction> getRecentTransactions({int limit = 5}) {
    final transactions = getMockTransactions();
    transactions.sort((a, b) => b.date.compareTo(a.date));
    return transactions.take(limit).toList();
  }
}
