'use server';

import { getFinancialReportData } from '../_actions/get-report-data';
import type { FinancialReportData, UserProfile } from '@/lib/types';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowUp, ArrowDown, TrendingUp, TrendingDown, Target, Lightbulb, Calendar } from 'lucide-react';
import { ExportButtons } from './export-buttons';
import { LedgerTables, LedgerRow } from './ledger-tables';
import { makeCurrencyFormatter } from '@/lib/format';

interface FinancialReportProps {
  from?: string;
  to?: string;
}

// Helper to format currency consistently
const formatMoney = (amountInCents: number, profile: UserProfile | null) => {
    const fmt = makeCurrencyFormatter(profile || undefined);
    return fmt(amountInCents || 0);
};

export async function FinancialReport({ from, to }: FinancialReportProps) {
    let reportData: FinancialReportData;
    try {
        reportData = await getFinancialReportData({ from, to });
    } catch (e: any) {
        return <div className="text-destructive text-center p-8">{e.message}</div>
    }

    const { userProfile, period } = reportData;
    const isFrench = userProfile?.locale === 'fr-CM';
    const locale = isFrench ? fr : undefined;
    
    const periodString = `${format(period.from, 'd MMM yyyy', { locale })} → ${format(period.to, 'd MMM yyyy', { locale })}`;
    const title = isFrench ? 'Rapport financier' : 'Financial Report';
    const currency = userProfile?.displayCurrency || 'USD';

    const translations = {
        totalIncome: isFrench ? 'Revenus totaux' : 'Total Income',
        totalExpenses: isFrench ? 'Dépenses totales' : 'Total Expenses',
        netBalance: isFrench ? 'Solde net' : 'Net Balance',
        variation: isFrench ? 'Variation' : 'Change',
        vsPrevious: isFrench ? 'vs période précédente' : 'vs previous period',
        categoryBreakdown: isFrench ? 'Répartition par catégories' : 'Category Breakdown',
        budgetVsActual: isFrench ? 'Budgets vs Réalisé' : 'Budget vs Actual',
        savingsGoals: isFrench ? 'Objectifs d\'épargne' : 'Savings Goals',
        aiSummary: isFrench ? 'Résumé Intelligent' : 'Smart Summary',
        recentTransactions: isFrench ? 'Transactions récentes' : 'Recent Transactions',
        generatedOn: isFrench ? 'Généré le' : 'Generated on',
        exportPDF: isFrench ? 'Exporter PDF' : 'Export PDF',
        exportExcel: isFrench ? 'Exporter Excel' : 'Export Excel',
        exportCSV: isFrench ? 'Exporter CSV' : 'Export CSV',
        exportCSV: isFrench ? 'Exporter CSV' : 'Export CSV',
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
                    
                    <ExportButtons translations={{
                        exportPDF: translations.exportPDF,
                        exportExcel: translations.exportExcel,
                        exportCSV: translations.exportCSV
                    }} />
                </div>

                {/* 2. Doubles tableaux Dépenses / Revenus */}
                {(() => {
                    const formatFn = (cents: number) => formatMoney(cents, userProfile);
                    // Dépenses: basé sur budgetVsActual
                    const expenseRows: LedgerRow[] = (reportData.budgetVsActual || []).map(item => ({
                        category: item.category,
                        plannedInCents: item.budgeted,
                        actualInCents: item.actual,
                        diffInCents: item.budgeted - item.actual,
                    }));
                    // Revenus: basé sur incomeByCategory (planned=0 par défaut)
                    const incomeRows: LedgerRow[] = (reportData.incomeByCategory || []).map(item => ({
                        category: item.name,
                        plannedInCents: 0,
                        actualInCents: item.value,
                        diffInCents: item.value - 0,
                    }));

                    return (
                        <div className="mb-8 print-section">
                            <LedgerTables 
                                expenses={expenseRows}
                                incomes={incomeRows}
                                formatMoney={formatFn}
                            />
                        </div>
                    );
                })()}

                {/* 3. KPIs - 4 cartes en ligne */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8 print-section">
                    {/* Revenus */}
                    <Card className="border-l-4 border-l-green-500">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-gray-700">
                                {translations.totalIncome}
                            </CardTitle>
                            <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                                <ArrowUp className="h-4 w-4 text-green-600" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-green-700">
                                {formatMoney(reportData.totalIncome, userProfile)}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Dépenses */}
                    <Card className="border-l-4 border-l-red-500">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-gray-700">
                                {translations.totalExpenses}
                            </CardTitle>
                            <div className="h-8 w-8 rounded-full bg-red-100 flex items-center justify-center">
                                <ArrowDown className="h-4 w-4 text-red-600" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-red-700">
                                {formatMoney(reportData.totalExpenses, userProfile)}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Solde net */}
                    <Card className="border-l-4 border-l-blue-500">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-gray-700">
                                {translations.netBalance}
                            </CardTitle>
                            <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                                <TrendingUp className="h-4 w-4 text-blue-600" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-blue-700">
                                {formatMoney(reportData.netBalance, userProfile)}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Variation */}
                    <Card className="border-l-4 border-l-gray-400">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-gray-700">
                                {translations.variation}
                            </CardTitle>
                            <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center">
                                {reportData.expenseDelta === null || reportData.expenseDelta >= 0 
                                    ? <TrendingUp className="h-4 w-4 text-red-500" />
                                    : <TrendingDown className="h-4 w-4 text-green-500" />
                                }
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-gray-700">
                                {reportData.expenseDelta === null || reportData.expenseDelta === 0 
                                    ? '--' 
                                    : `${reportData.expenseDelta > 0 ? '+' : ''}${reportData.expenseDelta.toFixed(1)}%`
                                }
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                                {translations.vsPrevious}
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* 4. Layout principal - 2 colonnes */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                    
                    {/* Colonne gauche */}
                    <div className="space-y-6">
                        
                        {/* Répartition par catégories */}
                        <Card className="print-section">
                            <CardHeader>
                                <CardTitle className="text-lg font-semibold text-gray-900">
                                    {translations.categoryBreakdown}
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {reportData.spendingByCategory.length > 0 ? (
                                    <div className="space-y-3">
                                        {reportData.spendingByCategory.slice(0, 5).map((category, index) => {
                                            const total = reportData.spendingByCategory.reduce((sum, cat) => sum + cat.value, 0);
                                            const percentage = total > 0 ? ((category.value / total) * 100) : 0;
                                            return (
                                                <div key={category.name} className="flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <div 
                                                            className="w-3 h-3 rounded-full"
                                                            style={{ 
                                                                backgroundColor: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'][index % 5] 
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
                        <Card className="print-section">
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
                                            const progress = (goal.currentAmountInCents / goal.targetAmountInCents) * 100;
                                            const remaining = goal.targetAmountInCents - goal.currentAmountInCents;
                                            
                                            return (
                                                <div key={goal.id} className="p-4 border border-gray-200 rounded-lg">
                                                    <h4 className="font-semibold text-gray-900 mb-2">
                                                        {goal.name}
                                                    </h4>
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
                                                    <div className="flex items-center gap-1 mt-2 text-xs text-gray-500">
                                                        <Calendar className="h-3 w-3" />
                                                        {format(new Date(goal.targetDate), 'd MMM yyyy', { locale })}
                                                    </div>
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
                        <Card className="print-section">
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
                                                    const percentage = item.budgeted > 0 ? (item.actual / item.budgeted) * 100 : 0;
                                                    const statusColor = percentage < 70 ? 'bg-green-100 text-green-800' :
                                                        percentage <= 100 ? 'bg-orange-100 text-orange-800' : 'bg-red-100 text-red-800';
                                                    
                                                    return (
                                                        <tr key={index} className="border-b">
                                                            <td className="py-2 font-medium">{item.category}</td>
                                                            <td className="py-2 text-right">{formatMoney(item.budgeted, userProfile)}</td>
                                                            <td className="py-2 text-right">{formatMoney(item.actual, userProfile)}</td>
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

                        {/* Résumé IA */}
                        <Card className="print-section">
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
                                                ? (isFrench ? 'Situation financière stable avec un solde positif.' : 'Stable financial situation with positive balance.')
                                                : (isFrench ? 'Attention au déficit ce mois-ci.' : 'Watch out for this month\'s deficit.')
                                            }
                                        </p>
                                    </div>
                                    
                                    {reportData.spendingByCategory.length > 0 && (
                                        <div className="flex items-start gap-3">
                                            <div className="w-4 h-4 flex items-center justify-center mt-0.5">
                                                <div className="w-2 h-2 bg-blue-600 rounded-full" />
                                            </div>
                                            <p className="text-sm text-gray-700">
                                                {isFrench 
                                                    ? `Principale dépense: ${reportData.spendingByCategory[0].name} (${formatMoney(reportData.spendingByCategory[0].value, userProfile)})`
                                                    : `Top expense: ${reportData.spendingByCategory[0].name} (${formatMoney(reportData.spendingByCategory[0].value, userProfile)})`
                                                }
                                            </p>
                                        </div>
                                    )}
                                    
                                    <div className="border-t pt-3">
                                        <p className="text-xs text-gray-500 italic">
                                            {isFrench 
                                                ? 'Conseils à visée éducative (non réglementé).' 
                                                : 'Educational advice only (not regulated).'
                                            }
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* 5. Aperçu des transactions */}
                <Card className="print-section mb-8">
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
                                            <th className="text-left py-2">{isFrench ? 'Description' : 'Description'}</th>
                                            <th className="text-left py-2">{isFrench ? 'Catégorie' : 'Category'}</th>
                                            <th className="text-right py-2">{isFrench ? 'Montant' : 'Amount'}</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {reportData.recentTransactions.slice(0, 10).map((transaction) => (
                                            <tr key={transaction.id} className="border-b">
                                                <td className="py-2">
                                                    {format(new Date(transaction.date), 'd MMM', { locale })}
                                                </td>
                                                <td className="py-2 font-medium">
                                                    {transaction.description}
                                                </td>
                                                <td className="py-2">
                                                    <span className="px-2 py-1 bg-gray-100 rounded text-xs">
                                                        {transaction.category}
                                                    </span>
                                                </td>
                                                <td className={`py-2 text-right font-semibold ${
                                                    transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                                                }`}>
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

                {/* 6. Pied de page */}
                <div className="mt-12 pt-6 border-t border-gray-200 text-center">
                    <div className="text-xs text-gray-500 space-y-1">
                        <p>
                            {translations.generatedOn} {format(new Date(), 'd MMMM yyyy', { locale })}
                        </p>
                        <p>
                            {isFrench ? 'Utilisateur' : 'User'}: {userProfile?.firstName} {userProfile?.lastName}
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