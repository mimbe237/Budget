import { initializeApp, getApp, getApps, App, cert, ServiceAccount } from 'firebase-admin/app';
import { getAuth, DecodedIdToken } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

// IMPORTANT: DO NOT MODIFY THIS FILE

let adminApp: App;

function initializeAdminApp(): App {
  if (getApps().length > 0) {
    return getApp();
  }

  // Prefer inline JSON service account BEFORE ADC to avoid ENAMETOOLONG on file open
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS && process.env.GOOGLE_APPLICATION_CREDENTIALS.trim().startsWith('{')) {
    try {
      const raw = JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS) as any;
      const normalized: ServiceAccount = {
        projectId: raw.project_id,
        clientEmail: raw.client_email,
        privateKey: (raw.private_key as string | undefined)?.replace(/\\n/g, '\n'),
      };
      if (!normalized.projectId || !normalized.clientEmail || !normalized.privateKey) {
        throw new Error('Incomplete service account credentials');
      }
      const app = initializeApp({ credential: cert(normalized) });
      return app;
    } catch (e) {
      console.warn('Failed to initialize with inline service account JSON', e);
    }
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

  // Finally, fall back to GOOGLE_APPLICATION_CREDENTIALS (JSON string or file path)
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    try {
        const gac = process.env.GOOGLE_APPLICATION_CREDENTIALS;
        if (gac.trim().startsWith('{')) {
          const raw = JSON.parse(gac) as any;
          const normalized: ServiceAccount = {
            projectId: raw.project_id,
            clientEmail: raw.client_email,
            privateKey: (raw.private_key as string | undefined)?.replace(/\\n/g, '\n'),
          };
          if (!normalized.projectId || !normalized.clientEmail || !normalized.privateKey) {
            console.warn('Service account credentials are incomplete. Skipping admin initialization.');
            throw new Error('Incomplete service account credentials');
          }
          const app = initializeApp({ credential: cert(normalized) });
          return app;
        } else {
          // treat as file path for ADC-compatible behavior
          process.env.GOOGLE_APPLICATION_CREDENTIALS = gac;
          const app = initializeApp();
          return app;
        }
    } catch(e) {
        console.warn('Failed to initialize with service account from env var', e);
        // Ne pas throw l'erreur, juste logger
    }
  }
  
  // En développement, on peut continuer sans admin SDK
  if (process.env.NODE_ENV === 'development') {
    console.warn('⚠️  Firebase Admin SDK not initialized. Some server-side features may not work.');
    // Retourner un mock ou undefined selon les besoins
    throw new Error('Firebase Admin SDK not configured for development. Please add valid service account credentials.');
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

// Note: Authenticated user helpers should live in server-only files/components
