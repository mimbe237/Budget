'use client';

import { Button } from '@/components/ui/button';
import { useAuth } from '@/firebase';
import { GoogleAuthProvider, FacebookAuthProvider, signInWithPopup } from 'firebase/auth';
import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from '@/lib/i18n';
import { cn } from '@/lib/utils';

interface SocialAuthButtonsProps {
  mode?: 'login' | 'signup';
  variant?: 'stacked' | 'minimal' | 'capsule';
}

type ProviderId = 'google' | 'facebook';

export function SocialAuthButtons({ mode = 'login', variant = 'stacked' }: SocialAuthButtonsProps) {
  const auth = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState<ProviderId | null>(null);
  const { t, formatMessage } = useTranslation();

  const providers = useMemo(() => ([
    {
      id: 'google' as ProviderId,
      label: t('auth.social.provider.google'),
      icon: (
        <svg className="h-4 w-4" viewBox="0 0 24 24">
          <path
            fill="currentColor"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="currentColor"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="currentColor"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
          />
          <path
            fill="currentColor"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
          />
        </svg>
      ),
      getProvider: () => {
        const provider = new GoogleAuthProvider();
        provider.addScope('profile');
        provider.addScope('email');
        return provider;
      },
    },
    {
      id: 'facebook' as ProviderId,
      label: t('auth.social.provider.facebook'),
      icon: (
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="#1877F2">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
        </svg>
      ),
      getProvider: () => {
        const provider = new FacebookAuthProvider();
        provider.addScope('email');
        provider.addScope('public_profile');
        return provider;
      },
    },
  ]), [t]);

  const handleSocialAuth = async (providerId: ProviderId) => {
    if (!auth) return;
    
    setLoading(providerId);
    try {
      const authProvider = providers.find(provider => provider.id === providerId)?.getProvider();
      if (!authProvider) return;

      const result = await signInWithPopup(auth, authProvider);
      
      // Redirection vers la page d'accueil après connexion réussie
      if (result.user) {
        router.push('/dashboard');
      }
    } catch (error: any) {
      console.error(`Erreur lors de la connexion avec ${providerId}:`, error);
      
      // Gestion des erreurs spécifiques
      let errorMessage = 'Une erreur est survenue lors de la connexion.';
      
      if (error.code === 'auth/popup-closed-by-user') {
        errorMessage = 'La connexion a été annulée.';
      } else if (error.code === 'auth/popup-blocked') {
        errorMessage = 'La popup a été bloquée. Veuillez autoriser les popups pour ce site.';
      } else if (error.code === 'auth/account-exists-with-different-credential') {
        errorMessage = 'Un compte existe déjà avec cet email via un autre fournisseur.';
      } else if (error.code === 'auth/cancelled-popup-request') {
        // Ignore si l'utilisateur a fermé la popup
        setLoading(null);
        return;
      }
      
      alert(errorMessage);
    } finally {
      setLoading(null);
    }
  };

  const actionTemplate = mode === 'login' ? 'auth.social.loginWith' : 'auth.social.signupWith';

  if (variant === 'minimal') {
    return (
      <div className="flex items-center justify-center gap-4">
        {providers.map(provider => (
          <Button
            key={provider.id}
            variant="outline"
            size="icon"
            type="button"
            disabled={loading !== null}
            onClick={() => handleSocialAuth(provider.id)}
            className={cn(
              'h-10 w-10 rounded-full border-muted-foreground/40 bg-background text-muted-foreground transition hover:bg-muted',
              provider.id === 'facebook' ? 'text-[#1877F2]' : ''
            )}
            aria-label={formatMessage(actionTemplate, { provider: provider.label })}
          >
            {loading === provider.id ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-muted-foreground/40 border-t-muted-foreground" />
            ) : (
              provider.icon
            )}
          </Button>
        ))}
      </div>
    );
  }

  if (variant === 'capsule') {
    return (
      <div className="grid gap-3 sm:grid-cols-3">
        {providers.map(provider => (
          <Button
            key={provider.id}
            variant="ghost"
            type="button"
            disabled={loading !== null}
            onClick={() => handleSocialAuth(provider.id)}
            className={cn(
              'h-12 justify-between rounded-xl border border-slate-200 bg-white text-slate-700 font-semibold shadow-none transition hover:bg-slate-50',
              provider.id === 'facebook' ? 'text-[#1B4BFF]' : ''
            )}
            aria-label={formatMessage(actionTemplate, { provider: provider.label })}
          >
            <span>{provider.label}</span>
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-current">
              {loading === provider.id ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-slate-600" />
              ) : (
                provider.icon
              )}
            </span>
          </Button>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-3">
      {providers.map(provider => (
        <Button
          key={provider.id}
          variant="outline"
          type="button"
          disabled={loading !== null}
          onClick={() => handleSocialAuth(provider.id)}
          className="w-full"
        >
          {loading === provider.id ? (
            <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" />
          ) : (
            <span className="mr-2">{provider.icon}</span>
          )}
          {formatMessage(actionTemplate, { provider: provider.label })}
        </Button>
      ))}
    </div>
  );
}
