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
  currency: string;
  locale: string;
  accent?: 'orange' | 'blue';
  alignRight?: boolean;
}

function formatMoney(amountInCents: number, currency: string, locale: string): string {
  // Valeurs par défaut si currency ou locale sont undefined/empty
  const safeCurrency = currency || 'XAF';
  const safeLocale = locale || 'fr-CM';
  
  return new Intl.NumberFormat(safeLocale, {
    style: 'currency',
    currency: safeCurrency,
  }).format(amountInCents / 100);
}

function LedgerTable({ title, rows, totals, currency, locale, accent = 'orange' }: LedgerTableProps) {
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
              <td className="py-2 px-2 text-right">{formatMoney(totals.plannedInCents, currency, locale)}</td>
              <td className="py-2 px-2 text-right">{formatMoney(totals.actualInCents, currency, locale)}</td>
              <td className={cn('py-2 pl-2 text-right font-semibold', totals.diffInCents >= 0 ? 'text-green-600' : 'text-red-600')}>
                {formatMoney(totals.diffInCents, currency, locale)}
              </td>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => (
              <tr key={row.category} className={cn('border-b', idx % 2 === 0 ? 'bg-orange-50/40' : 'bg-transparent')}>
                <td className="py-2 pr-2 font-medium">{row.category}</td>
                <td className="py-2 px-2 text-right">{formatMoney(row.plannedInCents, currency, locale)}</td>
                <td className="py-2 px-2 text-right">{formatMoney(row.actualInCents, currency, locale)}</td>
                <td className={cn('py-2 pl-2 text-right font-semibold', row.diffInCents >= 0 ? 'text-green-600' : 'text-red-600')}>
                  {row.diffInCents >= 0 ? '+' : ''}{formatMoney(row.diffInCents, currency, locale)}
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
  currency: string;
  locale: string;
}

export function LedgerTables({ expenses, incomes, currency, locale }: LedgerTablesProps) {
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
        currency={currency}
        locale={locale}
        accent="orange"
      />
      <LedgerTable 
        title="Revenus"
        rows={incomes}
        totals={incomeTotals}
        currency={currency}
        locale={locale}
        accent="blue"
      />
    </div>
  );
}
