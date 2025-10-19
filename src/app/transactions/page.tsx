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
import { useCollection, useDoc, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import type { Category, Currency, Transaction, UserProfile } from '@/lib/types';
import { collection, query, where, orderBy, doc } from 'firebase/firestore';
import { useState } from 'react';
import { startOfMonth, endOfMonth, startOfYesterday, startOfYear, endOfYear } from 'date-fns';
import { SummaryCard } from '@/components/dashboard/summary-card';


function formatMoney(amountInCents: number, currency: Currency, locale: string) {
    const amount = (amountInCents || 0) / 100;
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency,
    }).format(amount);
}

const categoryIcons: Record<Category, React.ReactNode> = {
    Housing: <Landmark className="h-4 w-4 text-muted-foreground" />,
    Food: <Utensils className="h-4 w-4 text-muted-foreground" />,
    Transport: <Car className="h-4 w-4 text-muted-foreground" />,
    Entertainment: <PartyPopper className="h-4 w-4 text-muted-foreground" />,
    Health: <HeartPulse className="h-4 w-4 text-muted-foreground" />,
    Shopping: <ShoppingBag className="h-4 w-4 text-muted-foreground" />,
    Utilities: <Lightbulb className="h-4 w-4 text-muted-foreground" />,
    Income: <DollarSign className="h-4 w-4 text-muted-foreground" />,
};

function getPeriod(period: string): { gte: string; lte: string } | null {
  const now = new Date();
  switch (period) {
    case 'this-month':
      return {
        gte: startOfMonth(now).toISOString(),
        lte: endOfMonth(now).toISOString(),
      };
    case 'last-month':
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        return {
            gte: startOfMonth(lastMonth).toISOString(),
            lte: endOfMonth(lastMonth).toISOString(),
        };
    case 'this-year':
        return {
            gte: startOfYear(now).toISOString(),
            lte: endOfYear(now).toISOString(),
        };
    default:
      return null;
  }
}

export default function TransactionsPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const [activePeriod, setActivePeriod] = useState('this-month');

  const transactionsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    
    const period = getPeriod(activePeriod);
    const baseQuery = collection(firestore, `users/${user.uid}/expenses`);

    if (period) {
        return query(baseQuery, where('date', '>=', period.gte), where('date', '<=', period.lte), orderBy('date', 'desc'));
    }

    return query(baseQuery, orderBy('date', 'desc'));

  }, [firestore, user, activePeriod]);

  const { data: transactions, isLoading } = useCollection<Transaction>(transactionsQuery);

  const userProfileRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, `users/${user.uid}`);
    }, [firestore, user]);
  const { data: userProfile } = useDoc<UserProfile>(userProfileRef);

  const displayCurrency = userProfile?.displayCurrency || 'USD';
  const displayLocale = userProfile?.locale || 'en-US';

  const totalIncome = transactions?.filter(t => t.type === 'income').reduce((acc, t) => acc + (t.amountInCents || 0), 0) || 0;
  const totalExpenses = transactions?.filter(t => t.type === 'expense').reduce((acc, t) => acc + (t.amountInCents || 0), 0) || 0;
  const balance = totalIncome - totalExpenses;

  return (
    <AppLayout>
        <Tabs value={activePeriod} onValueChange={setActivePeriod}>
            <div className="flex items-center justify-between">
                <TabsList>
                    <TabsTrigger value="this-month">Mois en cours</TabsTrigger>
                    <TabsTrigger value="last-month">Mois dernier</TabsTrigger>
                    <TabsTrigger value="this-year">Cette année</TabsTrigger>
                    <TabsTrigger value="all-time">Tout</TabsTrigger>
                </TabsList>
                <div className="ml-auto gap-1">
                    <Button asChild size="sm" className="h-8 gap-1">
                    <Link href="/transactions/add">
                        <PlusCircle className="h-3.5 w-3.5" />
                        <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                        Ajouter Transaction
                        </span>
                    </Link>
                    </Button>
                </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-3 my-4">
                <SummaryCard title="Total Revenus" amountInCents={totalIncome} icon={<DollarSign />} />
                <SummaryCard title="Total Dépenses" amountInCents={totalExpenses} icon={<CreditCard />} />
                <SummaryCard title="Solde Net" amountInCents={balance} icon={<Scale />} />
            </div>
            <TabsContent value={activePeriod}>
              <Card>
                <CardHeader className="flex flex-row items-center">
                  <div className="grid gap-2">
                    <CardTitle className="font-headline">Transactions</CardTitle>
                    <CardDescription>
                      Liste de vos revenus et dépenses pour la période sélectionnée.
                    </CardDescription>
                  </div>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Description</TableHead>
                        <TableHead className="hidden sm:table-cell">Catégorie</TableHead>
                        <TableHead className="hidden sm:table-cell">Date</TableHead>
                        <TableHead className="text-right">Montant</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {isLoading && (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center">
                            Chargement des transactions...
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
                            Aucune transaction trouvée pour cette période.
                          </TableCell>
                        </TableRow>
                      ) : null}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>
        </Tabs>
    </AppLayout>
  );
}
