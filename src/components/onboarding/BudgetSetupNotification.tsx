"use client";

import { useEffect, useState } from 'react';
import { useUser } from '@/firebase';
import Link from 'next/link';
import { X, Settings } from 'lucide-react';
import { usePathname } from 'next/navigation';

/**
 * Affiche une notification pour les nouveaux utilisateurs sans budget défini
 * Uniquement à la première connexion
 */
export function BudgetSetupNotification() {
  const { user, userProfile, isUserLoading, isUserProfileLoading } = useUser();
  const pathname = usePathname();
  const [dismissed, setDismissed] = useState(false);

  // Ne pas afficher sur certaines pages
  const isSettingsPage = pathname?.startsWith('/settings');
  const isOnboardingPage = pathname === '/onboarding';
  const isAuthPage = pathname?.startsWith('/login') || pathname?.startsWith('/signup');
  const isMarketingPage = pathname === '/' || pathname?.startsWith('/landing');

  useEffect(() => {
    if (isUserLoading || isUserProfileLoading) return;
    if (!user || !userProfile) return;
    
    // Ne pas afficher si déjà complété l'onboarding
    if (userProfile.hasCompletedOnboarding) return;

    // Vérifier si l'utilisateur a déjà un budget défini
    const hasBudget = typeof userProfile.monthlyExpenseBudget === 'number';
    
    // Vérifier si c'est la première connexion (pas de createdAt ou très récent)
    const isNewUser = !userProfile.createdAt || 
      (new Date().getTime() - new Date(userProfile.createdAt).getTime() < 24 * 60 * 60 * 1000); // moins de 24h

    // Afficher uniquement si nouveau utilisateur sans budget
    if (!hasBudget && isNewUser) {
      // Auto-dismiss après avoir consulté
      const hasSeenNotification = localStorage.getItem('budget-setup-notification-seen');
      if (hasSeenNotification) {
        setDismissed(true);
      }
    } else {
      setDismissed(true);
    }
  }, [user, userProfile, isUserLoading, isUserProfileLoading]);

  // Ne pas afficher si en cours de chargement, déjà fermé, ou sur certaines pages
  if (isUserLoading || isUserProfileLoading || dismissed || 
      isSettingsPage || isOnboardingPage || isAuthPage || isMarketingPage || !user) {
    return null;
  }

  const hasBudget = typeof userProfile?.monthlyExpenseBudget === 'number';
  if (hasBudget) return null;

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem('budget-setup-notification-seen', 'true');
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-md animate-in slide-in-from-bottom-5">
      <div className="rounded-2xl border border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 p-4 shadow-lg backdrop-blur-sm">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-500 text-white">
            <Settings className="h-5 w-5" />
          </div>
          
          <div className="flex-1 space-y-2">
            <h3 className="font-semibold text-slate-900">
              Configurez votre budget mensuel
            </h3>
            <p className="text-sm text-slate-600">
              Définissez votre budget pour commencer à suivre vos dépenses et recevoir des alertes personnalisées.
            </p>
            <Link
              href="/settings?tab=budget"
              onClick={handleDismiss}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
            >
              Configurer maintenant
            </Link>
          </div>

          <button
            onClick={handleDismiss}
            className="shrink-0 rounded-lg p-1 text-slate-400 transition-colors hover:bg-slate-200 hover:text-slate-600"
            aria-label="Fermer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
