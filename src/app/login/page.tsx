'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SocialAuthButtons } from '@/components/auth/social-auth-buttons';
import { useAuth, useUser, initiateEmailSignIn } from '@/firebase';
import { useRouter, useSearchParams } from 'next/navigation';
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
  const searchParams = useSearchParams();
  const accountDeletedFlag = searchParams?.get('accountDeleted');
  const isFrench = userProfile?.locale === 'fr-CM';
  const { t } = useTranslation();

  useEffect(() => {
    if (!isUserLoading && !isUserProfileLoading && user && userProfile?.status !== 'suspended') {
      router.push('/dashboard');
    }
  }, [user, userProfile?.status, isUserLoading, isUserProfileLoading, router]);

  const suspendedMessage = useMemo(() => {
    if (userProfile?.status === 'suspended' || userError?.message === 'account-suspended') {
      return "Votre compte est suspendu. Contactez l'assistance pour le réactiver.";
    }
    return null;
  }, [userProfile?.status, userError?.message]);

  const deletedMessage = accountDeletedFlag === '1'
    ? (isFrench
      ? 'Ce compte a été supprimé définitivement. Vous ne pouvez plus vous connecter.'
      : 'This account has been deleted permanently. You cannot sign in anymore.')
    : null;

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!auth) return;
    initiateEmailSignIn(auth, email, password);
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-header">
          <Link href="/" className="login-back-btn">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 5L7 10L12 15" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span>Retour à l&apos;accueil</span>
          </Link>
          <LanguageSwitcher compact />
        </div>

        <div className="login-card">
          <div className="login-logo">
            <Logo />
          </div>

          {suspendedMessage && (
            <div className="login-alert">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="10" cy="10" r="8" />
                <path d="M10 6v4M10 14h.01" strokeLinecap="round" />
              </svg>
              <p>{suspendedMessage}</p>
            </div>
          )}
          {deletedMessage && (
            <div className="login-alert">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="10" cy="10" r="8" />
                <path d="M7 7l6 6M13 7l-6 6" strokeLinecap="round" />
              </svg>
              <p>{deletedMessage}</p>
            </div>
          )}

          <div className="login-content">
            <h1>Bienvenue sur Budget Pro</h1>
            <p className="login-subtitle">
              Connectez-vous pour accéder à votre tableau de bord et piloter vos finances.
            </p>

            <form onSubmit={handleSubmit} className="login-form">
              <div className="login-field">
                <label htmlFor="email">Adresse e-mail</label>
                <Input
                  id="email"
                  type="email"
                  placeholder="vous@exemple.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  autoComplete="username"
                  className="login-input"
                  required
                />
              </div>

              <div className="login-field">
                <div className="login-field-header">
                  <label htmlFor="password">Mot de passe</label>
                  <Link href="/auth/reset-password" className="login-forgot">
                    Mot de passe oublié ?
                  </Link>
                </div>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  autoComplete="current-password"
                  className="login-input"
                  required
                />
              </div>

              <Button type="submit" className="login-btn-primary">
                Se connecter
              </Button>
            </form>

            <div className="login-divider">
              <span>ou continuez avec</span>
            </div>

            <div className="login-social">
              <SocialAuthButtons mode="login" variant="capsule" />
            </div>

            <p className="login-terms">
              En vous connectant, vous acceptez nos{' '}
              <Link href="/legal/terms">Conditions d&apos;utilisation</Link> et notre{' '}
              <Link href="/legal/privacy">Politique de confidentialité</Link>.
            </p>

            <p className="login-signup">
              Pas encore de compte ?{' '}
              <Link href="/signup">Créer un compte gratuitement</Link>
            </p>
          </div>
        </div>

        {isUserLoading && (
          <div className="login-loading">
            <div className="login-spinner"></div>
          </div>
        )}
      </div>

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&family=Inter:wght@400;500;600&display=swap');

        .login-page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #e0e7ff 0%, #f8fafc 55%, #f0fdfa 100%);
          padding: 2rem 1rem;
          font-family: 'Inter', system-ui, -apple-system, sans-serif;
        }

        .login-container {
          width: 100%;
          max-width: 480px;
          animation: fadeInUp 0.6s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .login-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 2rem;
        }

        .login-back-btn {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 1rem;
          border-radius: 12px;
          font-size: 0.95rem;
          font-weight: 500;
          color: #475467;
          background: rgba(255, 255, 255, 0.8);
          border: 1px solid rgba(15, 23, 42, 0.08);
          transition: all 0.2s ease;
        }

        .login-back-btn:hover {
          color: #2563eb;
          background: #ffffff;
          border-color: rgba(37, 99, 235, 0.2);
          transform: translateX(-2px);
        }

        .login-card {
          background: rgba(255, 255, 255, 0.95);
          border-radius: 24px;
          border: 1px solid rgba(15, 23, 42, 0.08);
          box-shadow: 0 24px 60px rgba(37, 99, 235, 0.12);
          backdrop-filter: blur(12px);
          overflow: hidden;
        }

        .login-logo {
          display: flex;
          justify-content: center;
          padding: 2.5rem 2rem 1.5rem;
          border-bottom: 1px solid rgba(15, 23, 42, 0.06);
        }

        .login-logo > * {
          height: 42px;
          width: auto;
        }

        .login-alert {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin: 1.5rem 2rem;
          padding: 1rem 1.25rem;
          border-radius: 16px;
          background: linear-gradient(135deg, rgba(239, 68, 68, 0.1), rgba(220, 38, 38, 0.08));
          border: 1.5px solid rgba(239, 68, 68, 0.3);
          color: #991b1b;
          font-size: 0.9rem;
          font-weight: 500;
        }

        .login-alert svg {
          flex-shrink: 0;
          color: #dc2626;
        }

        .login-alert p {
          margin: 0;
        }

        .login-content {
          padding: 2rem 2rem 2.5rem;
        }

        .login-content h1 {
          font-family: 'Poppins', sans-serif;
          font-size: 1.75rem;
          font-weight: 700;
          color: #0f172a;
          margin: 0 0 0.5rem;
          letter-spacing: -0.01em;
        }

        .login-subtitle {
          font-size: 0.95rem;
          color: #475467;
          line-height: 1.6;
          margin: 0 0 2rem;
        }

        .login-form {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .login-field {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .login-field-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .login-field label {
          font-family: 'Inter', sans-serif;
          font-size: 0.9rem;
          font-weight: 600;
          color: #111827;
        }

        .login-forgot {
          font-size: 0.85rem;
          font-weight: 500;
          color: #2563eb;
          transition: all 0.2s ease;
        }

        .login-forgot:hover {
          color: #1d4ed8;
          text-decoration: underline;
        }

        .login-input {
          height: 48px;
          padding: 0 1rem;
          border-radius: 12px;
          border: 1.5px solid rgba(15, 23, 42, 0.12);
          background: #ffffff;
          font-size: 0.95rem;
          color: #111827;
          transition: all 0.2s ease;
        }

        .login-input:focus {
          outline: none;
          border-color: #2563eb;
          box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
        }

        .login-input::placeholder {
          color: #94a3b8;
        }

        .login-btn-primary {
          height: 48px;
          width: 100%;
          margin-top: 0.5rem;
          border-radius: 12px;
          background: linear-gradient(135deg, #2563eb 0%, #0ea5e9 100%);
          color: #ffffff;
          font-family: 'Inter', sans-serif;
          font-size: 1rem;
          font-weight: 600;
          border: none;
          box-shadow: 0 4px 16px rgba(37, 99, 235, 0.25);
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          cursor: pointer;
        }

        .login-btn-primary:hover {
          background: linear-gradient(135deg, #1d4ed8 0%, #0284c7 100%);
          box-shadow: 0 8px 28px rgba(37, 99, 235, 0.35);
          transform: translateY(-2px);
        }

        .login-btn-primary:active {
          transform: translateY(0);
        }

        .login-divider {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin: 2rem 0 1.5rem;
          color: #94a3b8;
          font-size: 0.85rem;
          font-weight: 500;
        }

        .login-divider::before,
        .login-divider::after {
          content: '';
          flex: 1;
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(15, 23, 42, 0.1), transparent);
        }

        .login-social {
          margin-bottom: 1.5rem;
        }

        .login-terms {
          margin: 0;
          padding: 1.5rem 0 0;
          border-top: 1px solid rgba(15, 23, 42, 0.06);
          text-align: center;
          font-size: 0.8rem;
          color: #667085;
          line-height: 1.6;
        }

        .login-terms a {
          color: #2563eb;
          font-weight: 500;
          transition: color 0.2s ease;
        }

        .login-terms a:hover {
          color: #1d4ed8;
          text-decoration: underline;
        }

        .login-signup {
          margin: 1.25rem 0 0;
          text-align: center;
          font-size: 0.95rem;
          color: #475467;
        }

        .login-signup a {
          color: #2563eb;
          font-weight: 600;
          transition: all 0.2s ease;
        }

        .login-signup a:hover {
          color: #1d4ed8;
          text-decoration: underline;
        }

        .login-loading {
          position: fixed;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(15, 23, 42, 0.4);
          backdrop-filter: blur(4px);
          z-index: 100;
          animation: fadeIn 0.2s ease;
        }

        .login-spinner {
          width: 48px;
          height: 48px;
          border: 4px solid rgba(37, 99, 235, 0.2);
          border-top-color: #2563eb;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(24px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        @media (max-width: 640px) {
          .login-page {
            padding: 1rem 0.75rem;
          }

          .login-header {
            margin-bottom: 1.5rem;
          }

          .login-content {
            padding: 1.5rem 1.25rem 2rem;
          }

          .login-content h1 {
            font-size: 1.5rem;
          }

          .login-back-btn span {
            display: none;
          }
        }

        /* Dark mode support */
        @media (prefers-color-scheme: dark) {
          .login-page {
            background: linear-gradient(135deg, #0f172a 0%, #1e293b 55%, #0f172a 100%);
          }

          .login-card {
            background: rgba(30, 41, 59, 0.95);
            border-color: rgba(148, 163, 184, 0.1);
          }

          .login-back-btn {
            background: rgba(30, 41, 59, 0.8);
            border-color: rgba(148, 163, 184, 0.1);
            color: #cbd5e1;
          }

          .login-back-btn:hover {
            background: rgba(30, 41, 59, 1);
            border-color: rgba(37, 99, 235, 0.3);
          }

          .login-content h1 {
            color: #f1f5f9;
          }

          .login-subtitle {
            color: #cbd5e1;
          }

          .login-field label {
            color: #f1f5f9;
          }

          .login-input {
            background: rgba(15, 23, 42, 0.6);
            border-color: rgba(148, 163, 184, 0.2);
            color: #f1f5f9;
          }

          .login-input:focus {
            background: rgba(15, 23, 42, 0.8);
            border-color: #2563eb;
          }

          .login-terms {
            border-color: rgba(148, 163, 184, 0.1);
            color: #94a3b8;
          }

          .login-signup {
            color: #cbd5e1;
          }
        }
      `}</style>
    </div>
  );
}
