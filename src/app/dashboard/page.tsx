'use server';

import { Suspense } from 'react';
import { AIInsightsWrapper } from '@/components/dashboard/ai-insights-wrapper';
import { DashboardClientContent } from '@/components/dashboard/dashboard-client-content';
import { AppLayout } from '@/components/dashboard/dashboard-client';
import { DashboardSkeleton } from '@/components/loading-skeleton';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { getFinancialReportData } from '@/app/reports/_actions/get-report-data';
import type { FinancialReportData, Transaction } from '@/lib/types';

export type SerializableFinancialReportData = Omit<FinancialReportData, 'period' | 'recentTransactions'> & {
  period: {
    from: string;
    to: string;
    isCustom: boolean;
  };
  recentTransactions: (Transaction & { date: string })[];
};

function serializeReportData(report: FinancialReportData): SerializableFinancialReportData {
  return {
    ...report,
    period: {
      from: report.period.from.toISOString(),
      to: report.period.to.toISOString(),
      isCustom: report.period.isCustom,
    },
    recentTransactions: report.recentTransactions.map(transaction => ({
      ...transaction,
      date: typeof transaction.date === 'string' ? transaction.date : new Date(transaction.date).toISOString(),
    })),
  };
}

export default async function DashboardPage() {
  const reportData = serializeReportData(
    await getFinancialReportData({
      includeDebt: true,
    })
  );

  return (
    <AppLayout>
      <Suspense fallback={<DashboardSkeleton />}>
        <DashboardClientContent reportData={reportData}>
          <Suspense
            fallback={
              <Card>
                <CardHeader>
                  <Skeleton className="h-6 w-32" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-20 w-full" />
                </CardContent>
              </Card>
            }
          >
            <AIInsightsWrapper />
          </Suspense>
        </DashboardClientContent>
      </Suspense>
    </AppLayout>
  );
}
