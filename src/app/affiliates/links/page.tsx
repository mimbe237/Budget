import { AppLayout } from '@/components/dashboard/dashboard-client';
import { getAffiliateLinks } from '../_actions/get-affiliate-links';
import { AffiliateLinksClient } from '../_components/affiliate-links-client';

export default async function AffiliateLinksPage() {
  const overview = await getAffiliateLinks();
  return (
    <AppLayout>
      <AffiliateLinksClient overview={overview} />
    </AppLayout>
  );
}
