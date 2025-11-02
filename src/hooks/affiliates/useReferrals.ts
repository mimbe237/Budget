import { useFirestoreQuery } from '@/hooks/use-firestore-query';
import { collection, getDocs, orderBy, query, where, Timestamp } from 'firebase/firestore';
import { useFirestore } from '@/firebase/provider';

export interface ReferralDoc {
  id: string;
  affiliateId: string;
  userId: string;
  status: 'PENDING' | 'APPROVED' | 'VOID' | 'REJECTED';
  eventType: 'SIGNUP' | 'SUBSCRIPTION' | 'PURCHASE';
  amount: number;
  currency: string;
  createdAt: Timestamp;
}

export function useReferrals(affiliateId?: string, status?: ReferralDoc['status']) {
  const firestore = useFirestore();

  return useFirestoreQuery<ReferralDoc[]>(
    firestore,
    `referrals:${affiliateId ?? 'none'}:${status ?? 'all'}`,
    async () => {
      if (!firestore || !affiliateId) return [];
      const constraints: any[] = [where('affiliateId', '==', affiliateId), orderBy('createdAt', 'desc')];
      if (status && status !== 'PENDING') constraints.push(where('status', '==', status));
      const q = query(collection(firestore, 'referrals'), ...constraints);
      const snap = await getDocs(q);
      return snap.docs.map(d => ({ id: d.id, ...(d.data() as any) } as ReferralDoc));
    }
  );
}
