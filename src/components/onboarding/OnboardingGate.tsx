"use client";

import { useEffect, useMemo } from 'react';
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
  const isMarketingPage = pathname === '/' || pathname?.startsWith('/landing');

  const adminEmailSet = useMemo(() => {
    const raw = process.env.NEXT_PUBLIC_ADMIN_EMAILS ?? '';
    return new Set(
      raw
        .split(',')
        .map(email => email.trim().toLowerCase())
        .filter(Boolean)
    );
  }, []);

  useEffect(() => {
    if (isUserLoading || isUserProfileLoading) return;

    // Non connecté: pas de redirection (login/signup s'en occupent)
    if (!user) return;

    // Ne pas boucler sur la page d'onboarding, les pages d'auth ou les pages marketing publiques
    if (isAuthPage || isOnboardingPage || isMarketingPage) return;

    const isAdmin = userProfile?.role === 'admin' || userProfile?.isAdmin === true;
    if (isAdmin) return;

    // Éviter l'onboarding pour les administrateurs (claims ou email whitelist)
    const isAdminProfile = userProfile?.role === 'admin' || userProfile?.isAdmin === true;
    const isAdminEmail = user.email ? adminEmailSet.has(user.email.toLowerCase()) : false;
    if (isAdminProfile || isAdminEmail) return;

    const needsLocale = !userProfile?.locale;
    const needsCurrency = !userProfile?.displayCurrency;
    const needsBudget = typeof userProfile?.monthlyExpenseBudget !== 'number';

    const needsOnboarding = needsLocale || needsCurrency || needsBudget;

    if (needsOnboarding) {
      router.replace('/onboarding');
    }
  }, [user, userProfile, isUserLoading, isUserProfileLoading, isAuthPage, isOnboardingPage, isMarketingPage, router]);

  return <>{children}</>;
}
