'use server';

import { z } from 'zod';
import { requireAdmin } from '@/lib/adminAuth';
import { getAdminFirestore } from '@/firebase/admin';
import { AdminUserData } from '@/lib/adminTypes';

// Schemas de validation
const UpdateUserSchema = z.object({
  userId: z.string().min(1),
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  country: z.string().optional(),
  language: z.string().optional(),
  phoneCountryCode: z.string().optional(),
  phoneNumber: z.string().optional(),
});

const ToggleUserStatusSchema = z.object({
  userId: z.string().min(1),
  status: z.enum(['active', 'suspended']),
});

const DeleteUserSchema = z.object({
  userId: z.string().min(1),
  confirmEmail: z.string().email(),
});

export type ActionResult<T = any> = {
  success: boolean;
  data?: T;
  error?: string;
  details?: string;
};

/**
 * Met à jour les informations d'un utilisateur
 */
export async function updateUser(
  formData: FormData
): Promise<ActionResult<AdminUserData>> {
  try {
    // Vérifier les permissions admin
    await requireAdmin();
    
    // Valider les données
    const data = UpdateUserSchema.parse({
      userId: formData.get('userId'),
      firstName: formData.get('firstName') || undefined,
      lastName: formData.get('lastName') || undefined,
      country: formData.get('country') || undefined,
      language: formData.get('language') || undefined,
      phoneCountryCode: formData.get('phoneCountryCode') || undefined,
      phoneNumber: formData.get('phoneNumber') || undefined,
    });

    const db = getAdminFirestore();
    const userRef = db.collection('users').doc(data.userId);
    
    // Vérifier que l'utilisateur existe
    const userDoc = await userRef.get();
    if (!userDoc.exists) {
      return {
        success: false,
        error: 'Utilisateur non trouvé'
      };
    }

    // Préparer les données à mettre à jour (filtrer les undefined)
    const updateData: Record<string, any> = {};
    Object.entries(data).forEach(([key, value]) => {
      if (key !== 'userId' && value !== undefined) {
        updateData[key] = value;
      }
    });

    // Ajouter timestamp de modification
    updateData.updatedAt = new Date();

    // Mettre à jour dans Firestore
    await userRef.update(updateData);

    // Récupérer les données mises à jour
    const updatedUserDoc = await userRef.get();
    const updatedUserData = updatedUserDoc.data();

    return {
      success: true,
      data: {
        id: data.userId,
        firstName: updatedUserData?.firstName || '',
        lastName: updatedUserData?.lastName || '',
        email: updatedUserData?.email || '',
        country: updatedUserData?.country || '',
        gender: updatedUserData?.gender || 'male',
        language: updatedUserData?.language || 'fr',
        phoneCountryCode: updatedUserData?.phoneCountryCode || '',
        phoneNumber: updatedUserData?.phoneNumber || '',
        displayCurrency: updatedUserData?.displayCurrency,
        locale: updatedUserData?.locale,
        createdAt: updatedUserData?.createdAt,
        transactionCount: 0, // Sera recalculé si nécessaire
        balanceInCents: 0, // Sera recalculé si nécessaire
        lastLoginAt: updatedUserData?.lastLoginAt,
        status: updatedUserData?.status || 'active'
      }
    };

  } catch (error) {
    console.error('Erreur mise à jour utilisateur:', error);
    return {
      success: false,
      error: 'Erreur lors de la mise à jour',
      details: error instanceof Error ? error.message : 'Erreur inconnue'
    };
  }
}

/**
 * Active ou suspend un utilisateur
 */
export async function toggleUserStatus(
  formData: FormData
): Promise<ActionResult<{ status: 'active' | 'suspended' }>> {
  try {
    // Vérifier les permissions admin
    await requireAdmin();
    
    // Valider les données
    const data = ToggleUserStatusSchema.parse({
      userId: formData.get('userId'),
      status: formData.get('status'),
    });

    const db = getAdminFirestore();
    const userRef = db.collection('users').doc(data.userId);
    
    // Vérifier que l'utilisateur existe
    const userDoc = await userRef.get();
    if (!userDoc.exists) {
      return {
        success: false,
        error: 'Utilisateur non trouvé'
      };
    }

    // Mettre à jour le statut
    await userRef.update({
      status: data.status,
      statusUpdatedAt: new Date(),
      updatedAt: new Date()
    });

    return {
      success: true,
      data: { status: data.status }
    };

  } catch (error) {
    console.error('Erreur changement statut utilisateur:', error);
    return {
      success: false,
      error: 'Erreur lors du changement de statut',
      details: error instanceof Error ? error.message : 'Erreur inconnue'
    };
  }
}

/**
 * Supprime un utilisateur et toutes ses données
 * Attention: action irréversible!
 */
export async function deleteUser(
  formData: FormData
): Promise<ActionResult<{ deleted: boolean }>> {
  try {
    // Vérifier les permissions admin
    await requireAdmin();
    
    // Valider les données
    const data = DeleteUserSchema.parse({
      userId: formData.get('userId'),
      confirmEmail: formData.get('confirmEmail'),
    });

    const db = getAdminFirestore();
    const userRef = db.collection('users').doc(data.userId);
    
    // Vérifier que l'utilisateur existe
    const userDoc = await userRef.get();
    if (!userDoc.exists) {
      return {
        success: false,
        error: 'Utilisateur non trouvé'
      };
    }

    const userData = userDoc.data()!;
    
    // Vérifier que l'email de confirmation correspond
    if (userData.email !== data.confirmEmail) {
      return {
        success: false,
        error: 'L\'email de confirmation ne correspond pas'
      };
    }

    // Commencer une transaction pour supprimer toutes les données
    await db.runTransaction(async (transaction) => {
      // Supprimer les transactions
      const expensesSnapshot = await db.collection(`users/${data.userId}/expenses`).get();
      expensesSnapshot.docs.forEach(doc => {
        transaction.delete(doc.ref);
      });

      // Supprimer les catégories
      const categoriesSnapshot = await db.collection(`users/${data.userId}/categories`).get();
      categoriesSnapshot.docs.forEach(doc => {
        transaction.delete(doc.ref);
      });

      // Supprimer les objectifs
      const goalsSnapshot = await db.collection(`users/${data.userId}/budgetGoals`).get();
      goalsSnapshot.docs.forEach(doc => {
        transaction.delete(doc.ref);
      });

      // Supprimer le profil utilisateur
      transaction.delete(userRef);
    });

    // Note: Pour supprimer complètement l'utilisateur d'Auth, 
    // il faudrait aussi appeler getAdminAuth().deleteUser(data.userId)
    // Mais c'est très destructeur, à décider selon la politique

    return {
      success: true,
      data: { deleted: true }
    };

  } catch (error) {
    console.error('Erreur suppression utilisateur:', error);
    return {
      success: false,
      error: 'Erreur lors de la suppression',
      details: error instanceof Error ? error.message : 'Erreur inconnue'
    };
  }
}

/**
 * Réinitialise le mot de passe d'un utilisateur
 */
export async function resetUserPassword(
  formData: FormData
): Promise<ActionResult<{ emailSent: boolean }>> {
  try {
    // Vérifier les permissions admin
    await requireAdmin();
    
    const userId = formData.get('userId') as string;
    if (!userId) {
      return {
        success: false,
        error: 'ID utilisateur requis'
      };
    }

    const db = getAdminFirestore();
    const userDoc = await db.collection('users').doc(userId).get();
    
    if (!userDoc.exists) {
      return {
        success: false,
        error: 'Utilisateur non trouvé'
      };
    }

    const userData = userDoc.data()!;
    const email = userData.email;

    if (!email) {
      return {
        success: false,
        error: 'Email utilisateur non trouvé'
      };
    }

    // Générer un lien de réinitialisation
    const { getAdminAuth } = await import('@/firebase/admin');
    const adminAuth = getAdminAuth();
    
    await adminAuth.generatePasswordResetLink(email);

    // Log de l'action admin
    await db.collection('admin_logs').add({
      action: 'password_reset',
      userId: userId,
      userEmail: email,
      timestamp: new Date(),
      adminId: 'current_admin' // À remplacer par l'ID de l'admin connecté
    });

    return {
      success: true,
      data: { emailSent: true }
    };

  } catch (error) {
    console.error('Erreur réinitialisation mot de passe:', error);
    return {
      success: false,
      error: 'Erreur lors de la réinitialisation',
      details: error instanceof Error ? error.message : 'Erreur inconnue'
    };
  }
}