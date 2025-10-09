import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import type { Transaction, Category } from '@/lib/types';

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
          const spent = spendingByCategory[budget.name] || 0;
          const progress = Math.min((spent / budget.budgetedAmount) * 100, 100);
          return (
            <div key={budget.id} className="grid gap-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    {categoryIcons[budget.name as Category]}
                    <span className="font-medium">{budget.name}</span>
                </div>
                <span className="text-sm text-muted-foreground">
                  ${spent.toFixed(2)} / ${budget.budgetedAmount.toFixed(2)}
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
