#!/usr/bin/env node

/**
 * Script pour créer un compte administrateur Firebase
 * Usage: node scripts/create-admin.js <email> [password]
 */

const admin = require('firebase-admin');
const readline = require('readline');

// Initialiser Firebase Admin
const serviceAccount = require('../service-account-key.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

async function createAdmin(email, password) {
  try {
    // Créer l'utilisateur
    console.log(`\n🔄 Création de l'utilisateur ${email}...`);
    
    let user;
    try {
      user = await admin.auth().getUserByEmail(email);
      console.log('✓ Utilisateur existe déjà');
    } catch (error) {
      if (error.code === 'auth/user-not-found') {
        user = await admin.auth().createUser({
          email: email,
          password: password,
          emailVerified: true,
          displayName: 'Admin User',
        });
        console.log('✓ Utilisateur créé');
      } else {
        throw error;
      }
    }

    // Ajouter les custom claims admin
    console.log('🔄 Attribution des droits admin...');
    await admin.auth().setCustomUserClaims(user.uid, {
      admin: true,
      role: 'admin',
    });
    console.log('✓ Droits admin attribués');

    // Créer le document utilisateur dans Firestore
    console.log('🔄 Création du document Firestore...');
    await admin.firestore().collection('users').doc(user.uid).set({
      email: email,
      displayName: 'Admin User',
      role: 'admin',
      isAdmin: true,
      status: 'active',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      lastActive: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });
    console.log('✓ Document créé dans Firestore');

    console.log('\n✅ Compte admin créé avec succès!');
    console.log(`\nEmail: ${email}`);
    console.log(`Password: ${password}`);
    console.log('\nVous pouvez maintenant vous connecter au panel admin.');

  } catch (error) {
    console.error('\n❌ Erreur:', error.message);
    process.exit(1);
  }
}

// Main
const args = process.argv.slice(2);

if (args.length === 0) {
  console.log('Usage: node scripts/create-admin.js <email> [password]');
  process.exit(1);
}

const email = args[0];
const password = args[1] || Math.random().toString(36).slice(-12);

createAdmin(email, password).finally(() => {
  rl.close();
  process.exit(0);
});
