import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import type { Transaction, Category, Currency } from '@/lib/types';

interface Budget {
    id: string;
    name: string;
    budgetedAmount: number;
    userId: string;
    category: Category;
}

interface BudgetsOverviewProps {
  budgets: Budget[];
  transactions: Transaction[];
  categoryIcons: Record<Category, React.ReactNode>;
}

function formatMoney(amount: number, currency: Currency) {
  // This is a simplified formatter. We'll enhance this later.
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
  }).format(amount);
}


export function BudgetsOverview({ budgets, transactions, categoryIcons }: BudgetsOverviewProps) {
  const spendingByCategory = transactions
    .filter(t => t.type === 'expense')
    .reduce((acc, t) => {
      if (!acc[t.category]) {
        acc[t.category] = 0;
      }
      // TODO: This assumes all transactions are in the same currency. Needs conversion.
      acc[t.category] += t.amountInCents;
      return acc;
    }, {} as Record<string, number>);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline">Budgets</CardTitle>
        <CardDescription>Your monthly spending limits.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        {budgets.map(budget => {
          const spentInCents = spendingByCategory[budget.name] || 0;
          const budgetedInCents = budget.budgetedAmount * 100;
          const progress = Math.min((spentInCents / budgetedInCents) * 100, 100);
          return (
            <div key={budget.id} className="grid gap-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    {categoryIcons[budget.name as Category]}
                    <span className="font-medium">{budget.name}</span>
                </div>
                <span className="text-sm text-muted-foreground">
                  {/* TODO: Use user's display currency */}
                  {formatMoney(spentInCents / 100, 'USD')} / {formatMoney(budget.budgetedAmount, 'USD')}
                </span>
              </div>
              <Progress value={progress} aria-label={`${budget.name} budget progress`} />
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
