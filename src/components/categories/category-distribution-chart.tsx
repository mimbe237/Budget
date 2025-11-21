'use client';

import { useMemo } from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

type DistributionDatum = {
  id: string;
  name: string;
  value: number;
  color: string;
};

type CategoryDistributionChartProps = {
  data: DistributionDatum[];
  total: number;
  isFrench?: boolean;
  currency?: string;
  locale?: string;
};

const DEFAULT_COLORS = [
  '#2563eb',
  '#10b981',
  '#f59e0b',
  '#ef4444',
  '#8b5cf6',
  '#ec4899',
  '#14b8a6',
  '#f97316',
  '#a855f7',
  '#0ea5e9',
];

export function CategoryDistributionChart({
  data,
  total,
  isFrench,
  currency = 'USD',
  locale = 'en-US',
}: CategoryDistributionChartProps) {
  const chartData = useMemo(() => {
    if (!data.length) return [];
    return data.map((item, index) => ({
      ...item,
      color: item.color || DEFAULT_COLORS[index % DEFAULT_COLORS.length],
    }));
  }, [data]);

  const formatter = useMemo(
    () =>
      new Intl.NumberFormat(locale, {
        style: 'currency',
        currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }),
    [currency, locale]
  );

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-base font-semibold text-slate-900">
          {isFrench ? 'Répartition budgétaire' : 'Budget distribution'}
        </CardTitle>
        <CardDescription>
          {isFrench
            ? 'Visualisez le poids de chaque catégorie dans votre budget global.'
            : 'Visualise the weight of each category in your total budget.'}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {chartData.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center">
            {isFrench
              ? 'Aucune catégorie de dépenses pour afficher la répartition.'
              : 'No expense categories to display yet.'}
          </p>
        ) : (
          <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={chartData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={110}
                  strokeWidth={4}
                >
                  {chartData.map(entry => (
                    <Cell key={entry.id} fill={entry.color} stroke={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number, name: string) => [formatter.format(value), name]} />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-3 self-center">
              <div className="text-sm text-muted-foreground">
                {isFrench ? 'Budget total alloué' : 'Total allocated budget'}
              </div>
              <div className="text-3xl font-bold text-slate-900">{formatter.format(total)}</div>
              <ul className="space-y-2 text-sm">
                {chartData.map(entry => (
                  <li key={entry.id} className="flex items-center gap-2">
                    <span
                      className="inline-flex h-3 w-3 rounded-full"
                      style={{ backgroundColor: entry.color }}
                    />
                    <span className="flex-1 text-slate-700">{entry.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {total > 0 ? `${((entry.value / total) * 100).toFixed(1)}%` : '—'}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
