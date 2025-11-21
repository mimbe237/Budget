#!/usr/bin/env node
'use strict';

const path = require('path');
const fs = require('fs');
const admin = require('firebase-admin');

require('dotenv').config({ path: path.resolve(process.cwd(), '.env.local') });

const argv = process.argv.slice(2);
const flags = {
  dryRun: argv.includes('--dry-run'),
  userId: undefined,
};
for (const arg of argv) {
  if (arg.startsWith('--userId=')) {
    flags.userId = arg.split('=')[1];
  }
}

const DEFAULT_USER_ID = 'test-debt-user';
const TEST_USER_ID =
  flags.userId ||
  process.env.TEST_USER_UID ||
  process.env.NEXT_PUBLIC_TEST_USER_UID ||
  DEFAULT_USER_ID;
const PROJECT_ID =
  process.env.FIREBASE_PROJECT_ID ||
  process.env.GCLOUD_PROJECT ||
  process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ||
  'studio-3821270625-cd276';

const sampleDebtTemplates = (timestamp) => [
  {
    title: 'Studio setup • emprunt',
    type: 'EMPRUNT',
    counterparty: 'Banque de Montfort',
    currency: 'EUR',
    principalInitial: 150000,
    annualRate: 0.085,
    rateType: 'FIXE',
    amortizationMode: 'ANNUITE',
    totalPeriods: 24,
    frequency: 'MENSUEL',
    startDate: admin.firestore.Timestamp.fromDate(new Date('2025-11-01')),
    gracePeriods: 0,
    balloonPct: 0,
    upfrontFees: 0,
    monthlyInsurance: 0,
    prepaymentPenaltyPct: 0,
    variableIndexCode: null,
    variableMarginBps: null,
    recalcEachPeriod: false,
    status: 'EN_COURS',
    remainingPrincipal: 105000,
    nextDueDate: admin.firestore.Timestamp.fromDate(new Date('2025-12-01')),
    nextDueAmount: 5500,
    contractFilePath: null,
  },
  {
    title: 'Crédit véhicule • prêt',
    type: 'PRET',
    counterparty: 'Crédit Local',
    currency: 'XAF',
    principalInitial: 360000,
    annualRate: 0.072,
    rateType: 'FIXE',
    amortizationMode: 'PRINCIPAL_CONSTANT',
    totalPeriods: 18,
    frequency: 'MENSUEL',
    startDate: admin.firestore.Timestamp.fromDate(new Date('2025-09-15')),
    gracePeriods: 1,
    balloonPct: 0,
    upfrontFees: 0,
    monthlyInsurance: 500,
    prepaymentPenaltyPct: 0.01,
    variableIndexCode: null,
    variableMarginBps: null,
    recalcEachPeriod: false,
    status: 'EN_RETARD',
    remainingPrincipal: 182000,
    nextDueDate: admin.firestore.Timestamp.fromDate(new Date('2025-11-15')),
    nextDueAmount: 18000,
    contractFilePath: null,
  },
];

const deleteQuery = async (query, label, batchSize = 200) => {
  let deleted = 0;
  while (true) {
    const snapshot = await query.limit(batchSize).get();
    if (snapshot.empty) break;
    const batch = query.firestore.batch();
    snapshot.docs.forEach((doc) => batch.delete(doc.ref));
    await batch.commit();
    deleted += snapshot.size;
    if (snapshot.size < batchSize) break;
  }
  console.log(`  deleted ${deleted} documents from ${label}`);
};

(async () => {
  if (process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATORS === '1' && !process.env.FIRESTORE_EMULATOR_HOST) {
    const host = process.env.NEXT_PUBLIC_FIREBASE_EMULATORS_HOST || '127.0.0.1';
    const port = process.env.NEXT_PUBLIC_FIREBASE_EMULATORS_PORT || '8080';
    process.env.FIRESTORE_EMULATOR_HOST = `${host}:${port}`;
    process.env.FIREBASE_AUTH_EMULATOR_HOST = `${host}:${process.env.NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_PORT || '9099'}`;
    console.log(`[emulator] FIRESTORE_EMULATOR_HOST=${process.env.FIRESTORE_EMULATOR_HOST}`);
  }

  const credentialEnv = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (credentialEnv && credentialEnv.trim().startsWith('{')) {
    try {
      const parsed = JSON.parse(credentialEnv);
      if (parsed.private_key) {
        parsed.private_key = parsed.private_key.replace(/\\n/g, '\n');
      }
      const tmpDir = path.resolve(process.cwd(), '.tmp');
      if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });
      const tmpPath = path.join(tmpDir, 'serviceAccount.json');
      fs.writeFileSync(tmpPath, JSON.stringify(parsed), 'utf8');
      process.env.GOOGLE_APPLICATION_CREDENTIALS = tmpPath;
    } catch (error) {
      console.warn('[seed-debts] Unable to rewrite inline GOOGLE_APPLICATION_CREDENTIALS:', error);
    }
  }

  if (admin.apps.length === 0) {
    admin.initializeApp({ projectId: PROJECT_ID });
  }

  const db = admin.firestore();
  const now = admin.firestore.Timestamp.now();
  const userRef = db.collection('users').doc(TEST_USER_ID);

  console.log(`Seeding debts for user ${TEST_USER_ID} in project ${PROJECT_ID}`);
  if (flags.dryRun) console.log('Dry run mode: no writes will be committed.');

  await userRef.set(
    {
      displayCurrency: 'EUR',
      locale: 'fr-FR',
      onboardingCompleted: true,
      updatedAt: now,
    },
    { merge: true }
  );

  await deleteQuery(
    db.collection('debts').where('userId', '==', TEST_USER_ID),
    'root /debts'
  );
  await deleteQuery(
    userRef.collection('debts'),
    `users/${TEST_USER_ID}/debts`
  );

  const samples = sampleDebtTemplates(now);
  let created = 0;

  for (const template of samples) {
    const debtRef = db.collection('debts').doc();
    const debtData = {
      ...template,
      userId: TEST_USER_ID,
      createdAt: now,
      updatedAt: now,
    };

    if (!flags.dryRun) {
      await debtRef.set(debtData);
      await userRef.collection('debts').doc(debtRef.id).set(debtData);
    }
    created += 1;
  }

  console.log(`  ${flags.dryRun ? 'would create' : 'created'} ${created} debt records`);
  if (flags.dryRun) {
    console.log('Dry run complete. Remove --dry-run to apply changes.');
  }
  console.log('Seed script finished.');
})().catch((error) => {
  console.error('Seed script failed:', error);
  process.exit(1);
});
