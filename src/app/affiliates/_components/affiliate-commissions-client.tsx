'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { downloadCSV, generateFilename } from '@/lib/export-utils';
import type { AffiliateCommission, AffiliateCommissionSummary } from '@/types/affiliate';
import {
  ArrowUpRight,
  Download,
  FileSpreadsheet,
  RefreshCw,
} from 'lucide-react';
import { getAffiliateCommissions } from '../_actions/get-affiliate-commissions';
import { useTransition } from 'react';

type AffiliateCommissionsClientProps = {
  summary: AffiliateCommissionSummary;
};

export function AffiliateCommissionsClient({ summary }: AffiliateCommissionsClientProps) {
  const [statusFilter, setStatusFilter] = useState<'all' | AffiliateCommission['status']>('all');
  const [schemaFilter, setSchemaFilter] = useState<'all' | AffiliateCommission['schema']>('all');
  const [currentSummary, setCurrentSummary] = useState(summary);
  const [isRefreshing, startRefresh] = useTransition();

  const locale = currentSummary.currency === 'XAF' ? 'fr-CM' : 'fr-FR';
  const isFrench = locale.startsWith('fr');

  const numberFormatter = useMemo(
    () =>
      new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: currentSummary.currency,
        maximumFractionDigits: 0,
      }),
    [currentSummary.currency, locale],
  );

  const filtered: AffiliateCommission[] = useMemo(() => {
    return currentSummary.commissions.filter((commission) => {
      if (statusFilter !== 'all' && commission.status !== statusFilter) return false;
      if (schemaFilter !== 'all' && commission.schema !== schemaFilter) return false;
      return true;
    });
  }, [currentSummary.commissions, schemaFilter, statusFilter]);

  const statusBadge = (status: AffiliateCommission['status']) => {
    const map: Record<AffiliateCommission['status'], { label: string; variant: 'secondary' | 'outline' | 'default' | 'destructive' }> = {
      PENDING: { label: isFrench ? 'En attente' : 'Pending', variant: 'outline' },
      APPROVED: { label: isFrench ? 'Approuvée' : 'Approved', variant: 'secondary' },
      PAID: { label: isFrench ? 'Payée' : 'Paid', variant: 'default' },
      VOID: { label: isFrench ? 'Annulée' : 'Voided', variant: 'destructive' },
    };
    const config = map[status];
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const refreshData = () => {
    startRefresh(async () => {
      const refreshed = await getAffiliateCommissions();
      setCurrentSummary(refreshed);
    });
  };

  const exportCSV = () => {
    const rows: string[] = [];
    rows.push('ID,Referral,Status,Schema,Amount,Payout,Created At');
    filtered.forEach((commission) => {
      rows.push(
        `${commission.id},${commission.referralId},${commission.status},${commission.schema},${commission.amount},${commission.payoutId ?? ''},${commission.createdAt}`,
      );
    });
    downloadCSV(rows.join('\n'), generateFilename('affiliate-commissions', 'csv'));
  };

  const exportExcel = async () => {
    const xlsx = await import('xlsx');
    const wb = xlsx.utils.book_new();
    const ws = xlsx.utils.json_to_sheet(
      filtered.map((commission) => ({
        ID: commission.id,
        Referral: commission.referralId,
        Status: commission.status,
        Schema: commission.schema,
        Amount: numberFormatter.format(commission.amount),
        Payout: commission.payoutId ?? '-',
        CreatedAt: new Date(commission.createdAt).toLocaleString(locale),
      })),
    );
    xlsx.utils.book_append_sheet(wb, ws, 'Commissions');
    xlsx.writeFile(wb, generateFilename('affiliate-commissions', 'xlsx'));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {isFrench ? 'Commissions affiliées' : 'Affiliate commissions'}
          </h1>
          <p className="text-sm text-muted-foreground">
            {isFrench
              ? 'Suivez l’état de vos commissions, anticipez vos payouts et identifiez les récurrences actives.'
              : 'Track commission status, anticipate payouts, and identify active recurring streams.'}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" onClick={exportCSV}>
            <Download className="mr-2 h-4 w-4" />
            CSV
          </Button>
          <Button variant="outline" onClick={exportExcel}>
            <FileSpreadsheet className="mr-2 h-4 w-4" />
            Excel
          </Button>
          <Button variant="secondary" onClick={refreshData} disabled={isRefreshing}>
            {isRefreshing ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
            {isFrench ? 'Actualiser' : 'Refresh'}
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {isFrench ? 'Montant en attente' : 'Pending amount'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">
              {numberFormatter.format(currentSummary.totals.amountPending)}
            </div>
            <p className="text-xs text-muted-foreground">
              {currentSummary.totals.pending}{' '}
              {isFrench ? 'commissions en attente' : 'pending commissions'}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {isFrench ? 'Montant approuvé' : 'Approved amount'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">
              {numberFormatter.format(currentSummary.totals.amountApproved)}
            </div>
            <p className="text-xs text-muted-foreground">
              {isFrench ? 'Prêt à être payé' : 'Ready to be paid'}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {isFrench ? 'Payé ce mois-ci' : 'Paid this month'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">
              {numberFormatter.format(currentSummary.totals.amountPaid)}
            </div>
            <p className="text-xs text-muted-foreground">
              {currentSummary.totals.paid}{' '}
              {isFrench ? 'transferts effectués' : 'transfers completed'}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {isFrench ? 'Récurrent actif' : 'Active recurring'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">
              {currentSummary.recurrent.active}
            </div>
            <p className="text-xs text-muted-foreground">
              {isFrench ? 'Moyenne mensuelle' : 'Monthly average'} :{' '}
              {numberFormatter.format(currentSummary.recurrent.monthAverage)}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle>{isFrench ? 'Historique des commissions' : 'Commission history'}</CardTitle>
            <CardDescription>
              {isFrench
                ? 'Visualisez le statut de chaque commission et son lien avec les payouts.'
                : 'Inspect each commission and its payout relationship.'}
            </CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Select value={statusFilter} onValueChange={(value: typeof statusFilter) => setStatusFilter(value)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder={isFrench ? 'Statut' : 'Status'} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{isFrench ? 'Tous les statuts' : 'All status'}</SelectItem>
                <SelectItem value="PENDING">{isFrench ? 'En attente' : 'Pending'}</SelectItem>
                <SelectItem value="APPROVED">{isFrench ? 'Approuvées' : 'Approved'}</SelectItem>
                <SelectItem value="PAID">{isFrench ? 'Payées' : 'Paid'}</SelectItem>
                <SelectItem value="VOID">{isFrench ? 'Annulées' : 'Voided'}</SelectItem>
              </SelectContent>
            </Select>
            <Select value={schemaFilter} onValueChange={(value: typeof schemaFilter) => setSchemaFilter(value)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder={isFrench ? 'Type' : 'Type'} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{isFrench ? 'Tous les types' : 'All types'}</SelectItem>
                <SelectItem value="FIXED">{isFrench ? 'Fixe' : 'Fixed'}</SelectItem>
                <SelectItem value="PERCENT">{isFrench ? 'Pourcentage' : 'Percent'}</SelectItem>
                <SelectItem value="RECURRING">{isFrench ? 'Récurrent' : 'Recurring'}</SelectItem>
                <SelectItem value="TIERED">{isFrench ? 'Paliers' : 'Tiered'}</SelectItem>
                <SelectItem value="BONUS">{isFrench ? 'Bonus' : 'Bonus'}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[420px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{isFrench ? 'Commission' : 'Commission'}</TableHead>
                  <TableHead>{isFrench ? 'Type' : 'Type'}</TableHead>
                  <TableHead>{isFrench ? 'Statut' : 'Status'}</TableHead>
                  <TableHead className="text-right">{isFrench ? 'Montant' : 'Amount'}</TableHead>
                  <TableHead>{isFrench ? 'Lien payout' : 'Payout link'}</TableHead>
                  <TableHead>{isFrench ? 'Création' : 'Created'}</TableHead>
                  <TableHead>{isFrench ? 'Actions' : 'Actions'}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((commission) => (
                  <TableRow key={commission.id}>
                    <TableCell>
                      <div className="font-semibold">{commission.id}</div>
                      <div className="text-xs text-muted-foreground">ref: {commission.referralId}</div>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{commission.schema}</TableCell>
                    <TableCell>{statusBadge(commission.status)}</TableCell>
                    <TableCell className="text-right font-semibold">
                      {numberFormatter.format(commission.amount)}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {commission.payoutId ?? '—'}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(commission.createdAt).toLocaleDateString(locale)}
                    </TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/affiliates/commissions/${commission.id}`}>
                          <ArrowUpRight className="mr-2 h-4 w-4" />
                          {isFrench ? 'Détails' : 'Details'}
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="py-10 text-center text-sm text-muted-foreground">
                      {isFrench
                        ? 'Aucune commission ne correspond à vos filtres.'
                        : 'No commission matches your filters.'}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
