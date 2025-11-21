'use client';

import { useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  ComposedChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { formatDistanceToNowStrict } from 'date-fns';
import { fr as frLocale } from 'date-fns/locale';
import Link from 'next/link';
import {
  ArrowUpRight,
  FileSpreadsheet,
  Download,
  ExternalLink,
  TrendingUp,
  MousePointerClick,
  Percent,
  Wallet,
} from 'lucide-react';
import { downloadCSV, generateFilename } from '@/lib/export-utils';
import type { AffiliateAnalytics, AffiliateSourceBreakdown, AffiliateSeriesPoint } from '@/types/affiliate';
import type { AffiliateAnalyticsRange } from '../_actions/get-affiliate-analytics';

type AffiliateStatsClientProps = {
  analytics: AffiliateAnalytics;
  range: AffiliateAnalyticsRange;
};

export function AffiliateStatsClient({ analytics, range }: AffiliateStatsClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const rangeOptions: { value: AffiliateAnalyticsRange; label: string }[] = [
    { value: '7d', label: '7 jours' },
    { value: '30d', label: '30 jours' },
    { value: '90d', label: '90 jours' },
    { value: '180d', label: '6 mois' },
    { value: '365d', label: '12 mois' },
    { value: 'all', label: 'Depuis le début' },
  ];

  const locale = analytics.affiliate.currency === 'XAF' ? 'fr-CM' : 'fr-FR';
  const isFrench = locale.startsWith('fr');

  const numberFormatter = useMemo(
    () =>
      new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: analytics.affiliate.currency,
        maximumFractionDigits: 0,
      }),
    [analytics.affiliate.currency, locale],
  );

  const conversionFormatter = useMemo(
    () =>
      new Intl.NumberFormat(locale, {
        style: 'decimal',
        maximumFractionDigits: 1,
      }),
    [locale],
  );

  const handleRangeChange = (value: string) => {
    const params = new URLSearchParams(searchParams?.toString() ?? '');
    params.set('range', value);
    router.push(`/affiliates/stats?${params.toString()}`);
  };

  const handleExportCSV = () => {
    const rows: string[] = [];
    rows.push('Section,Label,Value');
    rows.push(`KPI,Clicks,${analytics.kpis.totalClicks}`);
    rows.push(`KPI,Conversions,${analytics.kpis.totalConversions}`);
    rows.push(`KPI,Conversion rate,${analytics.kpis.conversionRate.toFixed(2)}%`);
    rows.push(`KPI,Approved commissions,${analytics.kpis.approvedAmount}`);
    rows.push(`KPI,Pending commissions,${analytics.kpis.pendingAmount}`);
    rows.push('');
    rows.push('TimeSeries,Date,Clicks,Conversions,Revenue,Conversion rate (%)');
    analytics.series.forEach((point: AffiliateSeriesPoint) => {
      rows.push(
        `TimeSeries,${point.date},${point.clicks},${point.conversions},${point.revenue},${point.conversionRate.toFixed(
          2,
        )}`,
      );
    });
    rows.push('');
    rows.push('Sources,Source,Clicks,Conversions,Revenue');
    analytics.sources.forEach((source: AffiliateSourceBreakdown) => {
      rows.push(
        `Sources,${source.source},${source.clicks},${source.conversions},${source.revenue}`,
      );
    });

    const filename = generateFilename(`affiliate-stats-${analytics.affiliate.code}`, 'csv');
    downloadCSV(rows.join('\n'), filename);
  };

  const handleExportXlsx = async () => {
    const xlsx = await import('xlsx');
    const wb = xlsx.utils.book_new();

    const overviewSheet = xlsx.utils.aoa_to_sheet([
      ['Affilié', analytics.affiliate.code],
      ['Tier', analytics.affiliate.tier],
      ['Statut', analytics.affiliate.status],
      ['Période', analytics.period.label],
      ['Total clicks', analytics.kpis.totalClicks],
      ['Total conversions', analytics.kpis.totalConversions],
      ['Taux conversion', `${analytics.kpis.conversionRate.toFixed(2)}%`],
      ['Commissions approuvées', numberFormatter.format(analytics.kpis.approvedAmount)],
      ['Commissions en attente', numberFormatter.format(analytics.kpis.pendingAmount)],
    ]);
    xlsx.utils.book_append_sheet(wb, overviewSheet, 'Overview');

    const seriesSheet = xlsx.utils.json_to_sheet(
      analytics.series.map((point: AffiliateSeriesPoint) => ({
        Date: point.date,
        Clicks: point.clicks,
        Conversions: point.conversions,
        Revenue: numberFormatter.format(point.revenue),
        'Conversion rate (%)': point.conversionRate.toFixed(2),
      })),
    );
    xlsx.utils.book_append_sheet(wb, seriesSheet, 'TimeSeries');

    const sourcesSheet = xlsx.utils.json_to_sheet(
      analytics.sources.map((source: AffiliateSourceBreakdown) => ({
        Source: source.source,
        Clicks: source.clicks,
        Conversions: source.conversions,
        Revenue: numberFormatter.format(source.revenue),
      })),
    );
    xlsx.utils.book_append_sheet(wb, sourcesSheet, 'Sources');

    const filename = generateFilename(`affiliate-stats-${analytics.affiliate.code}`, 'xlsx');
    xlsx.writeFile(wb, filename);
  };

  const conversionRateBadge = (value: number) => {
    if (value >= 30) return 'bg-emerald-100 text-emerald-700';
    if (value >= 15) return 'bg-blue-100 text-blue-700';
    if (value >= 10) return 'bg-amber-100 text-amber-700';
    return 'bg-rose-100 text-rose-700';
  };

  const joinedAtDate = useMemo(() => new Date(analytics.affiliate.joinedAt), [analytics.affiliate.joinedAt]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {isFrench ? 'Statistiques affilié' : 'Affiliate analytics'}
          </h1>
          <p className="text-sm text-muted-foreground">
            {isFrench
              ? 'Suivez vos performances, ajustez vos campagnes et optimisez vos commissions.'
              : 'Monitor performance, optimise campaigns and keep commissions healthy.'}
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
            <Badge variant="outline">{analytics.affiliate.code}</Badge>
            <Badge variant="secondary">{analytics.affiliate.tier}</Badge>
            <span>
              {isFrench ? 'Inscrit depuis' : 'Joined'}{' '}
              {formatDistanceToNowStrict(joinedAtDate, {
                addSuffix: true,
                locale: isFrench ? frLocale : undefined,
              })}
            </span>
            <span>
              {isFrench ? 'Attribution' : 'Attribution'} : {analytics.affiliate.attributionModel}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Select value={range} onValueChange={handleRangeChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder={isFrench ? 'Période' : 'Range'} />
            </SelectTrigger>
            <SelectContent>
              {rangeOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={handleExportCSV}>
            <Download className="mr-2 h-4 w-4" />
            CSV
          </Button>
          <Button variant="outline" onClick={handleExportXlsx}>
            <FileSpreadsheet className="mr-2 h-4 w-4" />
            Excel
          </Button>
          <Button asChild>
            <Link href="/affiliates/links">
              <ExternalLink className="mr-2 h-4 w-4" />
              {isFrench ? 'Gérer mes liens' : 'Manage links'}
            </Link>
          </Button>
        </div>
      </div>

      {analytics.alerts.length > 0 && (
        <div className="grid gap-3 lg:grid-cols-2">
          {analytics.alerts.map((alert, index) => (
            <Alert key={index} variant={alert.type === 'warning' ? 'destructive' : 'default'}>
              <AlertDescription className="flex flex-wrap items-center justify-between gap-3">
                <span>{alert.message}</span>
                {alert.action && (
                  <Button asChild variant="secondary" size="sm">
                    <Link href={alert.action.href}>{alert.action.label}</Link>
                  </Button>
                )}
              </AlertDescription>
            </Alert>
          ))}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {isFrench ? 'Clicks' : 'Clicks'}
            </CardTitle>
            <MousePointerClick className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{analytics.kpis.totalClicks}</div>
            <p className="text-xs text-muted-foreground">{analytics.period.label}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {isFrench ? 'Conversions' : 'Conversions'}
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{analytics.kpis.totalConversions}</div>
            <Badge className={`mt-3 ${conversionRateBadge(analytics.kpis.conversionRate)}`}>
              {conversionFormatter.format(analytics.kpis.conversionRate)}%
            </Badge>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {isFrench ? 'Commissions approuvées' : 'Approved commissions'}
            </CardTitle>
            <Wallet className="h-4 w-4 text-violet-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">
              {numberFormatter.format(analytics.kpis.approvedAmount)}
            </div>
            <p className="text-xs text-muted-foreground">
              {isFrench ? 'Période en cours' : 'Current period'}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {isFrench ? 'Commission en attente' : 'Pending commission'}
            </CardTitle>
            <Percent className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">
              {numberFormatter.format(analytics.kpis.pendingAmount)}
            </div>
            <p className="text-xs text-muted-foreground">
              {analytics.kpis.upcomingPayout
                ? `${isFrench ? 'Prochain payout prévu le' : 'Next payout due on'} ${new Date(
                    analytics.kpis.upcomingPayout.expectedOn,
                  ).toLocaleDateString(locale)}`
                : '—'}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="print:break-inside-avoid">
        <CardHeader>
          <CardTitle>{isFrench ? 'Évolution des campagnes' : 'Campaign evolution'}</CardTitle>
          <CardDescription>
            {isFrench
              ? 'Comparaison des clicks, conversions et revenus générés sur la période.'
              : 'Clicks, conversions and revenue over the selected timeframe.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="h-[360px]">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={analytics.series}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="date" stroke="#6b7280" fontSize={12} />
              <YAxis yAxisId="left" stroke="#6b7280" fontSize={12} />
              <YAxis
                yAxisId="right"
                orientation="right"
                stroke="#6b7280"
                fontSize={12}
                tickFormatter={(value) => conversionFormatter.format(value)}
              />
              <Tooltip
                formatter={(value: number, name) => {
                  if (name === 'conversionRate') {
                    return [`${conversionFormatter.format(value)}%`, isFrench ? 'Taux conv.' : 'Conversion rate'];
                  }
                  if (name === 'revenue') {
                    return [numberFormatter.format(value), isFrench ? 'Revenu' : 'Revenue'];
                  }
                  return [value, name];
                }}
              />
              <Legend />
              <Bar yAxisId="left" dataKey="clicks" name={isFrench ? 'Clicks' : 'Clicks'} fill="#3b82f6" />
              <Bar
                yAxisId="left"
                dataKey="conversions"
                name={isFrench ? 'Conversions' : 'Conversions'}
                fill="#22c55e"
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="conversionRate"
                stroke="#f97316"
                name={isFrench ? 'Taux conv. %' : 'Conv. rate %'}
                strokeWidth={2}
                dot={false}
              />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="revenue"
                stroke="#6366f1"
                strokeWidth={2}
                name={isFrench ? 'Revenu' : 'Revenue'}
                dot={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Tabs defaultValue="sources" className="space-y-4">
        <TabsList>
          <TabsTrigger value="sources">{isFrench ? 'Sources' : 'Sources'}</TabsTrigger>
          <TabsTrigger value="referrals">
            {isFrench ? 'Conversions' : 'Conversions'}
          </TabsTrigger>
          <TabsTrigger value="payouts">{isFrench ? 'Payouts' : 'Payouts'}</TabsTrigger>
        </TabsList>
        <TabsContent value="sources" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{isFrench ? 'Performance par source' : 'Performance by source'}</CardTitle>
              <CardDescription>
                {isFrench
                  ? 'Identifiez les canaux les plus rentables et ceux à optimiser.'
                  : 'Identify your strongest and weakest acquisition channels.'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={analytics.sources}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="source" />
                  <YAxis />
                  <Tooltip
                    formatter={(value: number, name) => {
                      if (name === 'revenue') {
                        return [numberFormatter.format(value), isFrench ? 'Revenu' : 'Revenue'];
                      }
                      return [value, name];
                    }}
                  />
                  <Legend />
                  <Bar dataKey="clicks" name={isFrench ? 'Clicks' : 'Clicks'} fill="#38bdf8" />
                  <Bar
                    dataKey="conversions"
                    name={isFrench ? 'Conversions' : 'Conversions'}
                    fill="#22c55e"
                  />
                  <Bar
                    dataKey="revenue"
                    name={isFrench ? 'Revenu' : 'Revenue'}
                    fill="#a855f7"
                  />
                </BarChart>
              </ResponsiveContainer>

              <div className="grid gap-2 md:grid-cols-3">
                {analytics.sources.map((source) => (
                  <Card key={source.source} className="border-dashed">
                    <CardContent className="p-4">
                      <div className="text-sm font-medium">{source.source}</div>
                      <div className="mt-2 text-xs text-muted-foreground">
                        {isFrench ? 'Revenu' : 'Revenue'}
                      </div>
                      <div className="text-lg font-semibold">
                        {numberFormatter.format(source.revenue)}
                      </div>
                      <div className="mt-1 text-xs text-muted-foreground">
                        {source.conversions} {isFrench ? 'conv.' : 'conversions'} · {source.clicks}{' '}
                        clicks
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="referrals">
          <Card>
            <CardHeader>
              <CardTitle>{isFrench ? 'Dernières conversions' : 'Recent conversions'}</CardTitle>
              <CardDescription>
                {isFrench
                  ? 'Suivez le statut de chaque referral et les commissions associées.'
                  : 'Monitor referral status and related commissions.'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[320px]">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-background">
                    <tr className="border-b text-xs uppercase text-muted-foreground">
                      <th className="py-2 text-left">{isFrench ? 'Client' : 'Customer'}</th>
                      <th className="py-2 text-left">{isFrench ? 'Événement' : 'Event'}</th>
                      <th className="py-2 text-left">{isFrench ? 'Statut' : 'Status'}</th>
                      <th className="py-2 text-right">{isFrench ? 'Montant' : 'Amount'}</th>
                      <th className="py-2 text-right">{isFrench ? 'Commission' : 'Commission'}</th>
                      <th className="py-2 text-left">{isFrench ? 'Lien' : 'Link'}</th>
                      <th className="py-2 text-left">{isFrench ? 'Date' : 'Date'}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analytics.referrals.map((referral) => (
                      <tr key={referral.id} className="border-b last:border-none">
                        <td className="py-2 font-semibold">{referral.customer}</td>
                        <td className="py-2 text-xs text-muted-foreground">
                          {referral.eventType}
                        </td>
                        <td className="py-2 text-xs">
                          <Badge
                            variant={
                              referral.status === 'APPROVED'
                                ? 'secondary'
                                : referral.status === 'PENDING'
                                  ? 'outline'
                                  : 'destructive'
                            }
                          >
                            {referral.status}
                          </Badge>
                        </td>
                        <td className="py-2 text-right">
                          {numberFormatter.format(referral.amount)}
                        </td>
                        <td className="py-2 text-right">
                          {numberFormatter.format(referral.commissionAmount)}
                        </td>
                        <td className="py-2 text-xs text-muted-foreground">
                          {referral.linkLabel ?? '—'}
                        </td>
                        <td className="py-2 text-xs text-muted-foreground">
                        {new Date(referral.createdAt).toLocaleDateString(locale)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="payouts">
          <Card>
            <CardHeader>
              <CardTitle>{isFrench ? 'Payouts' : 'Payouts'}</CardTitle>
              <CardDescription>
                {isFrench
                  ? 'Historique des paiements mensuels et statut de traitement.'
                  : 'Monthly payouts and their current processing state.'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <table className="w-full text-sm">
                <thead className="border-b text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="py-2 text-left">{isFrench ? 'Période' : 'Period'}</th>
                    <th className="py-2 text-right">{isFrench ? 'Montant' : 'Amount'}</th>
                    <th className="py-2 text-left">{isFrench ? 'Statut' : 'Status'}</th>
                    <th className="py-2 text-left">{isFrench ? 'Méthode' : 'Method'}</th>
                    <th className="py-2 text-left">{isFrench ? 'Référence' : 'Reference'}</th>
                  </tr>
                </thead>
                <tbody>
                  {analytics.payouts.map((payout) => (
                    <tr key={payout.id} className="border-b last:border-none">
                      <td className="py-2">
                        {new Date(payout.periodFrom).toLocaleDateString(locale)} →{' '}
                        {new Date(payout.periodTo).toLocaleDateString(locale)}
                      </td>
                      <td className="py-2 text-right">
                        {numberFormatter.format(payout.amount)}
                      </td>
                      <td className="py-2 text-xs">
                        <Badge
                          variant={
                            payout.status === 'PAID'
                              ? 'secondary'
                              : payout.status === 'DUE'
                                ? 'outline'
                                : payout.status === 'PROCESSING'
                                  ? 'secondary'
                                  : 'destructive'
                          }
                        >
                          {payout.status}
                        </Badge>
                      </td>
                      <td className="py-2 text-xs text-muted-foreground">{payout.method}</td>
                      <td className="py-2 text-xs text-muted-foreground">
                        {payout.reference ?? '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Card>
        <CardHeader>
          <CardTitle>{isFrench ? 'Identifier des actions rapides' : 'Quick wins'}</CardTitle>
          <CardDescription>
            {isFrench
              ? 'Améliorez votre performance affiliée en activant les prochains leviers.'
              : 'Unlock the next actions to grow your affiliate revenue.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          <div className="rounded-lg border border-dashed p-4">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold">{isFrench ? 'Optimiser LinkedIn Ads' : 'Optimise LinkedIn ads'}</h4>
              <ArrowUpRight className="h-4 w-4 text-primary" />
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {isFrench
                ? 'Testez un nouveau visuel et une offre 3 mois pour remonter le taux de conversion.'
                : 'Refresh the creative and test a 3-month bundle to recover conversion rate.'}
            </p>
          </div>
          <div className="rounded-lg border border-dashed p-4">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold">
                {isFrench ? 'Campagne email segmentée' : 'Segmented email campaign'}
              </h4>
              <ArrowUpRight className="h-4 w-4 text-primary" />
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {isFrench
                ? 'Relancez vos contacts PME inactifs avec un cas client “Budget Pro x startup”.'
                : 'Re-activate dormant SME leads with a Budget Pro success story.'}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
