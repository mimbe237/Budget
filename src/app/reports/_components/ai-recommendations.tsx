'use server';

import { getSpendingInsights } from '@/ai/flows/spending-insights';
import type { FinancialReportData, UserProfile } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Lightbulb, TrendingUp, AlertTriangle, Target, Sparkles } from 'lucide-react';
import { 
  getCachedInsights, 
  setCachedInsights, 
  generateDataHash,
  hasDataChanged 
} from '@/lib/ai-cache';

interface AIRecommendationsProps {
  reportData: FinancialReportData;
  userProfile: UserProfile | null;
  isFrench: boolean;
}

/**
 * Composant serveur qui utilise Genkit pour générer des recommandations IA
 * basées sur les données financières complètes de l'utilisateur
 */
export async function AIRecommendations({ 
  reportData, 
  userProfile,
  isFrench 
}: AIRecommendationsProps) {
  const translations = {
    title: isFrench ? 'Recommandations IA Personnalisées' : 'Personalized AI Recommendations',
    subtitle: isFrench 
      ? 'Analyse intelligente de vos habitudes financières' 
      : 'Smart analysis of your financial habits',
    insightsLabel: isFrench ? 'Insights' : 'Insights',
    recommendationsLabel: isFrench ? 'Recommandations' : 'Recommendations',
    loading: isFrench ? 'Analyse en cours...' : 'Analyzing...',
    disclaimer: isFrench 
      ? 'Ces conseils sont générés par IA à titre éducatif uniquement et ne constituent pas des conseils financiers professionnels.' 
      : 'These AI-generated tips are for educational purposes only and do not constitute professional financial advice.',
  };

  // Helper pour formater l'argent
  const formatMoney = (amountInCents: number) => {
    const currency = userProfile?.displayCurrency || 'USD';
    const locale = userProfile?.locale || 'en-US';
    return new Intl.NumberFormat(locale, { style: 'currency', currency }).format((amountInCents || 0) / 100);
  };

  // Extraire l'userId des données (depuis le premier élément disponible)
  const userId = reportData.recentTransactions[0]?.userId || reportData.goals[0]?.userId;
  
  if (!userId) {
    // Pas d'userId disponible, impossible de gérer le cache
    return (
      <Card className="mb-6 border-gray-200">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-gray-600" />
            {translations.title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600">
            {isFrench 
              ? 'Impossible de charger les recommandations IA pour le moment.'
              : 'Unable to load AI recommendations at the moment.'}
          </p>
        </CardContent>
      </Card>
    );
  }

  // Générer le hash des données pour détecter les changements
  const dataHash = generateDataHash({
    transactionIds: reportData.recentTransactions.map(t => t.id),
    budgetIds: reportData.budgetVsActual.map(b => b.category), // Utiliser les catégories comme IDs
    transactionCount: reportData.recentTransactions.length,
    budgetCount: reportData.budgetVsActual.length,
  });

  // Vérifier si on a un cache valide
  const cachedResult = await getCachedInsights(userId);
  
  if (cachedResult) {
    // Vérifier si les données ont changé
    const dataChanged = await hasDataChanged(userId, dataHash);
    
    if (!dataChanged) {
      // Utiliser le cache
      if (process.env.NODE_ENV !== 'production') {
        console.info(`[AIRecommendations] Using cached insights for user ${userId}`);
      }

      return (
        <Card className="mb-6 border-blue-200 bg-gradient-to-br from-blue-50 to-white">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-blue-600" />
              {translations.title}
            </CardTitle>
            <p className="text-sm text-gray-600 mt-1">{translations.subtitle}</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Insights Section */}
              <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Lightbulb className="h-4 w-4 text-amber-600" />
                  {translations.insightsLabel}
                </h4>
                <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
                  <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
                    {cachedResult.insights}
                  </p>
                </div>
              </div>

              {/* Recommendations Section */}
              <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Target className="h-4 w-4 text-green-600" />
                  {translations.recommendationsLabel}
                </h4>
                <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
                  <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
                    {cachedResult.recommendations}
                  </p>
                </div>
              </div>

              {/* Disclaimer */}
              <div className="border-t pt-4">
                <p className="text-xs text-gray-500 italic flex items-start gap-2">
                  <AlertTriangle className="h-3 w-3 mt-0.5 flex-shrink-0" />
                  <span>{translations.disclaimer}</span>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      );
    }
  }

  // Pas de cache valide ou données changées - générer de nouveaux insights
  if (process.env.NODE_ENV !== 'production') {
    console.info(`[AIRecommendations] Generating new insights for user ${userId}`);
  }

  // Préparer l'historique des dépenses pour Genkit (limité à 100 transactions max)
  const currency = userProfile?.displayCurrency || 'USD';
  const spendingHistory = reportData.recentTransactions
    .slice(0, 100) // Limiter à 100 transactions max
    .map(t => {
      const amount = Math.abs(t.amountInCents) / 100;
      const type = t.type === 'expense' ? (isFrench ? 'Dépense' : 'Expense') : (isFrench ? 'Revenu' : 'Income');
      return `${t.date}: ${t.description} - ${amount.toFixed(2)} ${currency} [${t.category}] (${type})`;
    })
    .join('\n');

  // Préparer les objectifs de budget pour Genkit
  const budgetGoals = reportData.budgetVsActual
    .map(b => {
      const budgeted = b.budgeted / 100;
      const actual = b.actual / 100;
      const percentUsed = b.budgeted > 0 ? ((b.actual / b.budgeted) * 100).toFixed(0) : '0';
      return `${b.category}: Budget ${budgeted.toFixed(2)} ${currency}, Dépensé ${actual.toFixed(2)} ${currency} (${percentUsed}%)`;
    })
    .join('\n');

  // Ajouter le contexte des KPI et objectifs
  const contextInfo = `
${isFrench ? 'Résumé financier' : 'Financial Summary'}:
- ${isFrench ? 'Revenus' : 'Income'}: ${(reportData.totalIncome / 100).toFixed(2)} ${currency}
- ${isFrench ? 'Dépenses' : 'Expenses'}: ${(reportData.totalExpenses / 100).toFixed(2)} ${currency}
- ${isFrench ? 'Solde net' : 'Net Balance'}: ${(reportData.netBalance / 100).toFixed(2)} ${currency}
${reportData.expenseDelta ? `- ${isFrench ? 'Variation dépenses' : 'Expense Change'}: ${reportData.expenseDelta > 0 ? '+' : ''}${reportData.expenseDelta.toFixed(1)}%` : ''}

${isFrench ? 'Objectifs d\'épargne' : 'Savings Goals'}:
${reportData.goals.map(g => {
  const progress = g.targetAmountInCents > 0 ? ((g.currentAmountInCents / g.targetAmountInCents) * 100).toFixed(0) : '0';
  return `- ${g.name}: ${(g.currentAmountInCents / 100).toFixed(2)}/${(g.targetAmountInCents / 100).toFixed(2)} ${currency} (${progress}%)`;
}).join('\n')}

${isFrench ? 'Principales catégories de dépenses' : 'Top Spending Categories'}:
${reportData.spendingByCategory.slice(0, 5).map(c => 
  `- ${c.name}: ${(c.value / 100).toFixed(2)} ${currency}`
).join('\n')}
  `.trim();

  const fullInput = `${contextInfo}\n\n${isFrench ? 'Transactions récentes' : 'Recent Transactions'}:\n${spendingHistory}\n\n${isFrench ? 'Budgets' : 'Budgets'}:\n${budgetGoals}`;

  try {
    // Appeler Genkit pour obtenir des insights personnalisés
    const { insights, recommendations } = await getSpendingInsights({
      spendingHistory: fullInput,
      budgetGoals: budgetGoals || (isFrench ? 'Aucun budget configuré' : 'No budgets configured'),
    });

    // Sauvegarder dans le cache
    const transactionDates = reportData.recentTransactions.map(t => new Date(t.date ?? Date.now()));
    const periodStart = transactionDates.length > 0 
      ? new Date(Math.min(...transactionDates.map(d => d.getTime()))).toISOString()
      : new Date().toISOString();
    const periodEnd = transactionDates.length > 0
      ? new Date(Math.max(...transactionDates.map(d => d.getTime()))).toISOString()
      : new Date().toISOString();

    await setCachedInsights(userId, insights, recommendations, {
      dataHash,
      transactionCount: reportData.recentTransactions.length,
      budgetCount: reportData.budgetVsActual.length,
      periodStart,
      periodEnd,
    });

    return (
      <Card className="mb-6 border-blue-200 bg-gradient-to-br from-blue-50 to-white">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-blue-600" />
            {translations.title}
          </CardTitle>
          <p className="text-sm text-gray-600 mt-1">{translations.subtitle}</p>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Insights Section */}
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Lightbulb className="h-4 w-4 text-amber-600" />
                {translations.insightsLabel}
              </h4>
              <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
                <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
                  {insights}
                </p>
              </div>
            </div>

            {/* Recommendations Section */}
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Target className="h-4 w-4 text-green-600" />
                {translations.recommendationsLabel}
              </h4>
              <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
                <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
                  {recommendations}
                </p>
              </div>
            </div>

            {/* Disclaimer */}
            <div className="border-t pt-4">
              <p className="text-xs text-gray-500 italic flex items-start gap-2">
                <AlertTriangle className="h-3 w-3 mt-0.5 flex-shrink-0" />
                <span>{translations.disclaimer}</span>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  } catch (error) {
    console.error('Erreur lors de la génération des recommandations IA:', error);
    
    // Fallback en cas d'erreur
    return (
      <Card className="mb-6 border-gray-200">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-gray-600" />
            {translations.title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600">
            {isFrench 
              ? 'Les recommandations IA ne sont pas disponibles pour le moment. Assurez-vous que la clé API Gemini est configurée.'
              : 'AI recommendations are not available at the moment. Make sure the Gemini API key is configured.'}
          </p>
          <p className="text-xs text-gray-500 mt-2">
            {error instanceof Error ? error.message : String(error)}
          </p>
        </CardContent>
      </Card>
    );
  }
}
