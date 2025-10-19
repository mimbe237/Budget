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
import { DashboardClientContent } from '@/components/dashboard/dashboard-client-content';
import { AppLayout } from '@/components/dashboard/dashboard-client';


export default async function DashboardPage() {
  return (
    <AppLayout>
      <DashboardClientContent>
        <Suspense fallback={<Card><CardHeader><Skeleton className="h-6 w-32" /></CardHeader><CardContent><Skeleton className="h-20 w-full" /></CardContent></Card>}>
          {/* @ts-expect-error Server Component */}
          <AIInsightsWrapper />
        </Suspense>
      </DashboardClientContent>
    </AppLayout>
  );
}
