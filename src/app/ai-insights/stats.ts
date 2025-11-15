'use server';

import { getCacheStats } from '@/lib/ai-cache';
import { cookies, headers } from 'next/headers';
import { getAdminAuth } from '@/firebase/admin';

async function getAuthenticatedUserId(): Promise<string | null> {
  const headersInstance = await headers();
  let token = headersInstance.get('Authorization')?.split(' ')[1] || null;

  if (!token) {
    const cookieStore = await cookies();
    token = cookieStore.get('firebaseIdToken')?.value || null;
  }

  if (!token) {
    return null;
  }

  try {
    const adminAuth = getAdminAuth();
    const decodedToken = await adminAuth.verifyIdToken(token);
    return decodedToken.uid;
  } catch {
    return null;
  }
}

/**
 * Action serveur pour obtenir les statistiques du cache AI
 * Utile pour debugging et monitoring
 */
export async function getAICacheStats() {
  const userId = await getAuthenticatedUserId();
  
  if (!userId) {
    return { error: 'Non authentifié' };
  }

  const stats = await getCacheStats(userId);
  
  if (!stats) {
    return { 
      hasCache: false,
      message: 'Aucun cache trouvé. Générez des insights pour créer un cache.' 
    };
  }

  return stats;
}
