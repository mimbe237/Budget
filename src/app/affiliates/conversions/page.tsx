import { AppLayout } from '@/components/dashboard/dashboard-client';
import { getAffiliateConversions } from '../_actions/get-affiliate-conversions';
import { AffiliateConversionsClient } from '../_components/affiliate-conversions-client';

export default async function AffiliateConversionsPage() {
  const summary = await getAffiliateConversions();
  return (
    <AppLayout>
      <AffiliateConversionsClient summary={summary} />
    </AppLayout>
  );
}
