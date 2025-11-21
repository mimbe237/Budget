/**
 * Script pour compléter l'onboarding d'un utilisateur
 * Usage: node scripts/complete-onboarding.js <email>
 * 
 * Définit les valeurs par défaut pour permettre l'accès au dashboard :
 * - locale: fr-CM
 * - displayCurrency: XOF
 * - monthlyExpenseBudget: 100000 (100,000 XOF)
 * - hasCompletedOnboarding: true
 */

const admin = require('firebase-admin');
const path = require('path');

// Charger les variables d'environnement depuis .env.local
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });

// Initialiser Firebase Admin
if (!admin.apps.length) {
  const serviceAccount = process.env.GOOGLE_APPLICATION_CREDENTIALS
    ? JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS)
    : require(path.resolve(__dirname, '../serviceAccountKey.json'));

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

async function completeOnboarding(email) {
  try {
    // 1. Chercher l'utilisateur par email
    const userRecord = await admin.auth().getUserByEmail(email);
    console.log(`✓ Utilisateur trouvé: ${userRecord.uid} (${email})`);

    // 2. Récupérer le profil utilisateur actuel
    const userRef = db.collection('users').doc(userRecord.uid);
    const userDoc = await userRef.get();
    
    if (!userDoc.exists) {
      console.error(`✗ Profil utilisateur introuvable dans Firestore: ${userRecord.uid}`);
      process.exit(1);
    }

    const currentData = userDoc.data();
    console.log('\nProfil actuel:');
    console.log('  - locale:', currentData.locale || '(non défini)');
    console.log('  - displayCurrency:', currentData.displayCurrency || '(non défini)');
    console.log('  - monthlyExpenseBudget:', currentData.monthlyExpenseBudget || '(non défini)');
    console.log('  - hasCompletedOnboarding:', currentData.hasCompletedOnboarding || false);

    // 3. Déterminer les valeurs à mettre à jour
    const updates = {
      locale: currentData.locale || 'fr-CM',
      displayCurrency: currentData.displayCurrency || 'XOF',
      monthlyExpenseBudget: currentData.monthlyExpenseBudget ?? 100000, // 100,000 XOF par défaut
      hasCompletedOnboarding: true,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    // 4. Mettre à jour le profil
    await userRef.update(updates);

    console.log('\n✓ Onboarding complété avec succès !');
    console.log('\nNouvelles valeurs:');
    console.log('  - locale:', updates.locale);
    console.log('  - displayCurrency:', updates.displayCurrency);
    console.log('  - monthlyExpenseBudget:', updates.monthlyExpenseBudget);
    console.log('  - hasCompletedOnboarding:', updates.hasCompletedOnboarding);
    console.log('\n→ L\'utilisateur peut maintenant accéder au dashboard et aux autres pages.');

  } catch (error) {
    console.error('\n✗ Erreur:', error.message);
    process.exit(1);
  }
}

// Récupérer l'email depuis les arguments de ligne de commande
const email = process.argv[2];

if (!email) {
  console.error('Usage: node scripts/complete-onboarding.js <email>');
  console.error('Exemple: node scripts/complete-onboarding.js mimb.nout@gmail.com');
  process.exit(1);
}

console.log(`\n🚀 Complétion de l'onboarding pour: ${email}\n`);
completeOnboarding(email)
  .then(() => {
    console.log('\n✓ Terminé !');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n✗ Erreur fatale:', error);
    process.exit(1);
  });
