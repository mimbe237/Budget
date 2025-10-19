'use client';

import { ReportSection } from './ui/report-section';
import { cn } from '@/lib/utils';

export type LedgerRow = {
  category: string;
  plannedInCents: number;
  actualInCents: number;
  diffInCents: number; // signed
}

interface LedgerTableProps {
  title: string;
  rows: LedgerRow[];
  totals: { plannedInCents: number; actualInCents: number; diffInCents: number };
  formatMoney: (cents: number) => string;
  accent?: 'orange' | 'blue';
  alignRight?: boolean;
}

function LedgerTable({ title, rows, totals, formatMoney, accent = 'orange' }: LedgerTableProps) {
  return (
    <ReportSection title={title} accent={accent}>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className="text-left py-2 pr-2 w-[45%]">{title}</th>
              <th className="text-right py-2 px-2">Prévu</th>
              <th className="text-right py-2 px-2">Réelles</th>
              <th className="text-right py-2 pl-2">Diff.</th>
            </tr>
            <tr className="border-b text-gray-600">
              <td className="py-2 pr-2 font-medium">Totaux</td>
              <td className="py-2 px-2 text-right">{formatMoney(totals.plannedInCents)}</td>
              <td className="py-2 px-2 text-right">{formatMoney(totals.actualInCents)}</td>
              <td className={cn('py-2 pl-2 text-right font-semibold', totals.diffInCents >= 0 ? 'text-green-600' : 'text-red-600')}>
                {formatMoney(totals.diffInCents)}
              </td>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => (
              <tr key={row.category} className={cn('border-b', idx % 2 === 0 ? 'bg-orange-50/40' : 'bg-transparent')}>
                <td className="py-2 pr-2 font-medium">{row.category}</td>
                <td className="py-2 px-2 text-right">{formatMoney(row.plannedInCents)}</td>
                <td className="py-2 px-2 text-right">{formatMoney(row.actualInCents)}</td>
                <td className={cn('py-2 pl-2 text-right font-semibold', row.diffInCents >= 0 ? 'text-green-600' : 'text-red-600')}>
                  {row.diffInCents >= 0 ? '+' : ''}{formatMoney(row.diffInCents)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </ReportSection>
  );
}

interface LedgerTablesProps {
  expenses: LedgerRow[];
  incomes: LedgerRow[];
  formatMoney: (cents: number) => string;
}

export function LedgerTables({ expenses, incomes, formatMoney }: LedgerTablesProps) {
  const expenseTotals = expenses.reduce((acc, r) => ({
    plannedInCents: acc.plannedInCents + r.plannedInCents,
    actualInCents: acc.actualInCents + r.actualInCents,
    diffInCents: acc.diffInCents + r.diffInCents,
  }), { plannedInCents: 0, actualInCents: 0, diffInCents: 0 });

  const incomeTotals = incomes.reduce((acc, r) => ({
    plannedInCents: acc.plannedInCents + r.plannedInCents,
    actualInCents: acc.actualInCents + r.actualInCents,
    diffInCents: acc.diffInCents + r.diffInCents,
  }), { plannedInCents: 0, actualInCents: 0, diffInCents: 0 });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 two-columns">
      <LedgerTable 
        title="Dépenses"
        rows={expenses}
        totals={expenseTotals}
        formatMoney={formatMoney}
        accent="orange"
      />
      <LedgerTable 
        title="Revenus"
        rows={incomes}
        totals={incomeTotals}
        formatMoney={formatMoney}
        accent="blue"
      />
    </div>
  );
}
