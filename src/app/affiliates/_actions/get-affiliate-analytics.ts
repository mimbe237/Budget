'use server';

import { addDays, subDays, eachDayOfInterval, format } from 'date-fns';
import type { AffiliateAnalytics } from '@/types/affiliate';

export type AffiliateAnalyticsRange = '7d' | '30d' | '90d' | '180d' | '365d' | 'all';

type GetAffiliateAnalyticsInput = {
  affiliateId?: string | null;
  range?: AffiliateAnalyticsRange;
};

export async function getAffiliateAnalytics(
  { affiliateId, range = '30d' }: GetAffiliateAnalyticsInput = {},
): Promise<AffiliateAnalytics> {
  // TODO: hook up to real Firestore/Cloud Function backend.
  // For now, return deterministic mock data to unblock the UI work.
  return buildMockAnalytics(range);
}

function buildMockAnalytics(range: AffiliateAnalyticsRange): AffiliateAnalytics {
  const today = new Date();
  const rangeToDays: Record<AffiliateAnalyticsRange, number> = {
    '7d': 7,
    '30d': 30,
    '90d': 90,
    '180d': 180,
    '365d': 365,
    all: 180,
  };

  const days = rangeToDays[range] ?? 30;
  const from = subDays(today, days - 1);
  const to = today;

  const baseClicks = 320;
  const baseConversions = 48;
  const baseRevenue = 290_000;

  const dates = eachDayOfInterval({ start: from, end: to });

  const series = dates.map((date, index) => {
    const clicks = Math.round(6 + Math.abs(Math.sin(index / 4)) * 14 + index % 5);
    const conversions = Math.round(clicks * (0.12 + (index % 7) * 0.005));
    const revenue = conversions * 8500;
    const conversionRate = clicks > 0 ? (conversions / clicks) * 100 : 0;

    return {
      date: format(date, 'yyyy-MM-dd'),
      clicks,
      conversions,
      revenue,
      conversionRate,
    };
  });

  const totalClicks = series.reduce((acc, item) => acc + item.clicks, 0);
  const totalConversions = series.reduce((acc, item) => acc + item.conversions, 0);
  const totalRevenue = series.reduce((acc, item) => acc + item.revenue, 0);

  const sources = [
    { source: 'LinkedIn Ads', clicks: Math.round(baseClicks * 0.32), conversions: Math.round(baseConversions * 0.3), revenue: Math.round(baseRevenue * 0.34) },
    { source: 'Campagne email', clicks: Math.round(baseClicks * 0.21), conversions: Math.round(baseConversions * 0.27), revenue: Math.round(baseRevenue * 0.29) },
    { source: 'Blog / contenu', clicks: Math.round(baseClicks * 0.18), conversions: Math.round(baseConversions * 0.15), revenue: Math.round(baseRevenue * 0.13) },
    { source: 'Influenceurs', clicks: Math.round(baseClicks * 0.15), conversions: Math.round(baseConversions * 0.18), revenue: Math.round(baseRevenue * 0.19) },
    { source: 'Autres', clicks: Math.max(0, baseClicks - 230), conversions: Math.max(0, baseConversions - 32), revenue: Math.max(0, baseRevenue - 210_000) },
  ];

  const referrals: AffiliateAnalytics['referrals'] = [
    {
      id: 'rf_1',
      customer: 'Brice T.',
      eventType: 'SUBSCRIPTION_START',
      status: 'APPROVED',
      amount: 39000,
      currency: 'XAF',
      commissionAmount: 7800,
      createdAt: format(subDays(today, 2), "yyyy-MM-dd'T'HH:mm:ssxxx"),
      linkLabel: 'Campagne Q4 - PME',
    },
    {
      id: 'rf_2',
      customer: 'Melanie P.',
      eventType: 'PURCHASE',
      status: 'PENDING',
      amount: 52000,
      currency: 'XAF',
      commissionAmount: 10400,
      createdAt: format(subDays(today, 4), "yyyy-MM-dd'T'HH:mm:ssxxx"),
      linkLabel: 'Webinar Décembre',
    },
    {
      id: 'rf_3',
      customer: 'Startup Novi',
      eventType: 'SUBSCRIPTION_START',
      status: 'APPROVED',
      amount: 125000,
      currency: 'XAF',
      commissionAmount: 31250,
      createdAt: format(subDays(today, 6), "yyyy-MM-dd'T'HH:mm:ssxxx"),
      linkLabel: 'Bundle SaaS PME',
    },
    {
      id: 'rf_4',
      customer: 'Agence Koba',
      eventType: 'SIGNUP',
      status: 'REJECTED',
      amount: 0,
      currency: 'XAF',
      commissionAmount: 0,
      createdAt: format(subDays(today, 8), "yyyy-MM-dd'T'HH:mm:ssxxx"),
      linkLabel: 'Code général',
    },
  ];

  const payouts: AffiliateAnalytics['payouts'] = [
    {
      id: 'po_2024_11',
      periodFrom: format(subDays(today, 60), 'yyyy-MM-dd'),
      periodTo: format(subDays(today, 30), 'yyyy-MM-dd'),
      amount: 185000,
      currency: 'XAF',
      status: 'PAID',
      method: 'SEPA',
      reference: 'PAY-2024-11-AB12',
      paidAt: format(subDays(today, 10), "yyyy-MM-dd'T'HH:mm:ssxxx"),
    },
    {
      id: 'po_2024_12',
      periodFrom: format(subDays(today, 30), 'yyyy-MM-dd'),
      periodTo: format(today, 'yyyy-MM-dd'),
      amount: 226000,
      currency: 'XAF',
      status: 'DUE',
      method: 'MobileMoney',
    },
  ];

  const alerts: AffiliateAnalytics['alerts'] = [
    {
      type: 'info',
      message: "Votre prochain payout passera automatiquement en traitement dès que le seuil de 250 000 XAF sera atteint.",
    },
    {
      type: 'warning',
      message: 'Le taux de conversion LinkedIn Ads est en baisse de 12% sur la période. Pensez à rafraîchir vos visuels.',
      action: { label: 'Voir les liens', href: '/affiliates/links' },
    },
  ];

  return {
    affiliate: {
      code: 'BGP-ALPHA-92',
      tier: 'PRO',
      status: 'APPROVED',
      joinedAt: subDays(today, 240).toISOString(),
      cookieDays: 90,
      attributionModel: 'LAST_CLICK',
      currency: 'XAF',
      totals: {
        clicks: 8900,
        referrals: 123,
        approvedCommissions: 1_950_000,
        pendingCommissions: 245_000,
        paidOut: 1_520_000,
      },
    },
    period: {
      from: from.toISOString(),
      to: to.toISOString(),
      label: buildLabel(range, from, to),
    },
    kpis: {
      totalClicks,
      totalConversions,
      conversionRate: totalClicks > 0 ? (totalConversions / totalClicks) * 100 : 0,
      approvedAmount: Math.round(totalRevenue * 0.2),
      pendingAmount: Math.round(totalRevenue * 0.06),
      recurringSubscriptions: 18,
      upcomingPayout: {
        amount: payouts[1].amount,
        currency: payouts[1].currency,
        expectedOn: addDays(today, 5).toISOString(),
        status: payouts[1].status,
      },
    },
    series,
    sources,
    referrals,
    payouts,
    alerts,
  };
}

function buildLabel(range: AffiliateAnalyticsRange, from: Date, to: Date): string {
  if (range === 'all') {
    return 'Depuis inscription';
  }
  return `${format(from, 'dd MMM yyyy')} → ${format(to, 'dd MMM yyyy')}`;
}
