/**
 * SCRIPT UTILITAIRE POUR PROMOUVOIR UN UTILISATEUR EN ADMIN
 * 
 * Usage: Exécuter ce script depuis un environnement Node.js avec les credentials Firebase Admin
 * 
 * Exemple:
 * node scripts/set-admin.js user_uid_here
 * 
 * OU directement depuis la console Firebase:
 * https://console.firebase.google.com/project/YOUR_PROJECT/authentication/users
 * 
 * OU via ce composant pour les tests en développement
 */

import { getAdminAuth, getAdminFirestore } from '@/firebase/admin';

/**
 * Définit un utilisateur comme admin via Custom Claims
 */
export async function setUserAsAdmin(uid: string): Promise<{ success: boolean; error?: string }> {
  try {
    const adminAuth = getAdminAuth();
    const db = getAdminFirestore();
    
    // Vérifier que l'utilisateur existe
    const userRecord = await adminAuth.getUser(uid);
    if (!userRecord) {
      return { success: false, error: 'Utilisateur non trouvé' };
    }
    
    // Définir les Custom Claims
    await adminAuth.setCustomUserClaims(uid, { 
      admin: true,
      role: 'admin'
    });
    
    // Mettre à jour aussi dans Firestore pour la compatibilité
    const userRef = db.collection('users').doc(uid);
    await userRef.update({
      role: 'admin',
      isAdmin: true,
      adminSince: new Date(),
      updatedAt: new Date()
    });
    
    console.log(`✅ Utilisateur ${userRecord.email} promu admin avec succès`);
    return { success: true };
    
  } catch (error) {
    console.error('❌ Erreur promotion admin:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Erreur inconnue' 
    };
  }
}

/**
 * Retire les privilèges admin d'un utilisateur
 */
export async function removeUserAdmin(uid: string): Promise<{ success: boolean; error?: string }> {
  try {
    const adminAuth = getAdminAuth();
    const db = getAdminFirestore();
    
    // Supprimer les Custom Claims
    await adminAuth.setCustomUserClaims(uid, { 
      admin: false,
      role: 'user'
    });
    
    // Mettre à jour dans Firestore
    const userRef = db.collection('users').doc(uid);
    await userRef.update({
      role: 'user',
      isAdmin: false,
      adminSince: null,
      updatedAt: new Date()
    });
    
    console.log(`✅ Privilèges admin retirés avec succès`);
    return { success: true };
    
  } catch (error) {
    console.error('❌ Erreur retrait admin:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Erreur inconnue' 
    };
  }
}

/**
 * Liste tous les admins actuels
 */
export async function listAdmins(): Promise<{ success: boolean; admins?: any[]; error?: string }> {
  try {
    const db = getAdminFirestore();
    
    const adminUsersSnapshot = await db
      .collection('users')
      .where('role', '==', 'admin')
      .get();
    
    const admins = adminUsersSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    console.log(`📋 ${admins.length} admin(s) trouvé(s):`);
    admins.forEach(admin => {
      console.log(`  - ${admin.email} (${admin.firstName} ${admin.lastName})`);
    });
    
    return { success: true, admins };
    
  } catch (error) {
    console.error('❌ Erreur listage admins:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Erreur inconnue' 
    };
  }
}

// Script d'exemple pour définir un admin via Node.js
export const SET_ADMIN_SCRIPT = `
const admin = require('firebase-admin');
const serviceAccount = require('../path/to/serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const uid = process.argv[2];
if (!uid) {
  console.error('Usage: node set-admin.js <user-uid>');
  process.exit(1);
}

admin.auth().setCustomUserClaims(uid, { admin: true, role: 'admin' })
  .then(() => console.log('✅ Admin défini avec succès'))
  .catch(console.error);
`;

/*
INSTRUCTIONS D'UTILISATION:

1. Via Console Firebase:
   - Aller sur https://console.firebase.google.com/project/YOUR_PROJECT/authentication/users
   - Cliquer sur un utilisateur
   - Dans "Custom claims", ajouter: { "admin": true, "role": "admin" }

2. Via CLI (créer scripts/set-admin.js):
   const admin = require('firebase-admin');
   const serviceAccount = require('../path/to/serviceAccountKey.json');
   
   admin.initializeApp({
     credential: admin.credential.cert(serviceAccount)
   });
   
   const uid = process.argv[2];
   if (!uid) {
     console.error('Usage: node set-admin.js <user-uid>');
     process.exit(1);
   }
   
   admin.auth().setCustomUserClaims(uid, { admin: true, role: 'admin' })
     .then(() => console.log('✅ Admin défini avec succès'))
     .catch(console.error);

3. Après promotion, l'utilisateur doit se reconnecter pour que les claims prennent effet.
*/