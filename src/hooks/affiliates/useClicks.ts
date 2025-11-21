import { useFirestoreQuery } from '@/hooks/use-firestore-query';
import { collection, getDocs, orderBy, query, where, Timestamp } from 'firebase/firestore';
import { useFirestore } from '@/firebase/provider';

export interface ClickDoc {
  id: string;
  affiliateId: string;
  linkId?: string;
  createdAt: Timestamp;
}

export function useClicks(affiliateId?: string, since?: Date) {
  const firestore = useFirestore();

  return useFirestoreQuery<ClickDoc[]>(
    firestore,
    `clicks:${affiliateId ?? 'none'}:${since?.toISOString() ?? 'all'}`,
    async () => {
      if (!firestore || !affiliateId) return [];
      const constraints: any[] = [where('affiliateId', '==', affiliateId), orderBy('createdAt', 'desc')];
      if (since) constraints.push(where('createdAt', '>=', Timestamp.fromDate(since)));
      const q = query(collection(firestore, 'clicks'), ...constraints);
      const snap = await getDocs(q);
      return snap.docs.map(d => ({ id: d.id, ...(d.data() as any) } as ClickDoc));
    }
  );
}
