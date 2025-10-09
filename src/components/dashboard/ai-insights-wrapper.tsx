'use server';
import { getSpendingInsights } from '@/ai/flows/spending-insights';
import type { Transaction, Budget } from '@/lib/types';
import { AIInsights } from './ai-insights';
import { headers } from 'next/headers';
import { getFirebaseAdmin } from '@/firebase/admin';
import { User } from 'firebase-admin/auth';
import { DecodedIdToken } from 'firebase-admin/lib/auth/token-verifier';

async function getAuthenticatedUser(): Promise<User | DecodedIdToken | null> {
    const authHeader = headers().get('Authorization');
    if (authHeader) {
        const token = authHeader.split(' ')[1];
        try {
            const decodedToken = await getFirebaseAdmin().auth().verifyIdToken(token);
            return decodedToken;
        } catch (error) {
            console.error('Error verifying token:', error);
            try {
                // Fallback for user, not fully implemented for this case.
                const user = await getFirebaseAdmin().auth().getUser(token);
                return user;
            } catch (userError) {
                console.error('Error getting user by UID:', userError);
                return null;
            }
        }
    }
    return null;
}


export async function AIInsightsWrapper() {
  const user = await getAuthenticatedUser();

  if (!user) {
    return <AIInsights insights="Could not load insights." recommendations="User not found." />;
  }

  const db = getFirebaseAdmin().firestore();
  const transactionsSnap = await db.collection(`users/${user.uid}/expenses`).get();
  const budgetsSnap = await db.collection(`users/${user.uid}/categories`).get();

  const transactions = transactionsSnap.docs.map(doc => doc.data() as Transaction);
  const budgets = budgetsSnap.docs.map(doc => doc.data() as Budget);

  const spendingHistory = transactions.map(t => `${t.date}: ${t.description} - $${t.amount.toFixed(2)} [${t.category}]`).join('\n');
  const budgetGoals = budgets.map(b => `${b.name}: $${b.budgetedAmount.toFixed(2)}`).join('\n');

  if (transactions.length === 0) {
      return <AIInsights insights="Not enough data yet." recommendations="Start adding transactions to get personalized insights." />;
  }
  
  const { insights, recommendations } = await getSpendingInsights({
    spendingHistory,
    budgetGoals
  });

  return (
    <AIInsights insights={insights} recommendations={recommendations} />
  );
}
