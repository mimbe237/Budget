'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SocialAuthButtons } from '@/components/auth/social-auth-buttons';
import { useAuth, useUser, initiateEmailSignIn } from '@/firebase';
import { useRouter } from 'next/navigation';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Logo } from '@/components/logo';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { useTranslation } from '@/lib/i18n';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const auth = useAuth();
  const { user, userProfile, userError, isUserLoading, isUserProfileLoading } = useUser();
  const router = useRouter();
  const { t } = useTranslation();

  useEffect(() => {
    if (!isUserLoading && !isUserProfileLoading && user && userProfile?.status !== 'suspended') {
      router.push('/dashboard');
    }
  }, [user, userProfile?.status, isUserLoading, isUserProfileLoading, router]);

  const suspendedMessage = useMemo(() => {
    if (userProfile?.status === 'suspended' || userError?.message === 'account-suspended') {
      return 'Votre compte est suspendu. Contactez l’assistance pour le réactiver.';
    }
    return null;
  }, [userProfile?.status, userError?.message]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!auth) return;
    initiateEmailSignIn(auth, email, password);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 py-12 transition-colors duration-500 dark:bg-slate-900">
      <div className="w-full max-w-lg">
        <div className="flex justify-end mb-6">
          <LanguageSwitcher compact />
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white shadow-xl transition-colors duration-500 dark:border-slate-700 dark:bg-slate-900">
          <div className="px-8 py-10 sm:px-10">
            <div className="flex justify-center mb-8">
              <div className="h-10 w-auto"><Logo /></div>
            </div>

            {suspendedMessage && (
              <div className="mb-6 rounded-xl border border-red-500/60 bg-red-500/10 px-4 py-3 text-sm font-medium text-red-700 text-center">
                {suspendedMessage}
              </div>
            )}

            <div className="space-y-2">
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
                Commençons avec votre e-mail
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-300">
                {t('auth.login.subtitle')}
              </p>
            </div>

            <div className="mt-6 border-t border-slate-200 dark:border-slate-700" />

            <form onSubmit={handleSubmit} className="mt-6 space-y-6">
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                  {t('auth.login.emailLabel')}
                </label>
                <Input
                  id="email"
                  type="email"
                  placeholder={t('auth.login.emailPlaceholder')}
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  autoComplete="username"
                  className="h-12 rounded-xl border-slate-200 bg-white px-4 text-base text-slate-900 placeholder:text-slate-400 shadow-sm transition focus:border-[#5B2EFF] focus:ring-2 focus:ring-[#5B2EFF]/30 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                  required
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                  {t('auth.login.passwordLabel')}
                </label>
                <Input
                  id="password"
                  type="password"
                  placeholder={t('auth.login.passwordPlaceholder')}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  autoComplete="current-password"
                  className="h-12 rounded-xl border-slate-200 bg-white px-4 text-base text-slate-900 placeholder:text-slate-400 shadow-sm transition focus:border-[#5B2EFF] focus:ring-2 focus:ring-[#5B2EFF]/30 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                  required
                />
              </div>

              <Button
                type="submit"
                className="h-12 w-full rounded-xl bg-[#5B2EFF] text-base font-semibold text-white shadow-none transition hover:bg-[#4c24e0] focus:ring-2 focus:ring-offset-2 focus:ring-[#5B2EFF]"
              >
                {t('auth.login.button')}
              </Button>
            </form>

            <div className="mt-8 flex items-center gap-3 text-xs font-medium uppercase tracking-wide text-slate-400">
              <span className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
              <span>ou continuez avec</span>
              <span className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
            </div>

            <div className="mt-4">
              <SocialAuthButtons mode="login" variant="capsule" />
            </div>

            <p className="mt-6 text-center text-xs text-slate-500 dark:text-slate-300">
              En poursuivant, vous acceptez nos{' '}
              <Link href="/legal/terms" className="font-semibold text-[#5B2EFF] hover:underline">
                Conditions d’utilisation
              </Link>{' '}
              et notre{' '}
              <Link href="/legal/privacy" className="font-semibold text-[#5B2EFF] hover:underline">
                Politique de confidentialité
              </Link>
              .
            </p>

            <p className="mt-6 text-center text-sm text-slate-600 dark:text-slate-300">
              {t('auth.login.noAccount')}{' '}
              <Link href="/signup" className="font-semibold text-[#5B2EFF] hover:underline">
                {t('auth.login.signupLink')}
              </Link>
            </p>
          </div>
        </div>

        {isUserLoading && (
          <div className="fixed inset-0 flex items-center justify-center bg-black/30 z-50 animate-fadein">
            <div className="w-12 h-12 border-4 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
      </div>
      <style jsx global>{`
        .animate-fadein {
          animation: fadein 0.7s cubic-bezier(.4,0,.2,1);
        }
        @keyframes fadein {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: none; }
        }
      `}</style>
    </div>
  );
}
