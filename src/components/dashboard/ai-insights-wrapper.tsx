'use server';
import { getSpendingInsights } from '@/ai/flows/spending-insights';
import type { Transaction, Budget } from '@/lib/types';
import { AIInsights } from './ai-insights';
import { cookies, headers } from 'next/headers';
import { getAdminAuth, getAdminFirestore } from '@/firebase/admin';
import type { DecodedIdToken } from 'firebase-admin/auth';

async function getAuthenticatedUser(): Promise<DecodedIdToken | null> {
  const headersInstance = headers();
  let token = headersInstance.get('Authorization')?.split(' ')[1] || null;

  if (!token) {
    const cookieStore = cookies();
    token = cookieStore.get('firebaseIdToken')?.value || null;
  }

  if (!token) {
    return null;
  }

  try {
    const adminAuth = getAdminAuth();
    const decodedToken = await adminAuth.verifyIdToken(token);
    return decodedToken;
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.debug('[AIInsights] Unable to verify auth token.', error);
    }
    return null;
  }
}


export async function AIInsightsWrapper() {
  const user = await getAuthenticatedUser();

  if (!user) {
    return <AIInsights insights="Could not load insights." recommendations="User not found." />;
  }
  
  const db = getAdminFirestore();
  
  const transactionsSnap = await db.collection(`users/${user.uid}/expenses`).get();
  const budgetsSnap = await db.collection(`users/${user.uid}/categories`).get();

  const transactions = transactionsSnap.docs.map(doc => doc.data() as Transaction);
  const budgets = budgetsSnap.docs.map(doc => doc.data() as Budget);

  if (transactions.length === 0) {
      return <AIInsights insights="Not enough data yet." recommendations="Start adding transactions to get personalized insights." />;
  }

  const spendingHistory = transactions.map(t => {
      const amount = (t.amountInCents || 0) / 100;
      return `${t.date}: ${t.description} - ${amount.toFixed(2)} ${t.currency} [${t.category}]`;
  }).join('\n');
  
  const budgetGoals = budgets.map(b => {
      const amount = b.budgetedAmount || 0;
      return `${b.name}: ${amount.toFixed(2)}`; // Assuming budgets don't have a currency field yet.
  }).join('\n');
  
  const { insights, recommendations } = await getSpendingInsights({
    spendingHistory,
    budgetGoals
  });

  return (
    <AIInsights insights={insights} recommendations={recommendations} />
  );
}
