'use server';

import { getFinancialReportData } from '../_actions/get-report-data';
import type { FinancialReportData, UserProfile } from '@/lib/types';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

// Import all our new components
import { ReportHeader } from './report-header';
import { PeriodSelector } from './period-selector';
import { KPICards } from './kpi-cards';
import { CashflowChart } from './cashflow-chart';
import { CategoryBreakdown } from './category-breakdown';
import { BudgetTable } from './budget-table';
import { SavingsGoals } from './savings-goals';
import { AISummary } from './ai-summary';
import { TransactionPreview } from './transaction-preview';
import { ReportFooter } from './report-footer';

interface FinancialReportProps {
  from?: string;
  to?: string;
}

// Helper to format currency consistently
const formatMoney = (amountInCents: number, profile: UserProfile | null) => {
    const currency = profile?.displayCurrency || 'USD';
    const locale = profile?.locale || 'en-US';
    return new Intl.NumberFormat(locale, { style: 'currency', currency }).format((amountInCents || 0) / 100);
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

    // Au lieu de passer une fonction, on va formater les montants côté serveur
    const formatReportMoney = (amountInCents: number) => formatMoney(amountInCents, userProfile);
    
    // Pré-formater tous les montants pour éviter de passer des fonctions aux composants client
    const formattedTotalIncome = formatReportMoney(reportData.totalIncome);
    const formattedTotalExpenses = formatReportMoney(reportData.totalExpenses);
    const formattedNetBalance = formatReportMoney(reportData.netBalance);
    
    // Formater les données des graphiques et tableaux
    const formattedCashflow = reportData.cashflow.map(item => ({
        ...item,
        formattedIncome: formatReportMoney(item.income * 100),
        formattedExpenses: formatReportMoney(item.expenses * 100)
    }));
    
    const formattedSpendingByCategory = reportData.spendingByCategory.map(item => ({
        ...item,
        formattedValue: formatReportMoney(item.value)
    }));
    
    const formattedBudgetVsActual = reportData.budgetVsActual.map(item => ({
        ...item,
        formattedBudgeted: formatReportMoney(item.budgeted),
        formattedActual: formatReportMoney(item.actual),
        formattedVariance: formatReportMoney(item.variance)
    }));
    
    const formattedGoals = reportData.goals.map(goal => ({
        ...goal,
        formattedTarget: formatReportMoney(goal.targetAmountInCents),
        formattedCurrent: formatReportMoney(goal.currentAmountInCents),
        formattedRemaining: formatReportMoney(goal.targetAmountInCents - goal.currentAmountInCents)
    }));
    
    const formattedTransactions = reportData.recentTransactions.map(transaction => ({
        ...transaction,
        formattedAmount: formatReportMoney(Math.abs(transaction.amountInCents))
    }));
    
    // Trouver la catégorie principale pour l'IA
    const topCategory = reportData.spendingByCategory.length > 0 
        ? { name: reportData.spendingByCategory[0].name, amount: reportData.spendingByCategory[0].value }
        : null;

    const generatedAt = new Date();

    return (
        <div className="min-h-screen bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 print:p-0 print:max-w-none">
                {/* 1. En-tête avec actions d'export */}
                <ReportHeader 
                    title={`${title} — ${period.from.getFullYear()}`}
                    subtitle={periodString}
                    currency={currency}
                />

                {/* 2. Sélecteur de période (masqué en impression) */}
                <PeriodSelector userProfile={userProfile} />

                {/* 3. KPIs - 4 cartes en ligne */}
                <div className="print-section">
                    <KPICards
                        formattedTotalIncome={formattedTotalIncome}
                        formattedTotalExpenses={formattedTotalExpenses}
                        formattedNetBalance={formattedNetBalance}
                        expenseDelta={reportData.expenseDelta}
                        isFrench={isFrench}
                    />
                </div>

                {/* 4. Tendances - Graphique cashflow */}
                <div className="print-section">
                    <CashflowChart
                        data={reportData.cashflow}
                        formatMoney={formatReportMoney}
                        isFrench={isFrench}
                    />
                </div>

                {/* Layout principal - 2 colonnes */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                    {/* Colonne gauche */}
                    <div className="space-y-6">
                        {/* 5. Répartition par catégories */}
                        <div className="print-section">
                            <CategoryBreakdown
                                data={reportData.spendingByCategory}
                                formatMoney={formatReportMoney}
                                isFrench={isFrench}
                            />
                        </div>

                        {/* 7. Objectifs d'épargne */}
                        <div className="print-section">
                            <SavingsGoals
                                goals={reportData.goals}
                                formatMoney={formatReportMoney}
                                isFrench={isFrench}
                            />
                        </div>
                    </div>

                    {/* Colonne droite */}
                    <div className="space-y-6">
                        {/* 6. Budgets vs Réalisé */}
                        <div className="print-section">
                            <BudgetTable
                                data={reportData.budgetVsActual}
                                formatMoney={formatReportMoney}
                                isFrench={isFrench}
                            />
                        </div>

                        {/* 8. Résumé IA */}
                        <div className="print-section">
                            <AISummary
                                totalIncome={reportData.totalIncome}
                                totalExpenses={reportData.totalExpenses}
                                netBalance={reportData.netBalance}
                                topCategory={topCategory}
                                formatMoney={formatReportMoney}
                                isFrench={isFrench}
                            />
                        </div>
                    </div>
                </div>

                {/* 9. Aperçu des transactions */}
                <div className="print-section">
                    <TransactionPreview
                        transactions={reportData.recentTransactions}
                        formatMoney={formatReportMoney}
                        isFrench={isFrench}
                    />
                </div>

                {/* 10. Pied de page */}
                <ReportFooter
                    userProfile={userProfile}
                    generatedAt={generatedAt}
                    isFrench={isFrench}
                />
            </div>
        </div>
    );
}
