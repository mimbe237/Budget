import { NextResponse } from 'next/server';
import { getAdminAuth, getAdminFirestore } from '@/firebase/admin';
import type { CollectionReference, Firestore } from 'firebase-admin/firestore';
import { extractBearerToken } from '@/lib/auth-helpers';

const ROOT_COLLECTIONS_TO_CLEAN = ['debts'];
const BATCH_SIZE = 500;

async function deleteCollectionBatch(collectionRef: CollectionReference) {
  const snapshot = await collectionRef.limit(BATCH_SIZE).get();
  if (snapshot.empty) {
    return;
  }

  const batch = collectionRef.firestore.batch();
  for (const doc of snapshot.docs) {
    const childCollections = await doc.ref.listCollections();
    for (const child of childCollections) {
      await deleteCollectionBatch(child);
    }
    batch.delete(doc.ref);
  }

  await batch.commit();
  if (snapshot.size >= BATCH_SIZE) {
    await deleteCollectionBatch(collectionRef);
  }
}

async function deleteDependentDocuments(
  firestore: Firestore,
  collectionPath: string,
  field: string,
  value: string
) {
  while (true) {
    const snapshot = await firestore
      .collection(collectionPath)
      .where(field, '==', value)
      .limit(BATCH_SIZE)
      .get();

    if (snapshot.empty) {
      return;
    }

    const batch = firestore.batch();
    snapshot.docs.forEach((doc) => batch.delete(doc.ref));
    await batch.commit();
  }
}

export async function DELETE(request: Request) {
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

    await auth.revokeRefreshTokens(userId);

    const userSnapshot = await userRef.get();
    const userData = userSnapshot.data();
    const now = Date.now();
    const expiresAt =
      userData?.deletionExpiresAt && new Date(userData.deletionExpiresAt).getTime();

    if (userData?.status === 'pending_deletion') {
      if (expiresAt && expiresAt > now) {
        return NextResponse.json(
          {
            pending: true,
            deletionExpiresAt: userData.deletionExpiresAt,
            message: 'Deletion already scheduled. You can cancel within the grace period.',
          },
          { status: 202 }
        );
      }

      if (!expiresAt) {
        const nextExpiresAt = new Date(now + 30 * 24 * 60 * 60 * 1000).toISOString();
        await userRef.set(
          {
            deletionExpiresAt: nextExpiresAt,
          },
          { merge: true }
        );
        return NextResponse.json(
          {
            pending: true,
            deletionExpiresAt: nextExpiresAt,
            message: 'Deletion scheduled for 30 days from now.',
          },
          { status: 202 }
        );
      }
      // grace period expired -> proceed to final deletion
    } else {
      const nextExpiresAt = new Date(now + 30 * 24 * 60 * 60 * 1000).toISOString();
      await userRef.set(
        {
          status: 'pending_deletion',
          deletionRequestedAt: new Date(now).toISOString(),
          deletionExpiresAt: nextExpiresAt,
        },
        { merge: true }
      );
      return NextResponse.json(
        {
          pending: true,
          deletionExpiresAt: nextExpiresAt,
          message: 'Deletion scheduled. You can cancel within 30 days by contacting support.',
        },
        { status: 202 }
      );
    }

    const emailLower = (userData?.email as string | undefined)?.toLowerCase();
    const subcollections = await userRef.listCollections();
    for (const subcollection of subcollections) {
      await deleteCollectionBatch(subcollection);
    }

    await userRef.delete();

    if (emailLower) {
      await firestore.collection('deletedEmails').doc(emailLower).set({
        deletedAt: new Date().toISOString(),
        userId,
      });
    }

    for (const collectionPath of ROOT_COLLECTIONS_TO_CLEAN) {
      await deleteDependentDocuments(firestore, collectionPath, 'userId', userId);
    }

    await auth.deleteUser(userId);

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    console.error('[deleteAccount]', error);
    return NextResponse.json(
      { error: 'delete_failed', message: error?.message ?? 'Unknown error' },
      { status: 500 }
    );
  }
}
