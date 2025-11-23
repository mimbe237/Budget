#!/usr/bin/env node
/**
 * Script de promotion admin via Firebase Admin SDK.
 * Usage:
 *  node scripts/setAdminClaim.js --email mimb.nout@gmail.com --file ./service-account.json
 * OU avec variables d'environnement:
 *  FIREBASE_PROJECT_ID=xxx FIREBASE_CLIENT_EMAIL=xxx FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n..." node scripts/setAdminClaim.js --email mimb.nout@gmail.com
 */

const fs = require('fs');
const path = require('path');
const admin = require('firebase-admin');

function parseArgs() {
  const args = process.argv.slice(2);
  const out = {};
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--email') out.email = args[++i];
    else if (args[i] === '--file') out.file = args[++i];
  }
  return out;
}

async function initAdmin(opts) {
  if (admin.apps.length > 0) return;
  let { projectId, clientEmail, privateKey } = opts;
  if (opts.file && fs.existsSync(opts.file)) {
    const json = JSON.parse(fs.readFileSync(opts.file, 'utf8'));
    projectId = json.project_id;
    clientEmail = json.client_email;
    privateKey = json.private_key;
  }
  if (!projectId) projectId = process.env.FIREBASE_PROJECT_ID;
  if (!clientEmail) clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  if (!privateKey) privateKey = process.env.FIREBASE_PRIVATE_KEY;
  if (privateKey && privateKey.includes('\\n')) privateKey = privateKey.replace(/\\n/g, '\n');
  if (!projectId || !clientEmail || !privateKey) {
    throw new Error('Missing service account credentials. Provide --file or env vars.');
  }
  admin.initializeApp({ credential: admin.credential.cert({ projectId, clientEmail, privateKey }) });
}

(async () => {
  try {
    const { email, file } = parseArgs();
    if (!email) throw new Error('Missing --email');
    await initAdmin({ file });
    const user = await admin.auth().getUserByEmail(email);
    await admin.auth().setCustomUserClaims(user.uid, { admin: true, role: 'admin' });
    console.log(`✅ Utilisateur ${email} promu admin (uid=${user.uid}). Déconnectez-vous et reconnectez-vous pour rafraîchir le token.`);
    process.exit(0);
  } catch (e) {
    console.error('❌ Erreur:', e.message);
    process.exit(1);
  }
})();
