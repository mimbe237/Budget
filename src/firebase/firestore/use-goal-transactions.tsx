import { useEffect, useState } from 'react';
import { collection, query, where, orderBy, addDoc, updateDoc, deleteDoc, doc, getDocs } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import type { GoalTransaction } from '@/lib/types';

export function useGoalTransactions(userId: string | undefined, goalId: string | undefined) {
  const firestore = useFirestore();
  const [transactions, setTransactions] = useState<GoalTransaction[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!firestore || !userId || !goalId) return;
    setLoading(true);
    const q = query(
      collection(firestore, `users/${userId}/budgetGoals/${goalId}/transactions`),
      orderBy('createdAt', 'desc')
    );
    getDocs(q).then(snapshot => {
      setTransactions(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as GoalTransaction)));
      setLoading(false);
    });
  }, [firestore, userId, goalId]);

  return { transactions, loading };
}

export async function addGoalTransaction(
  firestore: any,
  userId: string,
  goalId: string,
  amountInCents: number,
  note?: string,
  attachment?: { url: string; name: string; type: string },
  metadata?: { sourceTransactionId?: string; sourceType?: GoalTransaction['sourceType'] }
) {
  const ref = collection(firestore, `users/${userId}/budgetGoals/${goalId}/transactions`);
  await addDoc(ref, {
    goalId,
    userId,
    amountInCents,
    note: note || '',
    createdAt: new Date().toISOString(),
    attachmentUrl: attachment?.url,
    attachmentName: attachment?.name,
    attachmentType: attachment?.type,
    sourceTransactionId: metadata?.sourceTransactionId,
    sourceType: metadata?.sourceType,
  });
}

export async function updateGoalTransaction(firestore: any, userId: string, goalId: string, transactionId: string, data: Partial<GoalTransaction>) {
  const ref = doc(firestore, `users/${userId}/budgetGoals/${goalId}/transactions`, transactionId);
  await updateDoc(ref, { ...data, updatedAt: new Date().toISOString() });
}

export async function deleteGoalTransaction(firestore: any, userId: string, goalId: string, transactionId: string) {
  const ref = doc(firestore, `users/${userId}/budgetGoals/${goalId}/transactions`, transactionId);
  await deleteDoc(ref);
}
