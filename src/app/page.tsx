'use server';
import { Suspense } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { AIInsightsWrapper } from '@/components/dashboard/ai-insights-wrapper';
import { DashboardClient } from '@/components/dashboard/dashboard-client';

export default async function DashboardPage() {
  // This is now a Server Component, so we can't use hooks here.
  // The client logic is moved to DashboardClient.
  // We can fetch initial data here if needed and pass it down.
  // For this fix, we will let the client component fetch its own data.
  // The main point is to correctly render the async AIInsightsWrapper.

  return (
    <DashboardClient>
        <Suspense fallback={<Card><CardHeader><Skeleton className="h-6 w-32" /></CardHeader><CardContent><Skeleton className="h-20 w-full" /></CardContent></Card>}>
            {/* @ts-expect-error Server Component */}
            <AIInsightsWrapper />
        </Suspense>
    </DashboardClient>
  );
}
