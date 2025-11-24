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

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ ok: false, error: 'Missing bearer token' }), { status: 401 });
    }
    const idToken = authHeader.substring(7);
    initAdmin();
    const decoded = await admin.auth().verifyIdToken(idToken);
    const adminClaim = decoded.admin === true || decoded.role === 'admin';
    return new Response(
      JSON.stringify({
        ok: true,
        uid: decoded.uid,
        email: decoded.email || null,
        admin: adminClaim,
        role: decoded.role || (adminClaim ? 'admin' : 'user'),
        claims: decoded,
      }),
      { status: 200 }
    );
  } catch (e: any) {
    return new Response(JSON.stringify({ ok: false, error: e.message }), { status: 500 });
  }
}
