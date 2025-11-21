import { NextResponse } from 'next/server';
import { getAdminAuth, getAdminFirestore } from '@/firebase/admin';
import { extractBearerToken } from '@/lib/auth-helpers';
import { isAdminEmail } from '@/lib/admin-auth';

export async function GET(request: Request) {
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

    const snapshot = await firestore
      .collection('users')
      .where('status', '==', 'pending_deletion')
      .orderBy('deletionExpiresAt', 'asc')
      .limit(200)
      .get();

    const items = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        deletionRequestedAt: data.deletionRequestedAt,
        deletionExpiresAt: data.deletionExpiresAt,
      };
    });

    return NextResponse.json({ items }, { status: 200 });
  } catch (error: any) {
    console.error('[admin/deletions]', error);
    return NextResponse.json(
      { error: 'failed', message: error?.message ?? 'Unknown error' },
      { status: 500 }
    );
  }
}
