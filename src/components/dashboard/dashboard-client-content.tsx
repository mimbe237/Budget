'use client';
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
import { collection, query } from 'firebase/firestore';

import { SummaryCard } from '@/components/dashboard/summary-card';
import { SpendingOverview } from '@/components/dashboard/spending-overview';
import { RecentTransactions } from '@/components/dashboard/recent-transactions';
import { BudgetsOverview } from '@/components/dashboard/budgets-overview';
import { GoalsOverview } from '@/components/dashboard/goals-overview';

export function DashboardClientContent({ children }: { children: React.ReactNode }) {
  const { user } = useUser();
  const firestore = useFirestore();

  const transactionsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, `users/${user.uid}/expenses`));
  }, [firestore, user]);
  const { data: transactions } = useCollection<Transaction>(transactionsQuery);

  const budgetsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, `users/${user.uid}/categories`));
  }, [firestore, user]);
  const { data: budgets } = useCollection<any>(budgetsQuery);

  const goalsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, `users/${user.uid}/budgetGoals`));
  }, [firestore, user]);
  const { data: goals } = useCollection<any>(goalsQuery);

  if (!transactions || !budgets || !goals) {
    return (
      <div className="flex items-center justify-center">
        <div>Loading dashboard data...</div>
      </div>
    );
  }

  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((acc, t) => acc + t.amountInCents, 0);
  const totalExpenses = transactions
    .filter(t => t.type === 'expense')
    .reduce((acc, t) => acc + t.amountInCents, 0);
  const balance = totalIncome - totalExpenses;

  const categoryIcons: Record<Category, React.ReactNode> = {
    Housing: <Landmark className="h-4 w-4 text-muted-foreground" />,
    Food: <Utensils className="h-4 w-4 text-muted-foreground" />,
    Transport: <Car className="h-4 w-4 text-muted-foreground" />,
    Entertainment: <PartyPopper className="h-4 w-4 text-muted-foreground" />,
    Health: <HeartPulse className="h-4 w-4 text-muted-foreground" />,
    Shopping: <ShoppingBag className="h-4 w-4 text-muted-foreground" />,
    Utilities: <Lightbulb className="h-4 w-4 text-muted-foreground" />,
    Income: <DollarSign className="h-4 w-4 text-muted-foreground" />,
  };

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-3">
        <SummaryCard title="Total Income" amountInCents={totalIncome} icon={<DollarSign />} />
        <SummaryCard title="Total Expenses" amountInCents={totalExpenses} icon={<CreditCard />} />
        <SummaryCard title="Balance" amountInCents={balance} icon={<Scale />} />
      </div>
      <div className="grid gap-4 md:gap-8 lg:grid-cols-2 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle className='font-headline'>Spending Overview</CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
            <SpendingOverview transactions={transactions} />
          </CardContent>
        </Card>
        <div className="grid auto-rows-max items-start gap-4 md:gap-8">
          {children}
          <BudgetsOverview budgets={budgets} transactions={transactions} categoryIcons={categoryIcons} />
        </div>
      </div>
      <div className="grid gap-4 md:gap-8 lg:grid-cols-2">
        <RecentTransactions transactions={transactions.slice(0, 5)} categoryIcons={categoryIcons} />
        <GoalsOverview goals={goals} />
      </div>
    </>
  );
}
