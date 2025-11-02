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

const FALLBACK_ERROR_INSIGHTS =
  "Impossible de récupérer les insights pour le moment.";
const FALLBACK_ERROR_RECOMMENDATIONS =
  "Les recommandations personnalisées sont temporairement indisponibles. Vérifiez la configuration de l’API ou réessayez plus tard.";
const FALLBACK_EMPTY_INSIGHTS = "Pas encore assez de données pour générer des insights.";
const FALLBACK_EMPTY_RECOMMENDATIONS =
  "Commencez par ajouter des transactions et définir vos budgets pour débloquer les recommandations personnalisées.";

export type AIInsightsState = {
  status: 'ok' | 'empty' | 'error';
  insights: string;
  recommendations: string;
  lastUpdatedLabel: string | null;
  sample: {
    transactionCount: number;
    budgetCount: number;
  };
};

export async function loadAIInsights(): Promise<AIInsightsState> {
  try {
    const user = await getAuthenticatedUser();

    if (!user) {
      return {
        status: 'error',
        insights: FALLBACK_ERROR_INSIGHTS,
        recommendations: FALLBACK_ERROR_RECOMMENDATIONS,
        lastUpdatedLabel: null,
        sample: { transactionCount: 0, budgetCount: 0 },
      };
    }

    const db = getAdminFirestore();

    let transactions: Transaction[] = [];
    let budgets: Budget[] = [];

    try {
      const [transactionsSnap, budgetsSnap] = await Promise.all([
        db.collection(`users/${user.uid}/expenses`).get(),
        db.collection(`users/${user.uid}/categories`).get(),
      ]);

      transactions = transactionsSnap.docs.map(doc => doc.data() as Transaction);
      budgets = budgetsSnap.docs.map(doc => doc.data() as Budget);
    } catch (firestoreError) {
      if (process.env.NODE_ENV !== 'production') {
        console.warn('[AIInsights] Firestore unavailable, returning offline fallback.', firestoreError);
      }
      return {
        status: 'error',
        insights: FALLBACK_ERROR_INSIGHTS,
        recommendations: FALLBACK_ERROR_RECOMMENDATIONS,
        lastUpdatedLabel: null,
        sample: { transactionCount: 0, budgetCount: 0 },
      };
    }

    if (transactions.length === 0) {
      return {
        status: 'empty',
        insights: FALLBACK_EMPTY_INSIGHTS,
        recommendations: FALLBACK_EMPTY_RECOMMENDATIONS,
        lastUpdatedLabel: null,
        sample: { transactionCount: 0, budgetCount: budgets.length },
      };
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
        return `${b.name}: ${amount.toFixed(2)}`;
      })
      .join('\n');

    let insights = FALLBACK_ERROR_INSIGHTS;
    let recommendations = FALLBACK_ERROR_RECOMMENDATIONS;

    try {
      const result = await getSpendingInsights({
        spendingHistory,
        budgetGoals,
      });
      insights = result.insights;
      recommendations = result.recommendations;
    } catch (error) {
      if (process.env.NODE_ENV !== 'production') {
        console.warn('[AIInsights] Falling back to default insights after Genkit error.', error);
      }
      return {
        status: 'error',
        insights: FALLBACK_ERROR_INSIGHTS,
        recommendations: FALLBACK_ERROR_RECOMMENDATIONS,
        lastUpdatedLabel: null,
        sample: { transactionCount: transactions.length, budgetCount: budgets.length },
      };
    }

    const latestTransactionDate = transactions
      .map(t => new Date(t.date ?? Date.now()).getTime())
      .sort((a, b) => b - a)[0];

    const formatter = new Intl.DateTimeFormat('fr-FR', {
      dateStyle: 'medium',
    });

    return {
      status: 'ok',
      insights,
      recommendations,
      lastUpdatedLabel: latestTransactionDate ? formatter.format(new Date(latestTransactionDate)) : null,
      sample: { transactionCount: transactions.length, budgetCount: budgets.length },
    };
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('[AIInsights] Failed to load AI insights data.', error);
    }
    return {
      status: 'error',
      insights: FALLBACK_ERROR_INSIGHTS,
      recommendations: FALLBACK_ERROR_RECOMMENDATIONS,
      lastUpdatedLabel: null,
      sample: { transactionCount: 0, budgetCount: 0 },
    };
  }
}

export async function AIInsightsWrapper() {
  const result = await loadAIInsights();
  return (
    <AIInsights
      mode="preview"
      status={result.status}
      insights={result.insights}
      recommendations={result.recommendations}
      onViewMoreHref="/ai-insights"
      lastUpdatedLabel={result.lastUpdatedLabel}
    />
  );
}
