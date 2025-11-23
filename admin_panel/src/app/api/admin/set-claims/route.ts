import { NextResponse } from 'next/server';
import admin from 'firebase-admin';

// Initialise admin SDK une seule fois
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_ADMIN_PROJECT_ID, 
        clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL, 
        privateKey: (process.env.FIREBASE_ADMIN_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
      }),
    });
  } catch (e) {
    console.error('Firebase admin init error', e);
  }
}

export async function POST(req: Request) {
  if (!process.env.FIREBASE_ADMIN_PRIVATE_KEY) {
    return NextResponse.json({ error: 'Server not configured with admin credentials' }, { status: 500 });
  }

  try {
    const body = await req.json();
    const { uid, admin: makeAdmin } = body as { uid: string; admin?: boolean };
    if (!uid) return NextResponse.json({ error: 'uid manquant' }, { status: 400 });

    await admin.auth().setCustomUserClaims(uid, { admin: !!makeAdmin, role: makeAdmin ? 'admin' : 'user' });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
