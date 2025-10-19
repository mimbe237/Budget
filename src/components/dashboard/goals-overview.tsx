import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
  } from '@/components/ui/card';
  import { Progress } from '@/components/ui/progress';
  import type { Goal, Currency, UserProfile } from '@/lib/types';
  import { Target } from 'lucide-react';
  import { useDoc, useFirestore, useUser, useMemoFirebase } from '@/firebase';
  import { doc } from 'firebase/firestore';
  
  interface GoalsOverviewProps {
    goals: Goal[];
  }
  
  function formatMoney(amountInCents: number, currency: Currency, locale: string) {
    const amount = (amountInCents || 0) / 100;
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency,
      maximumFractionDigits: 0,
    }).format(amount);
  }

  export function GoalsOverview({ goals }: GoalsOverviewProps) {
    const { user } = useUser();
    const firestore = useFirestore();
    const userProfileRef = useMemoFirebase(() => {
        if (!firestore || !user) return null;
        return doc(firestore, `users/${user.uid}`);
    }, [firestore, user]);
    const { data: userProfile } = useDoc<UserProfile>(userProfileRef);

    const displayCurrency = userProfile?.displayCurrency || 'USD';
    const displayLocale = userProfile?.locale || 'en-US';

    return (
      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Financial Goals</CardTitle>
          <CardDescription>Your progress towards your financial targets.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6">
          {goals && goals.length > 0 ? (
            goals.map(goal => {
              const currentAmount = goal.currentAmountInCents || 0;
              const targetAmount = goal.targetAmountInCents || 0;
              const progress = targetAmount > 0 ? (currentAmount / targetAmount) * 100 : 0;
              return (
                <div key={goal.id} className="grid gap-2">
                  <div className="flex items-center">
                      <Target className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span className="font-semibold">{goal.name}</span>
                      <span className="ml-auto text-sm text-muted-foreground">
                          {formatMoney(currentAmount, goal.currency || displayCurrency, displayLocale)} / {formatMoney(targetAmount, goal.currency || displayCurrency, displayLocale)}
                      </span>
                  </div>
                  <Progress value={progress} aria-label={`${goal.name} progress`} />
                  <div className="text-xs text-muted-foreground">
                      Target: {new Date(goal.targetDate).toLocaleDateString(displayLocale, { year: 'numeric', month: 'long' })}
                  </div>
                </div>
              );
            })
          ) : (
             <p className="text-sm text-muted-foreground text-center">No goals set yet. Go to the Goals page to add one.</p>
          )}
        </CardContent>
      </Card>
    );
  }
  