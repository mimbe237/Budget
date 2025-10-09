import { getSpendingInsights } from '@/ai/flows/spending-insights';
import type { Transaction, Budget } from '@/lib/types';
import { AIInsights } from './ai-insights';

interface AIInsightsWrapperProps {
    transactions: Transaction[];
    budgets: Budget[];
}

export async function AIInsightsWrapper({ transactions, budgets }: AIInsightsWrapperProps) {
  const spendingHistory = transactions.map(t => `${t.date}: ${t.description} - $${t.amount.toFixed(2)} [${t.category}]`).join('\n');
  const budgetGoals = budgets.map(b => `${b.name}: $${b.budgetedAmount.toFixed(2)}`).join('\n');
  
  const { insights, recommendations } = await getSpendingInsights({
    spendingHistory,
    budgetGoals
  });

  return (
    <AIInsights insights={insights} recommendations={recommendations} />
  );
}
