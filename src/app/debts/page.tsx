'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { collection, orderBy, query, where } from 'firebase/firestore';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { AppLayout } from '@/components/dashboard/dashboard-client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Landmark, LineChart, PiggyBank, PlusCircle } from 'lucide-react';
import type { Debt } from '@/types/debt';
import { format } from 'date-fns';

const statusLabels: Record<string, string> = {
  EN_COURS: 'En cours',
  EN_RETARD: 'En retard',
  RESTRUCTUREE: 'Restructurée',
  SOLDEE: 'Soldée',
};

const typeLabels: Record<string, string> = {
  EMPRUNT: 'Emprunt',
  PRET: 'Prêt',
};

function formatCurrency(value: number, currency = 'EUR', locale = 'fr-FR') {
  return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(value);
}

function computeMetrics(debts: Debt[]) {
  const outstanding = debts.reduce((acc, debt) => acc + (debt.remainingPrincipal ?? 0), 0);
  const initial = debts.reduce((acc, debt) => acc + (debt.principalInitial ?? 0), 0);
  const late = debts.filter((debt) => debt.status === 'EN_RETARD').length;
  return { outstanding, initial, late };
}

function DebtsContent() {
  const { user, userProfile } = useUser();
  const firestore = useFirestore();
  const [search, setSearch] = useState('');
  const [activeStatus, setActiveStatus] = useState<'ALL' | Debt['status']>('ALL');

  const debtsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(
      collection(firestore, 'debts'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );
  }, [firestore, user]);

  const { data: debts, isLoading } = useCollection<Debt>(debtsQuery);

  const filteredDebts = useMemo(() => {
    const list = debts ?? [];
    return list.filter((debt) => {
      const matchesStatus = activeStatus === 'ALL' ? true : debt.status === activeStatus;
      const needle = search.trim().toLowerCase();
      const matchesSearch =
        !needle ||
        debt.title.toLowerCase().includes(needle) ||
        (debt.counterparty ?? '').toLowerCase().includes(needle) ||
        debt.currency.toLowerCase().includes(needle);
      return matchesStatus && matchesSearch;
    });
  }, [debts, activeStatus, search]);

  const metrics = computeMetrics(filteredDebts ?? []);
  const locale = userProfile?.locale || 'fr-FR';
  const currency = userProfile?.displayCurrency || 'EUR';

  return (
    <AppLayout>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Gestion des dettes</h1>
            <p className="text-muted-foreground">
              Suivez vos emprunts et prêts, visualisez les échéances et agissez rapidement.
            </p>
          </div>
          <div className="flex gap-2">
            <Button asChild variant="outline">
              <Link href="/debts">Actualiser</Link>
            </Button>
            <Button asChild>
              <Link href="/debts/new">
                <PlusCircle className="mr-2 h-4 w-4" />
                Nouvelle dette
              </Link>
            </Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Encours total</CardTitle>
              <PiggyBank className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(metrics.outstanding, currency, locale)}</div>
              <p className="text-xs text-muted-foreground">Somme du capital restant dû</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Volume initial</CardTitle>
              <Landmark className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(metrics.initial, currency, locale)}</div>
              <p className="text-xs text-muted-foreground">Capital contracté à l’origine</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">En retard</CardTitle>
              <LineChart className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.late}</div>
              <p className="text-xs text-muted-foreground">Dettes nécessitant une attention immédiate</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>Vos dettes</CardTitle>
              <CardDescription>
                Filtrez par statut pour concentrer vos efforts et accéder aux détails.
              </CardDescription>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <Input
                placeholder="Rechercher une dette"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="w-full sm:w-64"
              />
            </div>
          </CardHeader>
          <CardContent>
            <Tabs value={activeStatus} onValueChange={(value) => setActiveStatus(value as typeof activeStatus)}>
              <TabsList className="mb-4">
                <TabsTrigger value="ALL">Toutes</TabsTrigger>
                <TabsTrigger value="EN_COURS">En cours</TabsTrigger>
                <TabsTrigger value="EN_RETARD">En retard</TabsTrigger>
                <TabsTrigger value="SOLDEE">Soldées</TabsTrigger>
                <TabsTrigger value="RESTRUCTUREE">Restructurées</TabsTrigger>
              </TabsList>
              <TabsContent value={activeStatus} className="mt-0">
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Intitulé</TableHead>
                        <TableHead className="hidden md:table-cell">Contrepartie</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead className="hidden lg:table-cell">Taux</TableHead>
                        <TableHead className="hidden lg:table-cell">Prochaine échéance</TableHead>
                        <TableHead className="text-right">Reste dû</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {isLoading && (
                        <TableRow>
                          <TableCell colSpan={6}>
                            <Skeleton className="h-6 w-full" />
                          </TableCell>
                        </TableRow>
                      )}
                      {!isLoading && filteredDebts.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                            Aucune dette ne correspond à vos filtres.
                          </TableCell>
                        </TableRow>
                      )}
                      {filteredDebts.map((debt) => (
                        <TableRow key={debt.id}>
                          <TableCell>
                            <div className="flex flex-col">
                              <Link href={`/debts/${debt.id}`} className="font-semibold hover:underline">
                                {debt.title}
                              </Link>
                              <span className="text-xs text-muted-foreground">
                                {statusLabels[debt.status] ?? debt.status}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                            {debt.counterparty || '—'}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{typeLabels[debt.type] ?? debt.type}</Badge>
                          </TableCell>
                          <TableCell className="hidden lg:table-cell text-sm">
                            {(debt.annualRate * 100).toFixed(2)}%
                          </TableCell>
                          <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
                            {debt.nextDueDate
                              ? format(new Date((debt.nextDueDate as any).toDate?.() ?? debt.nextDueDate), 'dd/MM/yyyy')
                              : '—'}
                          </TableCell>
                          <TableCell className="text-right font-semibold">
                            {formatCurrency(debt.remainingPrincipal ?? 0, debt.currency ?? currency, locale)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}

export default function DebtsPage() {
  return <DebtsContent />;
}
