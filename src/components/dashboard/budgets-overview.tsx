import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import type { Transaction, Budget, Category, Currency } from '@/lib/types';

interface BudgetsOverviewProps {
  budgets: Budget[];
  transactions: Transaction[];
  categoryIcons: Record<Category, React.ReactNode>;
}

function formatMoney(amount: number, currency: Currency = 'USD') {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
  }).format(amount);
}

export function BudgetsOverview({ budgets, transactions, categoryIcons }: BudgetsOverviewProps) {
  const spendingByCategory = transactions
    .filter(t => t.type === 'expense')
    .reduce((acc, t) => {
      const categoryName = budgets.find(b => b.id === t.categoryId)?.name || t.category;
      if (!acc[categoryName]) {
        acc[categoryName] = 0;
      }
      acc[categoryName] += t.amountInCents;
      return acc;
    }, {} as Record<string, number>);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline">Budgets</CardTitle>
        <CardDescription>Your monthly spending limits.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        {budgets.length > 0 ? (
          budgets.map(budget => {
            const spentInCents = spendingByCategory[budget.name] || 0;
            const budgetedInCents = budget.budgetedAmount * 100;
            const progress = budgetedInCents > 0 ? Math.min((spentInCents / budgetedInCents) * 100, 100) : 0;
            
            return (
              <div key={budget.id} className="grid gap-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                      {categoryIcons[budget.name as Category] || categoryIcons['Shopping']}
                      <span className="font-medium">{budget.name}</span>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {formatMoney(spentInCents / 100)} / {formatMoney(budget.budgetedAmount)}
                  </span>
                </div>
                <Progress value={progress} aria-label={`${budget.name} budget progress`} />
              </div>
            );
          })
        ) : (
          <p className="text-sm text-muted-foreground text-center">No budgets set yet. Go to Categories to add one.</p>
        )}
      </CardContent>
    </Card>
  );
}
