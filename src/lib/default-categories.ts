import type { CategoryDocument } from './types';

// Default predefined categories for expenses
export const DEFAULT_EXPENSE_CATEGORIES = [
  { name: 'Housing', icon: 'Landmark' },
  { name: 'Food', icon: 'Utensils' },
  { name: 'Transport', icon: 'Car' },
  { name: 'Entertainment', icon: 'PartyPopper' },
  { name: 'Health', icon: 'HeartPulse' },
  { name: 'Shopping', icon: 'ShoppingBag' },
  { name: 'Utilities', icon: 'Lightbulb' },
];

// Default predefined categories for income
export const DEFAULT_INCOME_CATEGORIES = [
  { name: 'Salary', icon: 'DollarSign' },
  { name: 'Freelance', icon: 'Briefcase' },
  { name: 'Investment', icon: 'TrendingUp' },
  { name: 'Other Income', icon: 'Wallet' },
];

// Helper function to initialize default categories for a user
export function createDefaultCategories(userId: string): Omit<CategoryDocument, 'id'>[] {
  const categories: Omit<CategoryDocument, 'id'>[] = [];
  
  // Add expense categories
  DEFAULT_EXPENSE_CATEGORIES.forEach(cat => {
    categories.push({
      userId,
      name: cat.name,
      type: 'expense',
      budgetedAmount: 0,
      icon: cat.icon,
      isCustom: false,
    });
  });
  
  // Add income categories
  DEFAULT_INCOME_CATEGORIES.forEach(cat => {
    categories.push({
      userId,
      name: cat.name,
      type: 'income',
      budgetedAmount: 0,
      icon: cat.icon,
      isCustom: false,
    });
  });
  
  return categories;
}
