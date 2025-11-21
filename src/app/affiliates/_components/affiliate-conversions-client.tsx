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
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Alert,
  AlertDescription,
} from '@/components/ui/alert';
import {
  Download,
  FileSpreadsheet,
  ExternalLink,
  Filter,
  Search,
  RefreshCw,
} from 'lucide-react';
import { downloadCSV, generateFilename } from '@/lib/export-utils';
import type { AffiliateReferral } from '@/types/affiliate';
import { formatDistanceToNowStrict } from 'date-fns';
import { fr as frLocale } from 'date-fns/locale';
import type { AffiliateConversionSummary } from '../_actions/get-affiliate-conversions';

type AffiliateConversionsClientProps = {
  summary: AffiliateConversionSummary;
};

export function AffiliateConversionsClient({ summary }: AffiliateConversionsClientProps) {
  const [filter, setFilter] = useState<'all' | 'PENDING' | 'APPROVED' | 'REJECTED'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentSummary] = useState(summary);

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

  const filteredConversions = useMemo(() => {
    return currentSummary.conversions.filter((conversion) => {
      if (filter !== 'all' && conversion.status !== filter) return false;
      if (!searchTerm) return true;
      const term = searchTerm.toLowerCase();
      return (
        conversion.customer.toLowerCase().includes(term) ||
        conversion.linkLabel?.toLowerCase().includes(term) ||
        conversion.id.toLowerCase().includes(term)
      );
    });
  }, [currentSummary.conversions, filter, searchTerm]);

  const statusBadge = (status: AffiliateReferral['status']) => {
    const config =
      status === 'PENDING'
        ? { label: isFrench ? 'En attente' : 'Pending', variant: 'outline' as const }
        : status === 'APPROVED'
          ? { label: isFrench ? 'Approuvée' : 'Approved', variant: 'secondary' as const }
          : status === 'REJECTED'
            ? { label: isFrench ? 'Rejetée' : 'Rejected', variant: 'destructive' as const }
            : { label: isFrench ? 'Annulée' : 'Voided', variant: 'destructive' as const };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const exportCSV = () => {
    const rows: string[] = [];
    rows.push('ID,Customer,Event,Status,Amount,Commission,Link,Date');
    filteredConversions.forEach((conversion) => {
      rows.push(
        `${conversion.id},${conversion.customer.replace(/,/g, ' ')},${conversion.eventType},${conversion.status},${conversion.amount},${conversion.commissionAmount},${conversion.linkLabel ?? ''},${conversion.createdAt}`,
      );
    });
    downloadCSV(rows.join('\n'), generateFilename('affiliate-conversions', 'csv'));
  };

  const exportExcel = async () => {
    const xlsx = await import('xlsx');
    const wb = xlsx.utils.book_new();
    const ws = xlsx.utils.json_to_sheet(
      filteredConversions.map((conversion) => ({
        ID: conversion.id,
        Customer: conversion.customer,
        Event: conversion.eventType,
        Status: conversion.status,
        Amount: numberFormatter.format(conversion.amount),
        Commission: numberFormatter.format(conversion.commissionAmount),
        Link: conversion.linkLabel ?? '',
        Date: new Date(conversion.createdAt).toLocaleString(locale),
      })),
    );
    xlsx.utils.book_append_sheet(wb, ws, 'Conversions');
    xlsx.writeFile(wb, generateFilename('affiliate-conversions', 'xlsx'));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {isFrench ? 'Conversions affiliées' : 'Affiliate conversions'}
          </h1>
          <p className="text-sm text-muted-foreground">
            {isFrench
              ? 'Analysez vos inscriptions, achats et abonnements attribués à vos campagnes.'
              : 'Analyse the signups, purchases, and subscriptions attributed to your campaigns.'}
          </p>
          <div className="mt-2 text-xs text-muted-foreground">
            {isFrench ? 'Mise à jour' : 'Updated'} :{' '}
            {new Date(currentSummary.lastUpdated).toLocaleString(locale)}
          </div>
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
          <Button variant="secondary" disabled>
            <RefreshCw className="mr-2 h-4 w-4" />
            {isFrench ? 'Live bientôt' : 'Live soon'}
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {isFrench ? 'Total approuvées' : 'Approved'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{currentSummary.totals.approved}</div>
            <p className="text-xs text-muted-foreground">
              {numberFormatter.format(currentSummary.totals.revenue)} {isFrench ? 'de revenu généré' : 'revenue generated'}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {isFrench ? 'En attente' : 'Pending'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{currentSummary.totals.pending}</div>
            <p className="text-xs text-muted-foreground">
              {isFrench ? 'En attente d’approbation' : 'Awaiting approval'}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {isFrench ? 'Rejetées' : 'Rejected'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{currentSummary.totals.rejected}</div>
            <p className="text-xs text-muted-foreground">
              {isFrench ? 'Raison : remboursement, fraude…' : 'Due to refunds, fraud, etc.'}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {isFrench ? 'Panier moyen approuvé' : 'Average approved order'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">
              {numberFormatter.format(currentSummary.totals.averageOrder)}
            </div>
            <p className="text-xs text-muted-foreground">
              {isFrench ? 'Sur les 90 derniers jours' : 'Over the past 90 days'}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle>{isFrench ? 'Historique des conversions' : 'Conversion history'}</CardTitle>
            <CardDescription>
              {isFrench
                ? 'Filtrez par statut, recherchez un client ou exportez la liste.'
                : 'Filter by status, search a customer, or export the list.'}
            </CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                className="pl-8"
                placeholder={isFrench ? 'Rechercher un client…' : 'Search customer…'}
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={filter} onValueChange={(value: typeof filter) => setFilter(value)}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder={isFrench ? 'Statut' : 'Status'} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{isFrench ? 'Tous les statuts' : 'All status'}</SelectItem>
                  <SelectItem value="PENDING">{isFrench ? 'En attente' : 'Pending'}</SelectItem>
                  <SelectItem value="APPROVED">{isFrench ? 'Approuvées' : 'Approved'}</SelectItem>
                  <SelectItem value="REJECTED">{isFrench ? 'Rejetées' : 'Rejected'}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredConversions.length === 0 ? (
            <Alert>
              <AlertDescription>
                {isFrench
                  ? 'Aucune conversion ne correspond aux filtres sélectionnés.'
                  : 'No conversion matches the selected filters.'}
              </AlertDescription>
            </Alert>
          ) : (
            <ScrollArea className="h-[420px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{isFrench ? 'Client' : 'Customer'}</TableHead>
                    <TableHead>{isFrench ? 'Campagne' : 'Campaign'}</TableHead>
                    <TableHead>{isFrench ? 'Événement' : 'Event'}</TableHead>
                    <TableHead className="text-right">{isFrench ? 'Montant' : 'Amount'}</TableHead>
                    <TableHead className="text-right">{isFrench ? 'Commission' : 'Commission'}</TableHead>
                    <TableHead>{isFrench ? 'Statut' : 'Status'}</TableHead>
                    <TableHead>{isFrench ? 'Date' : 'Date'}</TableHead>
                    <TableHead>{isFrench ? 'Détails' : 'Details'}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredConversions.map((conversion) => (
                    <TableRow key={conversion.id}>
                      <TableCell>
                        <div className="font-semibold">{conversion.customer}</div>
                        <div className="text-xs text-muted-foreground">{conversion.id}</div>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {conversion.linkLabel ?? '—'}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {conversion.eventType}
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        {numberFormatter.format(conversion.amount)}
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        {numberFormatter.format(conversion.commissionAmount)}
                      </TableCell>
                      <TableCell>{statusBadge(conversion.status)}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {formatDistanceToNowStrict(new Date(conversion.createdAt), {
                          addSuffix: true,
                          locale: isFrench ? frLocale : undefined,
                        })}
                      </TableCell>
                      <TableCell>
                        <Button asChild variant="outline" size="sm">
                          <Link href={`/affiliates/conversions/${conversion.id}`}>
                            <ExternalLink className="mr-2 h-4 w-4" />
                            {isFrench ? 'Voir' : 'View'}
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
