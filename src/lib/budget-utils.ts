import type {
  Transaction,
  CategoryBudgetAllocation,
  CategoryBudgetStatus,
  BudgetStatus,
} from './types';
import { format } from 'date-fns';

/**
 * Formate une période au format YYYY-MM
 */
export function formatBudgetPeriod(date: Date): string {
  return format(date, 'yyyy-MM');
}

/**
 * Calcule la consommation budgétaire pour une catégorie donnée
 */
export function calculateCategoryConsumption(
  allocation: CategoryBudgetAllocation,
  expenses: Transaction[]
): CategoryBudgetStatus {
  const categoryExpenses = expenses.filter(
    tx =>
      tx.type === 'expense' &&
      (tx.categoryId === allocation.categoryId || tx.category === allocation.categoryName)
  );

  const spent = categoryExpenses.reduce((sum, tx) => sum + (tx.amountInCents || 0), 0) / 100;
  const allocated = allocation.allocatedAmount;
  const remaining = allocated - spent;
  const percentage = allocated > 0 ? (spent / allocated) * 100 : spent > 0 ? 100 : 0;

  return {
    categoryId: allocation.categoryId,
    categoryName: allocation.categoryName,
    allocated,
    spent,
    remaining,
    percentage: Math.round(percentage * 10) / 10, // Arrondi à 1 décimale
    isOverBudget: spent > allocated,
  };
}

/**
 * Calcule le statut budgétaire global pour un mois donné
 */
export function calculateGlobalConsumption(
  period: string,
  totalBudget: number,
  categoryAllocations: CategoryBudgetAllocation[],
  expenses: Transaction[]
): BudgetStatus {
  // Calcul pour chaque catégorie
  const categoryStatuses = categoryAllocations.map(allocation =>
    calculateCategoryConsumption(allocation, expenses)
  );

  // Calcul global
  const totalSpent = categoryStatuses.reduce((sum, status) => sum + status.spent, 0);
  const totalRemaining = totalBudget - totalSpent;
  const globalPercentage = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

  // Détection des dépassements
  const overBudgetCategories = categoryStatuses
    .filter(status => status.isOverBudget)
    .map(status => status.categoryId);

  return {
    period,
    totalBudget,
    totalSpent,
    totalRemaining,
    globalPercentage: Math.round(globalPercentage * 10) / 10,
    isGlobalOverBudget: totalSpent > totalBudget,
    categoryStatuses,
    overBudgetCategories,
  };
}

/**
 * Détecte les catégories en dépassement avec détails
 */
export function detectBudgetOverruns(
  budgetStatus: BudgetStatus
): Array<{
  categoryId: string;
  categoryName: string;
  overageAmount: number;
  percentage: number;
}> {
  return budgetStatus.categoryStatuses
    .filter(status => status.isOverBudget)
    .map(status => ({
      categoryId: status.categoryId,
      categoryName: status.categoryName,
      overageAmount: Math.abs(status.remaining),
      percentage: status.percentage,
    }));
}

/**
 * Détermine le niveau de criticité d'un budget
 */
export function getBudgetSeverity(
  percentage: number
): 'healthy' | 'warning' | 'critical' | 'over' {
  if (percentage >= 100) return 'over';
  if (percentage >= 90) return 'critical';
  if (percentage >= 75) return 'warning';
  return 'healthy';
}

/**
 * Obtient la couleur associée au niveau de criticité
 */
export function getSeverityColor(
  severity: 'healthy' | 'warning' | 'critical' | 'over'
): string {
  switch (severity) {
    case 'over':
      return 'text-red-600 dark:text-red-400';
    case 'critical':
      return 'text-orange-600 dark:text-orange-400';
    case 'warning':
      return 'text-amber-600 dark:text-amber-400';
    default:
      return 'text-emerald-600 dark:text-emerald-400';
  }
}

/**
 * Obtient le label traduit pour le niveau de criticité
 */
export function getSeverityLabel(
  severity: 'healthy' | 'warning' | 'critical' | 'over',
  isFrench: boolean
): string {
  switch (severity) {
    case 'over':
      return isFrench ? 'Dépassé' : 'Over budget';
    case 'critical':
      return isFrench ? 'Critique' : 'Critical';
    case 'warning':
      return isFrench ? 'Attention' : 'Warning';
    default:
      return isFrench ? 'Sain' : 'Healthy';
  }
}
