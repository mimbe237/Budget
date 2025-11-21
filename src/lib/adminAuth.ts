'use server';

import { getAdminAuth, getAdminFirestore } from '@/firebase/admin';
import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { DecodedIdToken } from 'firebase-admin/auth';

export interface AdminUser extends DecodedIdToken {
  role?: string;
  status?: 'active' | 'suspended';
  isAdmin: boolean;
}

const adminEmailSet = (() => {
  const raw =
    process.env.ADMIN_EMAILS ??
    process.env.NEXT_PUBLIC_ADMIN_EMAILS ??
    '';
  return new Set(
    raw
      .split(',')
      .map(email => email.trim().toLowerCase())
      .filter(Boolean)
  );
})();

/**
 * Vérifie si l'utilisateur connecté est un admin
 * Support Custom Claims OU rôle dans Firestore
 */
export async function getAdminUser(): Promise<AdminUser | null> {
  try {
    const headersInstance = await headers();
    let token = headersInstance.get('Authorization')?.split(' ')[1] ?? null;

    if (!token) {
      const cookieStore = await cookies();
      token = cookieStore.get('firebaseIdToken')?.value ?? null;
    }

    if (!token) {
      return null;
    }

    const adminAuth = getAdminAuth();
    const decodedToken = await adminAuth.verifyIdToken(token);

    const db = getAdminFirestore();

    let profileRole: string | undefined;
    let profileStatus: 'active' | 'suspended' = 'active';
    let profileIsAdmin = false;

    try {
      const userDoc = await db.collection('users').doc(decodedToken.uid).get();
      if (userDoc.exists) {
        const userData = userDoc.data();
        if (typeof userData?.role === 'string') {
          profileRole = userData.role;
        }
        if (userData?.isAdmin === true || userData?.role === 'admin') {
          profileIsAdmin = true;
        }
        if (userData?.status === 'suspended') {
          profileStatus = 'suspended';
        }
      }
    } catch (firestoreError) {
      console.warn('Impossible de récupérer le profil admin', firestoreError);
    }

    const hasAdminClaim = decodedToken.role === 'admin' || decodedToken.admin === true;
    const fallbackEmailAdmin = decodedToken.email
      ? adminEmailSet.has(decodedToken.email.toLowerCase())
      : false;

    const derivedRole = profileRole
      ?? (hasAdminClaim || fallbackEmailAdmin ? 'admin' : 'user');

    const isAdmin = profileStatus !== 'suspended' && (hasAdminClaim || fallbackEmailAdmin || profileIsAdmin);

    return {
      ...decodedToken,
      role: derivedRole,
      status: profileStatus,
      isAdmin,
    };

  } catch (error) {
    console.error('Erreur vérification admin:', error);
    return null;
  }
}

/**
 * Guard pour protéger les routes admin
 * Redirige vers /login si non connecté ou non admin
 */
export async function requireAdmin(): Promise<AdminUser> {
  const adminUser = await getAdminUser();
  
  if (!adminUser) {
    redirect('/login');
  }
  
  if (!adminUser.isAdmin) {
    redirect('/'); // Rediriger vers dashboard si connecté mais pas admin
  }
  
  return adminUser;
}

/**
 * Middleware pour vérifier les permissions admin dans les Server Actions
 */
export async function withAdminAuth<T extends any[], R>(
  action: (...args: T) => Promise<R>
) {
  return async (...args: T): Promise<R> => {
    await requireAdmin();
    return action(...args);
  };
}

/**
 * Set custom claims pour un utilisateur (pour promouvoir en admin)
 * Utiliser depuis la console Firebase ou script admin
 */
export async function setAdminClaims(uid: string, isAdmin: boolean = true) {
  try {
    const adminAuth = getAdminAuth();
    await adminAuth.setCustomUserClaims(uid, { 
      admin: isAdmin,
      role: isAdmin ? 'admin' : 'user'
    });
    return { success: true };
  } catch (error) {
    console.error('Erreur setting admin claims:', error);
    return { success: false, error };
  }
}
