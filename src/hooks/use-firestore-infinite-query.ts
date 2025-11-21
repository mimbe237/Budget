import { useInfiniteQuery, UseInfiniteQueryOptions } from '@tanstack/react-query';
import { collection, query, orderBy, limit, startAfter, getDocs, Firestore, QueryConstraint } from 'firebase/firestore';

interface InfiniteOptions {
  pageSize?: number;
  orderByField?: string;
  orderDirection?: 'asc' | 'desc';
}

export function useFirestoreInfiniteQuery<T = any>(
  firestore: Firestore | null,
  collectionPath: string,
  options: InfiniteOptions = {},
  queryOptions?: UseInfiniteQueryOptions<T[]>
) {
  const { pageSize = 10, orderByField = 'createdAt', orderDirection = 'desc' } = options;

  return useInfiniteQuery<T[], Error>({
    queryKey: [collectionPath, pageSize, orderByField, orderDirection],
    queryFn: async ({ pageParam }) => {
      if (!firestore) return [];
      const constraints: QueryConstraint[] = [
        orderBy(orderByField, orderDirection),
        limit(pageSize)
      ];
      if (pageParam) {
        constraints.push(startAfter(pageParam as any));
      }
      try {
        const q = query(collection(firestore, collectionPath), ...constraints);
        const snap = await getDocs(q);
        return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as T));
      } catch (err: any) {
        // Fallback de compatibilité: certaines règles/prod peuvent autoriser `/goals` au lieu de `/budgetGoals`.
        // Si permission refusée sur budgetGoals, on tente `/goals` en secours.
        const isPermDenied = err?.code === 'permission-denied';
        const hasBudgetGoals = collectionPath.includes('/budgetGoals');
        if (isPermDenied && hasBudgetGoals) {
          const legacyPath = collectionPath.replace('/budgetGoals', '/goals');
          console.warn('[useFirestoreInfiniteQuery] Permission refusée sur', collectionPath, '— tentative avec', legacyPath);
          const q2 = query(collection(firestore, legacyPath), ...constraints);
          const snap2 = await getDocs(q2);
          return snap2.docs.map(doc => ({ id: doc.id, ...doc.data() } as T));
        }
        throw err;
      }
    },
    getNextPageParam: (lastPage, allPages) => {
      if (!lastPage || lastPage.length < pageSize) return undefined;
      // lastPage[lastPage.length - 1] est le dernier doc
      return (lastPage as any)[lastPage.length - 1]?.id;
    },
    enabled: !!firestore,
    staleTime: 60 * 1000,
    ...(queryOptions as any),
  });
}
