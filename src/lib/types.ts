export type Transaction = {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  category: Category;
};

export type Category = 'Housing' | 'Food' | 'Transport' | 'Entertainment' | 'Health' | 'Shopping' | 'Utilities' | 'Income';

export type Budget = {
  category: Category;
  limit: number;
};

export type Goal = {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string;
};
