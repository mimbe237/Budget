/**
 * Script pour créer un nouvel utilisateur administrateur
 * 
 * Usage: node scripts/create-admin.js <email> <password> <firstName> <lastName>
 * 
 * Exemple: node scripts/create-admin.js admin@example.com AdminPass123 John Doe
 */

const admin = require('firebase-admin');

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
      const path = require('path');
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

async function createAdmin(email, password, firstName, lastName) {
  try {
    const auth = admin.auth();
    const firestore = admin.firestore();
    
    console.log(`📧 Création de l'utilisateur: ${email}...`);
    
    // Créer l'utilisateur dans Firebase Auth
    const userRecord = await auth.createUser({
      email: email,
      password: password,
      emailVerified: true,
      displayName: `${firstName} ${lastName}`
    });
    
    console.log(`✅ Utilisateur créé avec UID: ${userRecord.uid}`);
    
    // Définir les Custom Claims admin
    await auth.setCustomUserClaims(userRecord.uid, { 
      admin: true,
      role: 'admin'
    });
    console.log('✅ Custom Claims admin définis');
    
    // Créer le document dans Firestore
    await firestore.collection('users').doc(userRecord.uid).set({
      email: email,
      firstName: firstName,
      lastName: lastName,
      role: 'admin',
      isAdmin: true,
      status: 'active',
      country: 'France',
      gender: 'male',
      language: 'fr',
      displayCurrency: 'EUR',
      locale: 'fr-FR',
      phoneCountryCode: '',
      phoneNumber: '',
      adminSince: admin.firestore.FieldValue.serverTimestamp(),
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    console.log('✅ Document Firestore créé');
    
    console.log('\n🎉 Administrateur créé avec succès !');
    console.log('\n📋 Identifiants de connexion:');
    console.log(`   Email:    ${email}`);
    console.log(`   Password: ${password}`);
    console.log(`   UID:      ${userRecord.uid}`);
    console.log('\n🔐 Vous pouvez maintenant vous connecter sur: http://localhost:9002/login');
    
  } catch (error) {
    console.error('❌ Erreur lors de la création:', error.message);
    
    if (error.code === 'auth/email-already-exists') {
      console.error('💡 Cet email existe déjà. Utilisez set-admin.js pour le promouvoir.');
    } else if (error.code === 'auth/invalid-password') {
      console.error('💡 Le mot de passe doit contenir au moins 6 caractères.');
    }
    
    process.exit(1);
  }
}

// Interface en ligne de commande
async function main() {
  const args = process.argv.slice(2);
  const [email, password, firstName, lastName] = args;
  
  console.log('🔥 Script de création d\'administrateur Firebase\n');
  
  if (!email || !password || !firstName || !lastName) {
    console.log('Usage:');
    console.log('  node scripts/create-admin.js <email> <password> <firstName> <lastName>');
    console.log('');
    console.log('Exemple:');
    console.log('  node scripts/create-admin.js admin@budget.com SuperAdmin2024! John Doe');
    console.log('');
    console.log('💡 Le mot de passe doit contenir au moins 6 caractères.');
    process.exit(0);
  }
  
  await createAdmin(email, password, firstName, lastName);
  process.exit(0);
}

// Exécuter le script
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Erreur fatale:', error);
    process.exit(1);
  });
}

module.exports = { createAdmin };
