'use client';

import { initializeFirebase } from '@/firebase';
import { getFirestore } from 'firebase/firestore';
import { getFunctions } from 'firebase/functions';

const { firebaseApp } = initializeFirebase();

export const db = getFirestore(firebaseApp);
export const functions = getFunctions(firebaseApp);
