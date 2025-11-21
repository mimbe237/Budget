#!/usr/bin/env node
/*
  Backfill script: mirror root /debts -> /users/{uid}/debts
  Usage:
    node scripts/backfill-debts-mirror.js [--dry-run] [--skip-existing]

  - Reads all documents from root collection "debts"
  - For each doc with a userId, writes a mirror document into users/{userId}/debts/{debtId}
  - Uses Firebase Admin SDK
  - Supports Firebase Emulator via env NEXT_PUBLIC_USE_FIREBASE_EMULATORS=1 or FIRESTORE_EMULATOR_HOST
*/

const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.resolve(process.cwd(), '.env.local') });
const admin = require('firebase-admin');

const args = new Set(process.argv.slice(2));
const DRY_RUN = args.has('--dry-run');
const SKIP_EXISTING = args.has('--skip-existing');

async function main() {
  // Emulator opt-in (helpful for local runs without prod creds)
  if (process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATORS === '1' && !process.env.FIRESTORE_EMULATOR_HOST) {
    const host = process.env.NEXT_PUBLIC_FIREBASE_EMULATORS_HOST || '127.0.0.1';
    const port = process.env.NEXT_PUBLIC_FIRESTORE_EMULATOR_PORT || '8080';
    process.env.FIRESTORE_EMULATOR_HOST = `${host}:${port}`;
    console.log(`[emulator] FIRESTORE_EMULATOR_HOST=${process.env.FIRESTORE_EMULATOR_HOST}`);
  }

  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || process.env.GCLOUD_PROJECT || process.env.FIREBASE_PROJECT || 'demo-budget';

  // If GOOGLE_APPLICATION_CREDENTIALS contains JSON content instead of a file path,
  // write it to a temp file to make Admin SDK happy (avoids ENAMETOOLONG).
  try {
    const gac = process.env.GOOGLE_APPLICATION_CREDENTIALS;
    if (gac && gac.trim().startsWith('{')) {
      const parsed = JSON.parse(gac);
      if (parsed.private_key && typeof parsed.private_key === 'string') {
        parsed.private_key = parsed.private_key.replace(/\\n/g, '\n');
      }
      const tmpDir = path.resolve(process.cwd(), '.tmp');
      if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });
      const tmpPath = path.join(tmpDir, 'serviceAccount.json');
      fs.writeFileSync(tmpPath, JSON.stringify(parsed), 'utf8');
      process.env.GOOGLE_APPLICATION_CREDENTIALS = tmpPath;
      console.log(`[gac] Wrote inline credentials JSON to ${tmpPath}`);
    }
  } catch (e) {
    console.warn('[gac] Unable to process GOOGLE_APPLICATION_CREDENTIALS:', e);
  }

  // Initialize Admin
  try {
    if (admin.apps.length === 0) {
      admin.initializeApp({ projectId });
    }
  } catch (e) {
    console.error('Failed to initialize Firebase Admin:', e);
    process.exit(1);
  }

  const db = admin.firestore();

  const pageSize = 500;
  let processed = 0;
  let copied = 0;
  let skipped = 0;
  let missingUser = 0;
  let lastDoc = null;

  console.log(`Starting backfill (dryRun=${DRY_RUN}, skipExisting=${SKIP_EXISTING})…`);

  while (true) {
    let query = db.collection('debts').orderBy(admin.firestore.FieldPath.documentId()).limit(pageSize);
    if (lastDoc) query = query.startAfter(lastDoc);

    const snapshot = await query.get();
    if (snapshot.empty) break;

    const batch = db.batch();

    for (const doc of snapshot.docs) {
      processed++;
      const data = doc.data() || {};
      const userId = data.userId;
      if (!userId) {
        missingUser++;
        continue;
      }
      const mirrorRef = db.doc(`users/${userId}/debts/${doc.id}`);
      let shouldCopy = true;
      if (SKIP_EXISTING) {
        const existing = await mirrorRef.get();
        if (existing.exists) {
          skipped++;
          shouldCopy = false;
        }
      }
      if (shouldCopy) {
        copied++;
        if (!DRY_RUN) {
          batch.set(mirrorRef, data, { merge: true });
        }
      }
    }

    if (!DRY_RUN) {
      await batch.commit();
    }

    lastDoc = snapshot.docs[snapshot.docs.length - 1];
    if (snapshot.size < pageSize) break; // done
  }

  console.log('Backfill complete:');
  console.log(`  processed: ${processed}`);
  console.log(`  copied:    ${copied}`);
  console.log(`  skipped:   ${skipped}`);
  console.log(`  no userId: ${missingUser}`);

  if (DRY_RUN) {
    console.log('Dry run: no writes were performed. Re-run without --dry-run to apply changes.');
  }
}

main().catch((e) => {
  console.error('Backfill failed:', e);
  process.exit(1);
});
