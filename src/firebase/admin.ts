import { initializeApp, getApp, getApps, App } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import * as admin from 'firebase-admin';

// IMPORTANT: DO NOT MODIFY THIS FILE

function getFirebaseAdmin(): App {
  if (getApps().length > 0) {
    return getApp();
  }

  // Attempt to initialize using Application Default Credentials
  try {
    const app = initializeApp();
    return app;
  } catch (e: any) {
      console.error('Admin SDK initialization failed:', e);
      // If ADC fails, you might need to configure credentials manually
      // For example, using a service account file:
      if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
        try {
            const serviceAccount = JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS);
            const app = initializeApp({
                credential: admin.credential.cert(serviceAccount)
            });
            return app;
        } catch(e) {
            console.error('Failed to initialize with service account from env var', e);
            throw e;
        }
      } else {
        throw new Error('Could not initialize Firebase Admin SDK. Application Default Credentials failed and GOOGLE_APPLICATION_CREDENTIALS env var is not set.');
      }
  }
}

export const firebaseAdmin = getFirebaseAdmin();

export function getFirebaseAdminApp() {
    return firebaseAdmin;
}

export function getAdminAuth() {
    return getAuth(firebaseAdmin);
}

export function getAdminFirestore() {
    return getFirestore(firebaseAdmin);
}

// Re-exporting for convenience
export { getFirebaseAdmin };
