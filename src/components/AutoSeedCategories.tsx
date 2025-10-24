'use client';

import { useEffect, useRef } from 'react';
import { useFirestore, useUser } from '@/firebase';
import { collection, doc, getDocs, limit, query, setDoc } from 'firebase/firestore';
import { createDefaultCategories } from '@/lib/default-categories';
import { useToast } from '@/hooks/use-toast';

function slugify(input: string) {
  return input
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}+/gu, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
}

export function AutoSeedCategories() {
  const { user, userProfile } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const ranRef = useRef(false);
  
  const isFrench = userProfile?.locale === 'fr-CM';

  useEffect(() => {
    if (!user || !firestore) return;
    if (ranRef.current) return; // ensure once per mount
    ranRef.current = true;

    const seedKey = `seed:categories:${user.uid}`;
    const mark = (state: 'in-progress' | 'done') => {
      try { localStorage.setItem(seedKey, state); } catch {}
    };
    const getMark = () => {
      try { return localStorage.getItem(seedKey); } catch { return null; }
    };

    if (getMark() === 'done' || getMark() === 'in-progress') return;

    (async () => {
      try {
        const colRef = collection(firestore, `users/${user.uid}/categories`);
        const snap = await getDocs(query(colRef, limit(1)));
        if (!snap.empty) return; // already has categories
        mark('in-progress');

        const defaults = createDefaultCategories(user.uid);
        // Write with deterministic IDs to avoid duplicates across potential concurrent seeders
        await Promise.all(defaults.map(async (cat) => {
          const id = `${cat.type}-${slugify(cat.name)}`;
          const ref = doc(colRef, id);
          await setDoc(ref, cat, { merge: true });
        }));
        mark('done');
        
        // Show success toast
        toast({
          title: isFrench ? 'Catégories par défaut créées' : 'Default categories created',
          description: isFrench 
            ? `${defaults.length} catégories ont été ajoutées automatiquement.` 
            : `${defaults.length} categories have been added automatically.`,
        });
      } catch (e) {
        // leave no hard failure path; user can still seed from Categories UI
        // optional: console.warn('[AutoSeedCategories] failed:', e);
      }
    })();
  }, [user, firestore]);

  return null;
}
