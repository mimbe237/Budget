import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import type { Budget, Transaction, Category } from '@/lib/types';

interface BudgetsOverviewProps {
  budgets: Budget[];
  transactions: Transaction[];
  categoryIcons: Record<Category, React.ReactNode>;
}

export function BudgetsOverview({ budgets, transactions, categoryIcons }: BudgetsOverviewProps) {
  const spendingByCategory = transactions
    .filter(t => t.type === 'expense')
    .reduce((acc, t) => {
      if (!acc[t.category]) {
        acc[t.category] = 0;
      }
      acc[t.category] += t.amount;
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
          const spent = spendingByCategory[budget.category] || 0;
          const progress = Math.min((spent / budget.limit) * 100, 100);
          return (
            <div key={budget.category} className="grid gap-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    {categoryIcons[budget.category]}
                    <span className="font-medium">{budget.category}</span>
                </div>
                <span className="text-sm text-muted-foreground">
                  ${spent.toFixed(2)} / ${budget.limit.toFixed(2)}
                </span>
              </div>
              <Progress value={progress} aria-label={`${budget.category} budget progress`} />
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
