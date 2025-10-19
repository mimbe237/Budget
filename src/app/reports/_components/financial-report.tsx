'use server';

import { getFinancialReportData } from '../_actions/get-report-data';
import type { FinancialReportData, UserProfile } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, ArrowDown, ArrowUp, Banknote, CreditCard, Scale, Target, Lightbulb } from 'lucide-react';
import { format, formatDistanceToNowStrict } from 'date-fns';
import { fr } from 'date-fns/locale';

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
    
    const periodString = `${format(period.from, 'd MMM yyyy', { locale })} - ${format(period.to, 'd MMM yyyy', { locale })}`;
    const title = isFrench ? 'Rapport Financier' : 'Financial Report';

  return (
    <div className="space-y-6 print:space-y-4">
        {/* 1. Header */}
        <div className="flex justify-between items-center print:hidden">
            <div>
                <h1 className="text-2xl font-bold font-headline">{title}</h1>
                <p className="text-muted-foreground">{periodString}</p>
            </div>
            {/* Actions will go here */}
        </div>

        {/* 2. KPIs */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 print:grid-cols-4">
            <KpiCard title={isFrench ? 'Revenus Totaux' : 'Total Income'} value={formatMoney(reportData.totalIncome, userProfile)} icon={<Banknote className="h-5 w-5 text-green-500" />} />
            <KpiCard title={isFrench ? 'Dépenses Totales' : 'Total Expenses'} value={formatMoney(reportData.totalExpenses, userProfile)} icon={<CreditCard className="h-5 w-5 text-red-500" />} />
            <KpiCard title={isFrench ? 'Solde Net' : 'Net Balance'} value={formatMoney(reportData.netBalance, userProfile)} icon={<Scale className="h-5 w-5 text-blue-500" />} />
            <KpiCard 
                title={isFrench ? 'Variation Dépenses' : 'Expense Change'} 
                value={`${reportData.expenseDelta === null || reportData.expenseDelta === 0 ? '--' : reportData.expenseDelta.toFixed(1) + '%'}`} 
                icon={reportData.expenseDelta === null || reportData.expenseDelta >= 0 ? <ArrowUp className="h-5 w-5 text-red-500" /> : <ArrowDown className="h-5 w-5 text-green-500" />}
                helpText={isFrench ? 'vs période précédente' : 'vs previous period'}
            />
        </div>
        
        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            
            {/* Left Column */}
            <div className="lg:col-span-3 space-y-6">
                 {/* Placeholder for Cashflow Chart */}
                <Card>
                    <CardHeader><CardTitle>{isFrench ? 'Tendances (Cashflow)' : 'Cashflow Trends'}</CardTitle></CardHeader>
                    <CardContent className='h-80'><p className="text-muted-foreground">{isFrench ? 'Graphique des revenus vs dépenses à venir...' : 'Income vs Expenses chart coming soon...'}</p></CardContent>
                </Card>

                {/* Placeholder for Budgets */}
                <Card>
                    <CardHeader><CardTitle>{isFrench ? 'Budgets vs Réalisé' : 'Budget vs Actual'}</CardTitle></CardHeader>
                    <CardContent><p className="text-muted-foreground">{isFrench ? 'Tableau de suivi des budgets à venir...' : 'Budget tracking table coming soon...'}</p></CardContent>
                </Card>
            </div>

            {/* Right Column */}
            <div className="lg:col-span-2 space-y-6">
                 {/* Placeholder for Category Breakdown */}
                <Card>
                    <CardHeader><CardTitle>{isFrench ? 'Dépenses par Catégorie' : 'Spending by Category'}</CardTitle><//CardHeader>
                    <CardContent className='h-80'><p className="text-muted-foreground">{isFrench ? 'Graphique de répartition des dépenses à venir...' : 'Spending breakdown chart coming soon...'}</p></CardContent>
                </Card>
                {/* Placeholder for Goals */}
                <Card>
                    <CardHeader><CardTitle>{isFrench ? 'Objectifs d\'Épargne' : 'Savings Goals'}</CardTitle></CardHeader>
                    <CardContent><p className="text-muted-foreground">{isFrench ? 'Suivi des objectifs à venir...' : 'Goals tracking coming soon...'}</p></CardContent>
                </Card>
                {/* Placeholder for AI Insights */}
                 <Card>
                    <CardHeader><CardTitle className="flex items-center gap-2"><Lightbulb className="h-5 w-5 text-primary"/>{isFrench ? 'Résumé Intelligent' : 'Smart Summary'}</CardTitle></CardHeader>
                    <CardContent><p className="text-muted-foreground">{isFrench ? 'Résumé et conseils par IA à venir...' : 'AI summary and tips coming soon...'}</p></CardContent>
                </Card>
            </div>
        </div>

        {/* Placeholder for Recent Transactions */}
        <Card>
            <CardHeader><CardTitle>{isFrench ? 'Transactions Récentes' : 'Recent Transactions'}</CardTitle></CardHeader>
            <CardContent><p className="text-muted-foreground">{isFrench ? 'Tableau des transactions récentes à venir...' : 'Recent transactions table coming soon...'}</p></CardContent>
        </Card>
    </div>
  );
}

// --- Sub-components ---

interface KpiCardProps {
    title: string;
    value: string;
    icon: React.ReactNode;
    helpText?: string;
}

function KpiCard({ title, value, icon, helpText }: KpiCardProps) {
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{title}</CardTitle>
                {icon}
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{value}</div>
                {helpText && <p className="text-xs text-muted-foreground">{helpText}</p>}
            </CardContent>
        </Card>
    );
}