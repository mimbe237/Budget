'use server';
import { Suspense } from 'react';
import { AppLayout } from '@/components/dashboard/dashboard-client';
import { DateRangePicker } from './_components/date-range-picker';
import { FinancialReport } from './_components/financial-report';
import { Skeleton } from '@/components/ui/skeleton';

// Note: The 'searchParams' prop is automatically provided by Next.js in server components.
export default async function ReportsPage({
  searchParams,
}: {
  searchParams?: { [key: string]: string | string[] | undefined };
}) {

  // Ensure searchParams are defined and get string values
  const from = typeof searchParams?.from === 'string' ? searchParams.from : undefined;
  const to = typeof searchParams?.to === 'string' ? searchParams.to : undefined;

  return (
    <AppLayout>
      <div className="flex flex-col gap-6">
        {/* Client component for date selection */}
        <DateRangePicker />
        
        {/* Server Component for displaying the report, with a loading fallback */}
        <Suspense fallback={<ReportSkeleton />}>
          {/* @ts-expect-error Server Component */}
          <FinancialReport from={from} to={to} />
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