/**
 * Script pour promouvoir un utilisateur en administrateur
 * 
 * Usage: node scripts/set-admin.js <user-uid>
 * 
 * Prérequis:
 * - Avoir configuré les credentials Firebase Admin (serviceAccountKey.json)
 * - Node.js installé
 * - firebase-admin installé: npm install firebase-admin
 */

const admin = require('firebase-admin');
const path = require('path');

// Initialiser Firebase Admin
if (!admin.apps.length) {
  try {
    // Essayer avec la variable d'environnement d'abord
    if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      const serviceAccount = JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
    } else {
      // Sinon essayer avec un fichier local
      const serviceAccountPath = path.join(__dirname, '..', 'serviceAccountKey.json');
      const serviceAccount = require(serviceAccountPath);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
    }
  } catch (error) {
    console.error('⚠️  Impossible d\'initialiser Firebase Admin.');
    console.error('💡 Options de configuration:');
    console.error('   1. Définir GOOGLE_APPLICATION_CREDENTIALS dans .env.local');
    console.error('   2. Placer serviceAccountKey.json à la racine du projet');
    console.error('\n📖 Guide: https://firebase.google.com/docs/admin/setup');
    console.error('\nErreur:', error.message);
    process.exit(1);
  }
}

async function setUserAsAdmin(uid) {
  try {
    const auth = admin.auth();
    const firestore = admin.firestore();
    
    // Vérifier que l'utilisateur existe
    const userRecord = await auth.getUser(uid);
    console.log(`👤 Utilisateur trouvé: ${userRecord.email}`);
    
    // Définir les Custom Claims
    await auth.setCustomUserClaims(uid, { 
      admin: true,
      role: 'admin'
    });
    console.log('✅ Custom Claims définis');
    
    // Mettre à jour dans Firestore
    const userRef = firestore.collection('users').doc(uid);
    const userDoc = await userRef.get();
    
    if (userDoc.exists) {
      await userRef.update({
        role: 'admin',
        isAdmin: true,
        adminSince: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      console.log('✅ Document Firestore mis à jour');
    } else {
      console.log('⚠️  Document utilisateur non trouvé dans Firestore');
    }
    
    console.log(`🎉 ${userRecord.email} est maintenant administrateur !`);
    console.log('💡 L\'utilisateur devra se reconnecter pour que les changements prennent effet.');
    
  } catch (error) {
    console.error('❌ Erreur lors de la promotion admin:', error.message);
    
    if (error.code === 'auth/user-not-found') {
      console.error('💡 Vérifiez que l\'UID utilisateur est correct');
    } else if (error.code === 'permission-denied') {
      console.error('💡 Vérifiez que les credentials Firebase Admin ont les bonnes permissions');
    }
    
    process.exit(1);
  }
}

async function listAdmins() {
  try {
    const firestore = admin.firestore();
    
    const adminSnapshot = await firestore
      .collection('users')
      .where('role', '==', 'admin')
      .get();
    
    console.log(`📋 ${adminSnapshot.size} administrateur(s) trouvé(s):\n`);
    
    adminSnapshot.docs.forEach(doc => {
      const data = doc.data();
      console.log(`  👤 ${data.firstName} ${data.lastName}`);
      console.log(`     📧 ${data.email}`);
      console.log(`     🆔 ${doc.id}`);
      console.log(`     📅 Admin depuis: ${data.adminSince ? data.adminSince.toDate().toLocaleDateString('fr-FR') : 'Non défini'}`);
      console.log('');
    });
    
  } catch (error) {
    console.error('❌ Erreur lors du listage des admins:', error.message);
    process.exit(1);
  }
}

async function removeAdmin(uid) {
  try {
    const auth = admin.auth();
    const firestore = admin.firestore();
    
    const userRecord = await auth.getUser(uid);
    console.log(`👤 Suppression des droits admin pour: ${userRecord.email}`);
    
    // Supprimer les Custom Claims
    await auth.setCustomUserClaims(uid, { 
      admin: false,
      role: 'user'
    });
    console.log('✅ Custom Claims supprimés');
    
    // Mettre à jour dans Firestore
    const userRef = firestore.collection('users').doc(uid);
    await userRef.update({
      role: 'user',
      isAdmin: false,
      adminSince: null,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    console.log('✅ Document Firestore mis à jour');
    
    console.log(`🎉 ${userRecord.email} n'est plus administrateur`);
    
  } catch (error) {
    console.error('❌ Erreur lors de la suppression admin:', error.message);
    process.exit(1);
  }
}

// Interface en ligne de commande
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  const uid = args[1];
  
  console.log('🔥 Script de gestion des administrateurs Firebase\n');
  
  if (!command) {
    console.log('Usage:');
    console.log('  node scripts/set-admin.js set <user-uid>     # Promouvoir en admin');
    console.log('  node scripts/set-admin.js remove <user-uid>  # Retirer les droits admin');
    console.log('  node scripts/set-admin.js list              # Lister tous les admins');
    console.log('');
    console.log('Exemples:');
    console.log('  node scripts/set-admin.js set abc123def456');
    console.log('  node scripts/set-admin.js list');
    process.exit(0);
  }
  
  switch (command) {
    case 'set':
      if (!uid) {
        console.error('❌ UID utilisateur requis');
        console.error('Usage: node scripts/set-admin.js set <user-uid>');
        process.exit(1);
      }
      await setUserAsAdmin(uid);
      break;
      
    case 'remove':
      if (!uid) {
        console.error('❌ UID utilisateur requis');
        console.error('Usage: node scripts/set-admin.js remove <user-uid>');
        process.exit(1);
      }
      await removeAdmin(uid);
      break;
      
    case 'list':
      await listAdmins();
      break;
      
    default:
      console.error(`❌ Commande inconnue: ${command}`);
      console.error('Commandes disponibles: set, remove, list');
      process.exit(1);
  }
  
  process.exit(0);
}

// Exécuter le script
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Erreur fatale:', error);
    process.exit(1);
  });
}

module.exports = { setUserAsAdmin, listAdmins, removeAdmin };