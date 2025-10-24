import { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  orderBy, 
  limit, 
  startAfter, 
  getDocs,
  QueryConstraint,
  DocumentSnapshot,
  Query
} from 'firebase/firestore';

interface UsePaginationOptions {
  pageSize?: number;
  orderByField?: string;
  orderDirection?: 'asc' | 'desc';
}

export function usePagination<T>(
  firestore: any,
  collectionPath: string,
  options: UsePaginationOptions = {}
) {
  const { pageSize = 10, orderByField = 'createdAt', orderDirection = 'desc' } = options;
  
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [lastDoc, setLastDoc] = useState<DocumentSnapshot | null>(null);
  const [page, setPage] = useState(1);

  const loadMore = async () => {
    if (!firestore || loading || !hasMore) return;
    
    setLoading(true);
    
    try {
      const constraints: QueryConstraint[] = [
        orderBy(orderByField, orderDirection),
        limit(pageSize)
      ];
      
      if (lastDoc) {
        constraints.push(startAfter(lastDoc));
      }
      
      const q = query(collection(firestore, collectionPath), ...constraints);
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        setHasMore(false);
        setLoading(false);
        return;
      }
      
      const newItems = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as T));
      
      setItems(prev => [...prev, ...newItems]);
      setLastDoc(snapshot.docs[snapshot.docs.length - 1]);
      setHasMore(snapshot.docs.length === pageSize);
      setPage(prev => prev + 1);
    } catch (error) {
      console.error('Pagination error:', error);
    }
    
    setLoading(false);
  };

  const reset = () => {
    setItems([]);
    setLastDoc(null);
    setHasMore(true);
    setPage(1);
  };

  useEffect(() => {
    if (firestore && collectionPath) {
      reset();
      loadMore();
    }
  }, [firestore, collectionPath]);

  return {
    items,
    loading,
    hasMore,
    loadMore,
    reset,
    page,
  };
}
