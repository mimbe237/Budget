'use client';
import {
  Car,
  CreditCard,
  DollarSign,
  HeartPulse,
  Landmark,
  Lightbulb,
  PartyPopper,
  PlusCircle,
  ShoppingBag,
  Utensils,
  Scale,
} from 'lucide-react';
import Link from 'next/link';
import { AppLayout } from '@/components/dashboard/dashboard-client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useCollection, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import type { Category, Currency, Transaction, UserProfile } from '@/lib/types';
import { collection, query, where, orderBy, doc } from 'firebase/firestore';
import { useState } from 'react';
import { startOfMonth, endOfMonth, startOfYesterday, startOfYear, endOfYear, format } from 'date-fns';
import { SummaryCard } from '@/components/dashboard/summary-card';
import { DateRangePicker } from '../reports/_components/date-range-picker';
import { useSearchParams } from 'next/navigation';


function formatMoney(amountInCents: number, currency: Currency, locale: string) {
    const amount = (amountInCents || 0) / 100;
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency,
    }).format(amount);
}

export default function TransactionsPage() {
  const { user, userProfile } = useUser();
  const firestore = useFirestore();
  const searchParams = useSearchParams();

  const isFrench = userProfile?.locale === 'fr-CM';

  const from = searchParams.get('from');
  const to = searchParams.get('to');

  const transactionsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    
    let q = query(collection(firestore, `users/${user.uid}/expenses`), orderBy('date', 'desc'));

    if (from) {
        q = query(q, where('date', '>=', from));
    }
    if (to) {
        q = query(q, where('date', '<=', to));
    }

    return q;

  }, [firestore, user, from, to]);

  const { data: transactions, isLoading } = useCollection<Transaction>(transactionsQuery);

  const displayCurrency = userProfile?.displayCurrency || 'USD';
  const displayLocale = userProfile?.locale || 'en-US';

  const totalIncome = transactions?.filter(t => t.type === 'income').reduce((acc, t) => acc + (t.amountInCents || 0), 0) || 0;
  const totalExpenses = transactions?.filter(t => t.type === 'expense').reduce((acc, t) => acc + (t.amountInCents || 0), 0) || 0;
  const balance = totalIncome - totalExpenses;

  const translations = {
      addTransaction: isFrench ? 'Ajouter Transaction' : 'Add Transaction',
      totalIncome: isFrench ? 'Total Revenus' : 'Total Income',
      totalExpenses: isFrench ? 'Total Dépenses' : 'Total Expenses',
      netBalance: isFrench ? 'Solde Net' : 'Net Balance',
      transactions: isFrench ? 'Transactions' : 'Transactions',
      transactionsDesc: isFrench ? 'Liste de vos revenus et dépenses pour la période sélectionnée.' : 'List of your income and expenses for the selected period.',
      description: 'Description',
      category: isFrench ? 'Catégorie' : 'Category',
      date: 'Date',
      amount: isFrench ? 'Montant' : 'Amount',
      loading: isFrench ? 'Chargement des transactions...' : 'Loading transactions...',
      noTransactions: isFrench ? 'Aucune transaction trouvée pour cette période.' : 'No transactions found for this period.',
  };


  return (
    <AppLayout>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex-1">
                <DateRangePicker />
            </div>
            <div className="ml-auto gap-1">
                <Button asChild size="sm" className="h-8 gap-1">
                <Link href="/transactions/add">
                    <PlusCircle className="h-3.5 w-3.5" />
                    <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                    {translations.addTransaction}
                    </span>
                </Link>
                </Button>
            </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-3 my-4">
            <SummaryCard title={translations.totalIncome} amountInCents={totalIncome} icon={<DollarSign />} />
            <SummaryCard title={translations.totalExpenses} amountInCents={totalExpenses} icon={<CreditCard />} />
            <SummaryCard title={translations.netBalance} amountInCents={balance} icon={<Scale />} />
        </div>
        <Card>
            <CardHeader className="flex flex-row items-center">
                <div className="grid gap-2">
                <CardTitle className="font-headline">{translations.transactions}</CardTitle>
                <CardDescription>
                    {translations.transactionsDesc}
                </CardDescription>
                </div>
            </CardHeader>
            <CardContent>
                <Table>
                <TableHeader>
                    <TableRow>
                    <TableHead>{translations.description}</TableHead>
                    <TableHead className="hidden sm:table-cell">{translations.category}</TableHead>
                    <TableHead className="hidden sm:table-cell">{translations.date}</TableHead>
                    <TableHead className="text-right">{translations.amount}</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {isLoading && (
                    <TableRow>
                        <TableCell colSpan={4} className="text-center">
                        {translations.loading}
                        </TableCell>
                    </TableRow>
                    )}
                    {transactions && transactions.length > 0 ? (
                    transactions.map(transaction => (
                        <TableRow key={transaction.id}>
                        <TableCell>
                            <div className="font-medium">{transaction.description}</div>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                            <Badge className="text-xs" variant="outline">
                            {transaction.category}
                            </Badge>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                            {new Date(transaction.date).toLocaleDateString(displayLocale)}
                        </TableCell>
                        <TableCell
                            className={`text-right font-semibold ${
                            transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                            }`}
                        >
                            {transaction.type === 'income' ? '+' : '-'}{formatMoney(transaction.amountInCents, transaction.currency || displayCurrency, displayLocale)}
                        </TableCell>
                        </TableRow>
                    ))
                    ) : !isLoading ? (
                    <TableRow>
                        <TableCell colSpan={4} className="h-24 text-center">
                        {translations.noTransactions}
                        </TableCell>
                    </TableRow>
                    ) : null}
                </TableBody>
                </Table>
            </CardContent>
        </Card>
    </AppLayout>
  );
}
