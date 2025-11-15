import { NextResponse } from 'next/server';
import { getAdminAuth, getAdminFirestore } from '@/firebase/admin';
import { extractBearerToken } from '@/lib/auth-helpers';

export async function POST(request: Request) {
  try {
    const token = extractBearerToken(request);
    if (!token) {
      return NextResponse.json({ error: 'missing_token' }, { status: 401 });
    }

    const auth = getAdminAuth();
    const firestore = getAdminFirestore();

    const decoded = await auth.verifyIdToken(token);
    const userId = decoded.uid;
    const userRef = firestore.collection('users').doc(userId);
    const snapshot = await userRef.get();
    if (!snapshot.exists) {
      return NextResponse.json({ error: 'user_missing' }, { status: 404 });
    }

    const data = snapshot.data();
    if (data?.status !== 'pending_deletion') {
      return NextResponse.json(
        { error: 'not_pending_deletion' },
        { status: 400 }
      );
    }

    await userRef.set(
      {
        status: 'active',
        deletionRequestedAt: null,
        deletionExpiresAt: null,
      },
      { merge: true }
    );

    const emailLower = (data.email as string | undefined)?.toLowerCase();
    if (emailLower) {
      await firestore.collection('deletedEmails').doc(emailLower).delete().catch(() => undefined);
    }

    return NextResponse.json({ restored: true }, { status: 200 });
  } catch (error: any) {
    console.error('[restoreAccount]', error);
    return NextResponse.json(
      { error: 'restore_failed', message: error?.message ?? 'Unknown error' },
      { status: 500 }
    );
  }
}
