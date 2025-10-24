'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Download, RefreshCw, X } from 'lucide-react';

export function ServiceWorkerRegistration() {
  const [showUpdatePrompt, setShowUpdatePrompt] = useState(false);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);

  useEffect(() => {
    // Vérifier si les Service Workers sont supportés
    if ('serviceWorker' in navigator) {
      registerServiceWorker();
    }

    // Capturer l'événement d'installation PWA
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Détecter si l'app est déjà installée
    window.addEventListener('appinstalled', () => {
      setShowInstallPrompt(false);
      setDeferredPrompt(null);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const registerServiceWorker = async () => {
    try {
      const registration = await navigator.serviceWorker.register('/service-worker.js', {
        scope: '/',
      });

      console.log('Service Worker enregistré:', registration);

      // Vérifier les mises à jour toutes les heures
      setInterval(() => {
        registration.update();
      }, 60 * 60 * 1000);

      // Écouter les mises à jour
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (!newWorker) return;

        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            // Nouvelle version disponible
            setWaitingWorker(newWorker);
            setShowUpdatePrompt(true);
          }
        });
      });

      // Vérifier si un worker est en attente
      if (registration.waiting) {
        setWaitingWorker(registration.waiting);
        setShowUpdatePrompt(true);
      }
    } catch (error) {
      console.error('Échec de l\'enregistrement du Service Worker:', error);
    }
  };

  const handleUpdate = () => {
    if (!waitingWorker) return;

    // Demander au SW en attente de devenir actif
    waitingWorker.postMessage({ type: 'SKIP_WAITING' });

    // Recharger la page une fois le nouveau SW actif
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      window.location.reload();
    });
  };

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    // Afficher le prompt d'installation natif
    deferredPrompt.prompt();

    // Attendre la réponse de l'utilisateur
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`Installation PWA: ${outcome}`);

    // Réinitialiser le prompt
    setDeferredPrompt(null);
    setShowInstallPrompt(false);
  };

  return (
    <>
      {/* Prompt de mise à jour */}
      {showUpdatePrompt && (
        <div className="fixed bottom-4 right-4 z-50 max-w-md animate-in slide-in-from-bottom-5">
          <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-950 dark:border-blue-800">
            <RefreshCw className="h-4 w-4 text-blue-600" />
            <AlertTitle className="text-blue-900 dark:text-blue-100">
              Mise à jour disponible
            </AlertTitle>
            <AlertDescription className="text-blue-800 dark:text-blue-200">
              Une nouvelle version de l'application est disponible.
            </AlertDescription>
            <div className="flex gap-2 mt-3">
              <Button size="sm" onClick={handleUpdate} className="flex-1">
                Mettre à jour
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowUpdatePrompt(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </Alert>
        </div>
      )}

      {/* Prompt d'installation PWA */}
      {showInstallPrompt && (
        <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 z-50 max-w-md animate-in slide-in-from-bottom-5">
          <Alert className="border-green-200 bg-green-50 dark:bg-green-950 dark:border-green-800">
            <Download className="h-4 w-4 text-green-600" />
            <AlertTitle className="text-green-900 dark:text-green-100">
              Installer l'application
            </AlertTitle>
            <AlertDescription className="text-green-800 dark:text-green-200">
              Ajoutez BudgetWise à votre écran d'accueil pour un accès rapide.
            </AlertDescription>
            <div className="flex gap-2 mt-3">
              <Button
                size="sm"
                onClick={handleInstall}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                Installer
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowInstallPrompt(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </Alert>
        </div>
      )}
    </>
  );
}
