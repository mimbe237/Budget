export type GoalType = 'epargne' | 'achat' | 'dette' | 'plafond';

// Historique des apports sur un objectif
export type GoalTransaction = {
  id: string;
  goalId: string;
  userId: string;
  amountInCents: number;
  createdAt: string;
  updatedAt?: string;
  note?: string;
  attachmentUrl?: string;
  attachmentName?: string;
  attachmentType?: string;
  sourceTransactionId?: string;
  sourceType?: 'income_allocation' | 'manual' | 'auto';
};

export type Transaction = {
  id: string;
  date: string;
  description: string;
  amountInCents: number;
  type: 'income' | 'expense';
  currency: 'XOF' | 'XAF' | 'EUR' | 'USD';
  category: string; // Now supports dynamic category names
  userId: string;
  categoryId?: string;
  attachmentUrl?: string;
  attachmentName?: string;
  attachmentType?: string;
};

// Legacy type for backward compatibility
export type Category = 'Housing' | 'Food' | 'Transport' | 'Entertainment' | 'Health' | 'Shopping' | 'Utilities' | 'Income';

// New interface for category documents in Firestore
export type CategoryDocument = {
  id: string;
  userId: string;
  name: string;
  type: 'income' | 'expense';
  budgetedAmount: number;
  icon?: string; // Optional icon name
  isCustom: boolean; // Distinguish custom vs predefined
};

export type Budget = {
  id: string;
  userId: string;
  name: string;
  budgetedAmount: number;
};

export type Goal = {
  id: string;
  userId: string;
  name: string;
  targetAmountInCents: number;
  currentAmountInCents: number;
  storageAccount?: string;
  currency: Currency;
  targetDate: string;
  description?: string;
  icon?: string;
  color?: string;
  archived?: boolean;
  archiveStatus?: 'completed' | 'abandoned';
  archivedAt?: string;
  createdAt: string;
  updatedAt?: string;
};

export type UserProfile = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  displayCurrency?: 'XOF' | 'XAF' | 'EUR' | 'USD';
  locale?: 'fr-CM' | 'en-US';
  monthlyExpenseBudget?: number;
}

export type Currency = 'XOF' | 'XAF' | 'EUR' | 'USD';

// ===== MONTHLY BUDGETS SYSTEM =====
// Allocation budgétaire pour une catégorie spécifique
export type CategoryBudgetAllocation = {
  categoryId: string;
  categoryName: string;
  allocatedAmount: number; // Montant alloué pour ce mois
};

// Plan budgétaire mensuel complet
export type MonthlyBudgetPlan = {
  id: string; // Format: YYYY-MM (ex: "2024-01")
  userId: string;
  period: string; // Format: YYYY-MM
  totalBudget: number; // Budget mensuel total prévu
  categoryAllocations: CategoryBudgetAllocation[]; // Répartition par catégorie
  createdAt: string;
  updatedAt?: string;
};

// Statut de consommation pour une catégorie
export type CategoryBudgetStatus = {
  categoryId: string;
  categoryName: string;
  allocated: number; // Budget alloué
  spent: number; // Montant dépensé
  remaining: number; // Reste disponible (peut être négatif)
  percentage: number; // Pourcentage de consommation (spent / allocated * 100)
  isOverBudget: boolean; // Dépassement détecté
};

// Statut budgétaire global pour un mois donné
export type BudgetStatus = {
  period: string; // Format: YYYY-MM
  totalBudget: number;
  totalSpent: number;
  totalRemaining: number;
  globalPercentage: number; // Pourcentage global (totalSpent / totalBudget * 100)
  isGlobalOverBudget: boolean;
  categoryStatuses: CategoryBudgetStatus[]; // Détail par catégorie
  overBudgetCategories: string[]; // IDs des catégories en dépassement
};

// Alerte de dépassement budgétaire
export type BudgetAlert = {
  id: string;
  userId: string;
  period: string;
  type: 'category' | 'global';
  categoryId?: string;
  categoryName?: string;
  overageAmount: number; // Montant du dépassement
  percentage: number; // Pourcentage de dépassement
  triggeredAt: string;
  acknowledged?: boolean;
  acknowledgedAt?: string;
};

export type FinancialReportData = {
    // KPIs
    totalIncome: number;
    totalExpenses: number;
    netBalance: number;
    expenseDelta: number | null; // % change from previous period
    // Chart Data
    cashflow: { date: string; income: number; expenses: number }[];
    spendingByCategory: { name: string; value: number }[];
  // Income breakdown by category (for Revenus table)
  incomeByCategory?: { name: string; value: number }[];
    // Table Data
    budgetVsActual: {
        category: string;
        budgeted: number;
        actual: number;
        variance: number;
    }[];
    // Goals
    goals: Goal[];
    // Summary
    recentTransactions: Transaction[];
    // Period Info
    period: {
        from: Date;
        to: Date;
        isCustom: boolean;
    };
    // User profile for formatting
    userProfile: UserProfile | null;
};
