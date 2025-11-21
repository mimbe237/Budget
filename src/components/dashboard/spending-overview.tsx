'use client';

import * as React from 'react';
import { Pie, PieChart, Sector } from 'recharts';

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from '@/components/ui/chart';
import type { Transaction } from '@/lib/types';

interface SpendingOverviewProps {
  transactions: Transaction[];
}

const chartConfig = {
  spending: {
    label: 'Spending',
  },
  Housing: {
    label: 'Housing',
    color: 'hsl(var(--chart-1))',
  },
  Food: {
    label: 'Food',
    color: 'hsl(var(--chart-2))',
  },
  Transport: {
    label: 'Transport',
    color: 'hsl(var(--chart-3))',
  },
  Entertainment: {
    label: 'Entertainment',
    color: 'hsl(var(--chart-4))',
  },
  Health: {
    label: 'Health',
    color: 'hsl(var(--chart-5))',
  },
  Shopping: {
    label: 'Shopping',
    color: 'hsl(var(--chart-1))',
  },
  Utilities: {
    label: 'Utilities',
    color: 'hsl(var(--chart-2))',
  },
};

export function SpendingOverview({ transactions }: SpendingOverviewProps) {
  const [activeIndex, setActiveIndex] = React.useState(0);

  const spendingData = React.useMemo(() => {
    const categoryTotals: { [key: string]: number } = {};
    transactions
      .filter(t => t.type === 'expense')
      .forEach(t => {
        if (!categoryTotals[t.category]) {
          categoryTotals[t.category] = 0;
        }
        // TODO: This assumes all transactions are in the same currency. Needs conversion logic.
        categoryTotals[t.category] += t.amountInCents;
      });

    return Object.entries(categoryTotals).map(([category, total]) => ({
      name: category,
      value: total / 100, // Display value in main currency unit, not cents
      fill: `var(--color-${category})`,
    }));
  }, [transactions]);
  
  const totalSpending = React.useMemo(() => {
    return spendingData.reduce((acc, curr) => acc + curr.value, 0)
  }, [spendingData]);


  return (
    <ChartContainer config={chartConfig} className="min-h-[220px] w-full bg-gradient-to-br from-white/60 via-blue-50/80 to-indigo-100/60 backdrop-blur-xl shadow-xl border-0 rounded-2xl p-4 animate-fadein">
      <PieChart width={340} height={220}>
        <ChartTooltip
          cursor={false}
          content={<ChartTooltipContent hideLabel formatter={(value, name, props) => (`${(value as number).toLocaleString()} F`)} />}
        />
        <Pie
          data={spendingData}
          dataKey="value"
          nameKey="name"
          innerRadius={70}
          strokeWidth={6}
          activeIndex={activeIndex}
          activeShape={(props: any) => (
            <Sector
              {...props}
              outerRadius={props.outerRadius ? props.outerRadius + 8 : 0}
              fill="#60A5FA"
            />
          )}
          onMouseOver={(_, index) => setActiveIndex(index)}
        />
        <ChartLegend
          content={<ChartLegendContent nameKey="name" />}
          className="-translate-y-[2rem] flex-wrap gap-2 [&>*]:basis-1/4 [&>*]:justify-center text-sm font-semibold text-blue-700"
        />
      </PieChart>
      <div className="mt-4 text-center text-lg font-bold text-gray-800 drop-shadow-sm">
        Total dépenses : <span className="text-blue-600">{totalSpending.toLocaleString()} F</span>
      </div>
    </ChartContainer>
  );
}
