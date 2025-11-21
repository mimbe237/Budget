import { Suspense } from 'react';
import { AppLayout } from '@/components/dashboard/dashboard-client';
import { Skeleton } from '@/components/ui/skeleton';
import { getAffiliateAnalytics, type AffiliateAnalyticsRange } from '../_actions/get-affiliate-analytics';
import { AffiliateStatsClient } from '../_components/affiliate-stats-client';

type PageProps = {
  searchParams?: {
    range?: AffiliateAnalyticsRange;
  };
};

const allowedRanges: AffiliateAnalyticsRange[] = ['7d', '30d', '90d', '180d', '365d', 'all'];

export default async function AffiliateStatsPage({ searchParams }: PageProps) {
  const requested = searchParams?.range;
  const range = allowedRanges.includes(requested as AffiliateAnalyticsRange)
    ? (requested as AffiliateAnalyticsRange)
    : '30d';
  const analytics = await getAffiliateAnalytics({ range });

  return (
    <AppLayout>
      <Suspense fallback={<Skeleton className="h-[600px] w-full" />}>
        <AffiliateStatsClient analytics={analytics} range={range} />
      </Suspense>
    </AppLayout>
  );
}
