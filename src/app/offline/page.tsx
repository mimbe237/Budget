'use client';

import { WifiOff, RefreshCw, Home } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useEffect, useState } from 'react';

export default function OfflinePage() {
  const [isOnline, setIsOnline] = useState(false);

  useEffect(() => {
    // Vérifier la connexion
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

  const handleRefresh = () => {
    if (navigator.onLine) {
      window.location.reload();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-orange-100 dark:bg-orange-900/20 flex items-center justify-center">
            <WifiOff className="h-8 w-8 text-orange-600 dark:text-orange-400" />
          </div>
          <CardTitle className="text-2xl font-headline">
            {isOnline ? 'Reconnexion en cours...' : 'Vous êtes hors ligne'}
          </CardTitle>
          <CardDescription className="text-base mt-2">
            {isOnline
              ? 'Votre connexion Internet a été rétablie. Rechargez la page pour continuer.'
              : 'Impossible de se connecter à Internet. Vérifiez votre connexion et réessayez.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Statut de connexion */}
          <div className="flex items-center justify-center gap-2 p-3 rounded-lg bg-muted">
            <div
              className={`w-3 h-3 rounded-full ${
                isOnline ? 'bg-green-500 animate-pulse' : 'bg-red-500'
              }`}
            />
            <span className="text-sm font-medium">
              {isOnline ? 'Connexion détectée' : 'Pas de connexion'}
            </span>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-2">
            <Button
              onClick={handleRefresh}
              disabled={!isOnline}
              className="w-full"
              size="lg"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Recharger la page
            </Button>

            <Button variant="outline" asChild className="w-full" size="lg">
              <Link href="/">
                <Home className="mr-2 h-4 w-4" />
                Retour à l'accueil
              </Link>
            </Button>
          </div>

          {/* Conseils */}
          <div className="mt-6 p-4 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800">
            <h3 className="font-semibold text-sm text-blue-900 dark:text-blue-100 mb-2">
              💡 Conseils
            </h3>
            <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
              <li>• Vérifiez votre connexion Wi-Fi ou données mobiles</li>
              <li>• Activez le mode Avion puis désactivez-le</li>
              <li>• Redémarrez votre routeur si nécessaire</li>
              <li>• Certaines données sont disponibles hors ligne</li>
            </ul>
          </div>

          {/* Fonctionnalités offline */}
          <div className="mt-4 p-4 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800">
            <h3 className="font-semibold text-sm text-green-900 dark:text-green-100 mb-2">
              ✅ Disponible hors ligne
            </h3>
            <ul className="text-sm text-green-800 dark:text-green-200 space-y-1">
              <li>• Consultation des dernières données synchronisées</li>
              <li>• Navigation dans les pages déjà visitées</li>
              <li>• Affichage des transactions en cache</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
