'use client';

import { useState, type ReactNode } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useUser } from '@/firebase';
import { cn } from '@/lib/utils';
import {
  Plus,
  X,
  TrendingUp,
  TrendingDown,
  Target,
} from 'lucide-react';

type Shortcut = {
  href: string;
  icon: ReactNode;
  title: string;
  description: string;
  accentClass: string;
};

/**
 * Floating quick-access button that expands into shortcuts for
 * adding incomes, expenses, or goals.
 */
export function QuickAddShortcuts() {
  const [isOpen, setIsOpen] = useState(false);
  const { user, isUserLoading, userProfile } = useUser();

  if (isUserLoading || !user) {
    return null;
  }

  const isFrench = userProfile?.locale === 'fr-CM';

  const shortcuts: Shortcut[] = [
    {
      href: '/transactions/add?type=income',
      icon: <TrendingUp className="h-5 w-5" aria-hidden="true" />,
      title: isFrench ? 'Revenu' : 'Income',
      description: isFrench
        ? 'Enregistrez un nouveau revenu pour garder votre cashflow à jour.'
        : 'Record a new income to keep your cash flow current.',
      accentClass: 'bg-emerald-100 text-emerald-700',
    },
    {
      href: '/transactions/add?type=expense',
      icon: <TrendingDown className="h-5 w-5" aria-hidden="true" />,
      title: isFrench ? 'Dépense' : 'Expense',
      description: isFrench
        ? 'Suivez instantanément une dépense et son impact sur votre budget.'
        : 'Log an expense and track its impact on your budget instantly.',
      accentClass: 'bg-rose-100 text-rose-700',
    },
    {
      href: '/goals?new=goal',
      icon: <Target className="h-5 w-5" aria-hidden="true" />,
      title: isFrench ? 'Objectif' : 'Goal',
      description: isFrench
        ? 'Définissez un objectif d’épargne ou de projet à atteindre.'
        : 'Create a new savings or project goal to stay motivated.',
      accentClass: 'bg-indigo-100 text-indigo-700',
    },
  ];

  const toggleLabel = isOpen
    ? isFrench
      ? 'Fermer les raccourcis rapides'
      : 'Close quick shortcuts'
    : isFrench
      ? 'Ouvrir les raccourcis rapides'
      : 'Open quick shortcuts';

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-4">
      <div
        className={cn(
          'pointer-events-none flex w-[320px] flex-col gap-3 transition-all duration-200 ease-out',
          isOpen
            ? 'opacity-100 translate-y-0 pointer-events-auto'
            : 'opacity-0 translate-y-4'
        )}
        aria-hidden={!isOpen}
      >
        {shortcuts.map(action => (
          <Link
            key={action.href}
            href={action.href}
            className="group block rounded-3xl border border-border/60 bg-background/95 p-4 shadow-lg backdrop-blur transition hover:-translate-y-1 hover:border-primary/40 hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            onClick={() => setIsOpen(false)}
          >
            <div className="flex items-start gap-3">
              <span
                className={cn(
                  'inline-flex h-11 w-11 items-center justify-center rounded-2xl transition group-hover:scale-110',
                  action.accentClass
                )}
              >
                {action.icon}
              </span>
              <div className="flex-1">
                <div className="font-semibold text-foreground">{action.title}</div>
                <p className="mt-1 text-xs text-muted-foreground leading-snug">
                  {action.description}
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>

      <Button
        size="icon"
        onClick={() => setIsOpen(prev => !prev)}
        aria-expanded={isOpen}
        aria-label={toggleLabel}
        className="h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-2xl hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
      >
        {isOpen ? <X className="h-6 w-6" aria-hidden="true" /> : <Plus className="h-6 w-6" aria-hidden="true" />}
      </Button>
    </div>
  );
}
