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
import { AlertCircle, CheckCircle2, TrendingUp } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

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

const BudgetStatusAlert = ({ overallProgress, isFrench }: { overallProgress: number, isFrench: boolean }) => {
    if (isNaN(overallProgress)) {
        return null;
    }

    if (overallProgress < 75) {
        return (
            <Alert className="bg-green-50 border-green-200 text-green-800 dark:bg-green-950 dark:border-green-800 dark:text-green-200">
                <CheckCircle2 className="h-4 w-4 !text-green-500" />
                <AlertTitle className="font-semibold">{isFrench ? 'Excellent !' : 'Excellent!'}</AlertTitle>
                <AlertDescription className="text-xs">
                    {isFrench ? 'Vous maîtrisez parfaitement votre budget ce mois-ci. Continuez comme ça !' : 'You are managing your budget perfectly this month. Keep up the great work!'}
                </AlertDescription>
            </Alert>
        );
    } else if (overallProgress <= 100) {
        return (
            <Alert className="bg-yellow-50 border-yellow-200 text-yellow-800 dark:bg-yellow-950 dark:border-yellow-800 dark:text-yellow-200">
                <AlertCircle className="h-4 w-4 !text-yellow-500" />
                <AlertTitle className="font-semibold">{isFrench ? 'Attention' : 'Attention'}</AlertTitle>
                <AlertDescription className="text-xs">
                    {isFrench ? 'Vous approchez de vos limites. Gardez un œil sur vos prochaines dépenses.' : 'You are approaching your limits. Keep an eye on your upcoming expenses.'}
                </AlertDescription>
            </Alert>
        );
    } else {
        return (
            <Alert variant="destructive" className="bg-red-50 border-red-200 text-red-800 dark:bg-red-950 dark:border-red-800 dark:text-red-200">
                <TrendingUp className="h-4 w-4 !text-red-500" />
                <AlertTitle className="font-semibold">{isFrench ? 'Budget Dépassé' : 'Budget Exceeded'}</AlertTitle>
                <AlertDescription className="text-xs">
                    {isFrench ? 'Vous avez dépassé votre budget. Analysez vos dépenses pour ajuster le tir.' : 'You have exceeded your budget. Analyze your expenses to make adjustments.'}
                </AlertDescription>
            </Alert>
        );
    }
};

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
  const isFrench = userProfile?.locale === 'fr-CM';

  const expenses = transactions.filter(t => t.type === 'expense');
  
  const budgetData = budgets.map(budget => {
    const spent = expenses
      .filter(e => e.category === budget.name)
      .reduce((sum, e) => sum + (e.amountInCents || 0), 0) / 100;
    const limit = budget.budgetedAmount || 0;
    const progress = limit > 0 ? (spent / limit) * 100 : 0;
    
    return {
      id: budget.id,
      name: budget.name,
      spent,
      limit,
      progress,
    };
  });

  const totalSpent = budgetData.reduce((sum, b) => sum + b.spent, 0);
  const totalBudgeted = budgetData.reduce((sum, b) => sum + b.limit, 0);
  const overallProgress = totalBudgeted > 0 ? (totalSpent / totalBudgeted) * 100 : 0;

  const translations = {
      title: isFrench ? 'Suivi Budgétaire Mensuel' : 'Monthly Budget Tracking',
      description: isFrench ? 'Votre performance par rapport à vos budgets.' : 'How you are performing against your budgets.',
      noBudgets: isFrench ? 'Aucun budget défini. Allez dans Catégories pour en ajouter.' : 'No budgets set. Go to Categories to add some.',
  };


  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline">{translations.title}</CardTitle>
        <CardDescription>{translations.description}</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-6">
        {budgetData.length > 0 ? (
          <>
            {budgetData.map(budget => {
                let progressColor = 'bg-green-500';
                if (budget.progress > 100) {
                    progressColor = 'bg-red-500';
                } else if (budget.progress > 70) {
                    progressColor = 'bg-orange-500';
                }

                return (
                    <div key={budget.id} className="grid gap-2">
                        <div className="flex items-center">
                        {categoryIcons[budget.name as Category]}
                        <span className="font-semibold ml-2">{budget.name}</span>
                        <span className="ml-auto text-sm text-muted-foreground">
                            {formatMoney(budget.spent, displayCurrency, displayLocale)} / {formatMoney(budget.limit, displayCurrency, displayLocale)}
                        </span>
                        </div>
                        <Progress value={budget.progress > 100 ? 100 : budget.progress} className={progressColor} aria-label={`${budget.name} budget progress`}/>
                    </div>
                )
            })}
             <div className="mt-4">
                <BudgetStatusAlert overallProgress={overallProgress} isFrench={!!isFrench} />
            </div>
          </>
        ) : (
          <p className="text-sm text-muted-foreground text-center">{translations.noBudgets}</p>
        )}
      </CardContent>
    </Card>
  );
}
