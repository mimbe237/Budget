import { AppLayout } from '@/components/dashboard/dashboard-client';
import { getAffiliateCommissions } from '../_actions/get-affiliate-commissions';
import { AffiliateCommissionsClient } from '../_components/affiliate-commissions-client';

export default async function AffiliateCommissionsPage() {
  const summary = await getAffiliateCommissions();
  return (
    <AppLayout>
      <AffiliateCommissionsClient summary={summary} />
    </AppLayout>
  );
}
