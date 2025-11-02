'use server';

import { getFinancialReportData } from '../_actions/get-report-data';
import type { FinancialReportData, UserProfile } from '@/lib/types';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  ArrowDown,
  ArrowUp,
  Banknote,
  Calendar,
  CheckCircle2,
  Lightbulb,
  Percent,
  Target,
  TrendingDown,
  TrendingUp,
  Wallet,
  AlarmClock,
  AlertTriangle,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ExportButtons } from './export-buttons';
import { LedgerTables, LedgerRow } from './ledger-tables';
import { makeCurrencyFormatter } from '@/lib/format';
import { ChartFinanceDebt } from './chart-finance-debt';

interface FinancialReportProps {
  from?: string;
  to?: string;
  includeDebt?: boolean;
}

// Helper to format currency consistently
const formatMoney = (amountInCents: number, profile: UserProfile | null) => {
  const fmt = makeCurrencyFormatter(profile || undefined);
  return fmt(amountInCents || 0);
};

export async function FinancialReport({ from, to, includeDebt = true }: FinancialReportProps) {
  let reportData: FinancialReportData;
  try {
    reportData = await getFinancialReportData({ from, to, includeDebt });
  } catch (e: any) {
    return <div className="text-destructive text-center p-8">{e.message}</div>;
  }

  const { userProfile, period, debtSummary } = reportData;
  const isFrench = userProfile?.locale === 'fr-CM';
  const locale = isFrench ? fr : undefined;

  const periodString = `${format(period.from, 'd MMM yyyy', { locale })} → ${format(
    period.to,
    'd MMM yyyy',
    { locale },
  )}`;
  const title = isFrench ? 'Rapport financier' : 'Financial Report';
  const currency = userProfile?.displayCurrency || 'USD';

  const hasDebtData = includeDebt && !!debtSummary;
  const serviceDebtTotal = hasDebtData ? debtSummary!.serviceDebtTotal : 0;
  const interestPaidTotal = hasDebtData ? debtSummary!.interestPaidTotal : 0;
  const remainingPrincipalEnd = hasDebtData ? debtSummary!.remainingPrincipalEnd : 0;
  const lateCount = hasDebtData ? debtSummary!.lateCount : 0;
  const dtiPercent = hasDebtData && debtSummary!.dti !== null ? debtSummary!.dti * 100 : null;
  const principalPaidTotal = hasDebtData ? debtSummary!.principalPaidTotal : 0;
  const upcomingInstallments = hasDebtData ? debtSummary!.next3Installments ?? [] : [];

  const interestShare =
    hasDebtData && reportData.totalExpenses > 0
      ? Math.min(100, (debtSummary!.interestPaidTotal / reportData.totalExpenses) * 100)
      : null;

  const translations = {
    totalIncome: isFrench ? 'Revenus totaux' : 'Total Income',
    totalExpenses: isFrench ? 'Dépenses totales' : 'Total Expenses',
    netBalance: isFrench ? 'Solde net' : 'Net Balance',
    variation: isFrench ? 'Variation' : 'Change',
    serviceDebt: isFrench ? 'Service de la dette' : 'Debt Service',
    interestPaid: isFrench ? 'Intérêts payés' : 'Interest Paid',
    debtBalance: isFrench ? 'Encours dette' : 'Debt Balance',
    dtiLabel: isFrench ? 'DTI' : 'DTI',
    lateLabel: isFrench ? 'Retards' : 'Late Installments',
    categoryBreakdown: isFrench ? 'Répartition par catégories' : 'Category Breakdown',
    budgetVsActual: isFrench ? 'Budgets vs Réalisé' : 'Budget vs Actual',
    debtNext: isFrench ? 'Dette — Prochaines échéances' : 'Debt — Upcoming Installments',
    debtReminder: isFrench
      ? 'Pensez au remboursement anticipé si trésorerie excédentaire.'
      : 'Consider prepayments when cash allows.',
    savingsGoals: isFrench ? 'Objectifs d\'épargne' : 'Savings Goals',
    aiSummary: isFrench ? 'Résumé Intelligent' : 'Smart Summary',
    recentTransactions: isFrench ? 'Transactions récentes' : 'Recent Transactions',
    generatedOn: isFrench ? 'Généré le' : 'Generated on',
    exportPDF: isFrench ? 'Exporter PDF' : 'Export PDF',
    exportExcel: isFrench ? 'Exporter Excel' : 'Export Excel',
    exportCSV: isFrench ? 'Exporter CSV' : 'Export CSV',
  };

  const formatDateLabel = (value: string, withYear = false) => {
    try {
      const date = new Date(value);
      return format(date, withYear ? 'd MMM yyyy' : 'd MMM', { locale });
    } catch {
      return value;
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 print:p-0 print:max-w-none">
        {/* 1. En-tête avec actions d'export */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 print:hidden">
          <div>
            <h1 className="text-3xl font-bold font-headline text-gray-900">
              {title} — {period.from.getFullYear()}
            </h1>
            <p className="text-lg text-gray-600 mt-1">
              {periodString} • {currency}
            </p>
          </div>

          <ExportButtons
            translations={{
              exportPDF: translations.exportPDF,
              exportExcel: translations.exportExcel,
              exportCSV: translations.exportCSV,
            }}
            reportData={reportData}
            userProfile={userProfile}
          />
        </div>

        {/* 2. Cartes KPI */}
        <div className="print-section print:break-inside-avoid">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 print:grid-cols-3">
            <Card className="border-l-4 border-l-emerald-500 print:break-inside-avoid">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-700">
                  {translations.totalIncome}
                </CardTitle>
                <div className="h-8 w-8 rounded-full bg-emerald-100 flex items-center justify-center">
                  <Wallet className="h-4 w-4 text-emerald-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-emerald-700">
                  {formatMoney(reportData.totalIncome, userProfile)}
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-rose-500 print:break-inside-avoid">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-700">
                  {translations.totalExpenses}
                </CardTitle>
                <div className="h-8 w-8 rounded-full bg-rose-100 flex items-center justify-center">
                  <ArrowDown className="h-4 w-4 text-rose-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-rose-700">
                  {formatMoney(reportData.totalExpenses, userProfile)}
                </div>
                {reportData.expenseDelta !== null && (
                  <p className="mt-1 text-xs text-rose-600">
                    {translations.variation}:{' '}
                    {`${reportData.expenseDelta > 0 ? '+' : ''}${reportData.expenseDelta.toFixed(1)}%`}
                  </p>
                )}
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-sky-500 print:break-inside-avoid">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-700">
                  {translations.netBalance}
                </CardTitle>
                <div className="h-8 w-8 rounded-full bg-sky-100 flex items-center justify-center">
                  <TrendingUp className="h-4 w-4 text-sky-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-sky-700">
                  {formatMoney(reportData.netBalance, userProfile)}
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  {reportData.netBalance >= 0
                    ? isFrench
                      ? 'Solde positif sur la période'
                      : 'Positive balance this period'
                    : isFrench
                      ? 'Solde négatif : surveillez vos charges'
                      : 'Negative balance: watch your spending'}
                </p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-amber-500 print:break-inside-avoid">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-700">
                  {translations.serviceDebt}
                </CardTitle>
                <div className="h-8 w-8 rounded-full bg-amber-100 flex items-center justify-center">
                  <Banknote className="h-4 w-4 text-amber-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-amber-700">
                  {hasDebtData ? formatMoney(serviceDebtTotal, userProfile) : '—'}
                </div>
                {hasDebtData && (
                  <p className="mt-1 text-xs text-gray-500">
                    {isFrench ? 'Principal' : 'Principal'}:{' '}
                    {formatMoney(principalPaidTotal, userProfile)} •{' '}
                    {isFrench ? 'Intérêts' : 'Interest'}:{' '}
                    {formatMoney(interestPaidTotal, userProfile)}
                  </p>
                )}
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-purple-500 print:break-inside-avoid">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-700">
                  {translations.interestPaid}
                </CardTitle>
                <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center">
                  <Percent className="h-4 w-4 text-purple-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-700">
                  {hasDebtData ? formatMoney(interestPaidTotal, userProfile) : '—'}
                </div>
                {interestShare !== null && (
                  <p className="mt-1 text-xs text-gray-500">
                    {isFrench
                      ? `Soit ${interestShare.toFixed(1)}% de vos dépenses`
                      : `${interestShare.toFixed(1)}% of total expenses`}
                  </p>
                )}
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-slate-500 print:break-inside-avoid">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-700">
                  {translations.debtBalance}
                </CardTitle>
                <div className="h-8 w-8 rounded-full bg-slate-200 flex items-center justify-center">
                  <AlarmClock className="h-4 w-4 text-slate-700" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-slate-800">
                  {hasDebtData ? formatMoney(remainingPrincipalEnd, userProfile) : '—'}
                </div>
                {upcomingInstallments[0] && (
                  <p className="mt-1 text-xs text-gray-500">
                    {isFrench ? 'Prochaine échéance' : 'Next installment'}:{' '}
                    {formatDateLabel(upcomingInstallments[0].dueDate, true)}
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          {hasDebtData && (
            <div className="mt-3 flex flex-wrap gap-2 print:break-inside-avoid">
              {dtiPercent !== null && (
                <Badge variant="secondary" className="text-xs font-semibold uppercase tracking-wide">
                  {translations.dtiLabel}: {dtiPercent.toFixed(1)}%
                </Badge>
              )}
              <Badge variant={lateCount > 0 ? 'destructive' : 'secondary'} className="text-xs font-semibold uppercase tracking-wide">
                {translations.lateLabel}: {lateCount}
              </Badge>
            </div>
          )}
        </div>

        {/* 3. Graphique multi-séries */}
        <div className="print-section print:break-inside-avoid">
          <ChartFinanceDebt
            data={reportData.financialSeries}
            currency={currency}
            locale={userProfile?.locale || (isFrench ? 'fr-CM' : 'en-US')}
            isFrench={isFrench}
          />
        </div>

        {/* 4. Doubles tableaux Dépenses / Revenus */}
        {(() => {
          const expenseRows: LedgerRow[] = (reportData.budgetVsActual || []).map((item) => ({
            category: item.category,
            plannedInCents: item.budgeted,
            actualInCents: item.actual,
            diffInCents: item.budgeted - item.actual,
          }));
          const incomeRows: LedgerRow[] = (reportData.incomeByCategory || []).map((item) => ({
            category: item.name,
            plannedInCents: 0,
            actualInCents: item.value,
            diffInCents: item.value,
          }));

          return (
            <div className="mb-8 print-section print:break-inside-avoid">
              <LedgerTables
                expenses={expenseRows}
                incomes={incomeRows}
                currency={currency}
                locale={userProfile?.locale || 'fr-FR'}
                debtServiceInCents={hasDebtData ? serviceDebtTotal : undefined}
              />
            </div>
          );
        })()}

        {/* 5. Layout principal - 2 colonnes */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Colonne gauche */}
          <div className="space-y-6">
            {/* Répartition par catégories */}
            <Card className="print-section print:break-inside-avoid">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-900">
                  {translations.categoryBreakdown}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {reportData.spendingByCategory.length > 0 ? (
                  <div className="space-y-3">
                    {reportData.spendingByCategory.slice(0, 5).map((category, index) => {
                      const total = reportData.spendingByCategory.reduce(
                        (sum, cat) => sum + cat.value,
                        0,
                      );
                      const percentage = total > 0 ? (category.value / total) * 100 : 0;
                      return (
                        <div
                          key={category.name}
                          className="flex items-center justify-between"
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{
                                backgroundColor: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'][index % 5],
                              }}
                            />
                            <span className="text-sm font-medium text-gray-700">
                              {category.name}
                            </span>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-semibold text-gray-900">
                              {formatMoney(category.value, userProfile)}
                            </div>
                            <div className="text-xs text-gray-500">
                              {percentage.toFixed(1)}%
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">
                    {isFrench ? 'Aucune donnée disponible' : 'No data available'}
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Objectifs d'épargne */}
            <Card className="print-section print:break-inside-avoid">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  {translations.savingsGoals}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {reportData.goals.length > 0 ? (
                  <div className="space-y-4">
                    {reportData.goals.slice(0, 3).map((goal) => {
                      const progress =
                        goal.targetAmountInCents > 0
                          ? (goal.currentAmountInCents / goal.targetAmountInCents) * 100
                          : 0;
                      const remaining =
                        goal.targetAmountInCents - goal.currentAmountInCents;

                      return (
                        <div key={goal.id} className="p-4 border border-gray-200 rounded-lg">
                          <h4 className="font-semibold text-gray-900 mb-2">{goal.name}</h4>
                          <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                            <div
                              className="bg-blue-600 h-2 rounded-full"
                              style={{ width: `${Math.min(100, progress)}%` }}
                            />
                          </div>
                          <div className="text-sm space-y-1">
                            <div className="flex justify-between">
                              <span className="text-gray-600">
                                {isFrench ? 'Épargné' : 'Saved'}:
                              </span>
                              <span className="font-medium text-green-700">
                                {formatMoney(goal.currentAmountInCents, userProfile)}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">
                                {isFrench ? 'Objectif' : 'Target'}:
                              </span>
                              <span className="font-medium">
                                {formatMoney(goal.targetAmountInCents, userProfile)}
                              </span>
                            </div>
                            {remaining > 0 && (
                              <div className="flex justify-between text-orange-700">
                                <span className="text-gray-600">
                                  {isFrench ? 'Restant' : 'Remaining'}:
                                </span>
                                <span className="font-medium">
                                  {formatMoney(remaining, userProfile)}
                                </span>
                              </div>
                            )}
                          </div>
                          {goal.targetDate && (
                            <div className="flex items-center gap-1 mt-2 text-xs text-gray-500">
                              <Calendar className="h-3 w-3" />
                              {format(new Date(goal.targetDate), 'd MMM yyyy', { locale })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">
                    {isFrench ? 'Aucun objectif configuré' : 'No goals configured'}
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Colonne droite */}
          <div className="space-y-6">
            {/* Budgets vs Réalisé */}
            <Card className="print-section print:break-inside-avoid">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-900">
                  {translations.budgetVsActual}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {reportData.budgetVsActual.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-2">
                            {isFrench ? 'Catégorie' : 'Category'}
                          </th>
                          <th className="text-right py-2">
                            {isFrench ? 'Budget' : 'Budget'}
                          </th>
                          <th className="text-right py-2">
                            {isFrench ? 'Réel' : 'Actual'}
                          </th>
                          <th className="text-center py-2">%</th>
                        </tr>
                      </thead>
                      <tbody>
                        {reportData.budgetVsActual.map((item, index) => {
                          const percentage =
                            item.budgeted > 0 ? (item.actual / item.budgeted) * 100 : 0;
                          const statusColor =
                            percentage < 70
                              ? 'bg-green-100 text-green-800'
                              : percentage <= 100
                                ? 'bg-orange-100 text-orange-800'
                                : 'bg-red-100 text-red-800';

                          return (
                            <tr key={index} className="border-b">
                              <td className="py-2 font-medium">{item.category}</td>
                              <td className="py-2 text-right">
                                {formatMoney(item.budgeted, userProfile)}
                              </td>
                              <td className="py-2 text-right">
                                {formatMoney(item.actual, userProfile)}
                              </td>
                              <td className="py-2 text-center">
                                <span className={`px-2 py-1 rounded text-xs ${statusColor}`}>
                                  {percentage.toFixed(0)}%
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">
                    {isFrench ? 'Aucun budget configuré' : 'No budgets configured'}
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Dette – Prochaines échéances */}
            <Card className="print-section print:break-inside-avoid">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-900">
                  {translations.debtNext}
                </CardTitle>
                <CardDescription>{translations.debtReminder}</CardDescription>
              </CardHeader>
              <CardContent>
                {hasDebtData && upcomingInstallments.length > 0 ? (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2">{isFrench ? 'Date' : 'Date'}</th>
                        <th className="text-right py-2">{isFrench ? 'Montant' : 'Amount'}</th>
                        <th className="text-left py-2">{isFrench ? 'Statut' : 'Status'}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {upcomingInstallments.slice(0, 3).map((item, idx) => (
                        <tr key={`${item.dueDate}-${idx}`} className="border-b last:border-none">
                          <td className="py-2">{formatDateLabel(item.dueDate, true)}</td>
                          <td className="py-2 text-right">
                            {formatMoney(item.amount, userProfile)}
                          </td>
                          <td className="py-2">
                            <Badge variant={item.status === 'EN_RETARD' ? 'destructive' : 'outline'}>
                              {item.status}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p className="text-gray-500 text-center py-4">
                    {hasDebtData
                      ? isFrench
                        ? 'Aucune échéance à venir.'
                        : 'No upcoming installments.'
                      : isFrench
                        ? 'Activez l’option “Inclure dette” pour voir les échéances.'
                        : 'Enable “Include debt” to display upcoming installments.'}
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* 6. Résumé intelligent */}
        <Card className="print-section print:break-inside-avoid">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-blue-600" />
              {translations.aiSummary}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <TrendingUp className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-gray-700">
                  {reportData.netBalance >= 0
                    ? isFrench
                      ? 'Situation financière stable avec un solde positif.'
                      : 'Stable financial situation with a positive balance.'
                    : isFrench
                      ? 'Attention au déficit sur la période : surveillez vos charges variables.'
                      : 'Deficit detected this period: tighten variable spending.'}
                </p>
              </div>

              {hasDebtData && interestShare !== null && (
                <div className="flex items-start gap-3">
                  <Percent className="h-4 w-4 text-purple-600 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-gray-700">
                    {isFrench
                      ? `Vos intérêts représentent ${interestShare.toFixed(1)}% de vos dépenses. Pensez à une renégociation de taux ou à un sur-paiement ciblé.`
                      : `Interest payments account for ${interestShare.toFixed(
                          1,
                        )}% of expenses. Consider renegotiating rates or targeting prepayments.`}
                  </p>
                </div>
              )}

              {hasDebtData && dtiPercent !== null && dtiPercent > 35 && (
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-gray-700">
                    {isFrench
                      ? 'Votre DTI dépasse 35%. Réduisez les charges non essentielles avant de contracter de nouvelles dettes.'
                      : 'Your DTI is above 35%. Trim non-essential spending before adding new debt.'}
                  </p>
                </div>
              )}

              {hasDebtData && lateCount === 0 ? (
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-gray-700">
                    {isFrench
                      ? 'Aucune échéance en retard — excellente discipline de remboursement !'
                      : 'No late installments — great repayment discipline!'}
                  </p>
                </div>
              ) : hasDebtData && lateCount > 0 ? (
                <div className="flex items-start gap-3">
                  <AlarmClock className="h-4 w-4 text-rose-600 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-gray-700">
                    {isFrench
                      ? `Vous avez ${lateCount} échéance(s) en retard. Priorisez un rattrapage pour éviter les pénalités.`
                      : `You have ${lateCount} overdue installment(s). Prioritize catching up to avoid penalties.`}
                  </p>
                </div>
              ) : null}

              <div className="border-t pt-3">
                <p className="text-xs text-gray-500 italic">
                  {isFrench
                    ? 'Conseils à visée éducative (non réglementé).'
                    : 'Educational advice only (not regulated).'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 7. Transactions récentes */}
        <Card className="print-section mb-8 print:break-inside-avoid">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900">
              {translations.recentTransactions}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {reportData.recentTransactions.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2">{isFrench ? 'Date' : 'Date'}</th>
                      <th className="text-left py-2">
                        {isFrench ? 'Description' : 'Description'}
                      </th>
                      <th className="text-left py-2">
                        {isFrench ? 'Catégorie' : 'Category'}
                      </th>
                      <th className="text-right py-2">{isFrench ? 'Montant' : 'Amount'}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.recentTransactions.slice(0, 10).map((transaction) => (
                      <tr key={transaction.id} className="border-b">
                        <td className="py-2">
                          {format(new Date(transaction.date), 'd MMM', { locale })}
                        </td>
                        <td className="py-2 font-medium">{transaction.description}</td>
                        <td className="py-2">
                          <span className="px-2 py-1 bg-gray-100 rounded text-xs">
                            {transaction.category}
                          </span>
                        </td>
                        <td
                          className={`py-2 text-right font-semibold ${
                            transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                          }`}
                        >
                          {transaction.type === 'income' ? '+' : '-'}
                          {formatMoney(Math.abs(transaction.amountInCents), userProfile)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">
                {isFrench ? 'Aucune transaction' : 'No transactions'}
              </p>
            )}
          </CardContent>
        </Card>

        {/* 8. Pied de page */}
        <div className="mt-12 pt-6 border-t border-gray-200 text-center">
          <div className="text-xs text-gray-500 space-y-1">
            <p>
              {translations.generatedOn}{' '}
              {format(new Date(), 'd MMMM yyyy', { locale })}
            </p>
            <p>
              {isFrench ? 'Utilisateur' : 'User'}: {userProfile?.firstName}{' '}
              {userProfile?.lastName}
            </p>
            <p>
              {isFrench ? 'Devise' : 'Currency'}: {currency}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
