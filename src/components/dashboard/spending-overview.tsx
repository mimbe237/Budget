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
    <ChartContainer config={chartConfig} className="min-h-[200px] w-full">
      <PieChart>
        <ChartTooltip
          cursor={false}
          content={<ChartTooltipContent hideLabel formatter={(value, name, props) => (`$${(value as number).toFixed(2)}`)} />}
        />
        <Pie
          data={spendingData}
          dataKey="value"
          nameKey="name"
          innerRadius={60}
          strokeWidth={5}
          activeIndex={activeIndex}
          activeShape={(props: any) => (
            <Sector
              {...props}
              outerRadius={props.outerRadius ? props.outerRadius + 5 : 0}
            />
          )}
          onMouseOver={(_, index) => setActiveIndex(index)}
        >
        </Pie>
        <ChartLegend
          content={<ChartLegendContent nameKey="name" />}
          className="-translate-y-[2rem] flex-wrap gap-2 [&>*]:basis-1/4 [&>*]:justify-center"
        />
      </PieChart>
    </ChartContainer>
  );
}
