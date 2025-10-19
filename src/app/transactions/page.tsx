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
import { useCollection, useDoc, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import type { Category, Currency, Transaction, UserProfile } from '@/lib/types';
import { collection, query, doc } from 'firebase/firestore';

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

export default function TransactionsPage() {
  const { user } = useUser();
  const firestore = useFirestore();

  const transactionsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, `users/${user.uid}/expenses`));
  }, [firestore, user]);

  const { data: transactions, isLoading } = useCollection<Transaction>(transactionsQuery);

  const userProfileRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, `users/${user.uid}`);
    }, [firestore, user]);
  const { data: userProfile } = useDoc<UserProfile>(userProfileRef);

  const displayCurrency = userProfile?.displayCurrency || 'USD';
  const displayLocale = userProfile?.locale || 'en-US';

  return (
    <AppLayout>
      <Card>
        <CardHeader className="flex flex-row items-center">
          <div className="grid gap-2">
            <CardTitle className="font-headline">Transactions</CardTitle>
            <CardDescription>
              A list of all your income and expenses.
            </CardDescription>
          </div>
          <div className="ml-auto gap-1">
            <Button asChild size="sm" className="h-8 gap-1">
              <Link href="/transactions/add">
                <PlusCircle className="h-3.5 w-3.5" />
                <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                  Add Transaction
                </span>
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Description</TableHead>
                <TableHead className="hidden sm:table-cell">Category</TableHead>
                <TableHead className="hidden sm:table-cell">Date</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center">
                    Loading transactions...
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
                      className={`text-right ${
                        transaction.type === 'income' ? 'text-green-600' : ''
                      }`}
                    >
                      {transaction.type === 'income' ? '+' : '-'}{formatMoney(transaction.amountInCents, transaction.currency || displayCurrency, displayLocale)}
                    </TableCell>
                  </TableRow>
                ))
              ) : !isLoading ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center">
                    No transactions found.
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
