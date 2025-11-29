// Usage:
//   export GOOGLE_APPLICATION_CREDENTIALS="/path/to/service-account.json"
//   node scripts/set-admin-claim.js <uid> [role]
// Example:
//   node scripts/set-admin-claim.js abc123 admin
// Sets custom claims on the user to grant admin privileges.

const admin = require('firebase-admin');

function requireEnv(name) {
  if (!process.env[name]) {
    console.error(`Missing env: ${name}. Set GOOGLE_APPLICATION_CREDENTIALS to your service account JSON.`);
    process.exit(1);
  }
}

async function main() {
  requireEnv('GOOGLE_APPLICATION_CREDENTIALS');

  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
    });
  }

  const [uid, roleArg] = process.argv.slice(2);
  if (!uid) {
    console.error('Usage: node scripts/set-admin-claim.js <uid> [role]');
    process.exit(1);
  }

  const role = roleArg || 'admin';
  const claims = { admin: role === 'admin', role };

  try {
    await admin.auth().setCustomUserClaims(uid, claims);
    console.log(`Custom claims set for uid=${uid}:`, claims);
    const user = await admin.auth().getUser(uid);
    console.log('User tokens valid after force refresh on next sign-in:', !!user.customClaims);
  } catch (e) {
    console.error('Failed to set custom claims:', e);
    process.exit(1);
  }
}

main();
