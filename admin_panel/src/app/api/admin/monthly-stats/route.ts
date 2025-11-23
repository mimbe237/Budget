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

interface MonthlyPoint { month: string; transactions: number; newUsers: number; volume: number }

export async function GET(req: NextRequest) {
  try {
    // --- Authentication & Authorization ---
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ ok: false, error: 'Missing bearer token' }), { status: 401 });
    }
    const idToken = authHeader.substring(7);
    initAdmin();
    let decoded: admin.auth.DecodedIdToken;
    try {
      decoded = await admin.auth().verifyIdToken(idToken);
    } catch (e: any) {
      return new Response(JSON.stringify({ ok: false, error: 'Invalid token' }), { status: 401 });
    }
    const isAdminClaim = decoded.admin === true || decoded.role === 'admin';
    if (!isAdminClaim) {
      return new Response(JSON.stringify({ ok: false, error: 'Forbidden: admin only' }), { status: 403 });
    }

    const db = admin.firestore();

    const usersSnap = await db.collection('users').get();
    const txSnap = await db.collection('transactions').get();

    const now = Date.now();
    const THIRTY_DAYS = 1000 * 60 * 60 * 24 * 30;
    let activeUsers = 0;
    let platformBalance = 0;
    const monthlyMap: Record<string, MonthlyPoint> = {};

    usersSnap.forEach(doc => {
      const data = doc.data();
      const last = data.lastActive instanceof admin.firestore.Timestamp ? data.lastActive.toDate() : (data.lastActive ? new Date(data.lastActive) : null);
      if (last && (now - last.getTime() < THIRTY_DAYS)) activeUsers++;
      if (typeof data.balance === 'number') platformBalance += data.balance;
      const created = data.createdAt instanceof admin.firestore.Timestamp ? data.createdAt.toDate() : (data.createdAt ? new Date(data.createdAt) : new Date());
      const key = `${created.getFullYear()}-${String(created.getMonth()+1).padStart(2,'0')}`;
      if (!monthlyMap[key]) monthlyMap[key] = { month: key, transactions: 0, newUsers: 0, volume: 0 };
      monthlyMap[key].newUsers += 1;
    });

    txSnap.forEach(doc => {
      const data = doc.data();
      const created = data.createdAt instanceof admin.firestore.Timestamp ? data.createdAt.toDate() : (data.createdAt ? new Date(data.createdAt) : new Date());
      const key = `${created.getFullYear()}-${String(created.getMonth()+1).padStart(2,'0')}`;
      if (!monthlyMap[key]) monthlyMap[key] = { month: key, transactions: 0, newUsers: 0, volume: 0 };
      monthlyMap[key].transactions += 1;
      if (typeof data.amount === 'number') monthlyMap[key].volume += data.amount;
    });

    const monthly = Object.values(monthlyMap).sort((a,b) => a.month.localeCompare(b.month));

    const payload = {
      totalUsers: usersSnap.size,
      activeUsers,
      totalTransactions: txSnap.size,
      platformBalance,
      monthly,
    };

    return new Response(JSON.stringify({ ok: true, data: payload }), { status: 200 });
  } catch (e: any) {
    return new Response(JSON.stringify({ ok: false, error: e.message }), { status: 500 });
  }
}
