import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import { collection, getDocs, doc, getDoc, Query, Firestore } from 'firebase/firestore';

export function useFirestoreQuery<T = any>(
  firestore: Firestore | null,
  key: string,
  fetcher: () => Promise<T>,
  options?: UseQueryOptions<T>
) {
  return useQuery<T>({
    queryKey: [key],
    queryFn: fetcher,
    enabled: !!firestore,
    staleTime: 60 * 1000, // 1 min par défaut
    ...options,
  });
}

// Exemple d’utilisation pour une collection Firestore
export function useFirestoreCollection<T = any>(
  firestore: Firestore | null,
  collectionPath: string,
  options?: UseQueryOptions<T[]>
) {
  return useFirestoreQuery<T[]>(
    firestore,
    `collection:${collectionPath}`,
    async () => {
      if (!firestore) return [];
      const snap = await getDocs(collection(firestore, collectionPath));
      return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as T));
    },
    options
  );
}

// Exemple d’utilisation pour un document Firestore
export function useFirestoreDoc<T = any>(
  firestore: Firestore | null,
  docPath: string,
  options?: UseQueryOptions<T | null>
) {
  return useFirestoreQuery<T | null>(
    firestore,
    `doc:${docPath}`,
    async () => {
      if (!firestore) return null;
      const snap = await getDoc(doc(firestore, docPath));
      return snap.exists() ? ({ id: snap.id, ...snap.data() } as T) : null;
    },
    options
  );
}
