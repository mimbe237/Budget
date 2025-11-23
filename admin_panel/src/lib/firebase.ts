import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyB1TtBmWvMUSlMLweCjQOrsxUermQM7TcU',
  authDomain: 'budget-pro-8e46f.firebaseapp.com',
  projectId: 'budget-pro-8e46f',
  storageBucket: 'budget-pro-8e46f.firebasestorage.app',
  messagingSenderId: '830482913404',
  appId: '1:830482913404:web:354d9ea847bd83526d51f9',
  measurementId: 'G-M387Q04KK0',
};

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// Initialize services
export const auth = getAuth(app);
export const db = getFirestore(app);

export default app;
