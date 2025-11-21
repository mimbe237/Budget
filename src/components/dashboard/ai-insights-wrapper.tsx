'use server';
import { getSpendingInsights } from '@/ai/flows/spending-insights';
import type { Transaction, Budget } from '@/lib/types';
import { AIInsights } from './ai-insights';
import { cookies, headers } from 'next/headers';
import { getAdminAuth, getAdminFirestore } from '@/firebase/admin';
import type { DecodedIdToken } from 'firebase-admin/auth';
import { 
  getCachedInsights, 
  setCachedInsights, 
  generateDataHash,
  hasDataChanged 
} from '@/lib/ai-cache';

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
      // Limiter aux 60 derniers jours et max 100 transactions pour réduire les coûts
      const sixtyDaysAgo = new Date();
      sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

      const [transactionsSnap, budgetsSnap] = await Promise.all([
        db.collection(`users/${user.uid}/expenses`)
          .where('date', '>=', sixtyDaysAgo.toISOString())
          .orderBy('date', 'desc')
          .limit(100)
          .get(),
        db.collection(`users/${user.uid}/categories`).get(),
      ]);

      transactions = transactionsSnap.docs.map(doc => doc.data() as Transaction);
      budgets = budgetsSnap.docs.map(doc => doc.data() as Budget);
    } catch (firestoreError) {
      const errorMessage = firestoreError instanceof Error ? firestoreError.message : 'Unknown error';
      const isNetworkError = errorMessage.includes('UNAVAILABLE') || 
                             errorMessage.includes('ECONNRESET') ||
                             errorMessage.includes('ETIMEDOUT') ||
                             errorMessage.includes('No connection established');
      
      if (process.env.NODE_ENV !== 'production') {
        if (isNetworkError) {
          console.info('[AIInsights] Firestore network unavailable, using fallback content.');
        } else {
          console.warn('[AIInsights] Firestore unavailable, returning offline fallback.', firestoreError);
        }
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

    // Générer le hash des données pour détecter les changements
    const dataHash = generateDataHash({
      transactionIds: transactions.map(t => t.id),
      budgetIds: budgets.map(b => b.id),
      transactionCount: transactions.length,
      budgetCount: budgets.length,
    });

    // Vérifier si on a un cache valide
    const cachedResult = await getCachedInsights(user.uid);
    
    if (cachedResult) {
      // Vérifier si les données ont changé
      const dataChanged = await hasDataChanged(user.uid, dataHash);
      
      if (!dataChanged) {
        // Utiliser le cache
        if (process.env.NODE_ENV !== 'production') {
          console.info(`[AIInsights] Using cached insights for user ${user.uid}`);
        }
        
        const latestTransactionDate = transactions
          .map(t => new Date(t.date ?? Date.now()).getTime())
          .sort((a, b) => b - a)[0];

        const formatter = new Intl.DateTimeFormat('fr-FR', {
          dateStyle: 'medium',
        });

        return {
          status: 'ok',
          insights: cachedResult.insights,
          recommendations: cachedResult.recommendations,
          lastUpdatedLabel: latestTransactionDate ? formatter.format(new Date(latestTransactionDate)) : null,
          sample: { transactionCount: transactions.length, budgetCount: budgets.length },
        };
      }
    }

    // Pas de cache valide ou données changées - générer de nouveaux insights
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
      if (process.env.NODE_ENV !== 'production') {
        console.info(`[AIInsights] Generating new insights for user ${user.uid}`);
      }

      const result = await getSpendingInsights({
        spendingHistory,
        budgetGoals,
      });
      insights = result.insights;
      recommendations = result.recommendations;

      // Sauvegarder dans le cache
      const transactionDates = transactions.map(t => new Date(t.date ?? Date.now()));
      const periodStart = new Date(Math.min(...transactionDates.map(d => d.getTime()))).toISOString();
      const periodEnd = new Date(Math.max(...transactionDates.map(d => d.getTime()))).toISOString();

      await setCachedInsights(user.uid, insights, recommendations, {
        dataHash,
        transactionCount: transactions.length,
        budgetCount: budgets.length,
        periodStart,
        periodEnd,
      });
    } catch (error) {
      // Erreur réseau ou API - utiliser fallback silencieusement
      if (process.env.NODE_ENV !== 'production') {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        const isNetworkError = errorMessage.includes('fetch failed') || 
                               errorMessage.includes('ECONNRESET') ||
                               errorMessage.includes('ETIMEDOUT') ||
                               errorMessage.includes('SocketError');
        
        if (isNetworkError) {
          console.info('[AIInsights] Network unavailable, using fallback content.');
        } else {
          console.warn('[AIInsights] Falling back to default insights after Genkit error.', error);
        }
      }
      // Retourner le fallback sans re-lancer l'erreur
      insights = FALLBACK_ERROR_INSIGHTS;
      recommendations = FALLBACK_ERROR_RECOMMENDATIONS;
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
