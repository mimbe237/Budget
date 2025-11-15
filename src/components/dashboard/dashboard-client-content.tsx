'use client';

import { useMemo } from 'react';
import {
  Wallet,
  ArrowUpCircle,
  ArrowDownCircle,
  PiggyBank,
  BarChart3,
  Landmark,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  Lightbulb,
  Sparkles,
  Calendar,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

import type { Category, Transaction, UserProfile } from '@/lib/types';
import type { Debt } from '@/types/debt';
import { useUser, useCollection, useFirestore, useMemoFirebase, useDoc } from '@/firebase';
import { collection, query, limit, orderBy, doc } from 'firebase/firestore';
import { useAndroidBackHandler } from '@/hooks/useAndroidBackHandler';

// Lazy loaded components (Code Splitting Phase 3)
import { SpendingOverviewLazy, GoalsOverviewLazy, ChartFinanceDebtLazy } from '@/components/lazy-charts';
import { RecentTransactions } from '@/components/dashboard/recent-transactions';
import { BudgetsOverview } from '@/components/dashboard/budgets-overview';
import { BudgetOverviewMonthly } from '@/components/dashboard/budget-overview-monthly';
import { BudgetAlertMonitor } from '@/components/budgets/budget-alert-monitor';
import { GuidedTourLauncher } from '@/components/onboarding/GuidedTourLauncher';
import { DebtSnapshot } from '@/components/dashboard/debt-snapshot';
import type { SerializableFinancialReportData } from '@/app/dashboard/page';

type DashboardClientContentProps = {
  reportData: SerializableFinancialReportData;
  children?: React.ReactNode;
};

type AlertMessage = {
  id: string;
  tone: 'warning' | 'positive';
  message: string;
};

const STATUS_COLORS: Record<string, 'default' | 'outline' | 'secondary' | 'destructive'> = {
  EN_RETARD: 'destructive',
  'EN_RETARD ': 'destructive',
  EN_COURS: 'outline',
  SOLDEE: 'secondary',
  RESTRUCTUREE: 'secondary',
  A_ECHoir: 'outline',
};

export function DashboardClientContent({ reportData, children }: DashboardClientContentProps) {
  const { user } = useUser();
  const firestore = useFirestore();

  // Hook Android back handler
  useAndroidBackHandler();

  const transactionsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(
      collection(firestore, `users/${user.uid}/expenses`),
      orderBy('date', 'desc'),
      limit(100)
    );
  }, [firestore, user]);
  const { data: firestoreTransactions } = useCollection<Transaction>(transactionsQuery);

  const budgetsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, `users/${user.uid}/categories`));
  }, [firestore, user]);
  const { data: budgets } = useCollection<any>(budgetsQuery);

  const debtsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    // Scope to the authenticated user's debts subcollection to satisfy security rules
    return query(
      collection(firestore, `users/${user.uid}/debts`),
      orderBy('createdAt', 'desc'),
      limit(200)
    );
  }, [firestore, user]);
  const { data: debts } = useCollection<Debt>(debtsQuery);

  const userProfileRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, `users/${user.uid}`);
  }, [firestore, user]);
  const { data: userProfile } = useDoc<UserProfile>(userProfileRef);

  const displayCurrency = userProfile?.displayCurrency || 'USD';
  const displayLocale = userProfile?.locale || 'en-US';
  const isFrench = userProfile?.locale === 'fr-CM';

  const currencyFormatter = useMemo(
    () =>
      new Intl.NumberFormat(displayLocale, {
        style: 'currency',
        currency: displayCurrency,
      }),
    [displayCurrency, displayLocale]
  );

  const formatCurrency = (amountInCents: number) => currencyFormatter.format((amountInCents || 0) / 100);

  const categoryIcons: Record<Category, React.ReactNode> = useMemo(
    () => ({
      Housing: <Landmark className="h-4 w-4 text-muted-foreground" />,
      Food: <ArrowDownCircle className="h-4 w-4 text-muted-foreground" />,
      Transport: <TrendingDown className="h-4 w-4 text-muted-foreground" />,
      Entertainment: <Sparkles className="h-4 w-4 text-muted-foreground" />,
      Health: <Lightbulb className="h-4 w-4 text-muted-foreground" />,
      Shopping: <TrendingDown className="h-4 w-4 text-muted-foreground" />,
      Utilities: <Lightbulb className="h-4 w-4 text-muted-foreground" />,
      Income: <TrendingUp className="h-4 w-4 text-muted-foreground" />,
    }),
    []
  );

  const financialSeries = reportData.financialSeries ?? [];
  const latestFinancialPoint = financialSeries.length > 0 ? financialSeries[financialSeries.length - 1] : null;
  const currentBalanceCents = latestFinancialPoint?.cumulativeBalance ?? reportData.netBalance ?? 0;
  const netSavingsCents = reportData.totalIncome - reportData.totalExpenses - (reportData.debtSummary?.serviceDebtTotal ?? 0);
  const outstandingDebtCents = reportData.debtSummary?.remainingPrincipalEnd ?? 0;
  const serviceDebtTotal = reportData.debtSummary?.serviceDebtTotal ?? 0;
  const interestPaidTotal = reportData.debtSummary?.interestPaidTotal ?? 0;
  const upcomingInstallments = reportData.debtSummary?.next3Installments ?? [];
  const lateInstallments = reportData.debtSummary?.lateCount ?? 0;
  const dti = reportData.debtSummary?.dti ?? null;

  const topExpenses = reportData.spendingByCategory.slice(0, 3);
  const topIncomes = (reportData.incomeByCategory ?? []).slice(0, 3);

  const quickGoals = reportData.goals.slice(0, 3);
  const recentTransactions = reportData.recentTransactions.slice(0, 5);

  const periodLabel = useMemo(() => {
    try {
      return new Intl.DateTimeFormat(displayLocale, { month: 'long', year: 'numeric' }).format(
        new Date(reportData.period.from)
      );
    } catch {
      return reportData.period.from;
    }
  }, [reportData.period.from, displayLocale]);

  const interestShare = reportData.totalExpenses > 0 ? interestPaidTotal / reportData.totalExpenses : 0;

  const alerts: AlertMessage[] = [];

  if (interestShare > 0.1) {
    alerts.push({
      id: 'interest-share',
      tone: 'warning',
      message: isFrench
        ? `Vos intérêts représentent ${(interestShare * 100).toFixed(1)} % de vos dépenses sur ${periodLabel}. Envisagez une renégociation ou un remboursement anticipé.`
        : `Interest charges represent ${(interestShare * 100).toFixed(1)}% of your spending in ${periodLabel}. Consider refinancing or prepaying.`,
    });
  }

  if (typeof dti === 'number' && dti > 0.35) {
    alerts.push({
      id: 'high-dti',
      tone: 'warning',
      message: isFrench
        ? 'Votre ratio d’endettement (DTI) dépasse 35 %. Réduisez vos charges ou évitez de nouveaux crédits.'
        : 'Your debt-to-income ratio is above 35%. Reduce expenses or delay new credit.',
    });
  }

  if (reportData.expenseDelta && reportData.expenseDelta > 5) {
    alerts.push({
      id: 'expense-delta',
      tone: 'warning',
      message: isFrench
        ? `Les dépenses sont en hausse de ${reportData.expenseDelta.toFixed(1)} % par rapport à la période précédente.`
        : `Expenses increased by ${reportData.expenseDelta.toFixed(1)}% vs the previous period.`,
    });
  }

  if (alerts.length === 0) {
    alerts.push({
      id: 'all-good',
      tone: 'positive',
      message: isFrench
        ? 'Gestion saine : continuez d’alimenter vos objectifs et de surveiller vos budgets.'
        : 'Finances healthy: keep funding your goals and monitoring budgets.',
    });
  }

  const insightsSection = children ? (
    <div className="h-full">{children}</div>
  ) : (
    <Card className="h-full border-dashed border-slate-200/70">
      <CardContent className="flex h-full flex-col items-start justify-center gap-3 text-sm text-muted-foreground">
        <p>{isFrench ? 'Activez les insights IA pour des recommandations personnalisées.' : 'Enable AI insights to unlock personalised recommendations.'}</p>
        <p>{isFrench ? 'Ajoutez vos transactions, budgets et dettes pour un suivi intelligent.' : 'Feed the system with transactions, budgets and debts for a smarter overview.'}</p>
      </CardContent>
    </Card>
  );

  const kpiCards = [
    {
      id: 'current-balance',
      title: isFrench ? 'Solde actuel' : 'Current balance',
      value: formatCurrency(currentBalanceCents),
      icon: <Wallet className="h-5 w-5 text-blue-500" />,
      accent: 'from-blue-50/80 via-blue-100/70 to-slate-100/60',
    },
    {
      id: 'total-income',
      title: isFrench ? 'Revenus (période)' : 'Income (period)',
      value: formatCurrency(reportData.totalIncome),
      icon: <ArrowUpCircle className="h-5 w-5 text-emerald-500" />,
      accent: 'from-emerald-50/80 via-emerald-100/70 to-slate-100/60',
    },
    {
      id: 'total-expenses',
      title: isFrench ? 'Dépenses (période)' : 'Expenses (period)',
      value: formatCurrency(reportData.totalExpenses),
      icon: <ArrowDownCircle className="h-5 w-5 text-rose-500" />,
      accent: 'from-rose-50/80 via-rose-100/70 to-slate-100/60',
    },
    {
      id: 'net-savings',
      title: isFrench ? 'Épargne nette' : 'Net savings',
      value: formatCurrency(netSavingsCents),
      icon: <PiggyBank className="h-5 w-5 text-violet-500" />,
      accent: 'from-violet-50/80 via-violet-100/70 to-slate-100/60',
    },
    {
      id: 'net-balance',
      title: isFrench ? 'Solde net du mois' : 'Monthly net balance',
      value: formatCurrency(reportData.netBalance),
      icon: <BarChart3 className="h-5 w-5 text-indigo-500" />,
      accent: 'from-indigo-50/80 via-indigo-100/70 to-slate-100/60',
    },
    {
      id: 'debt-outstanding',
      title: isFrench ? 'Encours dette' : 'Outstanding debt',
      value: formatCurrency(outstandingDebtCents),
      icon: <Landmark className="h-5 w-5 text-amber-500" />,
      accent: 'from-amber-50/80 via-amber-100/70 to-slate-100/60',
      badge:
        typeof dti === 'number'
          ? {
              text: `DTI ${(dti * 100).toFixed(1)}%`,
              variant: (dti > 0.35 ? 'destructive' : 'secondary') as 'destructive' | 'secondary',
            }
          : null,
    },
  ];

  const debtExpressList = upcomingInstallments.slice(0, 3);

  const spendingOverviewTransactions = firestoreTransactions ?? [];
  const budgetsData = budgets ?? [];

  return (
    <>
      <BudgetAlertMonitor />

      <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
            {isFrench ? 'Vue d’ensemble financière' : 'Financial overview'}
          </h1>
          <p className="text-sm text-muted-foreground">
            {isFrench ? 'Période en cours : ' : 'Current period: '}
            {periodLabel}
          </p>
        </div>
        <GuidedTourLauncher />
      </div>

      <div data-tour="summary-cards" className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {kpiCards.map(card => (
          <Card
            key={card.id}
            className={`bg-gradient-to-br ${card.accent} backdrop-blur-xl shadow-lg border-0 rounded-2xl transition-transform duration-200 hover:scale-[1.02] print:break-inside-avoid`}
          >
            <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3">
              <div>
                <CardTitle className="text-base font-semibold font-headline text-slate-800">
                  {card.title}
                </CardTitle>
              </div>
              <div className="rounded-full bg-white/80 p-2 shadow">
                {card.icon}
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="text-3xl font-bold text-slate-900 tracking-tight">{card.value}</div>
              {'badge' in card && card.badge ? (
                <Badge variant={card.badge.variant} className="text-xs">
                  {card.badge.text}
                </Badge>
              ) : null}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-[2fr_1fr]">
        <div className="min-w-0">
          <ChartFinanceDebtLazy
            data={reportData.financialSeries}
            currency={displayCurrency}
            locale={displayLocale}
            isFrench={!!isFrench}
          />
        </div>

        <div className="space-y-4 min-w-0">
          <Card className="h-fit print:break-inside-avoid">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-headline">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                {isFrench ? 'Alertes & Insights' : 'Alerts & insights'}
              </CardTitle>
              <CardDescription>
                {isFrench
                  ? 'Détection automatique des signaux financiers importants.'
                  : 'Automatic detection of key financial signals.'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {alerts.map(alert => (
                <div
                  key={alert.id}
                  className="flex items-start gap-3 rounded-xl border border-slate-200/70 bg-slate-50/70 p-3"
                >
                  {alert.tone === 'warning' ? (
                    <AlertTriangle className="h-4 w-4 text-amber-500 mt-1 flex-shrink-0" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-1 flex-shrink-0" />
                  )}
                  <p className="text-sm text-slate-700">{alert.message}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          <div className="h-fit">
            {insightsSection}
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <DebtSnapshot
          debts={debts}
          locale={displayLocale}
          currency={displayCurrency}
          interestPaid={interestPaidTotal}
          serviceDebt={serviceDebtTotal}
        />

        <Card className="min-w-0 print:break-inside-avoid">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-headline">
              <TrendingDown className="h-4 w-4 text-rose-500 flex-shrink-0" />
              {isFrench ? 'Top dépenses / revenus' : 'Top spending / income'}
            </CardTitle>
            <CardDescription>
              {isFrench ? 'Catégories les plus actives sur la période.' : 'Most active categories this period.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 text-sm">
            <div>
              <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-rose-500">
                {isFrench ? 'Dépenses' : 'Spending'}
              </h4>
              {topExpenses.length > 0 ? (
                <ul className="space-y-2">
                  {topExpenses.map(category => (
                    <li key={category.name} className="flex items-center justify-between gap-2">
                      <span className="flex items-center gap-2 min-w-0">
                        <Badge variant="outline" className="whitespace-nowrap">{category.name}</Badge>
                      </span>
                      <span className="font-semibold text-slate-900 whitespace-nowrap">
                        {formatCurrency(category.value)}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-muted-foreground">
                  {isFrench ? 'Pas encore de dépenses enregistrées.' : 'No spending recorded yet.'}
                </p>
              )}
            </div>

            <div>
              <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-emerald-500">
                {isFrench ? 'Revenus' : 'Income'}
              </h4>
              {topIncomes.length > 0 ? (
                <ul className="space-y-2">
                  {topIncomes.map(category => (
                    <li key={category.name} className="flex items-center justify-between gap-2">
                      <span className="flex items-center gap-2 min-w-0">
                        <Badge variant="outline" className="whitespace-nowrap">{category.name}</Badge>
                      </span>
                      <span className="font-semibold text-slate-900 whitespace-nowrap">
                        {formatCurrency(category.value)}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-muted-foreground">
                  {isFrench ? 'Aucun revenu catégorisé.' : 'No categorised income yet.'}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="min-w-0 print:break-inside-avoid">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-headline">
              <Sparkles className="h-4 w-4 text-violet-500" />
              {isFrench ? 'Objectifs rapides' : 'Quick goals'}
            </CardTitle>
            <CardDescription>
              {isFrench ? 'Progression des objectifs prioritaires.' : 'Progress on your priority goals.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {quickGoals.length > 0 ? (
              quickGoals.map(goal => {
                const target = goal.targetAmountInCents || 0;
                const current = goal.currentAmountInCents || 0;
                const progress = target > 0 ? Math.min(100, (current / target) * 100) : 0;
                const remaining = Math.max(0, target - current);
                return (
                  <div key={goal.id} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-slate-900">{goal.name}</span>
                      <span className="text-muted-foreground">{progress.toFixed(0)}%</span>
                    </div>
                    <Progress value={progress} />
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>
                        {isFrench ? 'Restant' : 'Remaining'}: {formatCurrency(remaining)}
                      </span>
                      {goal.targetDate ? (
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {goal.targetDate}
                        </span>
                      ) : null}
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-sm text-muted-foreground">
                {isFrench ? 'Aucun objectif défini pour le moment.' : 'No goals defined yet.'}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div className="space-y-4">
          <Card data-tour="spending-overview" className="print:break-inside-avoid">
            <CardHeader>
              <CardTitle className="font-headline text-slate-900">
                {isFrench ? 'Répartition des dépenses' : 'Spending overview'}
              </CardTitle>
              <CardDescription>
                {isFrench
                  ? 'Analyse des dépenses par catégorie sur les mouvements récents.'
                  : 'How your recent spending is split across categories.'}
              </CardDescription>
            </CardHeader>
            <CardContent className="pl-2">
              <SpendingOverviewLazy transactions={spendingOverviewTransactions} />
            </CardContent>
          </Card>

          <RecentTransactions transactions={recentTransactions as Transaction[]} categoryIcons={categoryIcons} />

          <div data-tour="goals-overview">
            <GoalsOverviewLazy />
          </div>
        </div>

        <div className="grid auto-rows-max items-start gap-4 md:gap-6">
          <div data-tour="budget-overview">
            <BudgetOverviewMonthly />
          </div>
          <BudgetsOverview
            budgets={budgetsData}
            transactions={spendingOverviewTransactions}
            categoryIcons={categoryIcons}
          />
        </div>
      </div>
    </>
  );
}
