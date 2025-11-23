"use client";
import { useState, useEffect, useCallback } from 'react';
import { Users, CreditCard, TrendingUp, Activity, RefreshCw } from 'lucide-react';
import { collection, Timestamp, onSnapshot, query, orderBy, limit, doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { fetchAdminAPI } from '@/lib/adminAPI';
import AdminShell from '@/components/AdminShell';
import { KPICard } from '@/components/KPICard';
import { Badge } from '@/components/Badge';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface Stats {
  totalUsers: number;
  activeUsers: number;
  totalTransactions: number;
  platformBalance: number;
}

interface MonthlyPoint {
  month: string; // YYYY-MM
  transactions: number;
  newUsers: number;
  volume: number; // sum of amounts
}


interface RawTransaction {
  createdAt?: Timestamp | string;
  amount?: number;
  type?: string;
  description?: string;
  userId?: string;
}

interface RecentActivity {
  id: string;
  userEmail: string;
  description: string;
  amount: number;
  timestamp: Date;
}

function DashboardContent() {
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    activeUsers: 0,
    totalTransactions: 0,
    platformBalance: 0,
  });
  const [monthly, setMonthly] = useState<MonthlyPoint[]>([]);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const loadStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const json = await fetchAdminAPI('/api/admin/monthly-stats');
      const data = json.data as { totalUsers: number; activeUsers: number; totalTransactions: number; platformBalance: number; monthly: MonthlyPoint[] };
      setStats({
        totalUsers: data.totalUsers,
        activeUsers: data.activeUsers,
        totalTransactions: data.totalTransactions,
        platformBalance: data.platformBalance,
      });
      setMonthly(data.monthly);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Erreur de chargement';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadStats(); }, [loadStats]);

  // Real-time listener for recent transactions
  useEffect(() => {
    const userCache: Record<string, string> = {};
    const q = query(collection(db, 'transactions'), orderBy('createdAt', 'desc'), limit(5));
    const unsub = onSnapshot(q, async (snap) => {
      const activities: RecentActivity[] = [];
      for (const docSnap of snap.docs) {
        const tx = docSnap.data() as RawTransaction;
        const timestamp = tx.createdAt && (tx.createdAt as Timestamp)?.toDate
          ? (tx.createdAt as Timestamp).toDate()
          : new Date(typeof tx.createdAt === 'string' ? tx.createdAt : Date.now());
        let userEmail = 'Utilisateur inconnu';
        if (tx.userId) {
          if (!userCache[tx.userId]) {
            try {
              const userRef = doc(db, 'users', tx.userId);
              const userSnap = await getDoc(userRef);
              userCache[tx.userId] = userSnap.exists() ? (userSnap.data().email || 'inconnu') : 'inconnu';
            } catch {
              userCache[tx.userId] = 'inconnu';
            }
          }
          userEmail = userCache[tx.userId];
        }
        activities.push({
          id: docSnap.id,
          userEmail,
          description: tx.description || tx.type || 'Transaction',
          amount: tx.amount || 0,
          timestamp,
        });
      }
      setRecentActivity(activities);
    });
    return () => unsub();
  }, []);

  const statCards = [
    {
      label: 'Total Utilisateurs',
      value: stats.totalUsers.toLocaleString(),
      icon: <Users className="w-5 h-5" />,
      delta: '+12%',
      deltaDirection: 'up' as const,
      description: 'Utilisateurs enregistrés sur la plateforme',
    },
    {
      label: 'Utilisateurs Actifs',
      value: stats.activeUsers.toLocaleString(),
      icon: <Activity className="w-5 h-5" />,
      delta: '+8%',
      deltaDirection: 'up' as const,
      description: 'Actifs < 30 jours',
    },
    {
      label: 'Transactions',
      value: stats.totalTransactions.toLocaleString(),
      icon: <CreditCard className="w-5 h-5" />,
      delta: '+23%',
      deltaDirection: 'up' as const,
      description: 'Total opérations',
    },
    {
      label: 'Solde Plateforme',
      value: `${stats.platformBalance.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}`,
      icon: <TrendingUp className="w-5 h-5" />,
      delta: '+15%',
      deltaDirection: 'up' as const,
      description: 'Agrégat des soldes',
    },
  ];

  const activityRate = stats.totalUsers ? Math.round((stats.activeUsers / stats.totalUsers) * 100) : 0;

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <div className="relative overflow-hidden rounded-3xl border border-white/70 bg-white/85 px-6 py-6 shadow-2xl backdrop-blur dark:border-gray-800/70 dark:bg-gray-900/75">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-10 top-0 h-40 w-40 rounded-full bg-[radial-gradient(circle_at_center,rgba(62,99,221,0.16),transparent_55%)] blur-2xl" />
          <div className="absolute right-0 top-10 h-56 w-56 rounded-full bg-[radial-gradient(circle_at_center,rgba(124,58,237,0.18),transparent_55%)] blur-2xl" />
        </div>
        <div className="relative flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="brand" subtle>Dashboard</Badge>
              <Badge variant="info" subtle icon={<RefreshCw className="h-3 w-3" />}>Temps réel</Badge>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Pilotage BudgetPro</h1>
            <p className="text-gray-600 dark:text-gray-300">
              Vue d&apos;ensemble opérationnelle : utilisateurs actifs, transactions et santé financière en un coup d’œil.
            </p>
            <div className="flex flex-wrap gap-2">
              <Badge variant="brand" subtle>En ligne</Badge>
              {loading && <Badge variant="info" subtle>Chargement…</Badge>}
              {error && <Badge variant="danger" subtle>{error}</Badge>}
            </div>
          </div>

          <div className="flex w-full flex-col gap-3 md:w-[320px]">
            <div className="rounded-2xl border border-white/70 bg-white/70 px-4 py-3 shadow-sm ring-1 ring-black/5 dark:border-gray-800 dark:bg-gray-900/70">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-500 dark:text-gray-400">Engagement</p>
                  <p className="text-sm text-gray-600 dark:text-gray-300">Actifs sur 30 jours</p>
                </div>
                <Badge variant="brand" subtle>{stats.activeUsers} / {stats.totalUsers || 0}</Badge>
              </div>
              <div className="mt-3 flex items-center justify-between">
                <div className="text-3xl font-bold text-gray-900 dark:text-white">{activityRate}%</div>
                <div className="h-2.5 flex-1 rounded-full bg-gray-100 dark:bg-gray-800 ml-3">
                  <div className="h-full rounded-full bg-gradient-to-r from-[var(--color-brand,#3E63DD)] to-[var(--color-brand-hover,#3257c7)]" style={{ width: `${Math.min(activityRate, 100)}%` }} />
                </div>
              </div>
            </div>

            <button
              onClick={loadStats}
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[var(--color-brand,#3E63DD)] to-[var(--color-brand-hover,#3257c7)] px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-[rgba(62,99,221,0.25)] transition hover:brightness-105 disabled:opacity-50"
            >
              <RefreshCw className={loading ? 'h-4 w-4 animate-spin' : 'h-4 w-4'} />
              Rafraîchir les données
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map(card => (
          <KPICard key={card.label} {...card} />
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-white/60 bg-white/90 p-4 shadow-md ring-1 ring-black/5 backdrop-blur dark:border-gray-800/80 dark:bg-gray-900/70">
          <div className="mb-2 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Transactions Mensuelles</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">Volumétrie consolidée par mois</p>
            </div>
            <Badge variant="info" subtle>Historique</Badge>
          </div>
          <div className="min-h-[260px] flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthly} margin={{ left: 0, right: 0 }}>
                <defs>
                  <linearGradient id="colorTx" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3E63DD" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#3E63DD" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip
                  contentStyle={{ fontSize: '12px' }}
                  formatter={(val: number) => [val, 'Transactions']}
                />
                <Area type="monotone" dataKey="transactions" stroke="#3E63DD" fill="url(#colorTx)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="rounded-2xl border border-white/60 bg-white/90 p-4 shadow-md ring-1 ring-black/5 backdrop-blur dark:border-gray-800/80 dark:bg-gray-900/70">
          <div className="mb-2 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Nouveaux Utilisateurs / Volume</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">Croissance & revenus</p>
            </div>
            <Badge variant="brand" subtle>Live</Badge>
          </div>
          <div className="min-h-[260px] flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthly} margin={{ left: 0, right: 0 }}>
                <defs>
                  <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#16a34a" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#16a34a" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip contentStyle={{ fontSize: '12px' }} />
                <Area type="monotone" dataKey="newUsers" stroke="#16a34a" fill="url(#colorUsers)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Activity - Real-time */}
      <div className="rounded-3xl border border-white/60 bg-white/90 p-6 shadow-lg ring-1 ring-black/5 backdrop-blur dark:border-gray-800/80 dark:bg-gray-900/70">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Activité Récente (Temps réel)</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">Les 5 dernières opérations utilisateurs</p>
          </div>
          <Badge variant="info" subtle>Transactions</Badge>
        </div>
        <div className="space-y-4">
          {recentActivity.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">Aucune transaction récente</p>
          ) : (
            recentActivity.map((activity) => {
              const timeAgo = Math.floor((Date.now() - activity.timestamp.getTime()) / (1000 * 60));
              const displayTime = timeAgo < 60 ? `${timeAgo}m` : `${Math.floor(timeAgo / 60)}h`;
              
              return (
                <div key={activity.id} className="flex items-center justify-between rounded-2xl border border-gray-100/80 bg-white/80 px-4 py-3 shadow-sm ring-1 ring-black/5 transition hover:-translate-y-[1px] dark:border-gray-800/80 dark:bg-gray-800/70">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-blue-600 text-white text-xs font-bold">
                      {activity.userEmail.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">{activity.userEmail}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{activity.description} • Il y a {displayTime}</p>
                    </div>
                  </div>
                  <span className={`text-sm font-semibold ${activity.amount >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    {activity.amount >= 0 ? '+' : ''}{activity.amount.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

export default function AdminDashboardPage() {
  return <AdminShell><DashboardContent /></AdminShell>;
}
