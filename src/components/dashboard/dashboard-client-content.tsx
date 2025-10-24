'use client';
import { useMemo } from 'react';
import {
  DollarSign,
  CreditCard,
  Scale,
  Landmark,
  Utensils,
  Car,
  PartyPopper,
  HeartPulse,
  ShoppingBag,
  Lightbulb,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import type { Category, Transaction } from '@/lib/types';

import { useUser, useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, limit, orderBy } from 'firebase/firestore';

import { SummaryCard } from '@/components/dashboard/summary-card';
import { SpendingOverview } from '@/components/dashboard/spending-overview';
import { RecentTransactions } from '@/components/dashboard/recent-transactions';
import { BudgetsOverview } from '@/components/dashboard/budgets-overview';
import GoalsOverview from '@/components/dashboard/goals-overview-new';
import { BudgetOverviewMonthly } from '@/components/dashboard/budget-overview-monthly';
import { BudgetAlertMonitor, BudgetHealthIndicator } from '@/components/budgets/budget-alert-monitor';
import { GuidedTourLauncher } from '@/components/onboarding/GuidedTourLauncher';

export function DashboardClientContent({ children }: { children: React.ReactNode }) {
  const { user } = useUser();
  const firestore = useFirestore();

  // Optimisation : limiter les transactions récentes à 100
  const transactionsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(
      collection(firestore, `users/${user.uid}/expenses`),
      orderBy('date', 'desc'),
      limit(100)
    );
  }, [firestore, user]);
  const { data: transactions } = useCollection<Transaction>(transactionsQuery);

  const budgetsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, `users/${user.uid}/categories`));
  }, [firestore, user]);
  const { data: budgets } = useCollection<any>(budgetsQuery);

  // Les objectifs sont désormais chargés depuis le composant GoalsOverview lui-même

  // Optimisation : mémoriser les calculs coûteux
  const { totalIncome, totalExpenses, balance } = useMemo(() => {
    if (!transactions) return { totalIncome: 0, totalExpenses: 0, balance: 0 };
    
    let income = 0;
    let expenses = 0;
    
    // Une seule itération au lieu de deux filter + reduce
    for (const t of transactions) {
      const amount = t.amountInCents || 0;
      if (t.type === 'income') {
        income += amount;
      } else if (t.type === 'expense') {
        expenses += amount;
      }
    }
    
    return {
      totalIncome: income,
      totalExpenses: expenses,
      balance: income - expenses
    };
  }, [transactions]);

  // Optimisation : mémoriser les icônes pour éviter de les recréer
  const categoryIcons: Record<Category, React.ReactNode> = useMemo(() => ({
    Housing: <Landmark className="h-4 w-4 text-muted-foreground" />,
    Food: <Utensils className="h-4 w-4 text-muted-foreground" />,
    Transport: <Car className="h-4 w-4 text-muted-foreground" />,
    Entertainment: <PartyPopper className="h-4 w-4 text-muted-foreground" />,
    Health: <HeartPulse className="h-4 w-4 text-muted-foreground" />,
    Shopping: <ShoppingBag className="h-4 w-4 text-muted-foreground" />,
    Utilities: <Lightbulb className="h-4 w-4 text-muted-foreground" />,
    Income: <DollarSign className="h-4 w-4 text-muted-foreground" />,
  }), []);

  // Optimisation : mémoriser les 5 dernières transactions
  const recentTransactions = useMemo(() => {
    return transactions ? transactions.slice(0, 5) : [];
  }, [transactions]);

  // Optimisation : retour anticipé avec fallback plus léger
  if (!transactions || !budgets) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-muted-foreground">Chargement des données du tableau de bord...</div>
      </div>
    );
  }

  return (
    <>
      {/* Moniteur d'alertes budgétaires (invisible, agit en arrière-plan) */}
      <BudgetAlertMonitor />

      <div className="flex items-center justify-between mb-2">
        <div />
        <GuidedTourLauncher />
      </div>
      <div data-tour="summary-cards" className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-3">
        <SummaryCard title="Total Income" amountInCents={totalIncome} icon={<DollarSign />} />
        <SummaryCard title="Total Expenses" amountInCents={totalExpenses} icon={<CreditCard />} />
        <SummaryCard title="Balance" amountInCents={balance} icon={<Scale />} />
      </div>
      <div className="grid gap-4 md:gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div className="space-y-4">
          <Card data-tour="spending-overview">
            <CardHeader>
              <CardTitle className="font-headline">Spending Overview</CardTitle>
            </CardHeader>
            <CardContent className="pl-2">
              <SpendingOverview transactions={transactions} />
            </CardContent>
          </Card>
          {children ? (
            <div className="space-y-4">{children}</div>
          ) : null}
          <RecentTransactions transactions={recentTransactions} categoryIcons={categoryIcons} />
          <div data-tour="goals-overview">
            <GoalsOverview />
          </div>
        </div>
        <div className="grid auto-rows-max items-start gap-4 md:gap-8">
          {/* NOUVEAU : Vue budgétaire mensuelle avec pourcentages */}
          <div data-tour="budget-overview">
            <BudgetOverviewMonthly />
          </div>
          <BudgetsOverview budgets={budgets} transactions={transactions} categoryIcons={categoryIcons} />
        </div>
      </div>
    </>
  );
}
