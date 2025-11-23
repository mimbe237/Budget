'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Logo from '@/components/Logo';
import { Badge } from '@/components/Badge';
import { Lock, ShieldCheck, ArrowRight, Sparkles } from 'lucide-react';

export default function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { signInWithEmailAndPassword } = await import('firebase/auth');
      const { auth, db } = await import('@/lib/firebase');
      const { doc, getDoc } = await import('firebase/firestore');
      
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      
      // Vérifier dans Firestore si l'utilisateur est admin
      const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));
      const userData = userDoc.data();
      
      if (!userData?.isAdmin && userData?.role !== 'admin') {
        await auth.signOut();
        throw new Error('Accès non autorisé. Seuls les administrateurs peuvent se connecter.');
      }

      router.push('/admin/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur de connexion');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen px-4 py-12">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(62,99,221,0.16),transparent_38%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_10%,rgba(124,58,237,0.18),transparent_34%)]" />
      </div>

      <div className="mx-auto grid max-w-5xl grid-cols-1 items-center gap-8 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="glass-card relative overflow-hidden rounded-3xl p-8 shadow-2xl">
          <div className="absolute inset-0 bg-gradient-to-br from-[var(--brand)]/6 via-transparent to-[var(--brand-secondary)]/12" />
          <div className="relative space-y-6">
            <Logo variant="icon" size="lg" className="drop-shadow" />
            <Badge variant="brand" subtle>
              Nouveau design admin
            </Badge>
            <div className="space-y-3">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                BudgetPro Control Center
              </h1>
              <p className="text-gray-600 dark:text-gray-300">
                Accès sécurisé aux indicateurs stratégiques, gestion des utilisateurs et exports.
                Retrouvez une interface épurée et prête pour vos opérations quotidiennes.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              {[
                { label: 'Sécurité', icon: <ShieldCheck className="h-4 w-4" />, value: 'Rôles & claims' },
                { label: 'Performance', icon: <Sparkles className="h-4 w-4" />, value: 'Temps réel' },
                { label: 'Export', icon: <Lock className="h-4 w-4" />, value: 'Données fiables' },
              ].map((item) => (
                <div key={item.label} className="rounded-2xl border border-white/60 bg-white/70 px-4 py-3 shadow-sm ring-1 ring-black/5 dark:border-gray-800/70 dark:bg-gray-900/70">
                  <div className="flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-white">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--brand)]/10 text-[var(--brand)]">
                      {item.icon}
                    </span>
                    {item.label}
                  </div>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{item.value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="card-surface relative overflow-hidden rounded-3xl px-8 py-10">
          <div className="absolute inset-0 bg-gradient-to-b from-white/70 via-white/60 to-white/90 dark:from-gray-900/70 dark:via-gray-900/60 dark:to-gray-900/80" />
          <div className="relative space-y-6">
            <div>
              <p className="text-[12px] uppercase tracking-[0.2em] text-[var(--muted)]">Connexion admin</p>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Rejoindre le cockpit</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Vos identifiants sont strictement réservés aux administrateurs BudgetPro.
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-5">
              {error && (
                <div className="flex items-start gap-2 rounded-2xl border border-rose-200 bg-rose-50/70 px-4 py-3 text-sm text-rose-700 dark:border-rose-800/60 dark:bg-rose-900/30 dark:text-rose-200">
                  <Lock className="mt-0.5 h-4 w-4" />
                  <div>{error}</div>
                </div>
              )}

              <div className="space-y-4">
                <label className="block space-y-2 text-sm font-semibold text-gray-700 dark:text-gray-200">
                  <span>Email</span>
                  <input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 bg-white/70 px-4 py-3 text-gray-900 shadow-inner shadow-black/5 focus:border-[var(--brand)] focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/30 dark:border-gray-700 dark:bg-gray-800/70 dark:text-white"
                    placeholder="admin@budgetpro.com"
                  />
                </label>

                <label className="block space-y-2 text-sm font-semibold text-gray-700 dark:text-gray-200">
                  <span>Mot de passe</span>
                  <input
                    id="password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 bg-white/70 px-4 py-3 text-gray-900 shadow-inner shadow-black/5 focus:border-[var(--brand)] focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/30 dark:border-gray-700 dark:bg-gray-800/70 dark:text-white"
                    placeholder="••••••••"
                  />
                </label>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[var(--brand)] to-[var(--brand-secondary)] px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-[rgba(62,99,221,0.25)] transition hover:brightness-105 disabled:opacity-60 disabled:shadow-none"
              >
                {loading ? 'Connexion...' : 'Se connecter'}
                {!loading && <ArrowRight className="h-4 w-4" />}
              </button>
            </form>

            <div className="flex items-center gap-3 rounded-2xl border border-white/60 bg-white/60 px-4 py-3 text-xs text-gray-500 shadow-sm ring-1 ring-black/5 dark:border-gray-800/70 dark:bg-gray-900/70 dark:text-gray-300">
              <ShieldCheck className="h-4 w-4 text-[var(--brand)]" />
              Accès réservé aux administrateurs vérifiés. Chaque action est journalisée.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
