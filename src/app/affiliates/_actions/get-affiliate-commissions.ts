'use server';

import { subDays, subMonths, format } from 'date-fns';
import type { AffiliateCommissionSummary, AffiliateCommission } from '@/types/affiliate';

export type AffiliateCommissionsRange = '90d' | '180d' | 'year';

export async function getAffiliateCommissions({
  range = '90d',
}: { range?: AffiliateCommissionsRange } = {}): Promise<AffiliateCommissionSummary> {
  const today = new Date();

  const commissions: AffiliateCommission[] = [
    {
      id: 'cm_12001',
      referralId: 'rf_9011',
      status: 'PAID',
      schema: 'RECURRING',
      amount: 39000,
      currency: 'XAF',
      monthKey: format(today, 'yyyy-MM'),
      recurringMonth: 3,
      totalRecurringMonths: 6,
      payoutId: 'po_2024_11',
      createdAt: subMonths(today, 2).toISOString(),
      approvedAt: subMonths(today, 2).toISOString(),
      paidAt: subMonths(today, 1).toISOString(),
    },
    {
      id: 'cm_12002',
      referralId: 'rf_9012',
      status: 'APPROVED',
      schema: 'FIXED',
      amount: 12500,
      currency: 'XAF',
      monthKey: format(today, 'yyyy-MM'),
      createdAt: subDays(today, 14).toISOString(),
      approvedAt: subDays(today, 6).toISOString(),
    },
    {
      id: 'cm_12003',
      referralId: 'rf_9013',
      status: 'PENDING',
      schema: 'BONUS',
      amount: 4500,
      currency: 'XAF',
      createdAt: subDays(today, 8).toISOString(),
    },
    {
      id: 'cm_12004',
      referralId: 'rf_9014',
      status: 'VOID',
      schema: 'PERCENT',
      amount: 18000,
      currency: 'XAF',
      reason: 'Refund',
      createdAt: subDays(today, 18).toISOString(),
      approvedAt: subDays(today, 16).toISOString(),
    },
    {
      id: 'cm_12005',
      referralId: 'rf_9017',
      status: 'APPROVED',
      schema: 'RECURRING',
      amount: 32500,
      currency: 'XAF',
      monthKey: format(today, 'yyyy-MM'),
      recurringMonth: 1,
      totalRecurringMonths: 12,
      createdAt: subDays(today, 3).toISOString(),
      approvedAt: subDays(today, 2).toISOString(),
    },
  ];

  const totals = commissions.reduce(
    (acc, commission) => {
      acc.amountPending += commission.status === 'PENDING' ? commission.amount : 0;
      acc.amountApproved += commission.status === 'APPROVED' ? commission.amount : 0;
      acc.amountPaid += commission.status === 'PAID' ? commission.amount : 0;
      acc.pending += commission.status === 'PENDING' ? 1 : 0;
      acc.approved += commission.status === 'APPROVED' ? 1 : 0;
      acc.paid += commission.status === 'PAID' ? 1 : 0;
      acc.void += commission.status === 'VOID' ? 1 : 0;
      return acc;
    },
    {
      pending: 0,
      approved: 0,
      paid: 0,
      void: 0,
      amountPending: 0,
      amountApproved: 0,
      amountPaid: 0,
    },
  );

  const recurrent = commissions
    .filter((commission) => commission.schema === 'RECURRING' && commission.status !== 'VOID')
    .reduce(
      (acc, commission) => {
        acc.active += 1;
        if (commission.recurringMonth && commission.totalRecurringMonths) {
          acc.monthAverage += commission.amount / commission.totalRecurringMonths;
        }
        return acc;
      },
      { active: 0, monthAverage: 0 },
    );

  return {
    affiliateCode: 'BGP-ALPHA-92',
    currency: 'XAF',
    totals,
    recurrent: {
      active: recurrent.active,
      monthAverage: recurrent.active ? recurrent.monthAverage / recurrent.active : 0,
    },
    commissions,
  };
}
