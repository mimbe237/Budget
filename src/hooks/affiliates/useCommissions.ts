import { useFirestoreQuery } from '@/hooks/use-firestore-query';
import { collection, getDocs, orderBy, query, where, Timestamp } from 'firebase/firestore';
import { useFirestore } from '@/firebase/provider';

export interface CommissionDoc {
  id: string;
  affiliateId: string;
  referralId: string;
  status: 'PENDING' | 'APPROVED' | 'PAID' | 'VOID';
  schema: 'FIXED' | 'PERCENT' | 'RECURRING' | 'TIERED' | 'BONUS';
  amount: number;
  currency: string;
  createdAt: Timestamp;
}

export function useCommissions(affiliateId?: string, status?: CommissionDoc['status']) {
  const firestore = useFirestore();

  return useFirestoreQuery<CommissionDoc[]>(
    firestore,
    `commissions:${affiliateId ?? 'none'}:${status ?? 'all'}`,
    async () => {
      if (!firestore || !affiliateId) return [];
      const constraints: any[] = [where('affiliateId', '==', affiliateId), orderBy('createdAt', 'desc')];
      if (status) constraints.push(where('status', '==', status));
      const q = query(collection(firestore, 'commissions'), ...constraints);
      const snap = await getDocs(q);
      return snap.docs.map(d => ({ id: d.id, ...(d.data() as any) } as CommissionDoc));
    }
  );
}
