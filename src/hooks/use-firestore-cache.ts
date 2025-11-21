import { useState, useEffect, useCallback } from 'react';

interface CacheConfig {
  ttl?: number; // Time to live en millisecondes
  staleTime?: number; // Temps avant que les données soient considérées obsolètes
}

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  staleAt: number;
}

class FirestoreCache {
  private cache: Map<string, CacheEntry<any>> = new Map();
  private subscribers: Map<string, Set<() => void>> = new Map();

  get<T>(key: string, config: CacheConfig = {}): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const now = Date.now();
    const { ttl = 5 * 60 * 1000 } = config; // 5 minutes par défaut

    // Vérifier si le cache est expiré
    if (now - entry.timestamp > ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  set<T>(key: string, data: T, config: CacheConfig = {}): void {
    const now = Date.now();
    const { staleTime = 30 * 1000 } = config; // 30 secondes par défaut

    this.cache.set(key, {
      data,
      timestamp: now,
      staleAt: now + staleTime,
    });

    // Notifier les abonnés
    this.notifySubscribers(key);
  }

  isStale(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return true;
    return Date.now() > entry.staleAt;
  }

  invalidate(pattern?: string): void {
    if (!pattern) {
      this.cache.clear();
      this.subscribers.forEach((_, key) => this.notifySubscribers(key));
      return;
    }

    // Invalider les clés qui correspondent au pattern
    const regex = new RegExp(pattern);
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
        this.notifySubscribers(key);
      }
    }
  }

  subscribe(key: string, callback: () => void): () => void {
    if (!this.subscribers.has(key)) {
      this.subscribers.set(key, new Set());
    }
    this.subscribers.get(key)!.add(callback);

    // Retourner la fonction de désabonnement
    return () => {
      const subs = this.subscribers.get(key);
      if (subs) {
        subs.delete(callback);
        if (subs.size === 0) {
          this.subscribers.delete(key);
        }
      }
    };
  }

  private notifySubscribers(key: string): void {
    const subs = this.subscribers.get(key);
    if (subs) {
      subs.forEach(callback => callback());
    }
  }

  getStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
      subscribers: this.subscribers.size,
    };
  }
}

// Instance singleton
export const firestoreCache = new FirestoreCache();

// Hook pour utiliser le cache
export function useCachedQuery<T>(
  key: string,
  fetcher: () => Promise<T>,
  config: CacheConfig = {}
) {
  const [data, setData] = useState<T | null>(() => firestoreCache.get<T>(key, config));
  const [loading, setLoading] = useState(!data);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async (force = false) => {
    // Si on a des données en cache et qu'elles ne sont pas obsolètes, on les utilise
    if (!force && data && !firestoreCache.isStale(key)) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await fetcher();
      firestoreCache.set(key, result, config);
      setData(result);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [key, fetcher, config, data]);

  useEffect(() => {
    fetchData();

    // S'abonner aux changements du cache
    const unsubscribe = firestoreCache.subscribe(key, () => {
      const cachedData = firestoreCache.get<T>(key, config);
      if (cachedData) {
        setData(cachedData);
      }
    });

    return unsubscribe;
  }, [key, fetchData, config]);

  const refetch = () => fetchData(true);
  const invalidate = () => firestoreCache.invalidate(key);

  return {
    data,
    loading,
    error,
    refetch,
    invalidate,
    isStale: firestoreCache.isStale(key),
  };
}

// Hook pour invalider le cache facilement
export function useCacheInvalidation() {
  return {
    invalidate: (pattern?: string) => firestoreCache.invalidate(pattern),
    invalidateGoals: () => firestoreCache.invalidate('goals'),
    invalidateTransactions: () => firestoreCache.invalidate('transactions'),
    invalidateCategories: () => firestoreCache.invalidate('categories'),
    clearAll: () => firestoreCache.invalidate(),
  };
}
