'use server';
import { getSpendingInsights } from '@/ai/flows/spending-insights';
import type { Transaction, Budget } from '@/lib/types';
import { AIInsights } from './ai-insights';
import { cookies, headers } from 'next/headers';
import { getAdminAuth, getAdminFirestore } from '@/firebase/admin';
import type { DecodedIdToken } from 'firebase-admin/auth';

async function getAuthenticatedUser(): Promise<DecodedIdToken | null> {
  const headersInstance = await headers();
  let token = headersInstance.get('Authorization')?.split(' ')[1] || null;

  if (!token) {
    const cookieStore = await cookies();
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
  try {
    const user = await getAuthenticatedUser();

    if (!user) {
      return (
        <AIInsights
          insights="Could not load insights."
          recommendations="User not found."
        />
      );
    }

    const db = getAdminFirestore();

    const transactionsSnap = await db
      .collection(`users/${user.uid}/expenses`)
      .get();
    const budgetsSnap = await db
      .collection(`users/${user.uid}/categories`)
      .get();

    const transactions = transactionsSnap.docs.map(
      doc => doc.data() as Transaction
    );
    const budgets = budgetsSnap.docs.map(doc => doc.data() as Budget);

    if (transactions.length === 0) {
      return (
        <AIInsights
          insights="Not enough data yet."
          recommendations="Start adding transactions to get personalized insights."
        />
      );
    }

    const spendingHistory = transactions
      .map(t => {
        const amount = (t.amountInCents || 0) / 100;
        return `${t.date}: ${t.description} - ${amount.toFixed(2)} ${t.currency} [${t.category}]`;
      })
      .join('\n');

    const budgetGoals = budgets
      .map(b => {
        const amount = b.budgetedAmount || 0;
        return `${b.name}: ${amount.toFixed(2)}`; // Assuming budgets don't have a currency field yet.
      })
      .join('\n');

    let insights = 'Not enough data to generate insights.';
    let recommendations =
      'Add more transactions and budget data to unlock personalized recommendations.';

    try {
      const result = await getSpendingInsights({
        spendingHistory,
        budgetGoals
      });
      insights = result.insights;
      recommendations = result.recommendations;
    } catch (error) {
      if (process.env.NODE_ENV !== 'production') {
        console.warn('[AIInsights] Falling back to default insights after Genkit error.', error);
      }
      insights = 'Impossible de récupérer les insights pour le moment. Vérifiez la configuration de l’API Gemini ou réessayez plus tard.';
      recommendations =
        'Assurez-vous que la clé d’API est valide et que le service est atteignable. Vous pouvez consulter les rapports pour des analyses manuelles en attendant.';
    }

    return (
      <AIInsights insights={insights} recommendations={recommendations} />
    );
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('[AIInsights] Failed to render AI insights widget. Falling back to safe defaults.', error);
    }
    return (
      <AIInsights
        insights="Impossible de récupérer les insights pour le moment."
        recommendations="Les recommandations personnalisées sont temporairement indisponibles. Vérifiez la configuration de l’API ou réessayez plus tard."
      />
    );
  }
}
