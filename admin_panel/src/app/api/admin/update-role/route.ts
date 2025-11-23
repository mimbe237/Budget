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

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ ok: false, error: 'Missing bearer token' }), { status: 401 });
    }
    const idToken = authHeader.substring(7);
    initAdmin();
    const decoded = await admin.auth().verifyIdToken(idToken);
    const isAdmin = decoded.admin === true || decoded.role === 'admin';
    if (!isAdmin) return new Response(JSON.stringify({ ok: false, error: 'Forbidden' }), { status: 403 });

    const { uid, makeAdmin } = await req.json();
    if (!uid || typeof makeAdmin !== 'boolean') {
      return new Response(JSON.stringify({ ok: false, error: 'Invalid payload' }), { status: 400 });
    }

    // Prevent removing last admin
    if (!makeAdmin) {
      const list = await admin.auth().listUsers(1000);
      const admins = list.users.filter(u => (u.customClaims?.admin === true) || (u.customClaims?.role === 'admin'));
      if (admins.length <= 1 && admins.some(a => a.uid === uid)) {
        return new Response(JSON.stringify({ ok: false, error: 'Cannot remove last admin' }), { status: 409 });
      }
    }

    const newClaims = makeAdmin ? { admin: true, role: 'admin' } : { admin: false, role: 'user' };
    await admin.auth().setCustomUserClaims(uid, newClaims);
    return new Response(JSON.stringify({ ok: true, uid, admin: makeAdmin }), { status: 200 });
  } catch (e: any) {
    return new Response(JSON.stringify({ ok: false, error: e.message }), { status: 500 });
  }
}
