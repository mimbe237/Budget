'use server';
import { getSpendingInsights } from '@/ai/flows/spending-insights';
import type { Transaction, Budget, UserProfile } from '@/lib/types';
import { AIInsights } from './ai-insights';
import { headers } from 'next/headers';
import { getFirebaseAdminApp } from '@/firebase/admin';
import { DecodedIdToken } from 'firebase-admin/lib/auth/token-verifier';

async function getAuthenticatedUser(): Promise<DecodedIdToken | null> {
    const authHeader = headers().get('Authorization');
    if (authHeader) {
        const token = authHeader.split(' ')[1];
        try {
            const adminApp = getFirebaseAdminApp();
            const decodedToken = await adminApp.auth().verifyIdToken(token);
            return decodedToken;
        } catch (error) {
            console.error('Error verifying auth token:', error);
            return null;
        }
    }
    return null;
}


export async function AIInsightsWrapper() {
  const user = await getAuthenticatedUser();

  if (!user) {
    return <AIInsights insights="Could not load insights." recommendations="User not found." />;
  }
  
  const adminApp = getFirebaseAdminApp();
  const db = adminApp.firestore();
  
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
