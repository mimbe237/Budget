import type { DebtReportSummary } from '@/types/debt';

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
  color?: string | null;
  parentCategoryId?: string | null;
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
  type?: GoalType;
  targetAmountInCents: number;
  currentAmountInCents: number;
  storageAccount?: string;
  currency: Currency;
  targetDate: string;
  description?: string;
  icon?: string;
  color?: string;
  linkedCategoryId?: string | null;
  linkedCategoryName?: string | null;
  linkedDebtId?: string | null;
  linkedDebtTitle?: string | null;
  archived?: boolean;
  archiveStatus?: 'completed' | 'abandoned';
  archivedAt?: string;
  createdAt: string;
  updatedAt?: string;
  projectionConfidence?: number | null;
};

export type UserProfile = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  displayCurrency?: 'XOF' | 'XAF' | 'EUR' | 'USD';
  locale?: 'fr-CM' | 'en-US';
  monthlyNetIncome?: number;
  monthlyExpenseBudget?: number;
  hasCompletedOnboarding?: boolean;
  hasCompletedTour?: boolean;
  status?: 'active' | 'suspended';
  createdAt?: string | Date;
  updatedAt?: string | Date;
  // Admin flags
  isAdmin?: boolean;
  admin?: boolean;
  role?: 'admin' | 'user';
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
    debtSummary: DebtReportSummary | null;
    // Chart Data
    cashflow: {
        date: string;
        income: number;
        expenses: number;
        incomeInCents: number;
        expensesInCents: number;
        netInCents: number;
    }[];
    financialSeries: {
        date: string;
        income: number;
        expenses: number;
        debtService: number;
        cumulativeBalance: number;
        principalPaid: number;
        interestPaid: number;
    }[];
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

// ===== AI INSIGHTS CACHE =====
export type AIInsightsCache = {
  id: string; // Format: "latest" ou timestamp
  userId: string;
  insights: string;
  recommendations: string;
  generatedAt: string; // ISO timestamp
  expiresAt: string; // ISO timestamp (generatedAt + 24h)
  dataHash: string; // Hash des transactions/budgets pour détecter les changements
  transactionCount: number;
  budgetCount: number;
  periodStart?: string; // Date de début des données analysées
  periodEnd?: string; // Date de fin des données analysées
  modelVersion?: string; // Version du modèle IA utilisé
};
