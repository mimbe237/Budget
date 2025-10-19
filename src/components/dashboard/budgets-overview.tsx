import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import type { Transaction, Budget, Category, Currency, UserProfile } from '@/lib/types';
import { useDoc, useFirestore, useUser, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';

interface BudgetsOverviewProps {
  budgets: Budget[];
  transactions: Transaction[];
  categoryIcons: Record<Category, React.ReactNode>;
}

function formatMoney(amount: number, currency: Currency, locale: string) {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
  }).format(amount || 0);
}

export function BudgetsOverview({ budgets, transactions, categoryIcons }: BudgetsOverviewProps) {
  const { user } = useUser();
  const firestore = useFirestore();
  const userProfileRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, `users/${user.uid}`);
  }, [firestore, user]);
  const { data: userProfile } = useDoc<UserProfile>(userProfileRef);
    
  const displayCurrency = userProfile?.displayCurrency || 'USD';
  const displayLocale = userProfile?.locale || 'en-US';

  const spendingByCategory = transactions
    .filter(t => t.type === 'expense')
    .reduce((acc, t) => {
      const categoryName = budgets.find(b => b.id === t.categoryId)?.name || t.category;
      if (!acc[categoryName]) {
        acc[categoryName] = 0;
      }
      acc[categoryName] += t.amountInCents || 0;
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
            const budgetedInCents = (budget.budgetedAmount || 0) * 100;
            const progress = budgetedInCents > 0 ? Math.min((spentInCents / budgetedInCents) * 100, 100) : 0;
            
            return (
              <div key={budget.id} className="grid gap-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                      {categoryIcons[budget.name as Category] || categoryIcons['Shopping']}
                      <span className="font-medium">{budget.name}</span>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {formatMoney(spentInCents / 100, displayCurrency, displayLocale)} / {formatMoney(budget.budgetedAmount, displayCurrency, displayLocale)}
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
