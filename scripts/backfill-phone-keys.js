/**
 * Script de migration pour backfiller le champ phoneCompositeKey
 * et (optionnellement) normaliser les numéros de téléphone existants.
 *
 * Utilisation:
 *   node scripts/backfill-phone-keys.js            # Dry-run (aucune écriture)
 *   node scripts/backfill-phone-keys.js --apply    # Applique les modifications
 *   node scripts/backfill-phone-keys.js --apply --normalize
 *
 * Options:
 *   --apply       Applique réellement les mises à jour (sinon dry-run)
 *   --normalize   Reformate les numéros de téléphone existants (espaces cohérents)
 *
 * Prérequis:
 *   - GOOGLE_APPLICATION_CREDENTIALS défini dans .env.local
 *     ou serviceAccountKey.json à la racine du projet.
 *
 * Le script traite les documents par lots de 400 pour rester sous la limite
 * des batch writes Firestore (500).
 */

const admin = require('firebase-admin');
const path = require('path');

const args = process.argv.slice(2);
const APPLY_CHANGES = args.includes('--apply');
const NORMALIZE_PHONE = args.includes('--normalize');

// Initialiser Firebase Admin (copie de scripts existants)
if (!admin.apps.length) {
  try {
    if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      const serviceAccount = JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
    } else {
      const serviceAccountPath = path.join(__dirname, '..', 'serviceAccountKey.json');
      const serviceAccount = require(serviceAccountPath);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
    }
  } catch (error) {
    console.error('⚠️  Impossible d\'initialiser Firebase Admin.');
    console.error('💡 Options de configuration:');
    console.error('   1. Définir GOOGLE_APPLICATION_CREDENTIALS dans .env.local');
    console.error('   2. Placer serviceAccountKey.json à la racine du projet');
    console.error('\n📖 Guide: https://firebase.google.com/docs/admin/setup');
    console.error('\nErreur:', error.message);
    process.exit(1);
  }
}

const firestore = admin.firestore();

function buildPhoneCompositeKey(countryCode, phoneNumber) {
  if (!phoneNumber) {
    return null;
  }
  const digits = phoneNumber.replace(/\D/g, '');
  if (!digits) {
    return null;
  }
  const normalizedCountry = (countryCode || 'XX').toUpperCase();
  return `${normalizedCountry}:${digits}`;
}

function formatPhoneNumber(countryCode, phoneNumber) {
  if (!phoneNumber) return phoneNumber || '';
  const digits = phoneNumber.replace(/\D/g, '');
  if (!digits) return phoneNumber || '';

  const iso = (countryCode || '').toUpperCase();
  if (iso === 'FR') {
    return digits.replace(/(\d{2})(?=\d)/g, '$1 ').trim();
  }
  if (iso === 'BE') {
    if (digits.length === 9) {
      return digits.replace(/(\d{2})(\d{3})(\d{2})(\d{2})/, '$1 $2 $3 $4').trim();
    }
    return digits.replace(/(\d{3})(?=\d)/g, '$1 ').trim();
  }
  if (iso === 'US' || iso === 'CA') {
    if (digits.length >= 10) {
      return digits.replace(/(\d{3})(\d{3})(\d{4}).*/, '($1) $2-$3');
    }
    if (digits.length >= 6) {
      return digits.replace(/(\d{3})(\d{3}).*/, '($1) $2');
    }
  }
  if (iso === 'CM') {
    if (digits.length >= 9) {
      return digits.replace(/(\d{3})(\d{3})(\d{3}).*/, '$1 $2 $3');
    }
  }

  return digits.replace(/(\d{2})(?=\d)/g, '$1 ').trim();
}

async function backfillPhoneCompositeKeys() {
  console.log('📱  Démarrage du backfill des phoneCompositeKey');
  console.log(`   Mode: ${APPLY_CHANGES ? 'APPLY' : 'DRY-RUN'}${NORMALIZE_PHONE ? ' + normalize' : ''}\n`);

  const snapshot = await firestore.collection('users').get();
  console.log(`🔎 Documents trouvés: ${snapshot.size}`);

  let processed = 0;
  let updated = 0;
  let normalized = 0;

  let batch = firestore.batch();
  let operationsInBatch = 0;

  for (const doc of snapshot.docs) {
    processed += 1;
    const data = doc.data() || {};
    const ref = doc.ref;

    const currentCountry = typeof data.phoneCountryCode === 'string' ? data.phoneCountryCode.trim() : '';
    const currentPhone = typeof data.phoneNumber === 'string' ? data.phoneNumber.trim() : '';
    const currentKey = data.phoneCompositeKey || null;

    const newKey = buildPhoneCompositeKey(currentCountry, currentPhone);
    const update = {};
    let willUpdate = false;

    if (newKey !== currentKey) {
      update.phoneCompositeKey = newKey;
      willUpdate = true;
    }

    if (NORMALIZE_PHONE && currentPhone) {
      const formatted = formatPhoneNumber(currentCountry, currentPhone);
      if (formatted && formatted !== currentPhone) {
        update.phoneNumber = formatted;
        willUpdate = true;
        normalized += 1;
      }
    }

    if (willUpdate) {
      updated += 1;
      console.log(
        `${APPLY_CHANGES ? '✏️ ' : 'ℹ️ '} ${doc.id} -> compositeKey: ${currentKey} => ${newKey || 'null'}${NORMALIZE_PHONE && update.phoneNumber ? `, phone: "${currentPhone}" => "${update.phoneNumber}"` : ''}`
      );

      if (APPLY_CHANGES) {
        batch.update(ref, update);
        operationsInBatch += 1;
        if (operationsInBatch >= 400) {
          await batch.commit();
          batch = firestore.batch();
          operationsInBatch = 0;
        }
      }
    }
  }

  if (APPLY_CHANGES && operationsInBatch > 0) {
    await batch.commit();
  }

  console.log('\n✅ Traitement terminé');
  console.log(`   Documents parcourus : ${processed}`);
  console.log(`   Documents mis à jour : ${updated}`);
  if (NORMALIZE_PHONE) {
    console.log(`   Numéros normalisés : ${normalized}`);
  }
  console.log(`   Mode d\'exécution : ${APPLY_CHANGES ? 'Modifications appliquées' : 'Dry-run (aucune écriture)'}`);
}

backfillPhoneCompositeKeys()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('❌ Erreur lors du backfill:', error);
    process.exit(1);
  });
