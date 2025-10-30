'use client';

import { useState } from 'react';
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
import type { LucideIcon } from 'lucide-react';

type AccentToken = 'emerald' | 'rose' | 'indigo';

type Shortcut = {
  href: string;
  icon: LucideIcon;
  title: string;
  description: string;
  accent: AccentToken;
};

const accentStyles: Record<AccentToken, { icon: string; halo: string; card: string }> = {
  emerald: {
    icon: 'text-emerald-600',
    halo: 'from-emerald-400/30 via-emerald-400/10 to-transparent',
    card: 'hover:border-emerald-200/70 hover:shadow-emerald-100/40',
  },
  rose: {
    icon: 'text-rose-600',
    halo: 'from-rose-400/30 via-rose-400/10 to-transparent',
    card: 'hover:border-rose-200/70 hover:shadow-rose-100/40',
  },
  indigo: {
    icon: 'text-indigo-600',
    halo: 'from-indigo-400/30 via-indigo-400/10 to-transparent',
    card: 'hover:border-indigo-200/70 hover:shadow-indigo-100/40',
  },
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
      icon: TrendingUp,
      title: isFrench ? 'Revenu' : 'Income',
      description: isFrench
        ? 'Enregistrez un nouveau revenu pour garder votre cashflow à jour.'
        : 'Record a new income to keep your cash flow current.',
      accent: 'emerald',
    },
    {
      href: '/transactions/add?type=expense',
      icon: TrendingDown,
      title: isFrench ? 'Dépense' : 'Expense',
      description: isFrench
        ? 'Suivez instantanément une dépense et son impact sur votre budget.'
        : 'Log an expense and track its impact on your budget instantly.',
      accent: 'rose',
    },
    {
      href: '/goals?new=goal',
      icon: Target,
      title: isFrench ? 'Objectif' : 'Goal',
      description: isFrench
        ? 'Définissez un objectif d’épargne ou de projet à atteindre.'
        : 'Create a new savings or project goal to stay motivated.',
      accent: 'indigo',
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
          'pointer-events-none flex w-[306px] flex-col gap-3 transition-all duration-200 ease-out sm:w-[340px]',
          isOpen
            ? 'pointer-events-auto translate-y-0 opacity-100'
            : 'translate-y-4 opacity-0'
        )}
        aria-hidden={!isOpen}
      >
        {shortcuts.map(action => (
          <ShortcutCard
            key={action.href}
            action={action}
            onSelect={() => setIsOpen(false)}
          />
        ))}
      </div>

      <Button
        size="icon"
        onClick={() => setIsOpen(prev => !prev)}
        aria-expanded={isOpen}
        aria-label={toggleLabel}
        className={cn(
          'group relative h-11 w-11 overflow-hidden rounded-full border border-primary/20 bg-background/70 text-primary shadow-lg shadow-primary/15 backdrop-blur-sm transition-all duration-200',
          isOpen
            ? 'ring-2 ring-primary/30'
            : 'hover:-translate-y-1 hover:shadow-primary/25'
        )}
      >
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 rounded-full bg-gradient-to-br from-primary/20 via-primary/5 to-transparent opacity-90"
        />
        {isOpen ? (
          <X className="relative h-4 w-4" aria-hidden="true" />
        ) : (
          <Plus className="relative h-4 w-4" aria-hidden="true" />
        )}
      </Button>
    </div>
  );
}

type ShortcutCardProps = {
  action: Shortcut;
  onSelect: () => void;
};

function ShortcutCard({ action, onSelect }: ShortcutCardProps) {
  const Icon = action.icon;
  const accent = accentStyles[action.accent];

  return (
    <Link
      href={action.href}
      onClick={onSelect}
      className={cn(
        'group relative block overflow-hidden rounded-2xl border border-border/40 bg-background/75 p-4 shadow-lg shadow-black/5 backdrop-blur-sm transition-all duration-200 hover:-translate-y-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2',
        accent.card
      )}
    >
      <div className="flex items-start gap-3">
        <span className="relative inline-flex h-9 w-9 items-center justify-center rounded-xl border border-border/40 bg-gradient-to-br from-white/70 via-white/20 to-transparent shadow-inner transition-transform duration-200 group-hover:scale-110">
          <span
            className={cn(
              'absolute inset-0 rounded-xl opacity-0 blur transition group-hover:opacity-70',
              `bg-gradient-to-br ${accent.halo}`
            )}
            aria-hidden="true"
          />
          <Icon className={cn('relative h-4 w-4', accent.icon)} aria-hidden="true" />
        </span>
        <div className="flex-1">
          <p className="font-semibold text-foreground">{action.title}</p>
          <p className="mt-1 text-xs leading-snug text-muted-foreground">
            {action.description}
          </p>
        </div>
      </div>
    </Link>
  );
}
