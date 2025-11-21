import { useFirestoreQuery } from '@/hooks/use-firestore-query';
import { collection, getDocs, limit, query, where } from 'firebase/firestore';
import { useUser, useFirestore } from '@/firebase/provider';

export interface AffiliateDoc {
  id: string;
  userId: string;
  affiliateCode: string;
  status: 'PENDING' | 'APPROVED' | 'BLOCKED' | 'SUSPENDED';
  tier: 'BASIC' | 'PRO' | 'VIP';
  totalClicks?: number;
  totalConversions?: number;
  totalEarnings?: number;
  pendingEarnings?: number;
  approvedEarnings?: number;
  paidEarnings?: number;
}

export function useAffiliate() {
  const { user } = useUser();
  const firestore = useFirestore();

  return useFirestoreQuery<AffiliateDoc | null>(
    firestore,
    `affiliates:${user?.uid ?? 'anon'}`,
    async () => {
      if (!firestore || !user) return null;
      const q = query(
        collection(firestore, 'affiliates'),
        where('userId', '==', user.uid),
        limit(1)
      );
      const snap = await getDocs(q);
      if (snap.empty) return null;
      const doc = snap.docs[0];
      return { id: doc.id, ...(doc.data() as any) } as AffiliateDoc;
    }
  );
}
