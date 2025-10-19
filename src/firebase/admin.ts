import { initializeApp, getApp, getApps, App, cert, ServiceAccount } from 'firebase-admin/app';
import { getAuth, DecodedIdToken } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { headers } from 'next/headers';

// IMPORTANT: DO NOT MODIFY THIS FILE

let adminApp: App;

function initializeAdminApp(): App {
  if (getApps().length > 0) {
    return getApp();
  }

  // First, try to use the Firebase-provided environment variables
  if (process.env.FIREBASE_CONFIG) {
    try {
      const firebaseConfig = JSON.parse(process.env.FIREBASE_CONFIG);
      // When running in a Firebase environment, ADC are implicitly available.
      const app = initializeApp({
        credential: cert(firebaseConfig.credential),
        projectId: firebaseConfig.projectId,
      });
      return app;
    } catch (e) {
        console.warn('Could not initialize via FIREBASE_CONFIG, falling back.', e);
    }
  }
  
  // Second, try Application Default Credentials directly
  try {
    const app = initializeApp();
    return app;
  } catch (e) {
      console.warn('ADC initialization failed, falling back to service account.', e);
  }

  // Finally, fall back to GOOGLE_APPLICATION_CREDENTIALS
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    try {
        const serviceAccount = JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS);
        const app = initializeApp({
            credential: cert(serviceAccount)
        });
        return app;
    } catch(e) {
        console.error('Failed to initialize with service account from env var', e);
        throw e;
    }
  }
  
  throw new Error('Could not initialize Firebase Admin SDK. No credentials found.');
}

adminApp = initializeAdminApp();

export function getFirebaseAdminApp(): App {
    return adminApp;
}

export function getAdminAuth() {
    return getAuth(adminApp);
}

export function getAdminFirestore() {
    return getFirestore(adminApp);
}

export async function getAuthenticatedUser(): Promise<DecodedIdToken | null> {
    const authHeader = headers().get('Authorization');
    if (authHeader) {
        const token = authHeader.split(' ')[1];
        try {
            const adminAuth = getAdminAuth();
            return await adminAuth.verifyIdToken(token);
        } catch (error) {
            console.error('Error verifying auth token:', error);
            return null;
        }
    }
    return null;
}
