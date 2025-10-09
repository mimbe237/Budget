import type { Transaction, Budget, Goal } from './types';

export const transactions: Transaction[] = [
  { id: '1', date: '2024-07-15', description: 'Paycheck', amount: 3000, type: 'income', category: 'Income' },
  { id: '2', date: '2024-07-15', description: 'Rent', amount: 1200, type: 'expense', category: 'Housing' },
  { id: '3', date: '2024-07-16', description: 'Groceries', amount: 150.75, type: 'expense', category: 'Food' },
  { id: '4', date: '2024-07-17', description: 'Gas', amount: 45.50, type: 'expense', category: 'Transport' },
  { id: '5', date: '2024-07-18', description: 'Movie night', amount: 42.00, type: 'expense', category: 'Entertainment' },
  { id: '6', date: '2024-07-20', description: 'Internet Bill', amount: 60.00, type: 'expense', category: 'Utilities' },
  { id: '7', date: '2024-07-21', description: 'New shoes', amount: 120.00, type: 'expense', category: 'Shopping' },
  { id: '8', date: '2024-07-22', description: 'Pharmacy', amount: 25.30, type: 'expense', category: 'Health' },
  { id: '9', date: '2024-07-23', description: 'Dinner out', amount: 78.90, type: 'expense', category: 'Food' },
  { id: '10', date: '2024-07-25', description: 'Freelance Project', amount: 500, type: 'income', category: 'Income' },
  { id: '11', date: '2024-07-26', description: 'Electricity Bill', amount: 75.00, type: 'expense', category: 'Utilities' },
  { id: '12', date: '2024-07-28', description: 'Weekly Groceries', amount: 110.25, type: 'expense', category: 'Food' },
];

export const budgets: Budget[] = [
  { category: 'Housing', limit: 1200 },
  { category: 'Food', limit: 400 },
  { category: 'Transport', limit: 150 },
  { category: 'Entertainment', limit: 100 },
  { category: 'Health', limit: 100 },
  { category: 'Shopping', limit: 250 },
  { category: 'Utilities', limit: 200 },
];

export const goals: Goal[] = [
  { id: 'g1', name: 'Vacation to Hawaii', targetAmount: 4000, currentAmount: 1500, deadline: '2025-06-01' },
  { id: 'g2', name: 'New Laptop', targetAmount: 1800, currentAmount: 1100, deadline: '2024-12-01' },
  { id: 'g3', name: 'Emergency Fund', targetAmount: 10000, currentAmount: 6500, deadline: '2026-01-01' },
];
