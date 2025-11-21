import { NextResponse } from 'next/server';
import { getAdminAuth, getAdminFirestore } from '@/firebase/admin';
import { buildPhoneCompositeKey } from '@/lib/phone';

type Payload = {
  email?: string;
  phoneCountryCode?: string;
  phoneNumber?: string;
};

export async function POST(request: Request) {
  try {
    const body: Payload = await request.json();
    const rawEmail = typeof body.email === 'string' ? body.email.trim() : '';
    const email = rawEmail.toLowerCase();
    const phoneCountryCode =
      typeof body.phoneCountryCode === 'string' ? body.phoneCountryCode : null;
    const phoneNumber =
      typeof body.phoneNumber === 'string' ? body.phoneNumber : null;

    if (!email && !phoneNumber) {
      return NextResponse.json(
        { error: 'missing_identity_fields' },
        { status: 400 }
      );
    }

    const auth = getAdminAuth();
    const firestore = getAdminFirestore();

    let emailExists = false;
    let emailDeleted = false;
    if (email) {
      try {
        await auth.getUserByEmail(email);
        emailExists = true;
      } catch (error: any) {
        if (!error?.code || error.code !== 'auth/user-not-found') {
          console.error('Failed to lookup email uniqueness', error);
          return NextResponse.json(
            { error: 'email_lookup_failed' },
            { status: 500 }
          );
        }
      }
      const deletedSnapshot = await firestore
        .collection('deletedEmails')
        .doc(email)
        .get();
      emailDeleted = deletedSnapshot.exists;
    }

    let phoneExists = false;
    const phoneKey = buildPhoneCompositeKey(phoneCountryCode, phoneNumber);
    if (phoneKey) {
      const snapshot = await firestore
        .collection('users')
        .where('phoneCompositeKey', '==', phoneKey)
        .limit(1)
        .get();
      phoneExists = !snapshot.empty;
    }

    return NextResponse.json(
      {
        emailExists,
        emailDeleted,
        phoneExists,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Identity check failed', error);
    return NextResponse.json({ error: 'identity_check_failed' }, { status: 500 });
  }
}
