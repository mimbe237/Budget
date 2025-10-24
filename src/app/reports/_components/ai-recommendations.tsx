'use server';

import { getSpendingInsights } from '@/ai/flows/spending-insights';
import type { FinancialReportData, UserProfile } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Lightbulb, TrendingUp, AlertTriangle, Target, Sparkles } from 'lucide-react';

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

  // Préparer l'historique des dépenses pour Genkit
  const currency = userProfile?.displayCurrency || 'USD';
  const spendingHistory = reportData.recentTransactions
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
