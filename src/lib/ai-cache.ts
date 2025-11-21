/**
 * AI Insights Cache Management
 * 
 * Gère le cache des insights IA dans Firestore pour réduire les coûts d'API.
 * - Cache valide pendant 24h
 * - Invalidation automatique si les données changent
 * - Hash des données pour détecter les changements
 */

import { getAdminFirestore } from '@/firebase/admin';
import type { AIInsightsCache } from './types';
import { Timestamp } from 'firebase-admin/firestore';
import crypto from 'crypto';

const CACHE_DURATION_MS = 24 * 60 * 60 * 1000; // 24 heures
const MODEL_VERSION = 'gemini-2.5-flash-v1'; // Permet d'invalider le cache si on change de modèle

/**
 * Génère un hash des données financières pour détecter les changements
 */
export function generateDataHash(data: {
  transactionIds: string[];
  budgetIds: string[];
  transactionCount: number;
  budgetCount: number;
}): string {
  const content = JSON.stringify({
    txIds: data.transactionIds.sort(),
    budgetIds: data.budgetIds.sort(),
    txCount: data.transactionCount,
    budgetCount: data.budgetCount,
  });
  
  return crypto.createHash('sha256').update(content).digest('hex');
}

/**
 * Récupère les insights en cache s'ils sont valides
 * 
 * @returns Les insights en cache ou null si pas de cache valide
 */
export async function getCachedInsights(
  userId: string
): Promise<{ insights: string; recommendations: string; cache: AIInsightsCache } | null> {
  try {
    const db = getAdminFirestore();
    const cacheRef = db.doc(`users/${userId}/aiInsights/latest`);
    const cacheDoc = await cacheRef.get();

    if (!cacheDoc.exists) {
      return null;
    }

    const cache = cacheDoc.data() as AIInsightsCache;
    const now = Date.now();
    const expiresAt = new Date(cache.expiresAt).getTime();

    // Vérifier si le cache est encore valide
    if (expiresAt <= now) {
      if (process.env.NODE_ENV !== 'production') {
        console.info(`[AI Cache] Cache expired for user ${userId}`);
      }
      return null;
    }

    // Vérifier la version du modèle
    if (cache.modelVersion !== MODEL_VERSION) {
      if (process.env.NODE_ENV !== 'production') {
        console.info(`[AI Cache] Model version mismatch for user ${userId}`);
      }
      return null;
    }

    if (process.env.NODE_ENV !== 'production') {
      const remainingHours = Math.round((expiresAt - now) / (60 * 60 * 1000));
      console.info(`[AI Cache] Cache HIT for user ${userId} (expires in ${remainingHours}h)`);
    }

    return {
      insights: cache.insights,
      recommendations: cache.recommendations,
      cache,
    };
  } catch (error) {
    console.error('[AI Cache] Error fetching cache:', error);
    return null;
  }
}

/**
 * Vérifie si les données ont changé depuis le dernier cache
 * 
 * @returns true si les données ont changé, false sinon
 */
export async function hasDataChanged(
  userId: string,
  currentDataHash: string
): Promise<boolean> {
  try {
    const db = getAdminFirestore();
    const cacheRef = db.doc(`users/${userId}/aiInsights/latest`);
    const cacheDoc = await cacheRef.get();

    if (!cacheDoc.exists) {
      return true; // Pas de cache = données "changées"
    }

    const cache = cacheDoc.data() as AIInsightsCache;
    const hasChanged = cache.dataHash !== currentDataHash;

    if (hasChanged && process.env.NODE_ENV !== 'production') {
      console.info(`[AI Cache] Data changed for user ${userId}`);
    }

    return hasChanged;
  } catch (error) {
    console.error('[AI Cache] Error checking data change:', error);
    return true; // En cas d'erreur, on considère que les données ont changé
  }
}

/**
 * Sauvegarde les insights générés dans le cache
 */
export async function setCachedInsights(
  userId: string,
  insights: string,
  recommendations: string,
  metadata: {
    dataHash: string;
    transactionCount: number;
    budgetCount: number;
    periodStart?: string;
    periodEnd?: string;
  }
): Promise<void> {
  try {
    const db = getAdminFirestore();
    const cacheRef = db.doc(`users/${userId}/aiInsights/latest`);
    
    const now = Date.now();
    const expiresAt = now + CACHE_DURATION_MS;

    const cacheData: AIInsightsCache = {
      id: 'latest',
      userId,
      insights,
      recommendations,
      generatedAt: new Date(now).toISOString(),
      expiresAt: new Date(expiresAt).toISOString(),
      dataHash: metadata.dataHash,
      transactionCount: metadata.transactionCount,
      budgetCount: metadata.budgetCount,
      periodStart: metadata.periodStart,
      periodEnd: metadata.periodEnd,
      modelVersion: MODEL_VERSION,
    };

    await cacheRef.set(cacheData);

    if (process.env.NODE_ENV !== 'production') {
      console.info(`[AI Cache] Saved cache for user ${userId} (expires in 24h)`);
    }
  } catch (error) {
    console.error('[AI Cache] Error saving cache:', error);
    // Ne pas bloquer si la sauvegarde échoue
  }
}

/**
 * Invalide le cache pour forcer une régénération
 */
export async function invalidateCache(userId: string): Promise<void> {
  try {
    const db = getAdminFirestore();
    const cacheRef = db.doc(`users/${userId}/aiInsights/latest`);
    await cacheRef.delete();

    if (process.env.NODE_ENV !== 'production') {
      console.info(`[AI Cache] Invalidated cache for user ${userId}`);
    }
  } catch (error) {
    console.error('[AI Cache] Error invalidating cache:', error);
  }
}

/**
 * Obtient les statistiques du cache (pour debugging)
 */
export async function getCacheStats(userId: string): Promise<{
  hasCache: boolean;
  isValid: boolean;
  age: number; // en heures
  expiresIn: number; // en heures
  transactionCount: number;
  budgetCount: number;
} | null> {
  try {
    const db = getAdminFirestore();
    const cacheRef = db.doc(`users/${userId}/aiInsights/latest`);
    const cacheDoc = await cacheRef.get();

    if (!cacheDoc.exists) {
      return null;
    }

    const cache = cacheDoc.data() as AIInsightsCache;
    const now = Date.now();
    const generatedAt = new Date(cache.generatedAt).getTime();
    const expiresAt = new Date(cache.expiresAt).getTime();
    
    const ageMs = now - generatedAt;
    const expiresInMs = expiresAt - now;

    return {
      hasCache: true,
      isValid: expiresAt > now,
      age: Math.round(ageMs / (60 * 60 * 1000)),
      expiresIn: Math.round(expiresInMs / (60 * 60 * 1000)),
      transactionCount: cache.transactionCount,
      budgetCount: cache.budgetCount,
    };
  } catch (error) {
    console.error('[AI Cache] Error getting cache stats:', error);
    return null;
  }
}
