'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';

const ROOT_ROUTES = ['/dashboard', '/transactions', '/goals', '/debts', '/reports'];

/**
 * Hook pour gérer le bouton retour Android sur les routes principales.
 * Affiche une confirmation avant de quitter l'app.
 * 
 * @usage
 * ```tsx
 * function MyPage() {
 *   useAndroidBackHandler();
 *   return <div>...</div>;
 * }
 * ```
 */
export function useAndroidBackHandler() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Détecter si on est sur Android (userAgent contient "Android")
    const isAndroid = typeof navigator !== 'undefined' && /Android/i.test(navigator.userAgent);
    
    if (!isAndroid || !pathname) return;

    // Vérifier si on est sur une route principale
    const isRootRoute = ROOT_ROUTES.some(route => pathname === route);

    if (!isRootRoute) return;

    // Handler pour le bouton back Android
    const handleBackButton = (event: PopStateEvent) => {
      event.preventDefault();
      
      // Afficher une confirmation avant de quitter
      const shouldExit = window.confirm(
        'Voulez-vous vraiment quitter l\'application ?'
      );

      if (shouldExit) {
        // Fermer l'app PWA (ou revenir en arrière dans l'historique)
        if (window.history.length > 1) {
          router.back();
        } else {
          // Si pas d'historique, fermer la fenêtre (fonctionne seulement dans les TWA)
          window.close();
        }
      } else {
        // Rester sur la page actuelle
        window.history.pushState(null, '', pathname);
      }
    };

    // Ajouter un état dans l'historique pour capturer le back
    window.history.pushState(null, '', pathname);

    // Écouter l'événement popstate (bouton retour Android)
    window.addEventListener('popstate', handleBackButton);

    return () => {
      window.removeEventListener('popstate', handleBackButton);
    };
  }, [pathname, router]);
}
