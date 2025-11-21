'use client';

import { useEffect, useState } from 'react';
import { Wifi, WifiOff } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

/**
 * Hook pour surveiller le statut de connexion
 */
export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    // Initialiser avec le statut actuel
    setIsOnline(navigator.onLine);

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}

/**
 * Composant pour afficher le statut de connexion
 */
export function OnlineStatusIndicator() {
  const isOnline = useOnlineStatus();
  const [showAlert, setShowAlert] = useState(false);

  useEffect(() => {
    if (!isOnline) {
      setShowAlert(true);
    } else {
      // Masquer l'alerte après 3 secondes quand on revient en ligne
      const timer = setTimeout(() => setShowAlert(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [isOnline]);

  if (!showAlert) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 animate-in slide-in-from-bottom-4">
      <Alert
        variant={isOnline ? 'default' : 'destructive'}
        className="shadow-lg max-w-md"
      >
        <div className="flex items-center gap-2">
          {isOnline ? (
            <Wifi className="h-4 w-4" />
          ) : (
            <WifiOff className="h-4 w-4" />
          )}
          <AlertDescription>
            {isOnline
              ? 'Connexion rétablie'
              : 'Vous êtes hors ligne. Certaines fonctionnalités sont limitées.'}
          </AlertDescription>
        </div>
      </Alert>
    </div>
  );
}

/**
 * Hook pour enregistrer le Service Worker
 */
export function useServiceWorkerRegistration() {
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);
  const [updateAvailable, setUpdateAvailable] = useState(false);

  useEffect(() => {
    if (
      typeof window !== 'undefined' &&
      'serviceWorker' in navigator &&
      process.env.NODE_ENV === 'production'
    ) {
      navigator.serviceWorker
        .register('/service-worker.js')
        .then((reg) => {
          console.log('Service Worker enregistré:', reg);
          setRegistration(reg);

          // Vérifier les mises à jour
          reg.addEventListener('updatefound', () => {
            const newWorker = reg.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  setUpdateAvailable(true);
                }
              });
            }
          });
        })
        .catch((error) => {
          console.error('Erreur Service Worker:', error);
        });
    }
  }, []);

  const updateServiceWorker = () => {
    if (registration?.waiting) {
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      window.location.reload();
    }
  };

  const clearCache = async () => {
    if (registration?.active) {
      registration.active.postMessage({ type: 'CLEAR_CACHE' });
      const caches = await window.caches.keys();
      await Promise.all(caches.map((name) => window.caches.delete(name)));
      window.location.reload();
    }
  };

  return {
    registration,
    updateAvailable,
    updateServiceWorker,
    clearCache,
  };
}

/**
 * Composant pour notifier d'une mise à jour disponible
 */
export function ServiceWorkerUpdateNotification() {
  const { updateAvailable, updateServiceWorker } = useServiceWorkerRegistration();

  if (!updateAvailable) return null;

  return (
    <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-top-4">
      <Alert className="shadow-lg max-w-md">
        <AlertDescription className="flex items-center justify-between gap-4">
          <span>Une nouvelle version est disponible</span>
          <button
            onClick={updateServiceWorker}
            className="px-3 py-1 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90"
          >
            Mettre à jour
          </button>
        </AlertDescription>
      </Alert>
    </div>
  );
}
