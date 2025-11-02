import { useFirestoreQuery } from '@/hooks/use-firestore-query';
import { collection, getDocs, orderBy, query, where, Timestamp } from 'firebase/firestore';
import { useFirestore } from '@/firebase/provider';

export interface PayoutDoc {
  id: string;
  affiliateId: string;
  amount: number;
  currency: string;
  status: 'DUE' | 'PAID' | 'PROCESSING' | 'FAILED';
  periodFrom: Timestamp;
  periodTo: Timestamp;
  commissionCount: number;
  txRef?: string;
  invoiceUrl?: string;
  createdAt: Timestamp;
}

export function usePayouts(affiliateId?: string, status?: PayoutDoc['status']) {
  const firestore = useFirestore();

  return useFirestoreQuery<PayoutDoc[]>(
    firestore,
    `payouts:${affiliateId ?? 'none'}:${status ?? 'all'}`,
    async () => {
      if (!firestore || !affiliateId) return [];
      const constraints: any[] = [where('affiliateId', '==', affiliateId), orderBy('createdAt', 'desc')];
      if (status) constraints.push(where('status', '==', status));
      const q = query(collection(firestore, 'payouts'), ...constraints);
      const snap = await getDocs(q);
      return snap.docs.map(d => ({ id: d.id, ...(d.data() as any) } as PayoutDoc));
    }
  );
}
