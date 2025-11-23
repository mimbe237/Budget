'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  isAdmin: false,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (!u) {
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      try {
        // Claims Firebase
        const idTokenResult = await u.getIdTokenResult();
        const adminFromClaims = idTokenResult.claims.admin === true || idTokenResult.claims.role === 'admin';

        // Firestore fallback
        let adminFromFirestore = false;
        try {
          const snap = await getDoc(doc(db, 'users', u.uid));
            const data = snap.data();
            if (data) {
              adminFromFirestore = data.isAdmin === true || data.role === 'admin';
            }
        } catch {
          // ignore read errors, keep claims decision
        }

        setIsAdmin(adminFromClaims || adminFromFirestore);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
