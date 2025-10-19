'use server';

import { getAdminAuth, getAdminFirestore } from '@/firebase/admin';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { DecodedIdToken } from 'firebase-admin/auth';

export interface AdminUser extends DecodedIdToken {
  role?: string;
  isAdmin: boolean;
}

/**
 * Vérifie si l'utilisateur connecté est un admin
 * Support Custom Claims OU rôle dans Firestore
 */
export async function getAdminUser(): Promise<AdminUser | null> {
  try {
    const headersInstance = await headers();
    const authHeader = headersInstance.get('Authorization');
    
    if (!authHeader) {
      return null;
    }

    const token = authHeader.split(' ')[1];
    const adminAuth = getAdminAuth();
    const decodedToken = await adminAuth.verifyIdToken(token);

    // Vérifier Custom Claims d'abord
    if (decodedToken.role === 'admin' || decodedToken.admin === true) {
      return {
        ...decodedToken,
        role: 'admin',
        isAdmin: true
      };
    }

    // Vérifier dans Firestore si pas de Custom Claims
    const db = getAdminFirestore();
    const userDoc = await db.collection('users').doc(decodedToken.uid).get();
    
    if (userDoc.exists) {
      const userData = userDoc.data();
      const isAdmin = userData?.role === 'admin';
      
      return {
        ...decodedToken,
        role: userData?.role || 'user',
        isAdmin
      };
    }

    return {
      ...decodedToken,
      role: 'user',
      isAdmin: false
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