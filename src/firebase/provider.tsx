'use client';

import React, { DependencyList, createContext, useContext, ReactNode, useMemo, useState, useEffect } from 'react';
import { FirebaseApp } from 'firebase/app';
import { Firestore, doc, onSnapshot } from 'firebase/firestore';
import { Auth, User, onAuthStateChanged, getIdToken } from 'firebase/auth';
import { FirebaseErrorListener } from '@/components/FirebaseErrorListener'
import type { UserProfile } from '@/lib/types';


// Combined state for the Firebase context
export interface FirebaseContextState {
  areServicesAvailable: boolean; // True if core services (app, firestore, auth instance) are provided
  firebaseApp: FirebaseApp | null;
  firestore: Firestore | null;
  auth: Auth | null; // The Auth service instance
  // User authentication state
  user: User | null;
  isUserLoading: boolean; // True during initial auth check
  userError: Error | null; // Error from auth listener
  userProfile: UserProfile | null;
  isUserProfileLoading: boolean;
}

// Return type for useFirebase()
export interface FirebaseServicesAndUser {
  firebaseApp: FirebaseApp;
  firestore: Firestore;
  auth: Auth;
  user: User | null;
  isUserLoading: boolean;
  userError: Error | null;
  userProfile: UserProfile | null;
  isUserProfileLoading: boolean;
}

// Return type for useUser() - specific to user auth state
export interface UserHookResult { 
  user: User | null;
  isUserLoading: boolean;
  userError: Error | null;
  userProfile: UserProfile | null;
  isUserProfileLoading: boolean;
}

interface FirebaseProviderProps {
  children: ReactNode;
  firebaseApp: FirebaseApp;
  firestore: Firestore;
  auth: Auth;
}


// React Context
export const FirebaseContext = createContext<FirebaseContextState | undefined>(undefined);

// Keep track of the original fetch function
const originalFetch = globalThis.fetch;
let idToken: string | null = null;

// The fetch interceptor
globalThis.fetch = async (input, init) => {
  if (idToken) {
    const headers = new Headers(init?.headers);
    headers.set('Authorization', `Bearer ${idToken}`);
    init = { ...init, headers };
  }
  return originalFetch(input, init);
};


/**
 * FirebaseProvider manages and provides Firebase services and user authentication state.
 */
export const FirebaseProvider: React.FC<FirebaseProviderProps> = ({
  children,
  firebaseApp,
  firestore,
  auth,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [isUserLoading, setIsUserLoading] = useState(true);
  const [userError, setUserError] = useState<Error | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isUserProfileLoading, setIsUserProfileLoading] = useState(true);


  // Effect to subscribe to Firebase auth state changes
  useEffect(() => {
    if (!auth) { 
      setIsUserLoading(false);
      setUserError(new Error("Auth service not provided."));
      return;
    }

    setIsUserLoading(true);

    const unsubscribe = onAuthStateChanged(
      auth,
      async (firebaseUser) => { 
        setUser(firebaseUser);
        if (firebaseUser) {
            try {
                idToken = await getIdToken(firebaseUser);
            } catch (e) {
                console.error("Error getting id token", e);
                idToken = null;
            }
        } else {
            idToken = null;
        }
        setIsUserLoading(false);
      },
      (error) => {
        console.error("FirebaseProvider: onAuthStateChanged error:", error);
        setUserError(error);
        setIsUserLoading(false);
      }
    );
    return () => unsubscribe();
  }, [auth]);

    // Effect to subscribe to user profile document
  useEffect(() => {
    if (!user || !firestore) {
      setUserProfile(null);
      setIsUserProfileLoading(false);
      return;
    }

    setIsUserProfileLoading(true);
    const userProfileRef = doc(firestore, `users/${user.uid}`);
    
    const unsubscribe = onSnapshot(userProfileRef, (docSnap) => {
        if (docSnap.exists()) {
            setUserProfile(docSnap.data() as UserProfile);
        } else {
            setUserProfile(null);
        }
        setIsUserProfileLoading(false);
    }, (error) => {
        console.error("FirebaseProvider: Error fetching user profile:", error);
        setUserProfile(null);
        setIsUserProfileLoading(false);
    });

    return () => unsubscribe();
  }, [user, firestore]);


  // Memoize the context value
  const contextValue = useMemo((): FirebaseContextState => {
    const servicesAvailable = !!(firebaseApp && firestore && auth);
    return {
      areServicesAvailable: servicesAvailable,
      firebaseApp: servicesAvailable ? firebaseApp : null,
      firestore: servicesAvailable ? firestore : null,
      auth: servicesAvailable ? auth : null,
      user,
      isUserLoading,
      userError,
      userProfile,
      isUserProfileLoading,
    };
  }, [firebaseApp, firestore, auth, user, isUserLoading, userError, userProfile, isUserProfileLoading]);

  return (
    <FirebaseContext.Provider value={contextValue}>
      <FirebaseErrorListener />
      {children}
    </FirebaseContext.Provider>
  );
};

/**
 * Hook to access core Firebase services and user authentication state.
 * Throws error if core services are not available or used outside provider.
 */
export const useFirebase = (): FirebaseServicesAndUser => {
  const context = useContext(FirebaseContext);

  if (context === undefined) {
    throw new Error('useFirebase must be used within a FirebaseProvider.');
  }

  if (!context.areServicesAvailable || !context.firebaseApp || !context.firestore || !context.auth) {
    throw new Error('Firebase core services not available. Check FirebaseProvider props.');
  }

  return {
    firebaseApp: context.firebaseApp,
    firestore: context.firestore,
    auth: context.auth,
    user: context.user,
    isUserLoading: context.isUserLoading,
    userError: context.userError,
    userProfile: context.userProfile,
    isUserProfileLoading: context.isUserProfileLoading
  };
};

/** Hook to access Firebase Auth instance. */
export const useAuth = (): Auth => {
  const { auth } = useFirebase();
  return auth;
};

/** Hook to access Firestore instance. */
export const useFirestore = (): Firestore => {
  const { firestore } = useFirebase();
  return firestore;
};

/** Hook to access Firebase App instance. */
export const useFirebaseApp = (): FirebaseApp => {
  const { firebaseApp } = useFirebase();
  return firebaseApp;
};

type MemoFirebase <T> = T & {__memo?: boolean};

export function useMemoFirebase<T>(factory: () => T, deps: DependencyList): T | (MemoFirebase<T>) {
  const memoized = useMemo(factory, deps);
  
  if(typeof memoized !== 'object' || memoized === null) return memoized;
  (memoized as MemoFirebase<T>).__memo = true;
  
  return memoized;
}

/**
 * Hook specifically for accessing the authenticated user's state.
 * This provides the User object, loading status, and any auth errors.
 * @returns {UserHookResult} Object with user, isUserLoading, userError.
 */
export const useUser = (): UserHookResult => { 
  const { user, isUserLoading, userError, userProfile, isUserProfileLoading } = useFirebase();
  return { user, isUserLoading, userError, userProfile, isUserProfileLoading };
};
