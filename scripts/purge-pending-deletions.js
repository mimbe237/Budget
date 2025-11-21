#!/usr/bin/env node

/*
  Script de purge : supprime tous les comptes marqués pending_deletion dont la date est dépassée.
  Usage : node scripts/purge-pending-deletions.js
*/

const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.resolve(process.cwd(), '.env.local') });
const admin = require('firebase-admin');

const BATCH_SIZE = 500;
const ROOT_COLLECTIONS_TO_CLEAN = ['debts'];

function ensureTmpServiceAccount() {
  const gac = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (gac && gac.trim().startsWith('{')) {
    const parsed = JSON.parse(gac);
    if (parsed.private_key && typeof parsed.private_key === 'string') {
      parsed.private_key = parsed.private_key.replace(/\\n/g, '\n');
    }
    const tmpDir = path.resolve(process.cwd(), '.tmp');
    if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });
    const tmpPath = path.join(tmpDir, 'serviceAccount.purge.json');
    fs.writeFileSync(tmpPath, JSON.stringify(parsed), 'utf8');
    process.env.GOOGLE_APPLICATION_CREDENTIALS = tmpPath;
    return tmpPath;
  }
  return gac;
}

function initAdmin() {
  ensureTmpServiceAccount();
  if (admin.apps.length === 0) {
    admin.initializeApp();
  }
  return admin.firestore();
}

async function deleteCollectionBatch(collectionRef) {
  const snapshot = await collectionRef.limit(BATCH_SIZE).get();
  if (snapshot.empty) return;

  const batch = collectionRef.firestore.batch();
  for (const doc of snapshot.docs) {
    const childCollections = await doc.ref.listCollections();
    for (const child of childCollections) {
      await deleteCollectionBatch(child);
    }
    batch.delete(doc.ref);
  }
  await batch.commit();
  if (snapshot.size >= BATCH_SIZE) {
    await deleteCollectionBatch(collectionRef);
  }
}

async function deleteDependentDocuments(firestore, collectionPath, field, value) {
  while (true) {
    const snapshot = await firestore
      .collection(collectionPath)
      .where(field, '==', value)
      .limit(BATCH_SIZE)
      .get();
    if (snapshot.empty) return;
    const batch = firestore.batch();
    snapshot.docs.forEach((doc) => batch.delete(doc.ref));
    await batch.commit();
  }
}

async function purgeUser(firestore, userDoc) {
  const userId = userDoc.id;
  const data = userDoc.data();
  const email = (data.email as string | undefined)?.toLowerCase();

  const subcollections = await userDoc.ref.listCollections();
  for (const subcollection of subcollections) {
    await deleteCollectionBatch(subcollection);
  }

  await userDoc.ref.delete();

  if (email) {
    await firestore.collection('deletedEmails').doc(email).set({
      deletedAt: new Date().toISOString(),
      userId,
    });
  }

  for (const path of ROOT_COLLECTIONS_TO_CLEAN) {
    await deleteDependentDocuments(firestore, path, 'userId', userId);
  }
}

async function main() {
  const firestore = initAdmin();
  const nowIso = new Date().toISOString();
  console.log('Purging expired pending deletions before', nowIso);

  const snapshot = await firestore
    .collection('users')
    .where('status', '==', 'pending_deletion')
    .where('deletionExpiresAt', '<=', nowIso)
    .get();

  if (snapshot.empty) {
    console.log('No expired deletions to process.');
    return;
  }

  console.log(`Processing ${snapshot.size} expired pending deletion(s)...`);
  for (const doc of snapshot.docs) {
    try {
      await purgeUser(firestore, doc);
      console.log(`Deleted account ${doc.id}`);
    } catch (error) {
      console.error(`Failed to purge ${doc.id}:`, error);
    }
  }
}

main().catch((error) => {
  console.error('Purge failed:', error);
  process.exitCode = 1;
});
