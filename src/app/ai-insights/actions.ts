'use server';

import { cookies, headers } from 'next/headers';
import { getAdminAuth } from '@/firebase/admin';
import { invalidateCache } from '@/lib/ai-cache';
import { revalidatePath } from 'next/cache';
import type { DecodedIdToken } from 'firebase-admin/auth';

async function getAuthenticatedUser(): Promise<DecodedIdToken | null> {
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
    return decodedToken;
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.debug('[RefreshInsights] Unable to verify auth token.', error);
    }
    return null;
  }
}

/**
 * Action serveur pour forcer la régénération des insights IA
 */
export async function refreshAIInsights(): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await getAuthenticatedUser();

    if (!user) {
      return { success: false, error: 'Non authentifié' };
    }

    // Invalider le cache
    await invalidateCache(user.uid);

    // Revalider la page pour forcer le rechargement
    revalidatePath('/ai-insights');
    revalidatePath('/dashboard');
    revalidatePath('/reports');

    if (process.env.NODE_ENV !== 'production') {
      console.info(`[RefreshInsights] Cache invalidated for user ${user.uid}`);
    }

    return { success: true };
  } catch (error) {
    console.error('[RefreshInsights] Error refreshing insights:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Erreur inconnue' 
    };
  }
}
