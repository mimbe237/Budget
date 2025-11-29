// Migration: ajoute le champ currency aux transactions existantes si absent.
// Usage:
//   node scripts/migrate_add_transaction_currency.js <USER_ID> <DEFAULT_CURRENCY>
// Ex:
//   node scripts/migrate_add_transaction_currency.js abc123 XAF
// Requires service account credentials via env or GOOGLE_APPLICATION_CREDENTIALS.

const admin = require('firebase-admin');

function ensureInit() {
  if (admin.apps.length === 0) {
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
    });
  }
}

async function run(userId, defaultCurrency) {
  ensureInit();
  const db = admin.firestore();
  const txCol = db.collection('users').doc(userId).collection('transactions');
  const snap = await txCol.get();
  let updated = 0;
  const batch = db.batch();

  snap.forEach(doc => {
    const data = doc.data();
    if (!data.currency) {
      batch.update(doc.ref, {
        currency: data.accountCurrency || defaultCurrency || 'XAF',
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      updated++;
    }
  });

  if (updated === 0) {
    console.log('Aucune transaction à mettre à jour.');
    return;
  }
  await batch.commit();
  console.log(`Migration terminée. Transactions mises à jour: ${updated}`);
}

(async () => {
  const [userId, defaultCurrency] = process.argv.slice(2);
  if (!userId) {
    console.error('Paramètres: <USER_ID> <DEFAULT_CURRENCY(optional)>');
    process.exit(1);
  }
  try {
    await run(userId, defaultCurrency);
  } catch (e) {
    console.error('Erreur migration:', e);
    process.exit(1);
  }
})();
