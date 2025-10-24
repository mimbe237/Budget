"use client";

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useUser } from '@/firebase';

/**
 * Bloque l'accès au dashboard tant que les infos essentielles ne sont pas définies
 * - locale
 * - displayCurrency
 * - monthlyExpenseBudget
 */
export function OnboardingGate({ children }: { children: React.ReactNode }) {
  const { user, isUserLoading, userProfile, isUserProfileLoading } = useUser();
  const pathname = usePathname();
  const router = useRouter();

  const isAuthPage = pathname?.startsWith('/login') || pathname?.startsWith('/signup');
  const isOnboardingPage = pathname === '/onboarding';

  useEffect(() => {
    if (isUserLoading || isUserProfileLoading) return;

    // Non connecté: pas de redirection (login/signup s'en occupent)
    if (!user) return;

    // Ne pas boucler sur la page d'onboarding ou les pages d'auth
    if (isAuthPage || isOnboardingPage) return;

    const needsLocale = !userProfile?.locale;
    const needsCurrency = !userProfile?.displayCurrency;
    const needsBudget = typeof userProfile?.monthlyExpenseBudget !== 'number';

    const needsOnboarding = needsLocale || needsCurrency || needsBudget;

    if (needsOnboarding) {
      router.replace('/onboarding');
    }
  }, [user, userProfile, isUserLoading, isUserProfileLoading, isAuthPage, isOnboardingPage, router]);

  return <>{children}</>;
}
