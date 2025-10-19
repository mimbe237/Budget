export type Transaction = {
  id: string;
  date: string;
  description: string;
  amountInCents: number;
  type: 'income' | 'expense';
  currency: 'XOF' | 'XAF' | 'EUR' | 'USD';
  category: Category;
  userId: string;
};

export type Category = 'Housing' | 'Food' | 'Transport' | 'Entertainment' | 'Health' | 'Shopping' | 'Utilities' | 'Income';

export type Budget = {
  id: string;
  userId: string;
  name: string;
  budgetedAmount: number;
  category: Category;
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
