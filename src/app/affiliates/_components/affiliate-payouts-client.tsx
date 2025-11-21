'use client';

import { useMemo } from 'react';
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { downloadCSV, generateFilename } from '@/lib/export-utils';
import type { AffiliatePayoutsSummary, AffiliatePayout } from '@/types/affiliate';
import { formatDistanceToNowStrict } from 'date-fns';
import { fr as frLocale } from 'date-fns/locale';
import { Download, FileSpreadsheet, ExternalLink, AlertCircle } from 'lucide-react';

type AffiliatePayoutsClientProps = {
  summary: AffiliatePayoutsSummary;
};

export function AffiliatePayoutsClient({ summary }: AffiliatePayoutsClientProps) {
  const locale = summary.currency === 'XAF' ? 'fr-CM' : 'fr-FR';
  const isFrench = locale.startsWith('fr');

  const numberFormatter = useMemo(
    () =>
      new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: summary.currency,
        maximumFractionDigits: 0,
      }),
    [locale, summary.currency],
  );

  const exportCSV = () => {
    const rows: string[] = [];
    rows.push('ID,From,To,Amount,Status,Method,Reference');
    summary.history.forEach((payout) => {
      rows.push(
        `${payout.id},${payout.periodFrom},${payout.periodTo},${payout.amount},${payout.status},${payout.method},${payout.reference ?? ''}`,
      );
    });
    downloadCSV(rows.join('\n'), generateFilename('affiliate-payouts', 'csv'));
  };

  const exportExcel = async () => {
    const xlsx = await import('xlsx');
    const wb = xlsx.utils.book_new();
    const ws = xlsx.utils.json_to_sheet(
      summary.history.map((payout) => ({
        ID: payout.id,
        From: payout.periodFrom,
        To: payout.periodTo,
        Amount: numberFormatter.format(payout.amount),
        Status: payout.status,
        Method: payout.method,
        Reference: payout.reference ?? '-',
        PaidAt: payout.paidAt ? new Date(payout.paidAt).toLocaleString(locale) : '-',
      })),
    );
    xlsx.utils.book_append_sheet(wb, ws, 'Payouts');
    xlsx.writeFile(wb, generateFilename('affiliate-payouts', 'xlsx'));
  };

  const statusBadge = (payout: AffiliatePayout) => {
    switch (payout.status) {
      case 'PAID':
        return <Badge variant="secondary">{isFrench ? 'Payé' : 'Paid'}</Badge>;
      case 'PROCESSING':
        return <Badge variant="outline">{isFrench ? 'En traitement' : 'Processing'}</Badge>;
      case 'DUE':
        return <Badge variant="default">{isFrench ? 'À venir' : 'Due'}</Badge>;
      case 'FAILED':
      default:
        return <Badge variant="destructive">{isFrench ? 'Échec' : 'Failed'}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {isFrench ? 'Payouts affiliés' : 'Affiliate payouts'}
          </h1>
          <p className="text-sm text-muted-foreground">
            {isFrench
              ? 'Suivez vos versements, vérifiez leur statut et téléchargez les justificatifs lorsque disponibles.'
              : 'Track your payouts, check their status and download receipts when available.'}
          </p>
          {summary.nextPayout && (
            <div className="mt-3 text-xs text-muted-foreground">
              {isFrench ? 'Prochain payout' : 'Next payout'} :{' '}
              {numberFormatter.format(summary.nextPayout.amount)} ·{' '}
              {formatDistanceToNowStrict(new Date(summary.nextPayout.periodTo), {
                addSuffix: true,
                locale: isFrench ? frLocale : undefined,
              })}
            </div>
          )}
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
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {isFrench ? 'Montant dû' : 'Amount due'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{numberFormatter.format(summary.totals.amountDue)}</div>
            <p className="text-xs text-muted-foreground">
              {summary.totals.due}{' '}
              {isFrench ? 'payouts à venir' : 'payouts upcoming'}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {isFrench ? 'En traitement' : 'Processing'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">
              {numberFormatter.format(summary.totals.amountProcessing)}
            </div>
            <p className="text-xs text-muted-foreground">
              {summary.totals.processing}{' '}
              {isFrench ? 'transferts en cours' : 'transfers ongoing'}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {isFrench ? 'Payé ce trimestre' : 'Paid this quarter'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{numberFormatter.format(summary.totals.amountPaid)}</div>
            <p className="text-xs text-muted-foreground">
              {summary.totals.paid}{' '}
              {isFrench ? 'paiements complétés' : 'payments completed'}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {isFrench ? 'Échecs récents' : 'Recent failures'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{summary.totals.failed}</div>
            <p className="text-xs text-muted-foreground">
              {isFrench ? 'Vérifiez vos informations de paiement' : 'Review payout settings'}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{isFrench ? 'Historique des payouts' : 'Payout history'}</CardTitle>
          <CardDescription>
            {isFrench
              ? 'Consultez les périodes payées et les méthodes utilisées.'
              : 'Review paid periods and payment methods.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{isFrench ? 'Période' : 'Period'}</TableHead>
                <TableHead className="text-right">{isFrench ? 'Montant' : 'Amount'}</TableHead>
                <TableHead>{isFrench ? 'Statut' : 'Status'}</TableHead>
                <TableHead>{isFrench ? 'Méthode' : 'Method'}</TableHead>
                <TableHead>{isFrench ? 'Référence' : 'Reference'}</TableHead>
                <TableHead>{isFrench ? 'Mise à jour' : 'Last update'}</TableHead>
                <TableHead>{isFrench ? 'Actions' : 'Actions'}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {summary.history.map((payout) => (
                <TableRow key={payout.id}>
                  <TableCell>
                    <div className="font-semibold">
                      {new Date(payout.periodFrom).toLocaleDateString(locale)} →{' '}
                      {new Date(payout.periodTo).toLocaleDateString(locale)}
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-semibold">
                    {numberFormatter.format(payout.amount)}
                  </TableCell>
                  <TableCell>{statusBadge(payout)}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{payout.method}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {payout.reference ?? '—'}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {payout.paidAt
                      ? formatDistanceToNowStrict(new Date(payout.paidAt), {
                          addSuffix: true,
                          locale: isFrench ? frLocale : undefined,
                        })
                      : '—'}
                  </TableCell>
                  <TableCell>
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/affiliates/payouts/${payout.id}`}>
                        <ExternalLink className="mr-2 h-4 w-4" />
                        {isFrench ? 'Détails' : 'Details'}
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {summary.totals.failed > 0 && (
        <Card className="border-destructive/40 bg-destructive/5">
          <CardHeader className="flex flex-row items-start gap-3">
            <AlertCircle className="mt-1 h-5 w-5 text-destructive" />
            <div>
              <CardTitle>{isFrench ? 'Payouts à vérifier' : 'Payouts to review'}</CardTitle>
              <CardDescription>
                {isFrench
                  ? 'Un payout récent a échoué. Vérifiez vos coordonnées bancaires ou contactez le support.'
                  : 'A recent payout failed. Check your payout settings or contact support.'}
              </CardDescription>
            </div>
          </CardHeader>
        </Card>
      )}
    </div>
  );
}
