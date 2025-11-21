#!/usr/bin/env node

/**
 * Script to create 4 test debts with schedules
 * Usage: node scripts/create-test-debts.js <userId>
 */

const admin = require('firebase-admin');

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

const TEST_DEBTS = [
  {
    type: 'EMPRUNT',
    title: 'Prêt immobilier - Test 1',
    counterparty: 'Banque XYZ',
    currency: 'XAF',
    principalInitial: 10000000,
    annualRate: 0.055,
    rateType: 'FIXE',
    amortizationMode: 'ANNUITE',
    totalPeriods: 240, // 20 ans
    frequency: 'MENSUEL',
    startDate: new Date('2025-01-01'),
    gracePeriods: 0,
    balloonPct: 0,
    upfrontFees: 200000,
    monthlyInsurance: 15000,
    prepaymentPenaltyPct: 0.01,
    variableIndexCode: null,
    variableMarginBps: null,
    recalcEachPeriod: false,
  },
  {
    type: 'EMPRUNT',
    title: 'Crédit automobile - Test 2',
    counterparty: 'Société de crédit ABC',
    currency: 'XAF',
    principalInitial: 5000000,
    annualRate: 0.08,
    rateType: 'FIXE',
    amortizationMode: 'ANNUITE',
    totalPeriods: 60, // 5 ans
    frequency: 'MENSUEL',
    startDate: new Date('2025-02-01'),
    gracePeriods: 0,
    balloonPct: 0,
    upfrontFees: 100000,
    monthlyInsurance: 8000,
    prepaymentPenaltyPct: 0.02,
    variableIndexCode: null,
    variableMarginBps: null,
    recalcEachPeriod: false,
  },
  {
    type: 'PRET',
    title: 'Prêt à un ami - Test 3',
    counterparty: 'Jean Dupont',
    currency: 'EUR',
    principalInitial: 5000,
    annualRate: 0.02,
    rateType: 'FIXE',
    amortizationMode: 'ANNUITE',
    totalPeriods: 12, // 1 an
    frequency: 'MENSUEL',
    startDate: new Date('2025-03-01'),
    gracePeriods: 0,
    balloonPct: 0,
    upfrontFees: 0,
    monthlyInsurance: 0,
    prepaymentPenaltyPct: 0,
    variableIndexCode: null,
    variableMarginBps: null,
    recalcEachPeriod: false,
  },
  {
    type: 'EMPRUNT',
    title: 'Crédit consommation - Test 4',
    counterparty: 'Banque DEF',
    currency: 'USD',
    principalInitial: 10000,
    annualRate: 0.12,
    rateType: 'FIXE',
    amortizationMode: 'PRINCIPAL_CONSTANT',
    totalPeriods: 36, // 3 ans
    frequency: 'MENSUEL',
    startDate: new Date('2025-04-01'),
    gracePeriods: 2,
    balloonPct: 0,
    upfrontFees: 500,
    monthlyInsurance: 50,
    prepaymentPenaltyPct: 0.03,
    variableIndexCode: null,
    variableMarginBps: null,
    recalcEachPeriod: false,
  },
];

async function createDebt(userId, debtData) {
  try {
    const docRef = db.collection('debts').doc();
    const now = admin.firestore.FieldValue.serverTimestamp();

    await docRef.set({
      ...debtData,
      userId,
      startDate: admin.firestore.Timestamp.fromDate(debtData.startDate),
      contractFilePath: null,
      status: 'EN_COURS',
      remainingPrincipal: debtData.principalInitial,
      nextDueDate: null,
      nextDueAmount: null,
      createdAt: now,
      updatedAt: now,
    });

    console.log(`✅ Dette créée: ${debtData.title} (ID: ${docRef.id})`);
    return docRef.id;
  } catch (error) {
    console.error(`❌ Erreur création dette "${debtData.title}":`, error.message);
    throw error;
  }
}

async function buildScheduleForDebt(debtId, debtTitle) {
  try {
    // Simulate calling buildSchedule Cloud Function
    // In production, this should be called via callable function
    console.log(`⏳ Construction échéancier pour: ${debtTitle}...`);
    
    // For now, we just log - the buildSchedule function should be called from the frontend
    // or via admin SDK if needed
    console.log(`ℹ️  Échéancier pour ${debtTitle} doit être construit via buildSchedule Cloud Function`);
    console.log(`   Exécutez: firebase functions:shell`);
    console.log(`   Puis: buildSchedule({debtId: "${debtId}"})`);
    
    return true;
  } catch (error) {
    console.error(`❌ Erreur construction échéancier "${debtTitle}":`, error.message);
    throw error;
  }
}

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.error('❌ Usage: node scripts/create-test-debts.js <userId>');
    console.error('   Exemple: node scripts/create-test-debts.js abc123xyz');
    process.exit(1);
  }

  const userId = args[0];
  
  console.log(`\n🚀 Création de ${TEST_DEBTS.length} dettes de test pour l'utilisateur: ${userId}\n`);

  // Verify user exists
  try {
    const userDoc = await db.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      console.error(`❌ Utilisateur non trouvé: ${userId}`);
      process.exit(1);
    }
    console.log(`✅ Utilisateur trouvé: ${userDoc.data().email || userId}\n`);
  } catch (error) {
    console.error(`❌ Erreur vérification utilisateur:`, error.message);
    process.exit(1);
  }

  const debtIds = [];

  for (const debtData of TEST_DEBTS) {
    try {
      const debtId = await createDebt(userId, debtData);
      debtIds.push({ id: debtId, title: debtData.title });
      
      // Small delay between creations
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      console.error(`❌ Échec pour ${debtData.title}`);
    }
  }

  console.log(`\n✅ ${debtIds.length}/${TEST_DEBTS.length} dettes créées avec succès!\n`);
  
  console.log('📋 IDs des dettes créées:');
  debtIds.forEach(({ id, title }) => {
    console.log(`   - ${title}: ${id}`);
  });

  console.log('\n⚠️  PROCHAINE ÉTAPE: Construire les échéanciers');
  console.log('   Pour chaque dette, appelez buildSchedule via Cloud Function:');
  console.log('   1. Via l\'interface web /debts/[debtId]');
  console.log('   2. Ou via Firebase Functions Shell:');
  console.log('      firebase functions:shell');
  debtIds.forEach(({ id, title }) => {
    console.log(`      buildSchedule({debtId: "${id}"}) // ${title}`);
  });
  
  console.log('\n✨ Script terminé!\n');
  process.exit(0);
}

main().catch((error) => {
  console.error('\n❌ Erreur fatale:', error);
  process.exit(1);
});
