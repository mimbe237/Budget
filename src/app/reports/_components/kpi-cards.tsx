'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowUp, ArrowDown, Minus, TrendingUp, TrendingDown } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface KPICardsProps {
  formattedTotalIncome: string;
  formattedTotalExpenses: string;
  formattedNetBalance: string;
  expenseDelta: number | null;
  isFrench: boolean;
}

export function KPICards({ 
  formattedTotalIncome, 
  formattedTotalExpenses, 
  formattedNetBalance, 
  expenseDelta, 
  isFrench 
}: KPICardsProps) {
  const translations = {
    totalIncome: isFrench ? 'Revenus totaux' : 'Total Income',
    totalExpenses: isFrench ? 'Dépenses totales' : 'Total Expenses', 
    netBalance: isFrench ? 'Solde net' : 'Net Balance',
    variation: isFrench ? 'Variation' : 'Change',
    vsPrevious: isFrench ? 'vs période précédente' : 'vs previous period',
    noData: isFrench ? 'Aucune donnée' : 'No data',
  };

  const getVariationIcon = () => {
    if (expenseDelta === null || expenseDelta === 0) return <Minus className="h-4 w-4 text-gray-400" />;
    return expenseDelta > 0 
      ? <TrendingUp className="h-4 w-4 text-red-500" />
      : <TrendingDown className="h-4 w-4 text-green-500" />;
  };

  const getVariationColor = () => {
    if (expenseDelta === null || expenseDelta === 0) return 'text-gray-600';
    return expenseDelta > 0 ? 'text-red-600' : 'text-green-600';
  };

  const getVariationValue = () => {
    if (expenseDelta === null || expenseDelta === 0) return '--';
    const sign = expenseDelta > 0 ? '+' : '';
    return `${sign}${expenseDelta.toFixed(1)}%`;
  };

  return (
    <TooltipProvider>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {/* Revenus */}
        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-700">
              {translations.totalIncome}
            </CardTitle>
            <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
              <ArrowUp className="h-4 w-4 text-green-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-700">
              {formattedTotalIncome}
            </div>
          </CardContent>
        </Card>

        {/* Dépenses */}
        <Card className="border-l-4 border-l-red-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-700">
              {translations.totalExpenses}
            </CardTitle>
            <div className="h-8 w-8 rounded-full bg-red-100 flex items-center justify-center">
              <ArrowDown className="h-4 w-4 text-red-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-700">
              {formattedTotalExpenses}
            </div>
          </CardContent>
        </Card>

        {/* Solde net */}
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-700">
              {translations.netBalance}
            </CardTitle>
            <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
              <TrendingUp className="h-4 w-4 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-700">
              {formattedNetBalance}
            </div>
          </CardContent>
        </Card>

        {/* Variation */}
        <Card className="border-l-4 border-l-gray-400">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-700">
              {translations.variation}
            </CardTitle>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center cursor-help">
                  {getVariationIcon()}
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>{translations.vsPrevious}</p>
              </TooltipContent>
            </Tooltip>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getVariationColor()}`}>
              {getVariationValue()}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {translations.vsPrevious}
            </p>
          </CardContent>
        </Card>
      </div>
    </TooltipProvider>
  );
}