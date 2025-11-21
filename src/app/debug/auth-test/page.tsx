'use client';

import { useState } from 'react';
import { useFirestore, useUser } from '@/firebase/provider';
import { collection, addDoc, getDocs, query, limit } from 'firebase/firestore';
import { Button } from '@/components/ui/button';

export default function AuthTestPage() {
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();
  const [result, setResult] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const canRun = !!user && !!firestore;

  async function writeTestDoc() {
    if (!canRun) return;
    setLoading(true);
    setResult('');
    try {
      const ref = collection(firestore, `users/${user!.uid}/expenses`);
      await addDoc(ref, {
        description: 'AuthTest',
        amountInCents: 1234,
        type: 'expense',
        currency: 'XAF',
        category: 'Utilities',
        date: new Date().toISOString().slice(0, 10),
        createdAt: new Date().toISOString(),
      });
      setResult('WRITE OK: test expense created');
    } catch (e: any) {
      setResult(`WRITE ERROR: ${e?.message || String(e)}`);
    } finally {
      setLoading(false);
    }
  }

  async function readSample() {
    if (!canRun) return;
    setLoading(true);
    setResult('');
    try {
      const ref = collection(firestore, `users/${user!.uid}/expenses`);
      const snap = await getDocs(query(ref, limit(5)));
      setResult(`READ OK: ${snap.size} docs`);
    } catch (e: any) {
      setResult(`READ ERROR: ${e?.message || String(e)}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-xl mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Auth/Rules quick test</h1>
      <p className="text-sm text-muted-foreground">
        Vérifie en un clic que les règles Firestore permettent lecture/écriture pour l’utilisateur connecté.
      </p>

      <div className="rounded-md border p-4 space-y-2">
        <div>Etat utilisateur: {isUserLoading ? 'Chargement…' : user ? `Connecté (${user.email || user.uid})` : 'Non connecté'}</div>
        <div className="flex gap-2">
          <Button disabled={!canRun || loading} onClick={writeTestDoc}>Ecrire un doc test</Button>
          <Button variant="secondary" disabled={!canRun || loading} onClick={readSample}>Lire 5 docs</Button>
        </div>
        {result && (
          <pre className="whitespace-pre-wrap text-sm bg-muted/50 p-2 rounded border">{result}</pre>
        )}
      </div>

      <p className="text-xs text-muted-foreground">
        Astuce: si tu vois des erreurs “Missing or insufficient permissions”, vérifie que le document utilisateur contient tous les champs requis
        ou utilise la page /fix-user pour le réparer.
      </p>
    </div>
  );
}
