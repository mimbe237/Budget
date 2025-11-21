// Offline Queue for writes when network is unavailable
// Minimal vanilla IndexedDB implementation (no external deps)

export type QueuedOperation = {
  id: string;
  type: 'goalContribution' | 'transaction' | 'debtPayment';
  data: any;
  timestamp: number;
  retries: number;
};

const DB_NAME = 'budgetpro-offline-queue';
const STORE_NAME = 'pending-operations';

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function txGetAll(db: IDBDatabase): Promise<QueuedOperation[]> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result as QueuedOperation[]);
    req.onerror = () => reject(req.error);
  });
}

function txAdd(db: IDBDatabase, op: QueuedOperation): Promise<void> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const req = store.add(op);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

function txPut(db: IDBDatabase, op: QueuedOperation): Promise<void> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const req = store.put(op);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

function txDelete(db: IDBDatabase, id: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const req = store.delete(id);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function queueOperation(type: QueuedOperation['type'], data: any) {
  if (typeof window === 'undefined') return; // safety for SSR
  const db = await openDb();
  const operation: QueuedOperation = {
    id: crypto.randomUUID(),
    type,
    data,
    timestamp: Date.now(),
    retries: 0,
  };
  await txAdd(db, operation);
}

export async function syncQueue() {
  if (typeof window === 'undefined') return; // SSR safety
  if (!navigator.onLine) return;
  const db = await openDb();
  const operations = await txGetAll(db);
  for (const op of operations) {
    try {
      await executeOperation(op);
      await txDelete(db, op.id);
    } catch (err) {
      // Retry up to 3 times then drop
      const updated: QueuedOperation = { ...op, retries: (op.retries || 0) + 1 };
      if (updated.retries >= 3) {
        await txDelete(db, op.id);
      } else {
        await txPut(db, updated);
      }
      if (process.env.NODE_ENV !== 'production') {
        console.warn('[OfflineQueue] Sync failed, will retry', err);
      }
    }
  }
}

// Operation executors
import { db as firestore } from '@/firebase/client';
import { addGoalTransaction } from '@/firebase/firestore/use-goal-transactions';
import { doc, getDoc, updateDoc } from 'firebase/firestore';

async function executeOperation(op: QueuedOperation) {
  switch (op.type) {
    case 'goalContribution': {
      const { userId, goalId, amountInCents, note, attachment } = op.data || {};
      if (!userId || !goalId || !amountInCents) throw new Error('Invalid goalContribution payload');
      // 1) Update goal aggregate
      const goalRef = doc(firestore, `users/${userId}/budgetGoals`, goalId);
      const snap = await getDoc(goalRef);
      const current = (snap.exists() ? snap.data()?.currentAmountInCents : 0) || 0;
      await updateDoc(goalRef, {
        currentAmountInCents: current + Number(amountInCents || 0),
        updatedAt: new Date().toISOString(),
      });
      // 2) Add goal transaction
      await addGoalTransaction(firestore, userId, goalId, amountInCents, note, attachment, { sourceType: 'manual' });
      return;
    }
    case 'transaction':
      // TODO: implement when transaction write API is centralized
      throw new Error('Not implemented');
    case 'debtPayment':
      // TODO: implement when debt payment write API is available
      throw new Error('Not implemented');
    default:
      throw new Error(`Unknown op type: ${op.type}`);
  }
}

// Attach online listener once per session
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    syncQueue().catch(() => {});
  });
}
