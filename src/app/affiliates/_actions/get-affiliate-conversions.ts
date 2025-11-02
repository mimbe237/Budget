'use server';

import { subDays, subHours, format } from 'date-fns';
import type { AffiliateReferral } from '@/types/affiliate';

export type AffiliateConversionsRange = '30d' | '90d' | '180d' | '365d' | 'all';

export type AffiliateConversionSummary = {
  affiliateCode: string;
  currency: string;
  totals: {
    pending: number;
    approved: number;
    rejected: number;
    revenue: number;
    averageOrder: number;
  };
  conversions: AffiliateReferral[];
  lastUpdated: string;
};

export async function getAffiliateConversions({ range = '90d' }: { range?: AffiliateConversionsRange } = {}): Promise<AffiliateConversionSummary> {
  const today = new Date();

  const mockConversions: AffiliateReferral[] = [
    {
      id: 'rf_9011',
      customer: 'Société Digimax',
      eventType: 'SUBSCRIPTION_START',
      status: 'APPROVED',
      amount: 145000,
      currency: 'XAF',
      commissionAmount: 36250,
      createdAt: subDays(today, 3).toISOString(),
      linkLabel: 'LinkedIn Q4',
    },
    {
      id: 'rf_9012',
      customer: 'Agence Nola',
      eventType: 'PURCHASE',
      status: 'PENDING',
      amount: 82000,
      currency: 'XAF',
      commissionAmount: 12300,
      createdAt: subDays(today, 5).toISOString(),
      linkLabel: 'Email nurturing TPE',
    },
    {
      id: 'rf_9013',
      customer: 'Startup Moko',
      eventType: 'SIGNUP',
      status: 'APPROVED',
      amount: 0,
      currency: 'XAF',
      commissionAmount: 4500,
      createdAt: subDays(today, 7).toISOString(),
      linkLabel: 'Webinar Décembre',
    },
    {
      id: 'rf_9014',
      customer: 'Fintech Alpha',
      eventType: 'SUBSCRIPTION_START',
      status: 'REJECTED',
      amount: 215000,
      currency: 'XAF',
      commissionAmount: 0,
      createdAt: subDays(today, 9).toISOString(),
      linkLabel: 'Influenceurs SaaS',
    },
    {
      id: 'rf_9015',
      customer: 'Compta+ Services',
      eventType: 'PURCHASE',
      status: 'APPROVED',
      amount: 64000,
      currency: 'XAF',
      commissionAmount: 9600,
      createdAt: subDays(today, 12).toISOString(),
      linkLabel: 'Bundle contenu IA',
    },
    {
      id: 'rf_9016',
      customer: 'PME Horizon',
      eventType: 'SIGNUP',
      status: 'PENDING',
      amount: 0,
      currency: 'XAF',
      commissionAmount: 4500,
      createdAt: subDays(today, 14).toISOString(),
      linkLabel: 'Campagne SMS Xpress',
    },
    {
      id: 'rf_9017',
      customer: 'Agence Nova',
      eventType: 'SUBSCRIPTION_START',
      status: 'APPROVED',
      amount: 195000,
      currency: 'XAF',
      commissionAmount: 39000,
      createdAt: subDays(today, 18).toISOString(),
      linkLabel: 'LinkedIn Q4',
    },
    {
      id: 'rf_9018',
      customer: 'Cabinet Fisko',
      eventType: 'PURCHASE',
      status: 'APPROVED',
      amount: 91000,
      currency: 'XAF',
      commissionAmount: 13650,
      createdAt: subHours(subDays(today, 20), 6).toISOString(),
      linkLabel: 'Email nurturing TPE',
    },
  ];

  const totals = mockConversions.reduce(
    (acc, conversion) => {
      if (conversion.status === 'PENDING') acc.pending += 1;
      if (conversion.status === 'APPROVED') acc.approved += 1;
      if (conversion.status === 'REJECTED') acc.rejected += 1;
      if (conversion.status === 'APPROVED') {
        acc.revenue += conversion.amount;
      }
      return acc;
    },
    { pending: 0, approved: 0, rejected: 0, revenue: 0 },
  );

  const approvedConversions = mockConversions.filter((conversion) => conversion.status === 'APPROVED');
  const averageOrder = approvedConversions.length
    ? approvedConversions.reduce((sum, conversion) => sum + conversion.amount, 0) / approvedConversions.length
    : 0;

  return {
    affiliateCode: 'BGP-ALPHA-92',
    currency: 'XAF',
    totals: {
      pending: totals.pending,
      approved: totals.approved,
      rejected: totals.rejected,
      revenue: totals.revenue,
      averageOrder,
    },
    conversions: mockConversions,
    lastUpdated: format(subHours(today, 2), "yyyy-MM-dd'T'HH:mm:ssxxx"),
  };
}
