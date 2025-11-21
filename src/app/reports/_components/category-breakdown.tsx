'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { ExternalLink } from 'lucide-react';

interface CategoryBreakdownProps {
  data: { name: string; value: number }[];
  formatMoney: (amount: number) => string;
  isFrench: boolean;
}

const COLORS = [
  '#3b82f6', // blue
  '#10b981', // green
  '#f59e0b', // amber
  '#ef4444', // red
  '#8b5cf6', // violet
  '#06b6d4', // cyan
  '#84cc16', // lime
  '#f97316', // orange
];

export function CategoryBreakdown({ data, formatMoney, isFrench }: CategoryBreakdownProps) {
  const translations = {
    title: isFrench ? 'Répartition par catégories' : 'Spending by Category',
    viewAll: isFrench ? 'Voir toutes les catégories' : 'View all categories',
    noData: isFrench ? 'Aucune donnée disponible' : 'No data available',
    total: isFrench ? 'Total' : 'Total',
  };

  const totalAmount = data.reduce((sum, item) => sum + item.value, 0);
  const topCategories = data
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

  const formatTooltipValue = (value: number, name: string) => {
    const percentage = totalAmount > 0 ? ((value / totalAmount) * 100).toFixed(1) : '0';
    return [`${formatMoney(value)} (${percentage}%)`, name];
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
          <div className="flex items-center justify-center h-64 text-gray-500">
            {translations.noData}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mb-6">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg font-semibold text-gray-900">
          {translations.title}
        </CardTitle>
        <button 
          className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 print:hidden"
          onClick={() => window.location.href = '/categories'}
        >
          {translations.viewAll}
          <ExternalLink className="h-3 w-3" />
        </button>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Donut Chart */}
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {data.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={COLORS[index % COLORS.length]} 
                    />
                  ))}
                </Pie>
                <Tooltip formatter={formatTooltipValue} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Top 5 List */}
          <div className="space-y-3">
            <h4 className="font-medium text-gray-900 mb-4">
              Top 5 {isFrench ? 'catégories' : 'categories'}
            </h4>
            {topCategories.map((category, index) => {
              const percentage = totalAmount > 0 ? ((category.value / totalAmount) * 100) : 0;
              return (
                <div key={category.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <span className="text-sm font-medium text-gray-700">
                      {category.name}
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-gray-900">
                      {formatMoney(category.value)}
                    </div>
                    <div className="text-xs text-gray-500">
                      {percentage.toFixed(1)}%
                    </div>
                  </div>
                </div>
              );
            })}
            
            {/* Total */}
            <div className="border-t pt-3 mt-4">
              <div className="flex items-center justify-between font-semibold">
                <span className="text-gray-900">{translations.total}</span>
                <span className="text-gray-900">{formatMoney(totalAmount)}</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}