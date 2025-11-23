import { NextRequest } from 'next/server';
import admin from 'firebase-admin';

function initAdmin() {
  if (admin.apps.length === 0) {
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    let privateKey = process.env.FIREBASE_PRIVATE_KEY;
    if (privateKey && privateKey.includes('\\n')) {
      privateKey = privateKey.replace(/\\n/g, '\n');
    }
    if (!projectId || !clientEmail || !privateKey) {
      throw new Error('Missing service account env vars (FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY)');
    }
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey,
      }),
    });
  }
}

export async function POST(req: NextRequest) {
  try {
    initAdmin();
    const { uid, makeAdmin } = await req.json();
    if (!uid) {
      return new Response(JSON.stringify({ ok: false, error: 'uid missing' }), { status: 400 });
    }
    await admin.auth().setCustomUserClaims(uid, { admin: !!makeAdmin });
    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  } catch (e: any) {
    return new Response(JSON.stringify({ ok: false, error: e.message }), { status: 500 });
  }
}
