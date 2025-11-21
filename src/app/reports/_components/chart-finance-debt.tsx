'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ComposedChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Area,
  Bar,
  Line,
} from 'recharts';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import type { FinancialReportData } from '@/lib/types';

interface ChartFinanceDebtProps {
  data: FinancialReportData['financialSeries'];
  currency: string;
  locale: string;
  isFrench: boolean;
}

export function ChartFinanceDebt({ data, currency, locale, isFrench }: ChartFinanceDebtProps) {
  const translations = {
    title: isFrench ? 'Évolution financière avec dette' : 'Financial Evolution with Debt',
    income: isFrench ? 'Revenus' : 'Income',
    expenses: isFrench ? 'Dépenses' : 'Expenses',
    debtService: isFrench ? 'Service de dette' : 'Debt service',
    cumulative: isFrench ? 'Solde cumulé' : 'Cumulative balance',
    principal: isFrench ? 'Principal' : 'Principal',
    interest: isFrench ? 'Intérêts' : 'Interest',
    noData: isFrench ? 'Aucune donnée pour la période sélectionnée.' : 'No data for the selected period.',
  };

  const dateLocale = isFrench ? fr : undefined;

  const numberFormatter = new Intl.NumberFormat(
    locale || (isFrench ? 'fr-CM' : 'en-US'),
    { style: 'currency', currency: currency || 'USD' },
  );

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900">
            {translations.title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-12">
            {translations.noData}
          </p>
        </CardContent>
      </Card>
    );
  }

  const chartData = data.map((item) => ({
    date: item.date,
    income: item.income / 100,
    expenses: item.expenses / 100,
    debtService: item.debtService / 100,
    cumulativeBalance: item.cumulativeBalance / 100,
    principalPaid: item.principalPaid / 100,
    interestPaid: item.interestPaid / 100,
  }));

  const formatTooltipLabel = (label: string) => {
    try {
      return format(new Date(label), 'd MMM yyyy', { locale: dateLocale });
    } catch {
      return label;
    }
  };

  const formatAxisLabel = (value: string) => {
    try {
      return format(new Date(value), 'd MMM', { locale: dateLocale });
    } catch {
      return value;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-gray-900">
          {translations.title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-96 w-full print:h-72">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={chartData}
              margin={{ top: 20, right: 30, left: 20, bottom: 10 }}
            >
              <CartesianGrid strokeDasharray="4 4" stroke="#e5e7eb" opacity={0.6} />
              <XAxis
                dataKey="date"
                tickFormatter={formatAxisLabel}
                stroke="#6b7280"
                fontSize={12}
              />
              <YAxis
                tickFormatter={(value) => numberFormatter.format(value)}
                stroke="#6b7280"
                fontSize={12}
              />
              <Tooltip
                labelFormatter={formatTooltipLabel}
                content={({ active, payload, label }) => {
                  if (!active || !payload || payload.length === 0) return null;
                  const debtPayload = payload.find((item) => item.dataKey === 'debtService');
                  const principal = debtPayload?.payload?.principalPaid ?? 0;
                  const interest = debtPayload?.payload?.interestPaid ?? 0;

                  return (
                    <div className="rounded-lg border border-slate-200 bg-white/90 p-3 shadow-lg print:border-slate-400">
                      <div className="font-semibold text-slate-800 mb-1">
                        {formatTooltipLabel(label || '')}
                      </div>
                      {payload.map((entry) => (
                        <div
                          key={entry.dataKey}
                          className="flex items-center gap-2 text-sm text-slate-700"
                        >
                          <span
                            className="inline-block h-2 w-2 rounded-full"
                            style={{ backgroundColor: entry.color }}
                          />
                          <span className="flex-1">{entry.name}</span>
                          <span className="font-medium">
                            {numberFormatter.format(entry.value as number)}
                          </span>
                        </div>
                      ))}
                      {debtPayload && (principal > 0 || interest > 0) && (
                        <div className="mt-2 space-y-1 text-xs text-slate-600">
                          <div>
                            {translations.principal}:{' '}
                            <span className="font-medium">
                              {numberFormatter.format(principal)}
                            </span>
                          </div>
                          <div>
                            {translations.interest}:{' '}
                            <span className="font-medium">
                              {numberFormatter.format(interest)}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                }}
              />
              <Legend />
              <Area
                type="monotone"
                dataKey="income"
                name={translations.income}
                fill="#10b98133"
                stroke="#10b981"
                strokeWidth={2}
                activeDot={{ r: 6 }}
              />
              <Area
                type="monotone"
                dataKey="expenses"
                name={translations.expenses}
                fill="#ef444433"
                stroke="#ef4444"
                strokeWidth={2}
                activeDot={{ r: 6 }}
              />
              <Bar
                dataKey="debtService"
                name={translations.debtService}
                fill="#f59e0b"
                opacity={0.85}
                maxBarSize={18}
              />
              <Line
                type="monotone"
                dataKey="cumulativeBalance"
                name={translations.cumulative}
                stroke="#2563eb"
                strokeWidth={2}
                dot={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
