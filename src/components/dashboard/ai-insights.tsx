import { Lightbulb } from 'lucide-react';
import { getSpendingInsights } from '@/ai/flows/spending-insights';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from '@/components/ui/card';
import type { Transaction, Budget } from '@/lib/types';

interface AIInsightsProps {
    transactions: Transaction[];
    budgets: Budget[];
}

export async function AIInsights({ transactions, budgets }: AIInsightsProps) {
  const spendingHistory = transactions.map(t => `${t.date}: ${t.description} - $${t.amount.toFixed(2)} [${t.category}]`).join('\n');
  const budgetGoals = budgets.map(b => `${b.category}: $${b.budgetedAmount.toFixed(2)}`).join('\n');
  
  const { insights, recommendations } = await getSpendingInsights({
    spendingHistory,
    budgetGoals
  });

  return (
    <Card className="bg-accent/20 border-accent/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 font-headline">
          <Lightbulb className="h-5 w-5 text-primary" />
          Smart Savings
        </CardTitle>
        <CardDescription>AI-powered tips to improve your finances.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 text-sm">
        <div>
          <h4 className="font-semibold mb-1">Insights:</h4>
          <p className="text-muted-foreground">{insights}</p>
        </div>
        <div>
          <h4 className="font-semibold mb-1">Recommendations:</h4>
          <p className="text-muted-foreground">{recommendations}</p>
        </div>
      </CardContent>
    </Card>
  );
}
