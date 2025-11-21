'use client';

import { useEffect, useState } from 'react';
import { useFirestore } from '@/firebase';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { WifiOff, Wifi, ChevronDown, ChevronUp } from 'lucide-react';

export function FirebaseStatus() {
  const firestore = useFirestore();
  const [isOnline, setIsOnline] = useState(true);
  const [showStatus, setShowStatus] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    if (!firestore) return;

    let isCancelled = false;
    let unsubscribe: (() => void) | undefined;

    (async () => {
      try {
        const { onSnapshot, collection } = await import('firebase/firestore');
        if (isCancelled) return;

        unsubscribe = onSnapshot(
          collection(firestore, '_firebase_status'),
          { includeMetadataChanges: true },
          (snapshot) => {
            const wasOnline = isOnline;
            const nowOnline = !snapshot.metadata.fromCache;

            if (wasOnline !== nowOnline) {
              setIsOnline(nowOnline);
              setShowStatus(true);

              if (nowOnline) {
                setTimeout(() => setShowStatus(false), 5000);
              }
            }
          },
          (error) => {
            // Permission errors can happen if the helper collection isn't readable.
            // Fallback to navigator.onLine and avoid spamming the console.
            if (process.env.NODE_ENV === 'development') {
              console.debug('Firebase status listener disabled:', error);
            }
            setIsOnline(navigator.onLine);
            setShowStatus(!navigator.onLine);
            if (unsubscribe) {
              unsubscribe();
              unsubscribe = undefined;
            }
          }
        );
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.debug('Firebase status listener setup failed:', error);
        }
        setIsOnline(navigator.onLine);
        setShowStatus(!navigator.onLine);
      }
    })();

    return () => {
      isCancelled = true;
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [firestore, isOnline]);

  // Monitor browser online/offline events
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowStatus(true);
      setTimeout(() => setShowStatus(false), 5000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowStatus(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Charger l'état de repli depuis localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('offlineBannerCollapsed');
      if (saved != null) setIsCollapsed(saved === 'true');
    } catch {}
  }, []);

  // Sauvegarder l'état de repli
  useEffect(() => {
    try {
      localStorage.setItem('offlineBannerCollapsed', String(isCollapsed));
    } catch {}
  }, [isCollapsed]);

  if (!showStatus) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-md animate-in slide-in-from-bottom-5">
      {isOnline ? (
        <Alert className="relative border-green-500 bg-green-50">
          <Wifi className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800 pr-8">
            Connexion rétablie - Les données sont synchronisées
          </AlertDescription>
          {/* Bouton pour fermer immédiatement l'alerte en mode en ligne */}
          <Button
            variant="ghost"
            size="icon"
            aria-label="Fermer la notification"
            className="absolute right-1 top-1 h-7 w-7 text-green-700 hover:text-green-900"
            onClick={() => setShowStatus(false)}
          >
            <ChevronDown className="h-4 w-4" />
          </Button>
        </Alert>
      ) : (
        <>
          {isCollapsed ? (
            // Pastille compacte quand replié
            <Button
              variant="secondary"
              className="shadow border border-orange-300 bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/60 text-orange-700 hover:text-orange-800"
              aria-expanded={false}
              aria-controls="offline-banner"
              onClick={() => setIsCollapsed(false)}
              title="Afficher le mode hors connexion"
            >
              <WifiOff className="h-4 w-4 mr-2" />
              Hors connexion
              <ChevronUp className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Alert id="offline-banner" className="relative border-orange-500 bg-orange-50 pr-10">
              <WifiOff className="h-4 w-4 text-orange-600" />
              <AlertDescription className="text-orange-800">
                Mode hors ligne — Les modifications seront synchronisées automatiquement
              </AlertDescription>
              {/* Bouton replier/masquer */}
              <div className="absolute right-1 top-1 flex gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Replier la notification hors connexion"
                  aria-expanded={!isCollapsed}
                  onClick={() => setIsCollapsed(true)}
                  className="h-7 w-7 text-orange-700 hover:text-orange-900"
                >
                  <ChevronDown className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  aria-label="Cacher jusqu'à la prochaine modification de connexion"
                  onClick={() => setShowStatus(false)}
                  className="h-7 px-2 text-orange-700 hover:text-orange-900"
                >
                  Cacher
                </Button>
              </div>
            </Alert>
          )}
        </>
      )}
    </div>
  );
}
