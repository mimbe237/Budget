import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
  } from '@/components/ui/card';
  import { Progress } from '@/components/ui/progress';
  import type { Goal } from '@/lib/types';
  import { TrendingUp } from 'lucide-react';
  
  interface GoalsOverviewProps {
    goals: Goal[];
  }
  
  export function GoalsOverview({ goals }: GoalsOverviewProps) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Financial Goals</CardTitle>
          <CardDescription>Your progress towards your financial targets.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6">
          {goals.map(goal => {
            const progress = (goal.currentAmount / goal.targetAmount) * 100;
            return (
              <div key={goal.id} className="grid gap-2">
                <div className="flex items-center">
                    <TrendingUp className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span className="font-semibold">{goal.name}</span>
                    <span className="ml-auto text-sm text-muted-foreground">
                        ${goal.currentAmount.toLocaleString()} / ${goal.targetAmount.toLocaleString()}
                    </span>
                </div>
                <Progress value={progress} aria-label={`${goal.name} progress`} />
                <div className="text-xs text-muted-foreground">
                    Deadline: {new Date(goal.deadline).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
    );
  }
  