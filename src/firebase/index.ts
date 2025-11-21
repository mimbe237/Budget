'use client';

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { 
  getFirestore, 
  enableIndexedDbPersistence, 
  enableMultiTabIndexedDbPersistence,
  connectFirestoreEmulator,
  setLogLevel
} from 'firebase/firestore';
import { getFunctions, connectFunctionsEmulator } from 'firebase/functions';
import { setupFirestoreLogger } from './firestore-logger';

// Configurer le logger personnalisé AVANT toute initialisation Firebase
if (typeof window !== 'undefined') {
  setupFirestoreLogger();
}

// Réduire les logs Firestore en production et développement
if (typeof window !== 'undefined') {
  // 'error' = seulement les erreurs critiques, pas les warnings réseau
  setLogLevel('error');
}

// IMPORTANT: DO NOT MODIFY THIS FUNCTION
export function initializeFirebase() {
  if (getApps().length) {
    // If already initialized, return the SDKs with the already initialized App
    return getSdks(getApp());
  }

  let firebaseApp;
  // In a production Firebase App Hosting environment, the SDK is automatically
  // initialized by the server-side environment variables.
  // In a local development environment, we must initialize with the config object.
  if (process.env.NODE_ENV === 'production' && !process.env.NEXT_PUBLIC_FIREBASE_API_KEY) {
      try {
        // Attempt to initialize via Firebase App Hosting environment variables
        firebaseApp = initializeApp();
      } catch (e) {
        console.warn('Automatic initialization failed. Falling back to firebase config object.', e);
        firebaseApp = initializeApp(firebaseConfig);
      }
  } else {
    firebaseApp = initializeApp(firebaseConfig);
  }

  return getSdks(firebaseApp);
}

export function getSdks(firebaseApp: FirebaseApp) {
  const firestore = getFirestore(firebaseApp);
  const auth = getAuth(firebaseApp);
  
  // Optional: connect to Firebase Emulators for zero-config local dev
  if (process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATORS === '1') {
    try {
      const host = process.env.NEXT_PUBLIC_FIREBASE_EMULATORS_HOST || '127.0.0.1';
      const fsPort = Number(process.env.NEXT_PUBLIC_FIRESTORE_EMULATOR_PORT || 8080);
      const authPort = Number(process.env.NEXT_PUBLIC_AUTH_EMULATOR_PORT || 9099);
      const fnPort = Number(process.env.NEXT_PUBLIC_FUNCTIONS_EMULATOR_PORT || 5001);
      connectFirestoreEmulator(firestore, host, fsPort);
      connectAuthEmulator(auth, `http://${host}:${authPort}`, { disableWarnings: true });
      const functions = getFunctions(firebaseApp);
      connectFunctionsEmulator(functions, host, fnPort);
      if (process.env.NEXT_PUBLIC_DEBUG_FIREBASE) {
        console.info(`[Emulators] Connected (firestore:${fsPort}, auth:${authPort}, functions:${fnPort})`);
      }
    } catch (e) {
      console.warn('[Emulators] Failed to connect, continuing with default services:', e);
    }
  }

  // Optional: fully offline mode (no network) for UI-only runs
  // Useful when internet is down; Firestore reads from IndexedDB.
  if (process.env.NEXT_PUBLIC_FIREBASE_OFFLINE_ONLY === '1') {
    import('firebase/firestore').then(({ disableNetwork }) => {
      disableNetwork(firestore).catch(() => undefined);
      if (process.env.NEXT_PUBLIC_DEBUG_FIREBASE) {
        console.info('[Firestore] Network disabled (offline-only mode)');
      }
    });
  }

  // Enable offline persistence for better UX with network issues
  if (typeof window !== 'undefined') {
    enableMultiTabIndexedDbPersistence(firestore).catch((err) => {
      // Gestion silencieuse des erreurs non-critiques de persistance
      if (err.code === 'failed-precondition') {
        // Multiple tabs - normal, pas besoin de log
        if (process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_DEBUG_FIRESTORE) {
          console.debug('[Firestore] Multiple tabs detected - persistence enabled in first tab');
        }
      } else if (err.code === 'unimplemented') {
        // Browser ne supporte pas - normal pour certains navigateurs
        if (process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_DEBUG_FIRESTORE) {
          console.debug('[Firestore] Browser does not support offline persistence');
        }
      } else {
        // Erreur inattendue - log complet
        console.error('[Firestore] Error enabling offline persistence:', err);
      }
    });
  }
  
  return {
    firebaseApp,
    auth,
    firestore
  };
}

export * from './provider';
export * from './client-provider';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export * from './non-blocking-updates';
export * from './non-blocking-login';
export * from './errors';
export * from './error-emitter';