import { AppLayout } from '@/components/dashboard/dashboard-client';
import { getAffiliatePayouts } from '../_actions/get-affiliate-payouts';
import { AffiliatePayoutsClient } from '../_components/affiliate-payouts-client';

export default async function AffiliatePayoutsPage() {
  const summary = await getAffiliatePayouts();
  return (
    <AppLayout>
      <AffiliatePayoutsClient summary={summary} />
    </AppLayout>
  );
}
