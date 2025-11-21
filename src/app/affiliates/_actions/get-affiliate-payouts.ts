'use server';

import { subMonths, subDays, format } from 'date-fns';
import type { AffiliatePayoutsSummary, AffiliatePayout } from '@/types/affiliate';

export async function getAffiliatePayouts(): Promise<AffiliatePayoutsSummary> {
  const today = new Date();
  const history: AffiliatePayout[] = [
    {
      id: 'po_2024_12',
      periodFrom: format(subMonths(today, 2), 'yyyy-MM-01'),
      periodTo: format(subMonths(today, 1), 'yyyy-MM-30'),
      amount: 184000,
      currency: 'XAF',
      status: 'PAID',
      method: 'SEPA',
      reference: 'PAY-2024-12-ALPHA',
      paidAt: subDays(today, 22).toISOString(),
    },
    {
      id: 'po_2025_01',
      periodFrom: format(subMonths(today, 1), 'yyyy-MM-01'),
      periodTo: format(today, 'yyyy-MM-01'),
      amount: 226000,
      currency: 'XAF',
      status: 'PROCESSING',
      method: 'MobileMoney',
      reference: 'PAY-2025-01-ALPHA',
      paidAt: null,
    },
    {
      id: 'po_2025_02',
      periodFrom: format(today, 'yyyy-MM-01'),
      periodTo: format(today, 'yyyy-MM-28'),
      amount: 202500,
      currency: 'XAF',
      status: 'DUE',
      method: 'PayPal',
      paidAt: null,
    },
    {
      id: 'po_2024_11',
      periodFrom: format(subMonths(today, 3), 'yyyy-MM-01'),
      periodTo: format(subMonths(today, 2), 'yyyy-MM-30'),
      amount: 172000,
      currency: 'XAF',
      status: 'FAILED',
      method: 'MobileMoney',
      reference: 'PAY-2024-11-ALPHA',
      paidAt: null,
    },
  ];

  const totals = history.reduce(
    (acc, payout) => {
      switch (payout.status) {
        case 'DUE':
          acc.due += 1;
          acc.amountDue += payout.amount;
          break;
        case 'PROCESSING':
          acc.processing += 1;
          acc.amountProcessing += payout.amount;
          break;
        case 'PAID':
          acc.paid += 1;
          acc.amountPaid += payout.amount;
          break;
        case 'FAILED':
          acc.failed += 1;
          break;
        default:
          break;
      }
      return acc;
    },
    {
      due: 0,
      processing: 0,
      paid: 0,
      failed: 0,
      amountDue: 0,
      amountProcessing: 0,
      amountPaid: 0,
    },
  );

  const nextPayout = history.find((item) => item.status === 'PROCESSING' || item.status === 'DUE') ?? null;

  return {
    affiliateCode: 'BGP-ALPHA-92',
    currency: 'XAF',
    totals,
    nextPayout,
    history,
  };
}
