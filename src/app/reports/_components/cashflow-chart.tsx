'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface CashflowChartProps {
  data: { date: string; income: number; expenses: number }[];
  formatMoney: (amount: number) => string;
  isFrench: boolean;
}

export function CashflowChart({ data, formatMoney, isFrench }: CashflowChartProps) {
  const translations = {
    title: isFrench ? 'Tendances des flux de trésorerie' : 'Cashflow Trends',
    income: isFrench ? 'Revenus' : 'Income',
    expenses: isFrench ? 'Dépenses' : 'Expenses',
  };

  const locale = isFrench ? fr : undefined;

  const formatTooltipValue = (value: number, name: string) => {
    return [formatMoney(value), name];
  };

  const formatTooltipLabel = (label: string) => {
    try {
      const date = new Date(label);
      return format(date, 'd MMM yyyy', { locale });
    } catch {
      return label;
    }
  };

  const formatXAxisLabel = (tickItem: string) => {
    try {
      const date = new Date(tickItem);
      return format(date, 'd MMM', { locale });
    } catch {
      return tickItem;
    }
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-gray-900">
          {translations.title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={data}
              margin={{
                top: 5,
                right: 30,
                left: 20,
                bottom: 5,
              }}
            >
              <CartesianGrid 
                strokeDasharray="3 3" 
                stroke="#e5e7eb"
                opacity={0.5}
              />
              <XAxis 
                dataKey="date" 
                tickFormatter={formatXAxisLabel}
                stroke="#6b7280"
                fontSize={12}
              />
              <YAxis 
                tickFormatter={(value) => formatMoney(value)}
                stroke="#6b7280"
                fontSize={12}
              />
              <Tooltip 
                formatter={formatTooltipValue}
                labelFormatter={formatTooltipLabel}
                contentStyle={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                }}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="income" 
                stroke="#10b981" 
                strokeWidth={2}
                dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: '#10b981', strokeWidth: 2 }}
                name={translations.income}
              />
              <Line 
                type="monotone" 
                dataKey="expenses" 
                stroke="#ef4444" 
                strokeWidth={2}
                dot={{ fill: '#ef4444', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: '#ef4444', strokeWidth: 2 }}
                name={translations.expenses}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}