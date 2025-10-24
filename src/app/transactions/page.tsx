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
import { Input } from '@/components/ui/input';
import { Pagination } from '@/components/ui/pagination';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useCollection, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import type { Category, Currency, Transaction, UserProfile } from '@/lib/types';
import { collection, query, where, orderBy, doc } from 'firebase/firestore';
import { Suspense, useState, useEffect } from 'react';
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

function TransactionsContent() {
  const { user, userProfile } = useUser();
  const firestore = useFirestore();
  const searchParams = useSearchParams();

  const isFrench = userProfile?.locale === 'fr-CM';

  const from = searchParams ? searchParams.get('from') : null;
  const to = searchParams ? searchParams.get('to') : null;

  const transactionsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    let q = query(collection(firestore, `users/${user.uid}/expenses`), orderBy('date', 'desc'));
    if (from) q = query(q, where('date', '>=', from));
    if (to) q = query(q, where('date', '<=', to));
    return q;
  }, [firestore, user, from, to]);

  const { data: transactions, isLoading } = useCollection<Transaction>(transactionsQuery);

  const displayCurrency = userProfile?.displayCurrency || 'USD';
  const displayLocale = userProfile?.locale || 'en-US';

  const [search, setSearch] = useState('');
  const [pageExpense, setPageExpense] = useState(1);
  const [pageIncome, setPageIncome] = useState(1);
  const rowsPerPage = 10;

  const filteredExpenses = (transactions || [])
    .filter(t => t.type === 'expense' && (
      t.description.toLowerCase().includes(search.toLowerCase()) ||
      t.category?.toLowerCase().includes(search.toLowerCase()) ||
      t.date?.toLowerCase().includes(search.toLowerCase())
    ));
  const totalExpensePages = Math.ceil(filteredExpenses.length / rowsPerPage);
  const paginatedExpenses = filteredExpenses.slice((pageExpense - 1) * rowsPerPage, pageExpense * rowsPerPage);

  const filteredIncomes = (transactions || [])
    .filter(t => t.type === 'income' && (
      t.description.toLowerCase().includes(search.toLowerCase()) ||
      t.category?.toLowerCase().includes(search.toLowerCase()) ||
      t.date?.toLowerCase().includes(search.toLowerCase())
    ));
  const totalIncomePages = Math.ceil(filteredIncomes.length / rowsPerPage);
  const paginatedIncomes = filteredIncomes.slice((pageIncome - 1) * rowsPerPage, pageIncome * rowsPerPage);

  useEffect(() => { setPageExpense(1); setPageIncome(1); }, [search]);

  const totalIncome = filteredIncomes.reduce((acc, t) => acc + (t.amountInCents || 0), 0) || 0;
  const totalExpenses = filteredExpenses.reduce((acc, t) => acc + (t.amountInCents || 0), 0) || 0;
  const balance = totalIncome - totalExpenses;

  const translations = {
      addTransaction: isFrench ? 'Ajouter Transaction' : 'Add Transaction',
      totalIncome: isFrench ? 'Total Revenus' : 'Total Income',
      totalExpenses: isFrench ? 'Total Dépenses' : 'Total Expenses',
      netBalance: isFrench ? 'Solde Net' : 'Net Balance',
      description: 'Description',
      category: isFrench ? 'Catégorie' : 'Category',
      date: 'Date',
      amount: isFrench ? 'Montant' : 'Amount',
      loading: isFrench ? 'Chargement des transactions...' : 'Loading transactions...',
      searchPlaceholder: isFrench ? 'Rechercher...' : 'Search...'
  };

  return (
    <>
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
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader className="flex flex-row items-center">
                <div className="grid gap-2">
                <CardTitle className="font-headline text-red-600">{isFrench ? 'Dépenses' : 'Expenses'}</CardTitle>
                <CardDescription>
                    {isFrench ? 'Liste de vos dépenses pour la période sélectionnée.' : 'List of your expenses for the selected period.'}
                </CardDescription>
                </div>
            </CardHeader>
            <CardContent>
                <div className="mb-2 flex flex-col sm:flex-row sm:items-center gap-2">
                  <Input
                    placeholder={translations.searchPlaceholder}
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="max-w-xs"
                  />
                </div>
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
                  {!isLoading && paginatedExpenses.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="h-24 text-center">
                        {isFrench ? 'Aucune dépense trouvée.' : 'No expenses found.'}
                      </TableCell>
                    </TableRow>
                  )}
                  {paginatedExpenses.map(transaction => (
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
                      <TableCell className="text-right font-semibold text-red-600">
                        -{formatMoney(transaction.amountInCents, displayCurrency, displayLocale)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                </Table>
                <Pagination
                  currentPage={pageExpense}
                  totalPages={totalExpensePages}
                  onPageChange={setPageExpense}
                />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center">
                <div className="grid gap-2">
                <CardTitle className="font-headline text-green-600">{isFrench ? 'Revenus' : 'Income'}</CardTitle>
                <CardDescription>
                    {isFrench ? 'Liste de vos revenus pour la période sélectionnée.' : 'List of your income for the selected period.'}
                </CardDescription>
                </div>
            </CardHeader>
            <CardContent>
                <div className="mb-2 flex flex-col sm:flex-row sm:items-center gap-2">
                  <Input
                    placeholder={translations.searchPlaceholder}
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="max-w-xs"
                  />
                </div>
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
                  {!isLoading && paginatedIncomes.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="h-24 text-center">
                        {isFrench ? 'Aucun revenu trouvé.' : 'No income found.'}
                      </TableCell>
                    </TableRow>
                  )}
                  {paginatedIncomes.map(transaction => (
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
                      <TableCell className="text-right font-semibold text-green-600">
                        +{formatMoney(transaction.amountInCents, displayCurrency, displayLocale)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                </Table>
                <Pagination
                  currentPage={pageIncome}
                  totalPages={totalIncomePages}
                  onPageChange={setPageIncome}
                />
            </CardContent>
          </Card>
        </div>
    </>
  );
}

export default function TransactionsPage() {
  return (
    <AppLayout>
      <Suspense fallback={<div className="p-6 text-center text-gray-500">Chargement des transactions…</div>}>
        <TransactionsContent />
      </Suspense>
    </AppLayout>
  );
}
