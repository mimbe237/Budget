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

import type { Transaction, Category, Currency } from '@/lib/types';
import { PlusCircle } from 'lucide-react';
import Link from 'next/link';

interface RecentTransactionsProps {
  transactions: Transaction[];
  categoryIcons: Record<Category, React.ReactNode>;
}

function formatMoney(amountInCents: number, currency: Currency = 'USD') {
  const amount = amountInCents / 100;
  // TODO: Use user's locale for formatting
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
  }).format(amount);
}

export function RecentTransactions({ transactions, categoryIcons }: RecentTransactionsProps) {
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
                  {transaction.type === 'income' ? '+' : '-'}{formatMoney(transaction.amountInCents, transaction.currency)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
