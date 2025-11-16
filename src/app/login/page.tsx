"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SocialAuthButtons } from "@/components/auth/social-auth-buttons";
import { useAuth, useUser } from "@/firebase";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Logo } from "@/components/logo";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { AlertCircle } from "lucide-react";
import { FirebaseError, signInWithEmailAndPassword } from "firebase/auth";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [isSubmittingLogin, setIsSubmittingLogin] = useState(false);
  const auth = useAuth();
  const { user, userProfile, userError, isUserLoading, isUserProfileLoading } = useUser();
  const router = useRouter();
  const searchParams = useSearchParams();
  const accountDeletedFlag = searchParams?.get("accountDeleted");
  const isFrench = userProfile?.locale === "fr-CM";
  useEffect(() => {
    if (!isUserLoading && !isUserProfileLoading && user && userProfile?.status !== "suspended") {
      router.push("/dashboard");
    }
  }, [user, userProfile?.status, isUserLoading, isUserProfileLoading, router]);

  const suspendedMessage = useMemo(() => {
    if (userProfile?.status === "suspended" || userError?.message === "account-suspended") {
      return "Votre compte est suspendu. Contactez l'assistance pour le réactiver.";
    }
    return null;
  }, [userProfile?.status, userError?.message]);

  const deletedMessage =
    accountDeletedFlag === "1"
      ? isFrench
        ? "Ce compte a été supprimé définitivement. Vous ne pouvez plus vous connecter."
        : "This account has been deleted permanently. You cannot sign in anymore."
      : null;

  useEffect(() => {
    if (loginError) {
      setLoginError("");
    }
  }, [email, password]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!auth) return;
    if (!email || !password) {
      setLoginError("Email et mot de passe sont requis.");
      return;
    }
    setLoginError("");
    setIsSubmittingLogin(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
      if (err instanceof FirebaseError) {
        switch (err.code) {
          case "auth/user-not-found":
            setLoginError("Ce compte n'existe pas. Créez-en un ou vérifiez votre email.");
            break;
          case "auth/wrong-password":
            setLoginError("Mot de passe incorrect. Réessayez ou réinitialisez-le.");
            break;
          case "auth/too-many-requests":
            setLoginError("Trop de tentatives. Réessayez dans quelques minutes.");
            break;
          default:
            setLoginError("Impossible de se connecter pour le moment, réessayez.");
        }
      } else {
        setLoginError("Impossible de se connecter pour le moment, réessayez.");
      }
    } finally {
      setIsSubmittingLogin(false);
    }
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

          {loginError && (
            <div className="login-alert login-error">
              <AlertCircle className="h-5 w-5" />
              <p>{loginError}</p>
            </div>
          )}

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
                  onChange={(e) => setEmail(e.target.value)}
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
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  className="login-input"
                  required
                />
              </div>

              <Button type="submit" className="login-btn-primary" disabled={isSubmittingLogin}>
                {isSubmittingLogin ? "Connexion…" : "Se connecter"}
              </Button>
            </form>

            <div className="login-divider">
              <span>ou continuez avec</span>
            </div>

            <div className="login-social">
              <SocialAuthButtons mode="login" variant="capsule" />
            </div>

            <p className="login-terms">
              En vous connectant, vous acceptez nos{" "}
              <Link href="/legal/terms">Conditions d&apos;utilisation</Link> et notre{" "}
              <Link href="/legal/privacy">Politique de confidentialité</Link>.
            </p>

            <p className="login-signup">
              Pas encore de compte ?{" "}
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
        @import url("https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&family=Inter:wght@400;500;600&display=swap");

        :root {
          color-scheme: light;
        }

        .login-page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: radial-gradient(circle at top right, rgba(59, 174, 255, 0.25), transparent 45%),
            radial-gradient(circle at 15% -20%, rgba(16, 185, 129, 0.15), transparent 40%),
            linear-gradient(180deg, #ecf1ff 0%, #f6fbff 100%);
          padding: 3rem 1rem;
          font-family: "Inter", system-ui, -apple-system, sans-serif;
        }

        .login-container {
          width: min(520px, 100%);
          animation: fadeInUp 0.65s ease;
        }

        .login-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 1.75rem;
        }

        .login-back-btn {
          display: inline-flex;
          align-items: center;
          gap: 0.6rem;
          padding: 0.6rem 1.4rem;
          border-radius: 999px;
          font-size: 0.9rem;
          font-weight: 500;
          color: #475467;
          background: rgba(255, 255, 255, 0.85);
          border: 1px solid rgba(15, 23, 42, 0.08);
          box-shadow: 0 18px 35px rgba(15, 23, 42, 0.08);
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }

        .login-back-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 22px 50px rgba(15, 23, 42, 0.12);
        }

        .login-card {
          background: linear-gradient(180deg, #ffffff 0%, #e9f1ff 50%, #fdf8ff 100%);
          border-radius: 32px;
          padding: 2.75rem 2.25rem;
          box-shadow: 0 30px 80px rgba(15, 23, 42, 0.18);
          border: 1px solid rgba(148, 163, 184, 0.25);
        }

        .login-logo {
          display: flex;
          justify-content: center;
          margin-bottom: 1.25rem;
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
          border-radius: 18px;
          background: linear-gradient(135deg, rgba(239, 68, 68, 0.1), rgba(220, 38, 38, 0.08));
          border: 1.5px solid rgba(239, 68, 68, 0.3);
          color: #991b1b;
          font-size: 0.9rem;
          font-weight: 500;
        }

        .login-alert.login-error {
          background: linear-gradient(135deg, rgba(37, 99, 235, 0.08), rgba(59, 130, 246, 0.08));
          border-color: rgba(37, 99, 235, 0.35);
          color: #1d4ed8;
        }

        .login-alert svg {
          flex-shrink: 0;
          color: #dc2626;
        }

        .login-alert.login-error svg {
          color: #2563eb;
        }

        .login-content {
          padding: 2rem 2rem 2.5rem;
        }

        .login-content h1 {
          font-family: "Poppins", sans-serif;
          font-size: 1.9rem;
          font-weight: 700;
          color: #0f172a;
          margin: 0 0 0.5rem;
          letter-spacing: -0.01em;
          text-align: center;
        }

        .login-subtitle {
          font-size: 0.95rem;
          color: #475467;
          line-height: 1.6;
          margin: 0 0 1.75rem;
          text-align: center;
        }

        .login-form {
          display: flex;
          flex-direction: column;
          gap: 1.35rem;
        }

        .login-field {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .login-field label {
          font-family: "Inter", sans-serif;
          font-size: 0.9rem;
          font-weight: 600;
          color: #111827;
        }

        .login-field-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .login-forgot {
          font-size: 0.85rem;
          font-weight: 600;
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
          border-radius: 16px;
          border: 1.5px solid rgba(15, 23, 42, 0.12);
          background: #ffffff;
          font-size: 0.95rem;
          color: #111827;
          transition: border 0.2s ease, box-shadow 0.2s ease;
        }

        .login-input:focus {
          outline: none;
          border-color: #2563eb;
          box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.15);
        }

        .login-input::placeholder {
          color: #94a3b8;
        }

        .login-btn-primary {
          height: 52px;
          width: 100%;
          border-radius: 999px;
          background: linear-gradient(120deg, #2563eb 0%, #1d4ed8 60%, #0ea5e9 100%);
          color: #ffffff;
          font-family: "Inter", sans-serif;
          font-size: 1rem;
          font-weight: 600;
          border: none;
          box-shadow: 0 25px 40px rgba(37, 99, 235, 0.4), inset 0 -3px 8px rgba(0, 0, 0, 0.15);
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }

        .login-btn-primary:hover {
          transform: translateY(-1px);
          box-shadow: 0 30px 45px rgba(37, 99, 235, 0.45), inset 0 -3px 8px rgba(0, 0, 0, 0.25);
        }

        .login-divider {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin: 1.75rem 0 1.25rem;
          color: #94a3b8;
          font-size: 0.85rem;
          font-weight: 500;
        }

        .login-divider::before,
        .login-divider::after {
          content: "";
          flex: 1;
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(15, 23, 42, 0.15), transparent);
        }

        .login-social {
          margin-bottom: 1.35rem;
          display: flex;
          justify-content: center;
        }

        .login-terms {
          margin: 0;
          padding: 1.5rem 0 0;
          border-top: 1px solid rgba(15, 23, 42, 0.06);
          text-align: center;
          font-size: 0.85rem;
          color: #667085;
          line-height: 1.6;
        }

        .login-terms a {
          color: #2563eb;
          font-weight: 500;
        }

        .login-signup {
          margin: 1rem 0 0;
          text-align: center;
          font-size: 0.95rem;
          color: #475467;
        }

        .login-signup a {
          color: #2563eb;
          font-weight: 600;
        }

        .login-loading {
          position: fixed;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(15, 23, 42, 0.45);
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
            padding: 1.2rem 0.75rem;
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

        @media (prefers-color-scheme: dark) {
          .login-page {
            background: linear-gradient(135deg, #0f172a 0%, #1e293b 55%, #0f172a 100%);
          }

          .login-card {
            background: rgba(30, 41, 59, 0.85);
            border-color: rgba(148, 163, 184, 0.1);
            box-shadow: 0 30px 80px rgba(2, 6, 23, 0.6);
          }

          .login-back-btn {
            background: rgba(30, 41, 59, 0.8);
            border-color: rgba(148, 163, 184, 0.1);
            color: #cbd5e1;
          }

          .login-back-btn:hover {
            background: rgba(30, 41, 59, 1);
            border-color: rgba(37, 99, 235, 0.3);
            color: #f8fafc;
          }

          .login-content h1 {
            color: #f8fafc;
          }

          .login-subtitle {
            color: #cbd5e1;
          }

          .login-field label {
            color: #f8fafc;
          }

          .login-input {
            background: rgba(15, 23, 42, 0.6);
            border-color: rgba(148, 163, 184, 0.2);
            color: #f8fafc;
          }

          .login-input::placeholder {
            color: rgba(248, 250, 252, 0.7);
          }

          .login-terms {
            border-color: rgba(148, 163, 184, 0.1);
            color: #cbd5e1;
          }

          .login-signup {
            color: #cbd5e1;
          }
        }
      `}</style>
    </div>
  );
}
