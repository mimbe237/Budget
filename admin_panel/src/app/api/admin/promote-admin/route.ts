import admin from 'firebase-admin';
import { NextRequest } from 'next/server';

function initAdmin() {
  if (admin.apps.length === 0) {
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    let privateKey = process.env.FIREBASE_PRIVATE_KEY;
    if (privateKey && privateKey.includes('\\n')) privateKey = privateKey.replace(/\\n/g, '\n');
    if (!projectId || !clientEmail || !privateKey) throw new Error('Missing service account env vars');
    admin.initializeApp({ credential: admin.credential.cert({ projectId, clientEmail, privateKey }) });
  }
}

/**
 * Route temporaire pour promouvoir un utilisateur en admin
 * À SUPPRIMER après usage pour des raisons de sécurité
 */
export async function POST(req: NextRequest) {
  try {
    initAdmin();
    
    const body = await req.json();
    const { email, secret } = body;
    
    // Secret temporaire pour éviter les abus
    const TEMP_SECRET = process.env.ADMIN_PROMOTION_SECRET || 'CHANGE_ME_IN_PRODUCTION';
    
    if (secret !== TEMP_SECRET) {
      return new Response(JSON.stringify({ ok: false, error: 'Invalid secret' }), { status: 403 });
    }
    
    if (!email) {
      return new Response(JSON.stringify({ ok: false, error: 'Email required' }), { status: 400 });
    }
    
    // Récupérer l'utilisateur par email
    const userRecord = await admin.auth().getUserByEmail(email);
    
    // Définir les custom claims
    await admin.auth().setCustomUserClaims(userRecord.uid, {
      admin: true,
      role: 'admin'
    });
    
    return new Response(JSON.stringify({ 
      ok: true, 
      message: `User ${email} promoted to admin successfully. Please sign out and sign in again.`,
      uid: userRecord.uid
    }), { status: 200 });
    
  } catch (e: any) {
    return new Response(JSON.stringify({ ok: false, error: e.message }), { status: 500 });
  }
}
