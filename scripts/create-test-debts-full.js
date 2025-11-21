#!/usr/bin/env node

/**
 * Script complet pour créer 4 dettes de test AVEC échéanciers
 * Utilise directement les fonctions Cloud Functions en local
 * Usage: node scripts/create-test-debts-full.js <userId>
 */

const admin = require('firebase-admin');
const { buildSchedule: computeSchedule } = require('../functions/lib/lib/amortization');

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

const roundMoney = (value, precision = 2) => {
  const factor = Math.pow(10, precision);
  return Math.round(value * factor) / factor;
};

const toTimestamp = (value) => admin.firestore.Timestamp.fromDate(value);

async function createDebtWithSchedule(userId, debtData) {
  const debtTitle = debtData.title;
  
  try {
    // 1. Créer la dette
    const docRef = db.collection('debts').doc();
    const now = admin.firestore.FieldValue.serverTimestamp();

    await docRef.set({
      ...debtData,
      userId,
      startDate: toTimestamp(debtData.startDate),
      contractFilePath: null,
      status: 'EN_COURS',
      remainingPrincipal: debtData.principalInitial,
      nextDueDate: null,
      nextDueAmount: null,
      createdAt: now,
      updatedAt: now,
    });

    console.log(`✅ Dette créée: ${debtTitle} (ID: ${docRef.id})`);
    
    // 2. Construire l'échéancier
    console.log(`⏳ Construction de l'échéancier pour: ${debtTitle}...`);
    
    const buildInput = {
      principal: debtData.principalInitial,
      annualRate: debtData.annualRate,
      rateType: debtData.rateType,
      amortizationMode: debtData.amortizationMode,
      totalPeriods: debtData.totalPeriods,
      gracePeriods: debtData.gracePeriods,
      balloonPct: debtData.balloonPct,
      monthlyInsurance: debtData.monthlyInsurance,
      upfrontFees: debtData.upfrontFees,
      frequency: debtData.frequency,
      startDate: debtData.startDate,
      variableRates: undefined,
      recalcEachPeriod: debtData.recalcEachPeriod,
    };
    
    const scheduleLines = computeSchedule(buildInput);
    
    // 3. Écrire les échéances dans Firestore (batch de 500 max)
    const batchSize = 450; // Safe limit under 500
    let currentBatch = db.batch();
    let operationCount = 0;
    
    for (let idx = 0; idx < scheduleLines.length; idx++) {
      const line = scheduleLines[idx];
      const scheduleRef = db.collection('debtSchedules').doc();
      
      currentBatch.set(scheduleRef, {
        debtId: docRef.id,
        periodIndex: idx + 1,
        dueDate: toTimestamp(line.dueDate),
        principalDue: roundMoney(line.principalDue),
        interestDue: roundMoney(line.interestDue),
        insuranceDue: roundMoney(line.insuranceDue),
        feesDue: roundMoney(line.feesDue),
        totalDue: roundMoney(line.totalDue),
        totalPaid: 0,
        principalPaid: 0,
        interestPaid: 0,
        feesPaid: 0,
        insurancePaid: 0,
        remainingPrincipalAfter: roundMoney(line.remainingPrincipalAfter),
        lastPaidAt: null,
        status: 'A_VENIR',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      
      operationCount++;
      
      // Commit batch when reaching limit
      if (operationCount >= batchSize) {
        await currentBatch.commit();
        currentBatch = db.batch();
        operationCount = 0;
        console.log(`   📝 ${idx + 1}/${scheduleLines.length} échéances écrites...`);
      }
    }
    
    // Commit remaining operations
    if (operationCount > 0) {
      await currentBatch.commit();
    }
    
    console.log(`✅ ${scheduleLines.length} échéances créées pour: ${debtTitle}`);
    
    // 4. Mettre à jour la dette avec les infos de prochaine échéance
    const firstSchedule = scheduleLines[0];
    if (firstSchedule) {
      await docRef.update({
        nextDueDate: toTimestamp(firstSchedule.dueDate),
        nextDueAmount: roundMoney(firstSchedule.totalDue),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      console.log(`✅ Dette mise à jour avec prochaine échéance: ${debtTitle}`);
    }
    
    return {
      debtId: docRef.id,
      title: debtTitle,
      scheduleCount: scheduleLines.length,
    };
  } catch (error) {
    console.error(`❌ Erreur pour "${debtTitle}":`, error.message);
    console.error(error.stack);
    throw error;
  }
}

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.error('❌ Usage: node scripts/create-test-debts-full.js <userId>');
    console.error('   Exemple: node scripts/create-test-debts-full.js abc123xyz');
    process.exit(1);
  }

  const userId = args[0];
  
  console.log(`\n🚀 Création de ${TEST_DEBTS.length} dettes de test COMPLÈTES pour: ${userId}\n`);

  // Verify user exists
  try {
    const userDoc = await db.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      console.error(`❌ Utilisateur non trouvé: ${userId}`);
      console.error('💡 Pour lister les utilisateurs disponibles, exécutez:');
      console.error('   firebase firestore:get users --limit 10');
      process.exit(1);
    }
    const userData = userDoc.data();
    console.log(`✅ Utilisateur trouvé: ${userData.email || userData.displayName || userId}\n`);
  } catch (error) {
    console.error(`❌ Erreur vérification utilisateur:`, error.message);
    process.exit(1);
  }

  const results = [];
  let successCount = 0;

  for (let i = 0; i < TEST_DEBTS.length; i++) {
    const debtData = TEST_DEBTS[i];
    console.log(`\n[${i + 1}/${TEST_DEBTS.length}] Traitement: ${debtData.title}`);
    console.log('─'.repeat(60));
    
    try {
      const result = await createDebtWithSchedule(userId, debtData);
      results.push(result);
      successCount++;
      
      // Small delay between creations to avoid rate limits
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.error(`❌ Échec pour ${debtData.title}`);
      results.push({ debtId: null, title: debtData.title, error: error.message });
    }
  }

  console.log('\n' + '═'.repeat(60));
  console.log(`✅ RÉSUMÉ: ${successCount}/${TEST_DEBTS.length} dettes créées avec succès!`);
  console.log('═'.repeat(60));
  
  console.log('\n📋 Détails des dettes créées:\n');
  results.forEach((result, idx) => {
    if (result.debtId) {
      console.log(`${idx + 1}. ✅ ${result.title}`);
      console.log(`   ID: ${result.debtId}`);
      console.log(`   Échéances: ${result.scheduleCount}`);
    } else {
      console.log(`${idx + 1}. ❌ ${result.title}`);
      console.log(`   Erreur: ${result.error || 'Inconnue'}`);
    }
  });
  
  if (successCount > 0) {
    console.log('\n✨ Les dettes sont prêtes à être consultées sur /debts\n');
  }
  
  process.exit(0);
}

main().catch((error) => {
  console.error('\n❌ Erreur fatale:', error);
  console.error(error.stack);
  process.exit(1);
});
