'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface BudgetTableProps {
  data: {
    category: string;
    budgeted: number;
    actual: number;
    variance: number;
  }[];
  formatMoney: (amount: number) => string;
  isFrench: boolean;
}

export function BudgetTable({ data, formatMoney, isFrench }: BudgetTableProps) {
  const translations = {
    title: isFrench ? 'Budgets vs Réalisé' : 'Budget vs Actual',
    category: isFrench ? 'Catégorie' : 'Category',
    limit: isFrench ? 'Limite' : 'Budget',
    expenses: isFrench ? 'Dépenses' : 'Expenses',
    variance: isFrench ? 'Écart' : 'Variance',
    percentage: '%',
    total: isFrench ? 'Total' : 'Total',
    noData: isFrench ? 'Aucun budget configuré' : 'No budgets configured',
  };

  if (data.length === 0) {
    return (
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900">
            {translations.title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32 text-gray-500">
            {translations.noData}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Calculer les totaux
  const totals = data.reduce(
    (acc, item) => ({
      budgeted: acc.budgeted + item.budgeted,
      actual: acc.actual + item.actual,
      variance: acc.variance + item.variance,
    }),
    { budgeted: 0, actual: 0, variance: 0 }
  );

  // Trier par pourcentage d'utilisation (décroissant)
  const sortedData = [...data].sort((a, b) => {
    const aPercent = a.budgeted > 0 ? (a.actual / a.budgeted) * 100 : 0;
    const bPercent = b.budgeted > 0 ? (b.actual / b.budgeted) * 100 : 0;
    return bPercent - aPercent;
  });

  const getStatusColor = (budgeted: number, actual: number) => {
    if (budgeted === 0) return 'bg-gray-100 text-gray-700';
    const percentage = (actual / budgeted) * 100;
    
    if (percentage < 70) return 'bg-green-100 text-green-800';
    if (percentage <= 100) return 'bg-orange-100 text-orange-800';
    return 'bg-red-100 text-red-800';
  };

  const getPercentage = (budgeted: number, actual: number) => {
    if (budgeted === 0) return '--';
    return ((actual / budgeted) * 100).toFixed(0);
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-gray-900">
          {translations.title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-2 text-sm font-semibold text-gray-700">
                  {translations.category}
                </th>
                <th className="text-right py-3 px-2 text-sm font-semibold text-gray-700">
                  {translations.limit}
                </th>
                <th className="text-right py-3 px-2 text-sm font-semibold text-gray-700">
                  {translations.expenses}
                </th>
                <th className="text-right py-3 px-2 text-sm font-semibold text-gray-700">
                  {translations.variance}
                </th>
                <th className="text-center py-3 px-2 text-sm font-semibold text-gray-700">
                  {translations.percentage}
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedData.map((item, index) => {
                const percentage = getPercentage(item.budgeted, item.actual);
                const statusColor = getStatusColor(item.budgeted, item.actual);
                
                return (
                  <tr key={index} className="border-b border-gray-50 hover:bg-gray-25">
                    <td className="py-3 px-2 text-sm font-medium text-gray-900">
                      {item.category}
                    </td>
                    <td className="py-3 px-2 text-sm text-right text-gray-700">
                      {formatMoney(item.budgeted)}
                    </td>
                    <td className="py-3 px-2 text-sm text-right text-gray-700">
                      {formatMoney(item.actual)}
                    </td>
                    <td className={`py-3 px-2 text-sm text-right font-medium ${
                      item.variance >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {item.variance >= 0 ? '+' : ''}{formatMoney(item.variance)}
                    </td>
                    <td className="py-3 px-2 text-center">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColor}`}>
                        {percentage}%
                      </span>
                    </td>
                  </tr>
                );
              })}
              
              {/* Ligne Total */}
              <tr className="border-t-2 border-gray-300 bg-gray-50 font-semibold">
                <td className="py-3 px-2 text-sm text-gray-900">
                  {translations.total}
                </td>
                <td className="py-3 px-2 text-sm text-right text-gray-900">
                  {formatMoney(totals.budgeted)}
                </td>
                <td className="py-3 px-2 text-sm text-right text-gray-900">
                  {formatMoney(totals.actual)}
                </td>
                <td className={`py-3 px-2 text-sm text-right ${
                  totals.variance >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {totals.variance >= 0 ? '+' : ''}{formatMoney(totals.variance)}
                </td>
                <td className="py-3 px-2 text-center">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    getStatusColor(totals.budgeted, totals.actual)
                  }`}>
                    {getPercentage(totals.budgeted, totals.actual)}%
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}