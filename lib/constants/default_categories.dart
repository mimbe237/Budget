import '../models/category.dart';

/// Catégories par défaut à créer lors de l'onboarding
class DefaultCategories {
  DefaultCategories._();

  static List<Map<String, dynamic>> get expenseCategories => [
    {
      'name': 'Alimentation',
      'type': CategoryType.expense,
      'icon': '🍔',
      'color': '#EF4444',
    },
    {
      'name': 'Transport',
      'type': CategoryType.expense,
      'icon': '🚗',
      'color': '#3B82F6',
    },
    {
      'name': 'Logement',
      'type': CategoryType.expense,
      'icon': '🏠',
      'color': '#8B5CF6',
    },
    {
      'name': 'Santé',
      'type': CategoryType.expense,
      'icon': '🏥',
      'color': '#10B981',
    },
    {
      'name': 'Loisirs',
      'type': CategoryType.expense,
      'icon': '🎮',
      'color': '#F59E0B',
    },
    {
      'name': 'Shopping',
      'type': CategoryType.expense,
      'icon': '🛍️',
      'color': '#EC4899',
    },
    {
      'name': 'Éducation',
      'type': CategoryType.expense,
      'icon': '📚',
      'color': '#6366F1',
    },
    {
      'name': 'Services',
      'type': CategoryType.expense,
      'icon': '💼',
      'color': '#14B8A6',
    },
    {
      'name': 'Restaurant',
      'type': CategoryType.expense,
      'icon': '🍽️',
      'color': '#F97316',
    },
    {
      'name': 'Abonnements',
      'type': CategoryType.expense,
      'icon': '📱',
      'color': '#8B5CF6',
    },
  ];

  static List<Map<String, dynamic>> get incomeCategories => [
    {
      'name': 'Salaire',
      'type': CategoryType.income,
      'icon': '💰',
      'color': '#10B981',
    },
    {
      'name': 'Freelance',
      'type': CategoryType.income,
      'icon': '💼',
      'color': '#3B82F6',
    },
    {
      'name': 'Investissement',
      'type': CategoryType.income,
      'icon': '📈',
      'color': '#8B5CF6',
    },
    {
      'name': 'Cadeau',
      'type': CategoryType.income,
      'icon': '🎁',
      'color': '#EC4899',
    },
    {
      'name': 'Remboursement',
      'type': CategoryType.income,
      'icon': '💵',
      'color': '#10B981',
    },
    {
      'name': 'Autre revenu',
      'type': CategoryType.income,
      'icon': '💸',
      'color': '#6B7280',
    },
  ];

  static List<Map<String, dynamic>> get allCategories => [
    ...expenseCategories,
    ...incomeCategories,
  ];
}
