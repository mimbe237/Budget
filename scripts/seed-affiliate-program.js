/**
 * Seed script to initialize affiliate program rules in Firestore
 * Run with: node seed-affiliate-program.js
 * 
 * Utilise GOOGLE_APPLICATION_CREDENTIALS depuis .env.local
 */

const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

// Lire les credentials depuis .env.local
const envPath = path.join(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const credMatch = envContent.match(/GOOGLE_APPLICATION_CREDENTIALS='(.+?)'/s);

if (!credMatch) {
  console.error('❌ GOOGLE_APPLICATION_CREDENTIALS non trouvé dans .env.local');
  process.exit(1);
}

// Parse en plusieurs étapes pour gérer les échappements
let credString = credMatch[1];
// D'abord remplacer les doubles backslash par un seul
credString = credString.replace(/\\\\n/g, '\\n');
// Puis parser le JSON (qui interprétera \n correctement)
const serviceAccount = JSON.parse(credString);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

const programRules = [
  {
    tier: 'BRONZE',
    defaultRatePct: 10,
    fixedBounty: 2000, // 2000 XAF for signup
    recurringMonths: 3,
    minPayout: 20000, // 20,000 XAF minimum
    cookieDays: 60,
    attribution: 'LAST_CLICK',
    conversionsForUpgrade: 10,
  },
  {
    tier: 'SILVER',
    defaultRatePct: 15,
    fixedBounty: 5000, // 5000 XAF for signup
    recurringMonths: 6,
    minPayout: 20000,
    cookieDays: 90,
    attribution: 'LAST_CLICK',
    conversionsForUpgrade: 50,
  },
  {
    tier: 'GOLD',
    defaultRatePct: 20,
    fixedBounty: 10000, // 10,000 XAF for signup
    recurringMonths: 12,
    minPayout: 20000,
    cookieDays: 90,
    attribution: 'LAST_CLICK',
    conversionsForUpgrade: 100,
  },
  {
    tier: 'PLATINUM',
    defaultRatePct: 25,
    fixedBounty: 20000, // 20,000 XAF for signup
    recurringMonths: 24,
    minPayout: 20000,
    cookieDays: 120,
    attribution: 'FIRST_CLICK',
    conversionsForUpgrade: null, // Max tier
  },
];

async function seedProgramRules() {
  console.log('🌱 Initialisation du programme d\'affiliation...\n');

  // Créer un seul document dans la collection affiliateProgram
  const programDoc = {
    name: 'Budget Pro Affiliate Program',
    tiers: {},
    globalSettings: {
      minPayout: 20000, // 20,000 XAF minimum pour tous
      defaultCookieDays: 90,
      antifraudEnabled: true,
      autoApproval: false, // Les affiliés doivent être approuvés manuellement
    },
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  };

  // Ajouter les tiers
  for (const rule of programRules) {
    programDoc.tiers[rule.tier] = {
      defaultRatePct: rule.defaultRatePct,
      fixedBounty: rule.fixedBounty,
      recurringMonths: rule.recurringMonths,
      cookieDays: rule.cookieDays,
      attribution: rule.attribution,
      conversionsForUpgrade: rule.conversionsForUpgrade,
    };
    console.log(`  ✓ ${rule.tier}: ${rule.defaultRatePct}% commission, ${rule.fixedBounty} XAF bounty, ${rule.recurringMonths} mois récurrents`);
  }

  await db.collection('affiliateProgram').doc('default').set(programDoc, { merge: true });
  
  console.log('\n✅ Programme d\'affiliation initialisé avec succès!');
  console.log('📍 Collection: affiliateProgram/default');
}

seedProgramRules()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Error seeding program rules:', error);
    process.exit(1);
  });
