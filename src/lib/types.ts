export type Transaction = {
  id: string;
  date: string;
  description: string;
  amountInCents: number;
  type: 'income' | 'expense';
  currency: 'XOF' | 'XAF' | 'EUR' | 'USD';
  category: Category;
  userId: string;
  categoryId?: string;
};

export type Category = 'Housing' | 'Food' | 'Transport' | 'Entertainment' | 'Health' | 'Shopping' | 'Utilities' | 'Income';

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
