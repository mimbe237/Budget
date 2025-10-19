'use server';

import { AppLayout } from '@/components/dashboard/dashboard-client';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { getTransactionsForPeriod } from './_actions/get-transactions';
import { DateRangePicker } from './_components/date-range-picker';
import { Suspense } from 'react';
import type { Category, Currency, Transaction as TransactionType, UserProfile } from '@/lib/types';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { getFirebaseAdminApp } from '@/firebase/admin';
import { headers } from 'next/headers';
import { DecodedIdToken } from 'firebase-admin/lib/auth/token-verifier';
import { DollarSign, CreditCard, Scale } from 'lucide-react';
import { format, parseISO } from 'date-fns';

async function getAuthenticatedUser(): Promise<DecodedIdToken | null> {
    const authHeader = headers().get('Authorization');
    if (authHeader) {
        const token = authHeader.split(' ')[1];
        try {
            const adminApp = getFirebaseAdminApp();
            return await adminApp.auth().verifyIdToken(token);
        } catch (error) {
            console.error('Error verifying auth token:', error);
            return null;
        }
    }
    return null;
}

async function getUserProfile(uid: string): Promise<UserProfile | null> {
    const db = getFirebaseAdminApp().firestore();
    const userDoc = await db.collection('users').doc(uid).get();
    if (userDoc.exists) {
        return userDoc.data() as UserProfile;
    }
    return null;
}


function formatMoney(amountInCents: number, currency: Currency = 'USD', locale: string = 'en-US') {
  const amount = (amountInCents || 0) / 100;
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
  }).format(amount);
}


export default async function ReportsPage({
  searchParams,
}: {
  searchParams?: { [key: string]: string | string[] | undefined };
}) {
  const from = searchParams?.from as string | undefined;
  const to = searchParams?.to as string | undefined;

  const user = await getAuthenticatedUser();
  const userProfile = user ? await getUserProfile(user.uid) : null;
  const isFrench = userProfile?.locale === 'fr-CM';
  
  const formattedFrom = from ? format(parseISO(from), 'dd MMM yyyy') : 'start';
  const formattedTo = to ? format(parseISO(to), 'dd MMM yyyy') : 'end';
  const readablePeriod = from && to ? `${formattedFrom} - ${formattedTo}` : 'All time';


  const translations = {
    title: isFrench ? 'Rapport Financier' : 'Financial Report',
    subtitle: isFrench ? `Devise: ${userProfile?.displayCurrency || 'USD'} | Période: ${readablePeriod}` : `Currency: ${userProfile?.displayCurrency || 'USD'} | Period: ${readablePeriod}`,
    loading: isFrench ? 'Chargement...' : 'Loading...',
    loginPrompt: isFrench ? 'Veuillez vous connecter' : 'Please log in',
  };


  return (
    <AppLayout>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className='grid gap-1'>
            <h1 className="text-2xl font-semibold font-headline">{translations.title}</h1>
            <p className="text-sm text-muted-foreground">{translations.subtitle}</p>
          </div>
          <DateRangePicker />
        </div>
        <Suspense fallback={<Card><CardHeader><CardTitle>{translations.loading}</CardTitle></CardHeader></Card>}>
          {/* @ts-expect-error Server Component */}
          <ReportContent from={from} to={to} />
        </Suspense>
      </div>
    </AppLayout>
  );
}

async function ReportContent({ from, to }: { from?: string; to?: string }) {
    const user = await getAuthenticatedUser();
    if (!user) {
        return <Card><CardHeader><CardTitle>Veuillez vous connecter</CardTitle></CardHeader></Card>;
    }
    
    const userProfile = await getUserProfile(user.uid);
    const displayCurrency = userProfile?.displayCurrency || 'USD';
    const displayLocale = userProfile?.locale || 'en-US';
    const isFrench = displayLocale === 'fr-CM';

    const transactions = await getTransactionsForPeriod({ from, to });

    const totalIncome = transactions.filter(t => t.type === 'income').reduce((acc, t) => acc + (t.amountInCents || 0), 0);
    const totalExpenses = transactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + (t.amountInCents || 0), 0);
    const netBalance = totalIncome - totalExpenses;

    const spendingByCategory = transactions
        .filter(t => t.type === 'expense' && t.category)
        .reduce((acc, t) => {
            const category = t.category!;
            if (!acc[category]) {
                acc[category] = 0;
            }
            acc[category] += t.amountInCents || 0;
            return acc;
        }, {} as Record<string, number>);

    const translations = {
        totalIncome: isFrench ? 'Revenus Totaux' : 'Total Income',
        totalExpenses: isFrench ? 'Dépenses Totales' : 'Total Expenses',
        netBalance: isFrench ? 'Solde Net' : 'Net Balance',
        spendingByCategory: isFrench ? 'Dépenses par Catégorie' : 'Spending by Category',
        spendingByCategoryDesc: isFrench ? 'Un aperçu de vos dépenses groupées par catégorie.' : 'An overview of your expenses grouped by category.',
        category: isFrench ? 'Catégorie' : 'Category',
        amount: isFrench ? 'Montant' : 'Amount',
        noSpending: isFrench ? 'Aucune dépense pour cette période.' : 'No spending for this period.',
        transactions: isFrench ? 'Transactions' : 'Transactions',
        transactionsDesc: isFrench ? `Liste de vos ${transactions.length} transactions pour la période.` : `A list of your ${transactions.length} transactions for the period.`,
        description: 'Description',
        date: 'Date',
        type: 'Type',
        noTransactions: isFrench ? 'Aucune transaction trouvée pour cette période.' : 'No transactions found for this period.',
        income: isFrench ? 'Revenu' : 'Income',
        expense: isFrench ? 'Dépense' : 'Expense',
    };

    return (
        <div className="grid gap-6">
            <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{translations.totalIncome}</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">{formatMoney(totalIncome, displayCurrency, displayLocale)}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{translations.totalExpenses}</CardTitle>
                        <CreditCard className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-600">{formatMoney(totalExpenses, displayCurrency, displayLocale)}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{translations.netBalance}</CardTitle>
                        <Scale className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className={`text-2xl font-bold ${netBalance >= 0 ? 'text-foreground' : 'text-red-600'}`}>{formatMoney(netBalance, displayCurrency, displayLocale)}</div>
                    </CardContent>
                </Card>
            </div>

             <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-full lg:col-span-3">
                    <CardHeader>
                        <CardTitle>{translations.spendingByCategory}</CardTitle>
                        <CardDescription>{translations.spendingByCategoryDesc}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>{translations.category}</TableHead>
                                    <TableHead className="text-right">{translations.amount}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {Object.keys(spendingByCategory).length > 0 ? (
                                    Object.entries(spendingByCategory)
                                        .sort(([, a], [, b]) => b - a)
                                        .map(([category, amount]) => (
                                        <TableRow key={category}>
                                            <TableCell className='font-medium'>{category}</TableCell>
                                            <TableCell className="text-right">{formatMoney(amount, displayCurrency, displayLocale)}</TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={2} className="h-24 text-center">{translations.noSpending}</TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
                <Card className="col-span-full lg:col-span-4">
                    <CardHeader>
                        <CardTitle>{translations.transactions}</CardTitle>
                        <CardDescription>{translations.transactionsDesc}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                             <TableHeader>
                                <TableRow>
                                    <TableHead>{translations.description}</TableHead>
                                    <TableHead className="hidden sm:table-cell">{translations.category}</TableHead>
                                    <TableHead className="hidden md:table-cell">{translations.date}</TableHead>
                                    <TableHead className="text-right">{translations.amount}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {transactions.length > 0 ? (
                                    transactions.slice(0, 10).map((t) => (
                                        <TableRow key={t.id}>
                                            <TableCell className="font-medium">{t.description}</TableCell>
                                            <TableCell className="hidden sm:table-cell"><Badge variant="outline">{t.category}</Badge></TableCell>
                                            <TableCell className="hidden md:table-cell">{new Date(t.date).toLocaleDateString(displayLocale)}</TableCell>
                                            <TableCell className={`text-right font-medium ${t.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                                                {t.type === 'income' ? '+' : '-'}
                                                {formatMoney(t.amountInCents, t.currency, displayLocale)}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                     <TableRow>
                                        <TableCell colSpan={4} className="h-24 text-center">{translations.noTransactions}</TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
