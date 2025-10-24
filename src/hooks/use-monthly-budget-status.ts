import { useMemo } from 'react';
import { useFirestore, useUser, useMemoFirebase } from '@/firebase';
import { useCollection } from '@/firebase/firestore/use-collection';
import { collection, doc, query, where, orderBy } from 'firebase/firestore';
import { startOfMonth, endOfMonth, format } from 'date-fns';
import type {
  MonthlyBudgetPlan,
  Transaction,
  BudgetStatus,
} from '@/lib/types';
import { calculateGlobalConsumption, formatBudgetPeriod } from '@/lib/budget-utils';

/**
 * Hook pour obtenir le statut budgétaire complet d'un mois donné
 * Calcule en temps réel les dépenses par catégorie et le pourcentage global
 */
export function useMonthlyBudgetStatus(period?: Date) {
  const { user } = useUser();
  const firestore = useFirestore();

  // Période par défaut : mois en cours
  const targetPeriod = period || new Date();
  const periodString = formatBudgetPeriod(targetPeriod);

  // Bornes du mois pour filtrer les transactions
  const monthStart = startOfMonth(targetPeriod);
  const monthEnd = endOfMonth(targetPeriod);
  const monthStartStr = format(monthStart, 'yyyy-MM-dd');
  const monthEndStr = format(monthEnd, 'yyyy-MM-dd');

  // Récupération du plan budgétaire pour cette période
  const budgetPlanQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(
      collection(firestore, `users/${user.uid}/monthlyBudgets`),
      where('period', '==', periodString)
    );
  }, [firestore, user, periodString]);

  // Récupération des transactions du mois
  const expensesQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(
      collection(firestore, `users/${user.uid}/expenses`),
      where('type', '==', 'expense'),
      orderBy('date', 'desc')
    );
  }, [firestore, user]);

  const { data: budgetPlan, isLoading: isBudgetLoading } = useCollection<MonthlyBudgetPlan>(budgetPlanQuery);
  const { data: expenses, isLoading: isExpensesLoading } = useCollection<Transaction>(expensesQuery);

  // Filtrer les transactions du mois côté client
  const monthlyExpenses = useMemo(() => {
    if (!expenses) return [];
    return expenses.filter(tx => {
      const txDate = tx.date;
      return txDate >= monthStartStr && txDate <= monthEndStr;
    });
  }, [expenses, monthStartStr, monthEndStr]);

  // Calcul du statut budgétaire
  const budgetStatus: BudgetStatus | null = useMemo(() => {
    if (!budgetPlan || budgetPlan.length === 0 || !monthlyExpenses) {
      return null;
    }

    const plan = budgetPlan[0];
    return calculateGlobalConsumption(
      periodString,
      plan.totalBudget,
      plan.categoryAllocations,
      monthlyExpenses
    );
  }, [budgetPlan, monthlyExpenses, periodString]);

  const isLoading = isBudgetLoading || isExpensesLoading;

  return {
    budgetStatus,
    budgetPlan: budgetPlan?.[0] || null,
    expenses: monthlyExpenses || [],
    isLoading,
    period: periodString,
  };
}

/**
 * Hook simplifié pour vérifier si un budget existe pour une période donnée
 */
export function useHasMonthlyBudget(period?: Date) {
  const { user } = useUser();
  const firestore = useFirestore();

  const targetPeriod = period || new Date();
  const periodString = formatBudgetPeriod(targetPeriod);

  const budgetQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(
      collection(firestore, `users/${user.uid}/monthlyBudgets`),
      where('period', '==', periodString)
    );
  }, [firestore, user, periodString]);

  const { data: budgets, isLoading } = useCollection<MonthlyBudgetPlan>(budgetQuery);

  return {
    hasBudget: (budgets?.length ?? 0) > 0,
    budget: budgets?.[0] || null,
    isLoading,
  };
}
