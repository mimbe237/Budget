import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
  } from '@/components/ui/card';
  import { Progress } from '@/components/ui/progress';
  import type { Goal, Currency } from '@/lib/types';
  import { Target } from 'lucide-react';
  
  interface GoalsOverviewProps {
    goals: Goal[];
  }
  
  function formatMoney(amountInCents: number, currency: Currency = 'USD') {
    const amount = amountInCents / 100;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      maximumFractionDigits: 0,
    }).format(amount);
  }

  export function GoalsOverview({ goals }: GoalsOverviewProps) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Financial Goals</CardTitle>
          <CardDescription>Your progress towards your financial targets.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6">
          {goals && goals.length > 0 ? (
            goals.map(goal => {
              const progress = goal.targetAmountInCents > 0 ? (goal.currentAmountInCents / goal.targetAmountInCents) * 100 : 0;
              return (
                <div key={goal.id} className="grid gap-2">
                  <div className="flex items-center">
                      <Target className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span className="font-semibold">{goal.name}</span>
                      <span className="ml-auto text-sm text-muted-foreground">
                          {formatMoney(goal.currentAmountInCents, goal.currency)} / {formatMoney(goal.targetAmountInCents, goal.currency)}
                      </span>
                  </div>
                  <Progress value={progress} aria-label={`${goal.name} progress`} />
                  <div className="text-xs text-muted-foreground">
                      Target: {new Date(goal.targetDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}
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
  