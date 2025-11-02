'use server';
import { Suspense } from 'react';
import { AppLayout } from '@/components/dashboard/dashboard-client';
import { FinancialReport } from './_components/financial-report-simple';
import { DateRangeFilter } from './_components/date-range-filter';
import { Skeleton } from '@/components/ui/skeleton';

// Note: The 'searchParams' prop is automatically provided by Next.js in server components.
export default async function ReportsPage({
  searchParams,
}: {
  searchParams?: { [key: string]: string | string[] | undefined };
}) {

  const params = searchParams || {};
  const from = typeof params.from === 'string' ? params.from : undefined;
  const to = typeof params.to === 'string' ? params.to : undefined;
  const includeDebt = params.includeDebt === undefined ? true : params.includeDebt === '1';

  return (
    <AppLayout>
      <div className="print:p-0 print:m-0 space-y-6">
        {/* Filtre de période (masqué à l'impression) */}
        <DateRangeFilter />
        
        {/* Server Component for displaying the report, with a loading fallback */}
        <Suspense fallback={<ReportSkeleton />}>
          <FinancialReport from={from} to={to} includeDebt={includeDebt} />
        </Suspense>
      </div>
    </AppLayout>
  );
}


function ReportSkeleton() {
    return (
        <div className="space-y-6">
            {/* KPI Cards Skeleton */}
            <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-4">
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
            </div>
            {/* Charts Skeleton */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                <div className="lg:col-span-3">
                    <Skeleton className="h-80 w-full" />
                </div>
                <div className="lg:col-span-2">
                    <Skeleton className="h-80 w-full" />
                </div>
            </div>
            {/* Tables Skeleton */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Skeleton className="h-96 w-full" />
                <Skeleton className="h-96 w-full" />
            </div>
        </div>
    )
}
