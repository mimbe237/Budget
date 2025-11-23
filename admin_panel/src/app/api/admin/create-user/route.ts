import { NextRequest } from 'next/server';
import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';

function initAdmin() {
  if (admin.apps.length === 0) {
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    let privateKey = process.env.FIREBASE_PRIVATE_KEY;
    if (privateKey && privateKey.includes('\\n')) {
      privateKey = privateKey.replace(/\\n/g, '\n');
    }
    if (!projectId || !clientEmail || !privateKey) {
      throw new Error('Missing service account env vars');
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
    const { email, password, displayName } = await req.json();
    
    if (!email || !password) {
      return new Response(JSON.stringify({ ok: false, error: 'Email and password required' }), { status: 400 });
    }

    // Create Firebase Auth user
    const userRecord = await admin.auth().createUser({
      email,
      password,
      displayName: displayName || email,
    });

    // Create Firestore document with matching UID
    const db = getFirestore();
    await db.collection('users').doc(userRecord.uid).set({
      email,
      displayName: displayName || email,
      role: 'user',
      isAdmin: false,
      status: 'active',
      balance: 0,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      lastActive: admin.firestore.FieldValue.serverTimestamp(),
    });

    return new Response(JSON.stringify({ ok: true, uid: userRecord.uid }), { status: 200 });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Unknown error';
    return new Response(JSON.stringify({ ok: false, error: message }), { status: 500 });
  }
}
