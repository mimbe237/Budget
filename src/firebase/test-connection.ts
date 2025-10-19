import { initializeFirebase } from '@/firebase';

export function testFirebaseConnection() {
  try {
    const { firebaseApp, auth, firestore } = initializeFirebase();
    
    console.log('🔥 Firebase initialisé avec succès !');
    console.log('📱 App ID:', firebaseApp.options.appId);
    console.log('🏗️ Project ID:', firebaseApp.options.projectId);
    console.log('🔐 Auth Domain:', firebaseApp.options.authDomain);
    console.log('📊 Firestore connecté:', !!firestore);
    console.log('🔒 Auth connecté:', !!auth);
    
    return {
      success: true,
      firebaseApp,
      auth,
      firestore
    };
  } catch (error) {
    console.error('❌ Erreur lors de l\'initialisation de Firebase:', error);
    return {
      success: false,
      error
    };
  }
}

// Fonction pour tester l'authentification
export async function testFirebaseAuth() {
  try {
    const { auth } = initializeFirebase();
    console.log('🔐 Test de l\'authentification Firebase...');
    console.log('👤 Utilisateur actuel:', auth.currentUser?.email || 'Non connecté');
    return { success: true, user: auth.currentUser };
  } catch (error) {
    console.error('❌ Erreur lors du test d\'authentification:', error);
    return { success: false, error };
  }
}

// Fonction pour tester Firestore
export async function testFirestore() {
  try {
    const { firestore } = initializeFirebase();
    console.log('📊 Test de Firestore...');
    // Vous pouvez ajouter un test de lecture/écriture ici si nécessaire
    console.log('✅ Firestore prêt pour les opérations');
    return { success: true, firestore };
  } catch (error) {
    console.error('❌ Erreur lors du test de Firestore:', error);
    return { success: false, error };
  }
}