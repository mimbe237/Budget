import { NextResponse } from 'next/server';
import { getAdminAuth, getAdminFirestore } from '@/firebase/admin';
import { extractBearerToken } from '@/lib/auth-helpers';
import { isAdminEmail } from '@/lib/admin-auth';

export async function POST(request: Request, { params }: { params: { userId: string } }) {
  try {
    const token = extractBearerToken(request);
    if (!token) {
      return NextResponse.json({ error: 'missing_token' }, { status: 401 });
    }

    const auth = getAdminAuth();
    const firestore = getAdminFirestore();

    const decoded = await auth.verifyIdToken(token);
    if (!isAdminEmail(decoded.email)) {
      return NextResponse.json({ error: 'forbidden' }, { status: 403 });
    }

    const userRef = firestore.collection('users').doc(params.userId);
    const snapshot = await userRef.get();
    if (!snapshot.exists) {
      return NextResponse.json({ error: 'not_found' }, { status: 404 });
    }

    const data = snapshot.data();
    if (data?.status !== 'pending_deletion') {
      return NextResponse.json({ error: 'not_pending' }, { status: 400 });
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
    console.error('[admin/restore-deletion]', error);
    return NextResponse.json(
      { error: 'restore_failed', message: error?.message ?? 'Unknown error' },
      { status: 500 }
    );
  }
}
