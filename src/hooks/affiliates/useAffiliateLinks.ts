import { useFirestoreQuery } from '@/hooks/use-firestore-query';
import { collection, getDocs, orderBy, query, where } from 'firebase/firestore';
import { useFirestore } from '@/firebase/provider';

export interface AffiliateLinkDoc {
  id: string;
  affiliateId: string;
  affiliateCode: string;
  linkCode: string;
  name?: string;
  utmSource: string;
  utmMedium: string;
  utmCampaign?: string;
  landingPage: string;
  active: boolean;
  totalClicks: number;
  totalConversions: number;
}

export function useAffiliateLinks(affiliateId?: string) {
  const firestore = useFirestore();

  return useFirestoreQuery<AffiliateLinkDoc[]>(
    firestore,
    `affiliateLinks:${affiliateId ?? 'none'}`,
    async () => {
      if (!firestore || !affiliateId) return [];
      const q = query(
        collection(firestore, 'affiliateLinks'),
        where('affiliateId', '==', affiliateId),
        orderBy('createdAt', 'desc')
      );
      const snap = await getDocs(q);
      return snap.docs.map(d => ({ id: d.id, ...(d.data() as any) } as AffiliateLinkDoc));
    }
  );
}
