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
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

import type { Transaction, Category, Currency, UserProfile } from '@/lib/types';
import { PlusCircle } from 'lucide-react';
import Link from 'next/link';
import { useDoc, useFirestore, useUser, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';


interface RecentTransactionsProps {
  transactions: Transaction[];
  categoryIcons: Record<Category, React.ReactNode>;
}

function formatMoney(amountInCents: number, currency: Currency, locale: string) {
  const amount = (amountInCents || 0) / 100;
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
  }).format(amount);
}

export function RecentTransactions({ transactions, categoryIcons }: RecentTransactionsProps) {
    const { user } = useUser();
    const firestore = useFirestore();
    const userProfileRef = useMemoFirebase(() => {
        if (!firestore || !user) return null;
        return doc(firestore, `users/${user.uid}`);
    }, [firestore, user]);

    const { data: userProfile } = useDoc<UserProfile>(userProfileRef);

    const displayCurrency = userProfile?.displayCurrency || 'USD';
    const displayLocale = userProfile?.locale || 'en-US';

  return (
    <Card>
      <CardHeader className="flex flex-row items-center">
        <div className="grid gap-2">
          <CardTitle className="font-headline">Recent Transactions</CardTitle>
          <CardDescription>
            A list of your recent income and expenses.
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
            {transactions.map(transaction => (
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
                  {new Date(transaction.date).toLocaleDateString()}
                </TableCell>
                <TableCell className={`text-right ${transaction.type === 'income' ? 'text-green-600' : ''}`}>
                  {transaction.type === 'income' ? '+' : '-'}{formatMoney(transaction.amountInCents, transaction.currency || displayCurrency, displayLocale)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
