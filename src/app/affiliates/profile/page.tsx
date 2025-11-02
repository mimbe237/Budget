import { AppLayout } from '@/components/dashboard/dashboard-client';
import { getAffiliateProfile } from '../_actions/get-affiliate-profile';
import { AffiliateProfileClient } from '../_components/affiliate-profile-client';

export default async function AffiliateProfilePage() {
  const profile = await getAffiliateProfile();
  return (
    <AppLayout>
      <AffiliateProfileClient profile={profile} />
    </AppLayout>
  );
}
