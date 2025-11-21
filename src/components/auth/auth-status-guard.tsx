'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useUser } from '@/firebase';
import { useToast } from '@/hooks/use-toast';

const PUBLIC_ROUTES = [
  '/',
  '/login',
  '/signup',
  '/auth/reset-password',
  '/pending-approval',
  '/offline',
  '/account-restore',
];

export function AuthStatusGuard({ children }: { children: React.ReactNode }) {
  const { user, userProfile, isUserLoading, isUserProfileLoading } = useUser();
  const router = useRouter();
  const pathname = usePathname();
  const toast = useToast();
  const [isFinalizingDeletion, setIsFinalizingDeletion] = useState(false);

  const loading = isUserLoading || isUserProfileLoading;

  useEffect(() => {
    // Attendre que le chargement soit terminé
    if (loading || !pathname) return;

    // Si pas d'utilisateur connecté et pas sur une route publique, rediriger vers login
    if (!user && !PUBLIC_ROUTES.includes(pathname) && !pathname.startsWith('/auth')) {
      router.push('/login');
      return;
    }

    // Si utilisateur connecté mais compte en attente d'approbation
    if (user && userProfile) {
      const status = (userProfile as any).status || 'active'; // Par défaut active pour les anciens comptes
      const isFrench = userProfile.locale === 'fr-CM';

      if (status === 'pending_deletion') {
        const expiresAt = userProfile.deletionExpiresAt
          ? new Date(userProfile.deletionExpiresAt).getTime()
          : null;
        const graceExpired = expiresAt !== null && expiresAt <= Date.now();

        if (graceExpired) {
          if (!isFinalizingDeletion) {
            setIsFinalizingDeletion(true);
            fetch('/api/user/me', { method: 'DELETE' })
              .then(async (response) => {
                if (!response.ok) {
                  const payload = await response.json().catch(() => ({}));
                  throw new Error(payload?.message || 'Unable to finalize deletion.');
                }
                toast({
                  title: isFrench ? 'Compte supprimé' : 'Account deleted',
                  description: isFrench
                    ? 'Votre compte est définitivement supprimé. Vous ne pouvez plus vous connecter.'
                    : 'Your account has been permanently deleted. You cannot sign in anymore.',
                });
              })
              .catch((err: Error) => {
                console.error('Auto finalize deletion failed', err);
              })
              .finally(() => {
                setIsFinalizingDeletion(false);
                router.push('/login?accountDeleted=1');
              });
          }
          return;
        }

        if (pathname !== '/account-restore') {
          router.push('/account-restore');
          return;
        }
      }

      // Si compte en attente et pas déjà sur la page pending-approval
      if (status === 'pending' && pathname !== '/pending-approval') {
        router.push('/pending-approval');
        return;
      }

      // Si compte rejeté, déconnecter et rediriger
      if (status === 'rejected') {
        // TODO: implémenter la déconnexion
        router.push('/login?error=account-rejected');
        return;
      }

      // Si compte actif et sur pending-approval, rediriger vers dashboard
      if (status === 'active' && pathname === '/pending-approval') {
        router.push('/dashboard');
        return;
      }

      if (status !== 'pending_deletion' && pathname === '/account-restore') {
        router.push('/dashboard');
        return;
      }
    }
  }, [user, userProfile, loading, pathname, router, isUserLoading, isUserProfileLoading, toast, isFinalizingDeletion]);

  // Afficher le chargement ou le contenu
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return <>{children}</>;
}
