'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Target, Calendar, Plus, Sparkles, TrendingUp, AlarmClock, PiggyBank, Home, Car, Plane, Gift, Heart, Book, Dumbbell, Briefcase } from 'lucide-react';
import { useUser, useFirestore, useMemoFirebase, useCollection } from '@/firebase';
import { collection, query, orderBy, limit } from 'firebase/firestore';
import type { Goal, Currency, GoalType } from '@/lib/types';
import { ResponsiveContainer, RadialBarChart, RadialBar, PolarAngleAxis } from 'recharts';
import { differenceInCalendarDays, differenceInDays, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';

type PaceCategory = 'ahead' | 'on-track' | 'behind';

const GOAL_TYPE_LABELS: Record<GoalType, { fr: string; en: string; tone: 'success' | 'warning' | 'info' | 'neutral' }> = {
  epargne: { fr: 'Épargne', en: 'Savings', tone: 'success' },
  achat: { fr: 'Dépense à réduire', en: 'Spending reduction', tone: 'warning' },
  dette: { fr: 'Dette à solder', en: 'Debt payoff', tone: 'info' },
  plafond: { fr: 'Plafond de dépenses', en: 'Spending cap', tone: 'neutral' },
};

const GOAL_ICON_COMPONENTS: Record<string, React.ComponentType<{ className?: string }>> = {
  target: Target,
  plane: Plane,
  car: Car,
  home: Home,
  'piggy-bank': PiggyBank,
  gift: Gift,
  heart: Heart,
  book: Book,
  dumbbell: Dumbbell,
  briefcase: Briefcase,
};

const PACE_META: Record<
  PaceCategory,
  {
    fr: string;
    en: string;
    badgeVariant: 'default' | 'outline' | 'secondary';
    toneClass: string;
  }
> = {
  ahead: {
    fr: 'En avance',
    en: 'Ahead',
    badgeVariant: 'default',
    toneClass: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  },
  'on-track': {
    fr: 'Sur la bonne voie',
    en: 'On track',
    badgeVariant: 'secondary',
    toneClass: 'bg-blue-100 text-blue-700 border-blue-200',
  },
  behind: {
    fr: 'À rattraper',
    en: 'Needs attention',
    badgeVariant: 'outline',
    toneClass: 'bg-amber-100 text-amber-700 border-amber-200',
  },
};

function formatCurrency(amountInCents: number, locale: string, currency: Currency) {
  const amount = amountInCents / 100;
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

type ComputedGoal = {
  goal: Goal;
  progressPct: number;
  expectedPct: number;
  pace: PaceCategory;
  probability: number;
  remainingAmount: number;
  recommendedBoost: number;
  aiMessage: string;
};

export default function GoalsOverview() {
  const { user, userProfile } = useUser();
  const firestore = useFirestore();

  const isFrench = userProfile?.locale === 'fr-CM';
  const displayCurrency = (userProfile?.displayCurrency || 'USD') as Currency;
  const displayLocale = userProfile?.locale || 'en-US';

  const goalsQuery = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return query(
      collection(firestore, `users/${user.uid}/budgetGoals`),
      orderBy('createdAt', 'desc'),
      limit(3),
    );
  }, [user, firestore]);

  const legacyGoalsQuery = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return query(
      collection(firestore, `users/${user.uid}/goals`),
      orderBy('createdAt', 'desc'),
      limit(3),
    );
  }, [user, firestore]);

  const { data: goalsPrimary, isLoading } = useCollection<Goal>(goalsQuery);
  const { data: goalsLegacy } = useCollection<Goal>(legacyGoalsQuery);

  const goalsPrimaryFiltered = goalsPrimary?.filter((goal) => !goal.archived) ?? [];
  const goalsLegacyFiltered = goalsLegacy?.filter((goal) => !goal.archived) ?? [];
  const goals = goalsPrimaryFiltered.length > 0 ? goalsPrimaryFiltered : goalsLegacyFiltered;

  const computedGoals = useMemo<ComputedGoal[]>(() => {
    if (!goals) return [];
    const today = new Date();

    return goals.map((goal) => {
      const targetAmount = goal.targetAmountInCents || 0;
      const currentAmount = goal.currentAmountInCents || 0;
      const progressPct = targetAmount === 0 ? 0 : Math.min((currentAmount / targetAmount) * 100, 150);

      const targetDate = goal.targetDate ? parseISO(goal.targetDate) : new Date();
      const creationDate = goal.createdAt ? parseISO(goal.createdAt) : new Date(targetDate.getTime() - 90 * 24 * 60 * 60 * 1000);

      const totalDays = Math.max(1, differenceInCalendarDays(targetDate, creationDate));
      const elapsedDays = Math.min(
        totalDays,
        Math.max(0, differenceInCalendarDays(today, creationDate)),
      );
      const expectedPct = Math.min(100, Math.max(0, (elapsedDays / totalDays) * 100));

      const delta = progressPct - expectedPct;
      let pace: PaceCategory = 'on-track';
      if (delta > 7) pace = 'ahead';
      else if (delta < -7) pace = 'behind';

      const baseProbability =
        goal.projectionConfidence != null
          ? goal.projectionConfidence
          : 0.6 + delta / 150;
      const probability = Math.min(0.98, Math.max(0.05, baseProbability));

      const expectedAmount = (targetAmount / 100) * (expectedPct / 100);
      const remainingAmount = Math.max(0, (targetAmount - currentAmount) / 100);
      const gapAmount = Math.max(0, expectedAmount - currentAmount / 100);

      // Recommended boost per month until target date
      const remainingDays = Math.max(1, differenceInDays(targetDate, today));
      const remainingMonths = remainingDays / 30;
      const recommendedBoost = remainingMonths > 0 ? gapAmount / remainingMonths : gapAmount;

      const aiMessage = buildAIMessage({
        isFrench,
        pace,
        probability,
        recommendedBoost,
        currency: displayCurrency,
        locale: displayLocale,
        linkedDebt: goal.linkedDebtTitle ?? null,
      });

      return {
        goal,
        progressPct,
        expectedPct,
        pace,
        probability,
        remainingAmount,
        recommendedBoost,
        aiMessage,
      };
    });
  }, [goals, displayCurrency, displayLocale, isFrench]);

  const translations = {
    title: isFrench ? 'Objectifs financiers' : 'Financial goals',
    description: isFrench
      ? 'Radars IA + état d’avancement des trois objectifs prioritaires.'
      : 'AI radar and progress for your top goals.',
    viewAll: isFrench ? 'Voir tous les objectifs' : 'View all goals',
    addGoal: isFrench ? 'Nouvel objectif' : 'New goal',
    noGoalsTitle: isFrench ? 'Aucun objectif actif' : 'No active goals',
    noGoalsDescription: isFrench
      ? 'Créez un objectif pour suivre vos progrès et recevoir des recommandations IA.'
      : 'Create a goal to track progress and receive AI recommendations.',
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-headline">
            <Target className="h-5 w-5 text-emerald-600" />
            {translations.title}
          </CardTitle>
          <CardDescription>{translations.description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              key={index}
              className="h-28 animate-pulse rounded-xl border border-dashed border-muted-foreground/20 bg-muted/30"
            />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="print:break-inside-avoid">
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle className="flex items-center gap-2 font-headline">
            <Target className="h-5 w-5 text-emerald-600" />
            {translations.title}
          </CardTitle>
          <CardDescription>{translations.description}</CardDescription>
        </div>
        <div className="flex gap-2">
          <Link href="/goals?new=goal">
            <Button size="sm" variant="secondary" className="hidden sm:flex">
              <Plus className="mr-2 h-4 w-4" />
              {translations.addGoal}
            </Button>
          </Link>
          <Link href="/goals">
            <Button size="sm" variant="outline">
              {translations.viewAll}
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {(!computedGoals || computedGoals.length === 0) ? (
          <div className="rounded-xl border border-dashed p-6 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
              <Target className="h-5 w-5" />
            </div>
            <h3 className="text-lg font-semibold">{translations.noGoalsTitle}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{translations.noGoalsDescription}</p>
            <Link href="/goals?new=goal">
              <Button className="mt-4">
                <Plus className="mr-2 h-4 w-4" />
                {translations.addGoal}
              </Button>
            </Link>
          </div>
        ) : (
          computedGoals.map((entry) => {
            const { goal, progressPct, expectedPct, pace, probability, remainingAmount, aiMessage } = entry;
            const typeMeta =
              GOAL_TYPE_LABELS[goal.type ?? 'epargne'] ?? GOAL_TYPE_LABELS.epargne;
            const paceMeta = PACE_META[pace];
            const IconComponent =
              (goal.icon && GOAL_ICON_COMPONENTS[goal.icon]) || GOAL_ICON_COMPONENTS.target;
            const displayProbability = Math.round(probability * 100);
            const targetDateObj = goal.targetDate ? new Date(goal.targetDate) : null;
            const targetDateLabel = targetDateObj
              ? targetDateObj.toLocaleDateString(displayLocale, {
                  year: 'numeric',
                  month: 'short',
                })
              : isFrench
                ? 'Non défini'
                : 'Not set';

            const chartData = [
              {
                name: 'radar',
                progress: Math.min(progressPct, 130),
                expected: expectedPct,
              },
            ];

            return (
              <div
                key={goal.id}
                className="grid gap-5 rounded-xl border border-slate-200 bg-white/80 p-5 shadow-sm backdrop-blur print:bg-white print:shadow-none sm:grid-cols-[140px_1fr]"
              >
                <div className="relative flex items-center justify-center">
                  <ResponsiveContainer width="100%" height={140}>
                    <RadialBarChart
                      data={chartData}
                      innerRadius={40}
                      outerRadius={60}
                      startAngle={90}
                      endAngle={-270}
                    >
                      <PolarAngleAxis type="number" domain={[0, 130]} tick={false} />
                      <RadialBar
                        dataKey="expected"
                        fill="rgba(148, 163, 184, 0.25)"
                        cornerRadius={10}
                      />
                      <RadialBar
                        dataKey="progress"
                        fill={goal.color ?? 'rgba(16, 185, 129, 0.8)'}
                        cornerRadius={12}
                      />
                    </RadialBarChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                    <span className="text-2xl font-semibold text-foreground">
                      {Math.round(progressPct)}%
                    </span>
                    <span className="text-[11px] text-muted-foreground">
                      {isFrench ? 'réalisé' : 'complete'}
                    </span>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            'flex h-9 w-9 items-center justify-center rounded-full border',
                            goal.color ? '' : 'border-emerald-200 bg-emerald-50 text-emerald-600',
                          )}
                          style={
                            goal.color
                              ? {
                                  borderColor: goal.color,
                                  backgroundColor: `${goal.color}1a`,
                                  color: goal.color,
                                }
                              : undefined
                          }
                          aria-hidden
                        >
                          <IconComponent className="h-5 w-5" />
                        </span>
                        <div>
                          <h3 className="text-lg font-semibold leading-tight">{goal.name}</h3>
                          {goal.description && (
                            <p className="text-xs text-muted-foreground line-clamp-2">
                              {goal.description}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Badge
                          variant="outline"
                          className={cn(
                            'border',
                            typeMeta.tone === 'success' && 'border-emerald-200 bg-emerald-50 text-emerald-700',
                            typeMeta.tone === 'warning' && 'border-amber-200 bg-amber-50 text-amber-700',
                            typeMeta.tone === 'info' && 'border-sky-200 bg-sky-50 text-sky-700',
                            typeMeta.tone === 'neutral' && 'border-slate-200 bg-slate-50 text-slate-700',
                          )}
                        >
                          {isFrench ? typeMeta.fr : typeMeta.en}
                        </Badge>
                        <Badge variant="outline" className={paceMeta.toneClass}>
                          {pace === 'ahead' && <TrendingUp className="mr-1 h-3 w-3" />}
                          {pace === 'behind' && <AlarmClock className="mr-1 h-3 w-3" />}
                          {isFrench ? paceMeta.fr : paceMeta.en}
                        </Badge>
                        {goal.linkedCategoryName && (
                          <Badge variant="outline" className="border-indigo-200 bg-indigo-50 text-indigo-700">
                            {goal.linkedCategoryName}
                          </Badge>
                        )}
                        {goal.linkedDebtTitle && (
                          <Badge variant="outline" className="border-rose-200 bg-rose-50 text-rose-700">
                            {goal.linkedDebtTitle}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="text-right text-sm">
                      <div className="flex items-center justify-end gap-1 text-muted-foreground">
                        <Calendar className="h-3.5 w-3.5" />
                        <span>{targetDateLabel}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {isFrench ? 'Probabilité IA:' : 'AI probability:'}{' '}
                        <span className="font-medium text-foreground">{displayProbability}%</span>
                      </p>
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-3 text-xs text-slate-600">
                      <div className="flex items-center justify-between">
                        <span>{isFrench ? 'Montant atteint' : 'Progressed'}</span>
                        <span className="font-medium text-foreground">
                          {formatCurrency(goal.currentAmountInCents || 0, displayLocale, displayCurrency)}
                        </span>
                      </div>
                      <div className="mt-1 flex items-center justify-between text-[11px] uppercase tracking-wide text-muted-foreground">
                        <span>{isFrench ? 'Objectif' : 'Target'}</span>
                        <span>
                          {formatCurrency(goal.targetAmountInCents || 0, displayLocale, displayCurrency)}
                        </span>
                      </div>
                    </div>

                    <div className="rounded-lg border border-dashed border-emerald-200 bg-emerald-50/60 p-3 text-xs text-emerald-700">
                      <div className="flex items-center gap-2 text-xs font-medium">
                        <Sparkles className="h-3.5 w-3.5" />
                        {isFrench ? 'Recommandation IA' : 'AI recommendation'}
                      </div>
                      <p className="mt-1 text-[11px] leading-relaxed">{aiMessage}</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-3 text-xs text-muted-foreground">
                    <div>
                      {isFrench ? 'Reste à financer' : 'Remaining'}:{' '}
                      <span className="font-medium text-foreground">
                        {formatCurrency(Math.round(remainingAmount * 100), displayLocale, displayCurrency)}
                      </span>
                    </div>
                    <Link href={`/goals?goalId=${goal.id}#details`} className="text-foreground underline-offset-4 hover:underline">
                      {isFrench ? 'Voir le plan' : 'View plan'}
                    </Link>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}

function buildAIMessage({
  isFrench,
  pace,
  probability,
  recommendedBoost,
  currency,
  locale,
  linkedDebt,
}: {
  isFrench: boolean;
  pace: PaceCategory;
  probability: number;
  recommendedBoost: number;
  currency: Currency;
  locale: string;
  linkedDebt: string | null;
}) {
  const formattedBoost = new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(Math.max(0, Math.round(recommendedBoost)));

  if (pace === 'ahead' && probability > 0.75) {
    return isFrench
      ? 'Excellente dynamique — maintenez ce rythme pour atteindre votre objectif en avance.'
      : 'Momentum is great—stay consistent to hit the goal early.';
  }

  if (pace === 'behind') {
    if (linkedDebt) {
      return isFrench
        ? `Ajoutez environ ${formattedBoost} par mois pour sécuriser le remboursement ${linkedDebt}.`
        : `Add roughly ${formattedBoost} monthly to stay on track with ${linkedDebt}.`;
    }
    return isFrench
      ? `Augmentez de ${formattedBoost} par mois pour rattraper la trajectoire idéale.`
      : `Boost contributions by ${formattedBoost} monthly to recover the ideal pace.`;
  }

  if (probability < 0.55) {
    return isFrench
      ? 'Probabilité faible : planifiez un virement automatique ou cherchez un gain ponctuel.'
      : 'Low probability detected: schedule an automatic top-up or look for a one-off boost.';
  }

  return isFrench
    ? 'Restez régulier : une contribution supplémentaire déclenchera un rappel positif.'
    : 'Stay consistent—one extra contribution will trigger a positive reminder.';
}
