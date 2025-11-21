'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { Debt } from '@/types/debt';
import { Landmark, AlertTriangle } from 'lucide-react';

function toDate(value: Debt['nextDueDate']): Date | null {
  if (!value) return null;
  if (typeof (value as any)?.toDate === 'function') {
    return (value as any).toDate();
  }
  const parsed = new Date(value as any);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

type DebtSnapshotProps = {
  debts: Debt[] | null | undefined;
  locale: string;
  currency: string;
  interestPaid?: number;
  serviceDebt?: number;
};

export function DebtSnapshot({ debts, locale, currency, interestPaid = 0, serviceDebt = 0 }: DebtSnapshotProps) {
  const normalizedDebts = Array.isArray(debts) ? debts : [];

  const activeDebts = normalizedDebts.filter(debt => debt.status !== 'SOLDEE');
  const outstanding = activeDebts.reduce((total, debt) => total + (debt.remainingPrincipal ?? debt.principalInitial ?? 0), 0);
  const overdue = activeDebts.filter(debt => debt.status === 'EN_RETARD');

  const upcoming = activeDebts
    .map(debt => {
      const dueDate = toDate(debt.nextDueDate);
      return {
        id: debt.id,
        title: debt.title,
        dueDate,
        amount: debt.nextDueAmount ?? debt.remainingPrincipal ?? debt.principalInitial ?? 0,
        status: debt.status,
      };
    })
    .filter(item => item.dueDate !== null)
    .sort((a, b) => (a.dueDate!.getTime() - b.dueDate!.getTime()))
    .slice(0, 3);

  const currencyFormatter = new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  });

  const dateFormatter = new Intl.DateTimeFormat(locale, {
    month: 'short',
    day: 'numeric',
  });

  return (
    <Card className="bg-gradient-to-br from-slate-50/80 via-blue-50/60 to-white/80 border-0 shadow-lg min-w-0 print:break-inside-avoid">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-slate-900 font-headline">
          <Landmark className="h-4 w-4 text-blue-500 flex-shrink-0" />
          {locale.startsWith('fr') ? 'Dette express' : 'Debt snapshot'}
        </CardTitle>
        <CardDescription>
          {locale.startsWith('fr') ? 'Suivi rapide de vos obligations.' : 'Quick glance at your liabilities.'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 text-sm text-slate-600">
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl bg-slate-100/70 p-4">
            <p className="text-xs uppercase tracking-wide text-slate-500">Encours total</p>
            <p className="mt-1 text-xl font-semibold text-slate-900">
              {currencyFormatter.format(outstanding)}
            </p>
            <p className="text-xs text-slate-500 mt-1">{activeDebts.length} dette(s) active(s)</p>
          </div>
          <div className="rounded-2xl bg-amber-50/80 p-4">
            <p className="text-xs uppercase tracking-wide text-amber-700">Intérêts du mois</p>
            <p className="mt-1 text-xl font-semibold text-amber-900">
              {currencyFormatter.format(interestPaid)}
            </p>
            <p className="text-xs text-amber-600 mt-1">Service dette: {currencyFormatter.format(serviceDebt)}</p>
          </div>
          <div className="rounded-2xl bg-slate-100/70 p-4">
            <p className="text-xs uppercase tracking-wide text-slate-500">En retard</p>
            <p className="mt-1 flex items-center gap-1 text-xl font-semibold text-amber-600">
              <AlertTriangle className="h-4 w-4" aria-hidden="true" />
              {overdue.length}
            </p>
            <p className="text-xs text-slate-500 mt-1">À surveiller</p>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-700">Prochaines échéances</p>
            <Button asChild size="sm" variant="ghost" className="h-8 px-2 text-xs">
              <Link href="/debts">Tout voir</Link>
            </Button>
          </div>
          {upcoming.length === 0 ? (
            <p className="text-xs text-slate-500">Aucune échéance programmée. Ajoutez vos dettes pour planifier vos remboursements.</p>
          ) : (
            <ul className="space-y-2">
              {upcoming.map(item => (
                <li key={item.id} className="flex items-center justify-between rounded-xl border border-slate-200/70 bg-white px-3 py-2">
                  <div>
                    <p className="text-sm font-medium text-slate-800">{item.title}</p>
                    <p className="text-xs text-slate-500">{dateFormatter.format(item.dueDate!)} • {currencyFormatter.format(item.amount)}</p>
                  </div>
                  <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                    {item.status === 'EN_RETARD' ? 'En retard' : 'À venir'}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
