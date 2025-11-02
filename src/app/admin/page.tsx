'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { useAuth, useUser } from '@/firebase';
import { Button } from '@/components/ui/button';
import { AdminSidebar } from './components/AdminSidebar';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ShieldCheck, Landmark, AlertTriangle, Sparkles } from 'lucide-react';

const ADMIN_EMAIL_SET = (() => {
  if (typeof process === 'undefined') return new Set<string>();
  const raw = process.env.NEXT_PUBLIC_ADMIN_EMAILS ?? '';
  return new Set(
    raw
      .split(',')
      .map(email => email.trim().toLowerCase())
      .filter(Boolean)
  );
})();

export default function AdminLoginPage() {
  const auth = useAuth();
  const { user, userProfile, userError, isUserLoading, isUserProfileLoading } = useUser();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [kpis, setKpis] = useState<{
    totalUsers: number;
    totalTransactions: number;
    totalPlatformBalanceInCents: number;
    newUsersThisMonth: number;
    activeUsersThisMonth: number;
    totalDebts: number;
    activeDebts: number;
    overdueDebts: number;
  } | null>(null);
  const [kpiLoading, setKpiLoading] = useState(false);
  const [kpiError, setKpiError] = useState<string | null>(null);

  const isProfileAdmin = useMemo(() => {
    if (!user) return false;
    if (userProfile?.status === 'suspended') {
      return false;
    }
    // Vérification admin : on utilise uniquement le set d'emails admins
    if (user.email) {
      return ADMIN_EMAIL_SET.has(user.email.toLowerCase());
    }
    return false;
  }, [user, userProfile]);

  useEffect(() => {
    if (userError?.message === 'account-suspended' || userProfile?.status === 'suspended') {
      setErrorMessage('Votre compte administrateur est suspendu. Contactez un administrateur principal.');
      setIsSubmitting(false);
      if (auth) {
        signOut(auth).catch(() => {/* noop */});
      }
      return;
    }
    if (isUserLoading || isUserProfileLoading) {
      return;
    }
    // Si l'utilisateur est connecté mais n'est pas admin, déconnexion et message
    if (user && !isProfileAdmin && auth) {
      setErrorMessage("Vous n'avez pas les droits administrateur pour accéder à cette console.");
      setIsSubmitting(false);
      signOut(auth).catch(() => {/* noop */});
    }
  }, [user, isProfileAdmin, isUserLoading, isUserProfileLoading, auth, router, userProfile?.status, userError?.message]);

  useEffect(() => {
    if (!user || !isProfileAdmin) {
      setKpis(null);
      return;
    }
    let isMounted = true;
    const fetchKpis = async () => {
      try {
        setKpiLoading(true);
        setKpiError(null);
        const res = await fetch('/api/admin/users/overview', { cache: 'no-store' });
        if (!res.ok) {
          throw new Error('Impossible de récupérer les indicateurs');
        }
        const data = await res.json();
        if (isMounted) {
          setKpis({
            totalUsers: data.kpis.totalUsers,
            totalTransactions: data.kpis.totalTransactions,
            totalPlatformBalanceInCents: data.kpis.totalPlatformBalanceInCents,
            newUsersThisMonth: data.kpis.newUsersThisMonth,
            activeUsersThisMonth: data.kpis.activeUsersThisMonth,
            totalDebts: data.kpis.totalDebts,
            activeDebts: data.kpis.activeDebts,
            overdueDebts: data.kpis.overdueDebts,
          });
        }
      } catch (error: any) {
        if (isMounted) {
          setKpiError(error?.message || 'Erreur lors du chargement des indicateurs');
        }
      } finally {
        if (isMounted) {
          setKpiLoading(false);
        }
      }
    };
    fetchKpis();
    return () => {
      isMounted = false;
    };
  }, [user, isProfileAdmin]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!auth) {
      setErrorMessage('Service d’authentification indisponible.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error: any) {
      let message = 'Connexion impossible. Vérifiez vos identifiants.';
      if (error?.code === 'auth/invalid-email') {
        message = 'Adresse email invalide.';
      } else if (error?.code === 'auth/user-not-found') {
        message = 'Aucun compte administrateur avec cette adresse.';
      } else if (error?.code === 'auth/wrong-password') {
        message = 'Mot de passe incorrect.';
      } else if (error?.message) {
        message = error.message;
      }
      setErrorMessage(message);
      setIsSubmitting(false);
    }
  };

  // Si l'utilisateur est admin, afficher le dashboard avec sidebar
  if (user && isProfileAdmin) {
    const formatNumber = (value: number) => new Intl.NumberFormat('fr-FR').format(value);
    const formatCurrency = (valueInCents: number) =>
      new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XAF', maximumFractionDigits: 0 }).format(
        Math.round(valueInCents / 100)
      );

    return (
      <div className="flex min-h-screen bg-slate-50">
        <AdminSidebar />
        <main className="flex-1 px-8 py-10">
          <header className="flex items-center justify-between mb-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1 text-sm font-medium text-primary">
                <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                Accès réservé aux administrateurs
              </div>
              <h1 className="text-3xl font-headline font-bold text-gray-900">
                Console d’administration
              </h1>
              <p className="max-w-3xl text-base text-gray-600">
                Pilotez votre plateforme en toute confiance : suivez l’adoption et accédez aux rapports consolidés pour anticiper les besoins de vos utilisateurs.
              </p>
            </div>
          </header>
          <section className="grid grid-cols-1 gap-6 mb-10 lg:grid-cols-4">
            <Card className="shadow-sm border border-slate-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-slate-500">Utilisateurs totaux</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-semibold text-slate-900">
                  {kpiLoading ? '...' : formatNumber(kpis?.totalUsers ?? 0)}
                </div>
                <p className="text-xs text-slate-500 mt-2">Comptes actifs et suspendus confondus</p>
              </CardContent>
            </Card>
            <Card className="shadow-sm border border-slate-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-slate-500">Transactions totales</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-semibold text-slate-900">
                  {kpiLoading ? '...' : formatNumber(kpis?.totalTransactions ?? 0)}
                </div>
                <p className="text-xs text-slate-500 mt-2">Incluant revenus et dépenses</p>
              </CardContent>
            </Card>
            <Card className="shadow-sm border border-slate-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-slate-500">Solde agrégé</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-semibold text-slate-900">
                  {kpiLoading ? '...' : formatCurrency(kpis?.totalPlatformBalanceInCents ?? 0)}
                </div>
                <p className="text-xs text-slate-500 mt-2">Disponible tous utilisateurs confondus</p>
              </CardContent>
            </Card>
            <Card className="shadow-sm border border-slate-200">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm font-medium text-slate-500">
                  <Landmark className="h-4 w-4 text-slate-400" aria-hidden="true" />
                  Dettes actives
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-semibold text-slate-900">
                  {kpiLoading ? '...' : formatNumber(kpis?.activeDebts ?? 0)}
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  {kpiLoading ? 'Suivi en cours' : `Sur ${formatNumber(kpis?.totalDebts ?? 0)} dettes suivies`}
                </p>
              </CardContent>
            </Card>
          </section>

          <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="shadow-sm border border-slate-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold text-slate-900">Nouveaux utilisateurs</CardTitle>
                <CardDescription>Créés depuis le début du mois courant</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-semibold text-slate-900">
                  {kpiLoading ? '...' : formatNumber(kpis?.newUsersThisMonth ?? 0)}
                </div>
              </CardContent>
            </Card>
            <Card className="shadow-sm border border-slate-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold text-slate-900">Utilisateurs actifs ce mois</CardTitle>
                <CardDescription>Ayant réalisé au moins une transaction</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-semibold text-slate-900">
                  {kpiLoading ? '...' : formatNumber(kpis?.activeUsersThisMonth ?? 0)}
                </div>
              </CardContent>
            </Card>
            <Card className="shadow-sm border border-slate-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold text-slate-900">Dettes en retard</CardTitle>
                <CardDescription>Échéances dépassées nécessitant un suivi</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-semibold text-amber-600 flex items-center gap-2">
                  <AlertTriangle className="h-6 w-6" aria-hidden="true" />
                  {kpiLoading ? '...' : formatNumber(kpis?.overdueDebts ?? 0)}
                </div>
              </CardContent>
            </Card>
          </section>

          {kpiError && (
            <div className="mt-6 text-sm text-red-600">{kpiError}</div>
          )}
          <Card className="mt-10 border border-slate-200 bg-white shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-slate-900">Accès rapide</CardTitle>
              <CardDescription>Mettez à jour les contenus clés et explorez les nouveaux modules dettes.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-3">
              <Button variant="outline" onClick={() => router.push('/admin/users')}>
                Gestion des utilisateurs
              </Button>
              <Button variant="outline" onClick={() => router.push('/admin/reports')}>
                Rapports &amp; exports
              </Button>
              <Button variant="outline" onClick={() => router.push('/dashboard')}>
                Tableau de bord utilisateur
              </Button>
              <Button variant="outline" onClick={() => router.push('/debts')}>
                Pilotage des dettes
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  // Sinon, afficher le formulaire de connexion admin
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-900 px-4">
      <Card className="w-full max-w-md border-slate-800 bg-slate-950 text-slate-100 shadow-2xl">
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <CardHeader className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                <ShieldCheck className="h-6 w-6" aria-hidden="true" />
              </div>
              <div>
                <CardTitle className="text-2xl font-headline">Console Administrateur</CardTitle>
                <CardDescription className="text-slate-400">
                  Accès réservé aux comptes administrateurs autorisés.
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            {errorMessage && (
              <div className="rounded-md border border-red-500/60 bg-red-500/10 px-3 py-2 text-sm text-red-200">
                {errorMessage}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="admin-email" className="text-sm font-medium text-slate-200">
                Adresse email
              </Label>
              <Input
                id="admin-email"
                type="email"
                value={email}
                onChange={event => setEmail(event.target.value)}
                placeholder="admin@entreprise.com"
                autoComplete="username"
                required
                className="h-11 border-slate-700 bg-slate-900 text-slate-100 placeholder:text-slate-500 focus-visible:ring-primary"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="admin-password" className="text-sm font-medium text-slate-200">
                Mot de passe
              </Label>
              <Input
                id="admin-password"
                type="password"
                value={password}
                onChange={event => setPassword(event.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                required
                className="h-11 border-slate-700 bg-slate-900 text-slate-100 placeholder:text-slate-500 focus-visible:ring-primary"
              />
            </div>
          </CardContent>

          <CardFooter className="flex flex-col gap-4 pt-0">
            <Button
              type="submit"
              className="h-11 w-full text-base font-semibold"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Connexion…' : 'Se connecter'}
            </Button>
            <p className="text-center text-xs text-slate-500">
              Besoin d’un accès ? Contactez un administrateur principal.
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
