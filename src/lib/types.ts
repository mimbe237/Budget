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
  currency: 'XOF' | 'XAF' | 'EUR' | 'USD';
  targetDate: string;
};

export type UserProfile = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  displayCurrency?: 'XOF' | 'XAF' | 'EUR' | 'USD';
  locale?: 'fr-CM' | 'en-US';
}

export type Currency = 'XOF' | 'XAF' | 'EUR' | 'USD';

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
