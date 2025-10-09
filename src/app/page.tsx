import { Suspense } from 'react';
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
import { Button } from '@/components/ui/button';
import { transactions, budgets, goals } from '@/lib/data';
import type { Category } from '@/lib/types';

import { UserNav } from '@/components/user-nav';
import { Logo } from '@/components/logo';
import { SummaryCard } from '@/components/dashboard/summary-card';
import { SpendingOverview } from '@/components/dashboard/spending-overview';
import { RecentTransactions } from '@/components/dashboard/recent-transactions';
import { BudgetsOverview } from '@/components/dashboard/budgets-overview';
import { GoalsOverview } from '@/components/dashboard/goals-overview';
import { AIInsights } from '@/components/dashboard/ai-insights';
import { Skeleton } from '@/components/ui/skeleton';

export default function DashboardPage() {
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
              <AIInsights />
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
