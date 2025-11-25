#!/usr/bin/env node
/*
  Purge Firestore: conserve uniquement le compte demo (email demo123@budgetpro.net ou isDemo=true)
  Sécurité:
    - Dry-run par défaut: affiche ce qui serait supprimé.
    - Passer --confirm pour effectuer la suppression.

  Prérequis:
    - Créer un compte de service Firebase avec rôle Owner/Editor + Cloud Datastore User.
    - Exporter la clé JSON et définir la variable d'environnement:
        export GOOGLE_APPLICATION_CREDENTIALS="/chemin/service-account.json"
    - npm install firebase-admin (si non présent):
        npm i firebase-admin

  Usage:
    node scripts/cleanup_non_demo_users.js           # dry-run
    node scripts/cleanup_non_demo_users.js --confirm # suppression réelle
    node scripts/cleanup_non_demo_users.js --only-user <uid> --confirm # purge spécifique
*/

const admin = require('firebase-admin');

if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  console.error('⚠️ GOOGLE_APPLICATION_CREDENTIALS non défini. Abandon.');
  process.exit(1);
}

if (!admin.apps.length) {
  admin.initializeApp({}); // Utilise GOOGLE_APPLICATION_CREDENTIALS
}

const db = admin.firestore();
const DEMO_EMAIL = 'demo123@budgetpro.net';
const args = process.argv.slice(2);
const doConfirm = args.includes('--confirm');
const onlyUserIdx = args.indexOf('--only-user');
const onlyUserId = onlyUserIdx !== -1 ? args[onlyUserIdx + 1] : null;

async function listSubcollections(docRef) {
  return await docRef.listCollections();
}

async function deleteDocRecursive(docRef) {
  // Supprimer sous-collections avant le doc
  const subs = await listSubcollections(docRef);
  for (const col of subs) {
    const snap = await col.get();
    for (const doc of snap.docs) {
      await deleteDocRecursive(doc.ref);
    }
  }
  await docRef.delete();
}

async function run() {
  console.log('🔍 Chargement des utilisateurs Firestore...');
  const usersSnap = await db.collection('users').get();
  if (usersSnap.empty) {
    console.log('Aucun utilisateur trouvé.');
    return;
  }

  // Identifier les utilisateurs à conserver
  let demoDoc = null;
  const toDelete = [];

  for (const doc of usersSnap.docs) {
    const data = doc.data();
    const email = (data.email || '').toLowerCase();
    const isDemo = !!data.isDemo;

    const keep = email === DEMO_EMAIL.toLowerCase() || isDemo;
    if (keep) {
      if (!demoDoc) demoDoc = doc; // Premier trouvé
      console.log(`✅ Conserver: ${doc.id} (email=${email}, isDemo=${isDemo})`);
    } else {
      if (!onlyUserId || onlyUserId !== doc.id) {
        toDelete.push(doc);
      }
    }
  }

  if (onlyUserId) {
    const onlyRef = db.collection('users').doc(onlyUserId);
    const onlyData = await onlyRef.get();
    if (!onlyData.exists) {
      console.error(`UID spécifique introuvable: ${onlyUserId}`);
      process.exit(1);
    }
    console.log(`Mode --only-user: purge uniquement ${onlyUserId}`);
    // Remplacer la liste par tous sauf celui demandé
    toDelete.length = 0; // vide
    const usersSnap2 = await db.collection('users').get();
    for (const d of usersSnap2.docs) {
      if (d.id === onlyUserId) continue;
      const data = d.data();
      const email = (data.email || '').toLowerCase();
      const isDemo = !!data.isDemo;
      if (!(email === DEMO_EMAIL.toLowerCase() || isDemo)) {
        toDelete.push(d);
      }
    }
  }

  console.log(`\nRésumé: ${toDelete.length} utilisateur(s) à supprimer (hors demo).`);
  if (!doConfirm) {
    console.log('Dry-run (aucune suppression). Ajoute --confirm pour exécuter.');
    toDelete.forEach(d => console.log(`🗑  (DRY) ${d.id}`));
    return;
  }

  console.log('🚨 CONFIRMATION ACTIVE: suppression en cours...');
  for (const doc of toDelete) {
    console.log(`🗑  Suppression récursive utilisateur ${doc.id} ...`);
    await deleteDocRecursive(doc.ref);
  }
  console.log('✅ Purge terminée. Conserver uniquement compte demo.');
}

run().catch(e => {
  console.error('Erreur purge:', e);
  process.exit(1);
});
