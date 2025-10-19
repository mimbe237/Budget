'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Lightbulb, TrendingUp, AlertTriangle } from 'lucide-react';

interface AISummaryProps {
  totalIncome: number;
  totalExpenses: number;
  netBalance: number;
  topCategory: { name: string; amount: number } | null;
  formatMoney: (amount: number) => string;
  isFrench: boolean;
}

export function AISummary({ 
  totalIncome, 
  totalExpenses, 
  netBalance, 
  topCategory, 
  formatMoney, 
  isFrench 
}: AISummaryProps) {
  const translations = {
    title: isFrench ? 'Résumé Intelligent' : 'Smart Summary',
    disclaimer: isFrench 
      ? 'Conseils à visée éducative (non réglementé).' 
      : 'Educational advice only (not regulated).',
  };

  // Générer un résumé basé sur les données
  const generateSummary = () => {
    const savingsRate = totalIncome > 0 ? ((netBalance / totalIncome) * 100) : 0;
    
    let trends = [];
    let insights = [];
    let actions = [];

    // Analyse de la tendance générale
    if (netBalance >= 0) {
      if (savingsRate >= 20) {
        trends.push(
          isFrench 
            ? `Excellente santé financière avec un taux d'épargne de ${savingsRate.toFixed(0)}%.`
            : `Excellent financial health with a ${savingsRate.toFixed(0)}% savings rate.`
        );
      } else if (savingsRate >= 10) {
        trends.push(
          isFrench 
            ? `Situation financière stable avec un taux d'épargne de ${savingsRate.toFixed(0)}%.`
            : `Stable financial situation with a ${savingsRate.toFixed(0)}% savings rate.`
        );
      } else {
        trends.push(
          isFrench 
            ? `Équilibre financier maintenu mais marge d'amélioration possible.`
            : `Financial balance maintained but room for improvement.`
        );
      }
    } else {
      trends.push(
        isFrench 
          ? `Déficit de ${formatMoney(Math.abs(netBalance))} à surveiller ce mois.`
          : `Deficit of ${formatMoney(Math.abs(netBalance))} to monitor this month.`
      );
    }

    // Analyse du poste principal
    if (topCategory) {
      const categoryPercent = totalExpenses > 0 ? ((topCategory.amount / totalExpenses) * 100) : 0;
      insights.push(
        isFrench 
          ? `${topCategory.name} représente ${categoryPercent.toFixed(0)}% de vos dépenses (${formatMoney(topCategory.amount)}).`
          : `${topCategory.name} accounts for ${categoryPercent.toFixed(0)}% of your expenses (${formatMoney(topCategory.amount)}).`
      );
    }

    // Actions recommandées
    if (netBalance < 0) {
      actions.push(
        isFrench 
          ? `Réduire les dépenses de ${formatMoney(Math.abs(netBalance))}`
          : `Reduce expenses by ${formatMoney(Math.abs(netBalance))}`
      );
    } else if (savingsRate < 10) {
      const targetSavings = totalIncome * 0.1 - netBalance;
      if (targetSavings > 0) {
        actions.push(
          isFrench 
            ? `Économiser ${formatMoney(targetSavings)} de plus pour atteindre 10%`
            : `Save an additional ${formatMoney(targetSavings)} to reach 10%`
        );
      }
    }

    if (topCategory && totalExpenses > 0) {
      const reduction = topCategory.amount * 0.1; // Suggestion de réduction de 10%
      actions.push(
        isFrench 
          ? `Optimiser ${topCategory.name} (-${formatMoney(reduction)})`
          : `Optimize ${topCategory.name} (-${formatMoney(reduction)})`
      );
    }

    // Action d'urgence si nécessaier
    if (Math.abs(netBalance) > totalIncome * 0.5) {
      actions.push(
        isFrench 
          ? `Réviser le budget d'urgence`
          : `Review emergency budget`
      );
    }

    return { trends, insights, actions: actions.slice(0, 3) };
  };

  const summary = generateSummary();

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-blue-600" />
          {translations.title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Tendance générale */}
          {summary.trends.map((trend, index) => (
            <div key={`trend-${index}`} className="flex items-start gap-3">
              <TrendingUp className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-gray-700 leading-relaxed">
                {trend}
              </p>
            </div>
          ))}

          {/* Insights */}
          {summary.insights.map((insight, index) => (
            <div key={`insight-${index}`} className="flex items-start gap-3">
              <AlertTriangle className="h-4 w-4 text-orange-600 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-gray-700 leading-relaxed">
                {insight}
              </p>
            </div>
          ))}

          {/* Actions recommandées */}
          {summary.actions.length > 0 && (
            <div className="border-t pt-4">
              <h4 className="text-sm font-semibold text-gray-900 mb-2">
                {isFrench ? 'Actions recommandées :' : 'Recommended actions:'}
              </h4>
              <ul className="space-y-1">
                {summary.actions.map((action, index) => (
                  <li key={`action-${index}`} className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-blue-600 rounded-full flex-shrink-0" />
                    <span className="text-sm text-gray-700">{action}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Disclaimer */}
          <div className="border-t pt-3 mt-4">
            <p className="text-xs text-gray-500 italic">
              {translations.disclaimer}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}