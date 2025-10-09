'use client';
import { Suspense, useEffect } from 'react';
import {
  Car,
  CreditCard,
  DollarSign,
  Landmark,
  Lightbulb,
  PartyPopper,
  Scale,
  ShoppingBag,
  Utensils,
  HeartPulse
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import type { Category, Transaction } from '@/lib/types';
import { useRouter } from 'next/navigation';

import { useUser, useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';

import { UserNav } from '@/components/user-nav';
import { Logo } from '@/components/logo';
import { SummaryCard } from '@/components/dashboard/summary-card';
import { SpendingOverview } from '@/components/dashboard/spending-overview';
import { RecentTransactions } from '@/components/dashboard/recent-transactions';
import { BudgetsOverview } from '@/components/dashboard/budgets-overview';
import { AIInsightsWrapper } from '@/components/dashboard/ai-insights-wrapper';
import { Skeleton } from '@/components/ui/skeleton';
import { GoalsOverview } from '@/components/dashboard/goals-overview';

export default function DashboardPage() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const firestore = useFirestore();

  const transactionsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, `users/${user.uid}/expenses`));
  }, [firestore, user]);
  const { data: transactions, isLoading: transactionsLoading } = useCollection<Transaction>(transactionsQuery);

  const budgetsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, `users/${user.uid}/categories`));
  }, [firestore, user]);
  const { data: budgets, isLoading: budgetsLoading } = useCollection<any>(budgetsQuery);

  const goalsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, `users/${user.uid}/budgetGoals`));
  }, [firestore, user]);
  const { data: goals, isLoading: goalsLoading } = useCollection<any>(goalsQuery);

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login');
    }
  }, [user, isUserLoading, router]);

  if (isUserLoading || !user || !transactions || !budgets || !goals) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-2xl font-semibold">Loading your dashboard...</div>
      </div>
    );
  }

  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((acc, t) => acc + t.amount, 0);
  const totalExpenses = transactions
    .filter(t => t.type === 'expense')
    .reduce((acc, t) => acc + t.amount, 0);
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
    <div className="flex min-h-screen w-full flex-col">
      <header className="sticky top-0 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6 z-10">
        <nav className="hidden flex-col gap-6 text-lg font-medium md:flex md:flex-row md:items-center md:gap-5 md:text-sm lg:gap-6">
          <Logo />
        </nav>
        <div className="flex w-full items-center gap-4 md:ml-auto md:gap-2 lg:gap-4">
          <div className="ml-auto flex-1 sm:flex-initial">
          </div>
          <UserNav />
        </div>
      </header>
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-4">
          <SummaryCard title="Total Income" amount={totalIncome} icon={<DollarSign />} />
          <SummaryCard title="Total Expenses" amount={totalExpenses} icon={<CreditCard />} />
          <SummaryCard title="Balance" amount={balance} icon={<Scale />} />
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
            <Suspense fallback={<Card><CardHeader><Skeleton className="h-6 w-32" /></CardHeader><CardContent><Skeleton className="h-20 w-full" /></CardContent></Card>}>
              <AIInsightsWrapper transactions={transactions} budgets={budgets} />
            </Suspense>
            <BudgetsOverview budgets={budgets} transactions={transactions} categoryIcons={categoryIcons} />
          </div>
        </div>
        <div className="grid gap-4 md:gap-8 lg:grid-cols-2">
            <RecentTransactions transactions={transactions.slice(0, 5)} categoryIcons={categoryIcons} />
            <GoalsOverview goals={goals} />
        </div>
      </main>
    </div>
  );
}
