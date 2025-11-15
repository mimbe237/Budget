'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  ArrowDownCircle,
  ArrowUpCircle,
  BadgeCheck,
  Banknote,
  Calendar,
  Filter,
  Link2,
  ListChecks,
  Trash2,
  PlusCircle,
} from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { deleteDoc, doc, collection, query, where, orderBy, limit } from 'firebase/firestore';

import { AppLayout } from '@/components/dashboard/dashboard-client';
import { useCollection, useFirestore, useMemoFirebase, useUser, useDoc } from '@/firebase';
import type { Transaction, UserProfile, Category } from '@/lib/types';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Pagination } from '@/components/ui/pagination';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from '@/hooks/use-toast';
import { SummaryCard } from '@/components/dashboard/summary-card';
import { DateRangePicker } from '../reports/_components/date-range-picker';
import { ImportTransactionsDialog } from '@/components/transactions/import-transactions-dialog';
import { Skeleton } from '@/components/ui/skeleton';

const ROWS_PER_PAGE = 15;

const TYPE_OPTIONS = [
  { value: 'all', labelFr: 'Tous', labelEn: 'All' },
  { value: 'expense', labelFr: 'Dépense', labelEn: 'Expense' },
  { value: 'income', labelFr: 'Revenu', labelEn: 'Income' },
] as const;

function formatCurrency(amountInCents: number, currency: string, locale: string) {
  const formatter = new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
  });
  return formatter.format((amountInCents || 0) / 100);
}

type EnrichedTransaction = Transaction & {
  accountName?: string | null;
};

function TransactionsContent() {
  const { user, userProfile } = useUser();
  const firestore = useFirestore();
  const searchParams = useSearchParams();

  const isFrench = userProfile?.locale === 'fr-CM';
  const displayCurrency = userProfile?.displayCurrency || 'USD';
  const displayLocale = userProfile?.locale || 'en-US';

  const from = searchParams?.get('from') || null;
  const to = searchParams?.get('to') || null;

  const transactionsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    let transactionsRef = collection(firestore, `users/${user.uid}/expenses`);
    let q = query(transactionsRef, orderBy('date', 'desc'), limit(500));
    if (from) q = query(q, where('date', '>=', from));
    if (to) q = query(q, where('date', '<=', to));
    return q;
  }, [firestore, user, from, to]);

  const { data: transactions, isLoading } = useCollection<EnrichedTransaction>(transactionsQuery);

  const userProfileRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, `users/${user.uid}`);
  }, [firestore, user]);
  const { data: profileDoc } = useDoc<UserProfile>(userProfileRef);

  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'income' | 'expense'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [accountFilter, setAccountFilter] = useState<string>('all');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [page, setPage] = useState(1);

  useEffect(() => {
    setPage(1);
    setSelectedIds([]);
  }, [searchTerm, typeFilter, categoryFilter, accountFilter, from, to]);

  const categoryOptions = useMemo(() => {
    const unique = new Set<string>();
    (transactions ?? []).forEach(transaction => {
      if (transaction.category) {
        unique.add(transaction.category);
      }
    });
    return Array.from(unique).sort();
  }, [transactions]);

  const accountOptions = useMemo(() => {
    const unique = new Set<string>();
    (transactions ?? []).forEach(transaction => {
      const account =
        transaction.accountName ??
        (transaction as any).account ??
        (transaction as any).accountId ??
        '';
      if (account) {
        unique.add(account as string);
      }
    });
    return Array.from(unique).sort();
  }, [transactions]);

  const filteredTransactions = useMemo(() => {
    if (!transactions) return [];
    return transactions
      .filter(transaction => {
        const accountName =
          transaction.accountName ??
          (transaction as any).account ??
          (transaction as any).accountId ??
          '';
        const matchesType = typeFilter === 'all' || transaction.type === typeFilter;
        const matchesCategory = categoryFilter === 'all' || transaction.category === categoryFilter;
        const matchesAccount = accountFilter === 'all' || accountName === accountFilter;
        const haystack = `${transaction.description ?? ''} ${transaction.category ?? ''} ${accountName ?? ''} ${
          transaction.date ?? ''
        }`.toLowerCase();
        const matchesSearch = haystack.includes(searchTerm.toLowerCase().trim());
        return matchesType && matchesCategory && matchesAccount && matchesSearch;
      })
      .sort((a, b) => {
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();
        return dateB - dateA;
      });
  }, [transactions, typeFilter, categoryFilter, accountFilter, searchTerm]);

  const totalPages = Math.max(1, Math.ceil(filteredTransactions.length / ROWS_PER_PAGE));
  const paginatedTransactions = filteredTransactions.slice(
    (page - 1) * ROWS_PER_PAGE,
    page * ROWS_PER_PAGE
  );

  const totals = useMemo(() => {
    return filteredTransactions.reduce(
      (acc, transaction) => {
        if (transaction.type === 'income') {
          acc.income += transaction.amountInCents || 0;
        } else {
          acc.expense += transaction.amountInCents || 0;
        }
        return acc;
      },
      { income: 0, expense: 0 }
    );
  }, [filteredTransactions]);

  const balance = totals.income - totals.expense;

  const toggleSelectTransaction = (id: string) => {
    setSelectedIds(prev => (prev.includes(id) ? prev.filter(existing => existing !== id) : [...prev, id]));
  };

  const toggleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(paginatedTransactions.map(transaction => transaction.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleDeleteSelected = async () => {
    if (!firestore || !user || selectedIds.length === 0) return;
    const confirmMessage = isFrench
      ? `Supprimer ${selectedIds.length} transaction(s) ? Cette action est irréversible.`
      : `Delete ${selectedIds.length} transaction(s)? This action cannot be undone.`;
    if (!window.confirm(confirmMessage)) return;

    try {
      await Promise.all(
        selectedIds.map(id => deleteDoc(doc(firestore, `users/${user.uid}/expenses/${id}`)))
      );
      toast({
        title: isFrench ? 'Transactions supprimées' : 'Transactions deleted',
        description: isFrench
          ? 'Les transactions sélectionnées ont été supprimées avec succès.'
          : 'Selected transactions have been removed successfully.',
      });
      setSelectedIds([]);
    } catch (error: any) {
      toast({
        title: isFrench ? 'Erreur' : 'Error',
        description: error?.message ?? (isFrench ? 'Suppression impossible.' : 'Unable to delete items.'),
        variant: 'destructive',
      });
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
            {isFrench ? 'Transactions' : 'Transactions'}
          </h1>
          <p className="text-sm text-muted-foreground">
            {isFrench
              ? 'Pilotez vos flux financiers, filtrez, importez et catégorisez vos opérations.'
              : 'Manage your financial activity, filter, import and categorise your operations.'}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {/* Primary action now opens the full form instead of the quick dialog */}
          <Button size="sm" className="h-9 gap-2" asChild>
            <Link href="/transactions/add">
              <PlusCircle className="h-4 w-4" />
              {isFrench ? 'Ajouter une Transaction' : 'Full form'}
            </Link>
          </Button>
          <ImportTransactionsDialog isFrench={isFrench} />
          <Button variant="outline" size="sm" className="h-9 gap-2" asChild>
            <Link href="/reports?tab=transactions">
              <Banknote className="h-4 w-4" />
              {isFrench ? 'Voir les rapports' : 'View reports'}
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <SummaryCard title={isFrench ? 'Revenus filtrés' : 'Filtered income'} amountInCents={totals.income} icon={<ArrowUpCircle />} />
        <SummaryCard title={isFrench ? 'Dépenses filtrées' : 'Filtered expenses'} amountInCents={totals.expense} icon={<ArrowDownCircle />} />
        <SummaryCard title={isFrench ? 'Solde net' : 'Net balance'} amountInCents={balance} icon={<BadgeCheck />} />
      </div>

      <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
        <Card>
          <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Filter className="h-4 w-4 text-blue-500" />
                {isFrench ? 'Filtres dynamiques' : 'Dynamic filters'}
              </CardTitle>
              <CardDescription>
                {isFrench
                  ? 'Affinez vos résultats par période, type, catégorie et compte.'
                  : 'Refine your results by period, type, category and account.'}
              </CardDescription>
            </div>
            <DateRangePicker />
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <Input
              placeholder={isFrench ? 'Rechercher...' : 'Search...'}
              value={searchTerm}
              onChange={event => setSearchTerm(event.target.value)}
            />
            <Select value={typeFilter} onValueChange={value => setTypeFilter(value as typeof typeFilter)}>
              <SelectTrigger>
                <SelectValue placeholder={isFrench ? 'Type' : 'Type'} />
              </SelectTrigger>
              <SelectContent>
                {TYPE_OPTIONS.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {isFrench ? option.labelFr : option.labelEn}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger>
                <SelectValue placeholder={isFrench ? 'Catégorie' : 'Category'} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{isFrench ? 'Toutes les catégories' : 'All categories'}</SelectItem>
                {categoryOptions.map(category => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={accountFilter} onValueChange={setAccountFilter}>
              <SelectTrigger>
                <SelectValue placeholder={isFrench ? 'Compte' : 'Account'} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{isFrench ? 'Tous les comptes' : 'All accounts'}</SelectItem>
                {accountOptions.map(account => (
                  <SelectItem key={account} value={account}>
                    {account}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-slate-50/80 via-white/60 to-blue-50/40 border border-slate-200/70">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ListChecks className="h-4 w-4 text-indigo-500" />
              {isFrench ? 'Sélections rapides' : 'Quick selections'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>
              {isFrench
                ? 'Sélectionnez plusieurs transactions pour les supprimer ou les catégoriser en masse.'
                : 'Select multiple entries to delete or categorise them in bulk.'}
            </p>
            <p>
              {isFrench
                ? 'Importez un relevé bancaire pour déclencher la catégorisation automatique (IA).'
                : 'Upload a bank statement to trigger automatic (AI) categorisation.'}
            </p>
            <p>
              {isFrench
                ? 'Le filtrage par compte est basé sur le champ “accountName” s’il est renseigné.'
                : 'Filtering by account uses the “accountName” field when available.'}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Link2 className="h-4 w-4 text-purple-500" />
              {isFrench ? 'Transactions filtrées' : 'Filtered transactions'}
            </CardTitle>
            <CardDescription>
              {isFrench
                ? `${filteredTransactions.length} élément(s) correspondant(s) à vos critères.`
                : `${filteredTransactions.length} record(s) matching your filters.`}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="destructive"
              size="sm"
              className="h-9 gap-2"
              disabled={selectedIds.length === 0}
              onClick={handleDeleteSelected}
            >
              <Trash2 className="h-4 w-4" />
              {isFrench ? 'Supprimer sélection' : 'Delete selected'}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[40px]">
                    <Checkbox
                      aria-label={isFrench ? 'Tout sélectionner' : 'Select all'}
                      checked={
                        selectedIds.length > 0 &&
                        paginatedTransactions.every(transaction => selectedIds.includes(transaction.id))
                      }
                      onCheckedChange={value => toggleSelectAll(Boolean(value))}
                    />
                  </TableHead>
                  <TableHead>{isFrench ? 'Date' : 'Date'}</TableHead>
                  <TableHead>{isFrench ? 'Description' : 'Description'}</TableHead>
                  <TableHead>{isFrench ? 'Catégorie' : 'Category'}</TableHead>
                  <TableHead>{isFrench ? 'Compte' : 'Account'}</TableHead>
                  <TableHead>{isFrench ? 'Type' : 'Type'}</TableHead>
                  <TableHead className="text-right">{isFrench ? 'Montant' : 'Amount'}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, index) => (
                    <TableRow key={`skeleton-${index}`}>
                      <TableCell colSpan={7}>
                        <Skeleton className="h-6 w-full" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : paginatedTransactions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                      {isFrench ? 'Aucune transaction pour ces filtres.' : 'No transactions for these filters.'}
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedTransactions.map(transaction => {
                    const accountName =
                      transaction.accountName ??
                      (transaction as any).account ??
                      (transaction as any).accountId ??
                      '';
                    const amountFormatted = formatCurrency(transaction.amountInCents, displayCurrency, displayLocale);
                    const isIncome = transaction.type === 'income';
                    return (
                      <TableRow key={transaction.id} className="hover:bg-muted/40">
                        <TableCell>
                          <Checkbox
                            aria-label={isFrench ? 'Sélectionner la transaction' : 'Select transaction'}
                            checked={selectedIds.includes(transaction.id)}
                            onCheckedChange={() => toggleSelectTransaction(transaction.id)}
                          />
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Calendar className="h-3.5 w-3.5" />
                            {new Date(transaction.date).toLocaleDateString(displayLocale)}
                          </div>
                        </TableCell>
                        <TableCell className="font-medium text-slate-900">{transaction.description}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {transaction.category || '—'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {accountName || '—'}
                        </TableCell>
                        <TableCell>
                          <Badge variant={isIncome ? 'secondary' : 'outline'} className="text-xs">
                            {isIncome ? (isFrench ? 'Revenu' : 'Income') : isFrench ? 'Dépense' : 'Expense'}
                          </Badge>
                        </TableCell>
                        <TableCell
                          className={`text-right font-semibold ${
                            isIncome ? 'text-emerald-600' : 'text-rose-600'
                          }`}
                        >
                          {isIncome ? '+' : '-'}
                          {amountFormatted}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
          <div className="py-4">
            <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function TransactionsPage() {
  return (
    <AppLayout>
      <TransactionsContent />
    </AppLayout>
  );
}
