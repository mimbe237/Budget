'use client';

import { initializeFirebase } from '@/firebase';
import { getFirestore } from 'firebase/firestore';
import { getFunctions, connectFunctionsEmulator } from 'firebase/functions';

const { firebaseApp } = initializeFirebase();

export const db = getFirestore(firebaseApp);
export const functions = getFunctions(firebaseApp);

// Ensure functions emulator connection if requested
if (process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATORS === '1') {
	try {
		const host = process.env.NEXT_PUBLIC_FIREBASE_EMULATORS_HOST || '127.0.0.1';
		const fnPort = Number(process.env.NEXT_PUBLIC_FUNCTIONS_EMULATOR_PORT || 5001);
		connectFunctionsEmulator(functions, host, fnPort);
	} catch {}
}
