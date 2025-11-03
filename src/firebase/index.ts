'use client';

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { 
  getFirestore, 
  enableIndexedDbPersistence, 
  enableMultiTabIndexedDbPersistence,
  connectFirestoreEmulator,
  setLogLevel
} from 'firebase/firestore';
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
    auth: getAuth(firebaseApp),
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