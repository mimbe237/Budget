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
};

export function DebtSnapshot({ debts, locale, currency }: DebtSnapshotProps) {
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
    <Card className="h-full border-slate-200/70 shadow-sm">
      <CardHeader className="space-y-1">
        <CardTitle className="flex items-center gap-2 text-base font-semibold text-slate-800">
          <Landmark className="h-4 w-4 text-slate-500" aria-hidden="true" />
          Synthèse des dettes
        </CardTitle>
        <CardDescription>Vue rapide des encours et prochaines échéances.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 text-sm text-slate-600">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl bg-slate-100/70 p-4">
            <p className="text-xs uppercase tracking-wide text-slate-500">Encours total</p>
            <p className="mt-1 text-xl font-semibold text-slate-900">
              {currencyFormatter.format(outstanding)}
            </p>
            <p className="text-xs text-slate-500 mt-1">{activeDebts.length} dette(s) active(s)</p>
          </div>
          <div className="rounded-2xl bg-slate-100/70 p-4">
            <p className="text-xs uppercase tracking-wide text-slate-500">Échéances en retard</p>
            <p className="mt-1 flex items-center gap-1 text-xl font-semibold text-amber-600">
              <AlertTriangle className="h-4 w-4" aria-hidden="true" />
              {overdue.length}
            </p>
            <p className="text-xs text-slate-500 mt-1">Surveillez ces comptes pour éviter les pénalités.</p>
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
