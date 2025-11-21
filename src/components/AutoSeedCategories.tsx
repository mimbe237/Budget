'use client';

import { useEffect, useRef } from 'react';
import { useFirestore, useUser } from '@/firebase';
import { collection, doc, getDocs, setDoc } from 'firebase/firestore';
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
  const toastRef = useRef(toast);

  useEffect(() => {
    toastRef.current = toast;
  }, [toast]);
  
  const isFrench = userProfile?.locale === 'fr-CM';

  useEffect(() => {
    if (!user || !firestore) return;
    if (ranRef.current) return; // ensure once per mount
    ranRef.current = true;

    const seedKey = `seed:categories:${user.uid}`;
    const mark = (state: 'in-progress' | 'done' | null) => {
      try {
        if (state) {
          localStorage.setItem(seedKey, state);
        } else {
          localStorage.removeItem(seedKey);
        }
      } catch {
        // ignore storage errors
      }
    };
    const getMark = () => {
      try { return localStorage.getItem(seedKey); } catch { return null; }
    };

    (async () => {
      const currentMark = getMark();
      if (currentMark === 'in-progress') {
        // another tab already seeding, let it finish
        return;
      }

      try {
        const colRef = collection(firestore, `users/${user.uid}/categories`);
        const snap = await getDocs(colRef);
        const existingKeys = new Set(
          snap.docs.map(docSnap => {
            const data = docSnap.data() as { type?: string; name?: string };
            const type = (data.type || '').toLowerCase();
            const name = (data.name || '').toLowerCase();
            return `${type}::${name}`;
          }),
        );
        const defaults = createDefaultCategories(user.uid);
        const missing = defaults.filter(cat => {
          const key = `${cat.type.toLowerCase()}::${cat.name.toLowerCase()}`;
          return !existingKeys.has(key);
        });

        if (missing.length === 0) {
          if (currentMark !== 'done') {
            mark('done');
          }
          return;
        }

        mark('in-progress');

        // Write with deterministic IDs to avoid duplicates across potential concurrent seeders
        await Promise.all(missing.map(async (cat) => {
          const id = `${cat.type}-${slugify(cat.name)}`;
          const ref = doc(colRef, id);
          await setDoc(ref, cat, { merge: true });
        }));
        mark('done');
        
        // Show success toast
        toastRef.current?.({
          title: isFrench ? 'Catégories par défaut complétées' : 'Default categories restored',
          description: isFrench 
            ? `${missing.length} catégorie${missing.length > 1 ? 's' : ''} manquante${missing.length > 1 ? 's' : ''} ${missing.length > 1 ? 'ont' : 'a'} été ajoutée${missing.length > 1 ? 's' : ''}.` 
            : `${missing.length} missing default categor${missing.length > 1 ? 'ies were' : 'y was'} added automatically.`,
        });
      } catch (e) {
        // leave no hard failure path; user can still seed from Categories UI
        // optional: console.warn('[AutoSeedCategories] failed:', e);
        mark(null);
      }
    })();
  }, [user, firestore, userProfile]);

  return null;
}
