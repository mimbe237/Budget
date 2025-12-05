'use client';
import { useState, useEffect } from 'react';
import { Search, Filter, Mail, Shield, MoreVertical, Check, X, Crown, Sparkles, ArrowLeft, ArrowRight, SortAsc, RefreshCw, UserMinus, UserPlus } from 'lucide-react';
import { collection, getDocs, updateDoc, doc, query, orderBy, limit, startAfter, DocumentData, QueryDocumentSnapshot } from 'firebase/firestore';
import { fetchAdminAPI } from '@/lib/adminAPI';
import { db } from '@/lib/firebase';
import AdminShell from '@/components/AdminShell';
import { Badge } from '@/components/Badge';

interface User {
  id: string;
  email: string;
  displayName: string;
  role: string;
  status: 'active' | 'suspended';
  balance: number;
  createdAt: string;
  lastActive: string;
  countryCode?: string;
  phoneNumber?: string;
}

function UsersContent() {
  const [users, setUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [filterCountry, setFilterCountry] = useState('all');
  const [pageSize, setPageSize] = useState(20);
  const [usersByCountry, setUsersByCountry] = useState<Record<string, number>>({});
  const [sortField, setSortField] = useState<'createdAt' | 'balance' | 'email'>('createdAt');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [pageHistory, setPageHistory] = useState<QueryDocumentSnapshot<DocumentData>[]>([]);
  const [isLoadingPage, setIsLoadingPage] = useState(false);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [claimStatus, setClaimStatus] = useState<{ loading: boolean; admin: boolean; role: string; error: string | null }>({ loading: true, admin: false, role: 'user', error: null });

  // Debounce search input (400ms delay)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  async function loadPage(initial = false, direction: 'next' | 'prev' | 'stay' = 'stay') {
    setIsLoadingPage(true);
    try {
      let qBase = query(
        collection(db, 'users'),
        orderBy(sortField, sortDir),
        limit(pageSize + 1) // fetch one extra to determine next page existence
      );
      if (!initial && direction === 'next' && lastDoc) {
        qBase = query(
          collection(db, 'users'),
          orderBy(sortField, sortDir),
          startAfter(lastDoc),
          limit(pageSize + 1)
        );
      } else if (!initial && direction === 'prev') {
        const previous = pageHistory[pageHistory.length - 2];
        if (previous) {
          qBase = query(
            collection(db, 'users'),
            orderBy(sortField, sortDir),
            startAfter(previous),
            limit(pageSize + 1)
          );
          setPageHistory(h => h.slice(0, -1));
        }
      }
      const snap = await getDocs(qBase);
      const docs = snap.docs;
      setHasNextPage(docs.length === pageSize + 1);
      const slice = docs.slice(0, pageSize);
      const list: User[] = slice.map(d => {
        const raw = d.data();
        interface RawTimestamp { toDate?: () => Date }
        interface RawUser { email?: string; displayName?: string; role?: string; status?: string; balance?: number; createdAt?: RawTimestamp | string; lastActive?: RawTimestamp | string; countryCode?: string; phoneNumber?: string }
        const data: RawUser = raw as RawUser;
        const status = data.status === 'suspended' ? 'suspended' : 'active';
        const createdAt = (data.createdAt as RawTimestamp)?.toDate?.()?.toISOString() || (typeof data.createdAt === 'string' ? data.createdAt : '');
        const lastActive = (data.lastActive as RawTimestamp)?.toDate?.()?.toISOString() || (typeof data.lastActive === 'string' ? data.lastActive : '');
        return {
          id: d.id,
          email: data.email || '',
          displayName: data.displayName || '',
          role: data.role || 'user',
          status,
          balance: data.balance || 0,
          createdAt,
          lastActive,
          countryCode: data.countryCode,
          phoneNumber: data.phoneNumber,
        };
      });
      setUsers(list);
      if (slice.length > 0) {
        setLastDoc(slice[slice.length - 1]);
        if (initial || direction === 'next') setPageHistory(h => [...h, slice[slice.length - 1]]);
        if (direction === 'prev') setLastDoc(slice[slice.length - 1]);
      } else if (direction === 'prev') {
        // at start
        setLastDoc(null);
        setPageHistory([]);
      }
    } catch (e) {
      console.error('Error loading users:', e);
      setUsers([]);
    } finally {
      setIsLoadingPage(false);
    }
  }
  // Charger statistiques par pays
  async function loadCountryStats() {
    try {
      const snap = await getDocs(collection(db, 'users'));
      const stats: Record<string, number> = {};
      snap.docs.forEach(doc => {
        const data = doc.data();
        const country = data.countryCode || 'unknown';
        stats[country] = (stats[country] || 0) + 1;
      });
      setUsersByCountry(stats);
    } catch (e) {
      console.error('Error loading country stats:', e);
    }
  }

  // Chargement initial une seule fois
  useEffect(() => {
    loadPage(true);
    loadCountryStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Rafraîchissements manuels ou changements de tri / pagination
  useEffect(() => {
    loadPage(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sortField, sortDir, pageSize, refreshTrigger]);

  async function toggleSuspend(user: User) {
    const newStatus = user.status === 'active' ? 'suspended' : 'active';
    await updateDoc(doc(db, 'users', user.id), { status: newStatus });
    setRefreshTrigger(prev => prev + 1);
  }

  async function makeAdmin(user: User) {
    // Firestore flag (purely informational)
    await updateDoc(doc(db, 'users', user.id), { role: 'admin', isAdmin: true });
    // Custom claim via secure API route
    try {
      await fetchAdminAPI('/api/admin/update-role', {
        method: 'POST',
        body: JSON.stringify({ uid: user.id, makeAdmin: true })
      });
    } catch (e) {
      console.error('Erreur makeAdmin:', e);
    }
    setRefreshTrigger(prev => prev + 1);
  }

  async function revokeAdmin(user: User) {
    // Update Firestore role
    await updateDoc(doc(db, 'users', user.id), { role: 'user', isAdmin: false });
    try {
      await fetchAdminAPI('/api/admin/update-role', {
        method: 'POST',
        body: JSON.stringify({ uid: user.id, makeAdmin: false })
      });
    } catch (e) {
      console.error('Erreur revokeAdmin:', e);
    }
    setRefreshTrigger(prev => prev + 1);
  }

  async function createUser(e: React.FormEvent) {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const email = (form.elements.namedItem('newEmail') as HTMLInputElement).value;
    const displayName = (form.elements.namedItem('newName') as HTMLInputElement).value;
    const password = (form.elements.namedItem('newPassword') as HTMLInputElement).value;
    
    if (!email || !password) return;
    
    try {
      // Call API route to create Auth user
      const res = await fetch('/api/admin/create-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, displayName }),
      });
      
      const result = await res.json();
      if (!result.ok) {
        alert(`Erreur: ${result.error}`);
        return;
      }
      
      form.reset();
      setRefreshTrigger(prev => prev + 1);
      alert('Utilisateur créé avec succès!');
    } catch (err) {
      alert(`Erreur de création: ${err}`);
    }
  }

  const filteredUsers = users.filter((user) => {
    const matchesSearch = debouncedSearch === '' || 
      user.email.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      user.displayName.toLowerCase().includes(debouncedSearch.toLowerCase());
    const matchesRole = filterRole === 'all' || user.role === filterRole;
    const matchesCountry = filterCountry === 'all' || user.countryCode === filterCountry;
    return matchesSearch && matchesRole && matchesCountry;
  });

  const adminCount = users.filter((user) => user.role === 'admin').length;
  const premiumCount = users.filter((user) => user.role === 'premium').length;
  const suspendedCount = users.filter((user) => user.status === 'suspended').length;

  function roleBadge(role: string) {
    switch (role) {
      case 'admin':
        return <Badge variant="danger" subtle icon={<Shield className="w-3 h-3" />}>admin</Badge>;
      case 'premium':
        return <Badge variant="brand" subtle>premium</Badge>;
      default:
        return <Badge variant="info" subtle>user</Badge>;
    }
  }

  function statusBadge(status: string) {
    return status === 'active'
      ? <Badge variant="success" subtle>active</Badge>
      : <Badge variant="neutral" subtle>inactive</Badge>;
  }

  useEffect(() => {
    let cancelled = false;
    async function loadClaim() {
      try {
        const res = await fetchAdminAPI('/api/admin/claim-status');
        if (!cancelled) setClaimStatus({ loading: false, admin: !!res.admin, role: res.role || (res.admin ? 'admin' : 'user'), error: null });
      } catch (e: any) {
        if (!cancelled) setClaimStatus({ loading: false, admin: false, role: 'user', error: e.message || 'Erreur claims' });
      }
    }
    loadClaim();
    return () => { cancelled = true; };
  }, []);
  function toggleMenu(id: string) {
    setOpenMenu(prev => prev === id ? null : id);
  }

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <section className="relative overflow-hidden rounded-3xl border border-white/70 bg-white/85 px-6 py-6 shadow-2xl backdrop-blur dark:border-gray-800/70 dark:bg-gray-900/75">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-10 top-0 h-40 w-40 rounded-full bg-[radial-gradient(circle_at_center,rgba(62,99,221,0.16),transparent_55%)] blur-2xl" />
          <div className="absolute right-0 top-10 h-56 w-56 rounded-full bg-[radial-gradient(circle_at_center,rgba(124,58,237,0.18),transparent_55%)] blur-2xl" />
        </div>
        <div className="relative space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="brand" subtle>Utilisateurs</Badge>
            <Badge variant="info" subtle icon={<Filter className="h-3 w-3" />}>{filteredUsers.length} filtrés</Badge>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Gestion des utilisateurs</h1>
          <p className="text-gray-600 dark:text-gray-300">
            Surveillez les rôles, statuts et soldes clients. Actions rapides pour activer, promouvoir ou suspendre.
          </p>
          <div className="flex flex-wrap gap-2 items-center">
            <Badge variant="brand" subtle icon={<Shield className="h-3 w-3" />}>Sécu claims</Badge>
            <Badge variant="info" subtle icon={<Mail className="h-3 w-3" />}>Contact direct</Badge>
            {claimStatus.loading && <Badge variant="neutral" subtle>Vérification…</Badge>}
            {!claimStatus.loading && claimStatus.admin && (
              <Badge variant="success" subtle icon={<Crown className="h-3 w-3" />}>Vous êtes admin</Badge>
            )}
            {!claimStatus.loading && !claimStatus.admin && !claimStatus.error && (
              <Badge variant="warning" subtle>Accès standard</Badge>
            )}
            {claimStatus.error && (
              <Badge variant="danger" subtle>{claimStatus.error}</Badge>
            )}
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-white/70 bg-white/90 p-4 shadow-sm ring-1 ring-black/5 dark:border-gray-800/80 dark:bg-gray-900/70">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-500 dark:text-gray-400">Total utilisateurs</p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-gray-900 dark:text-white">{users.length}</span>
            <Badge variant="brand" subtle>{filteredUsers.length} visibles</Badge>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400">Vue globale de la base</p>
        </div>
        <div className="rounded-2xl border border-white/70 bg-white/90 p-4 shadow-sm ring-1 ring-black/5 dark:border-gray-800/80 dark:bg-gray-900/70">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-500 dark:text-gray-400">Admins & premium</p>
          <div className="mt-2 flex items-center gap-3">
            <span className="text-3xl font-bold text-gray-900 dark:text-white">{adminCount}</span>
            <Badge variant="brand" subtle>Premium {premiumCount}</Badge>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400">Rôles renforcés</p>
        </div>
        <div className="rounded-2xl border border-white/70 bg-white/90 p-4 shadow-sm ring-1 ring-black/5 dark:border-gray-800/80 dark:bg-gray-900/70">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-500 dark:text-gray-400">Suspendus</p>
          <div className="mt-2 flex items-center gap-3">
            <span className="text-3xl font-bold text-gray-900 dark:text-white">{suspendedCount}</span>
            <Badge variant="danger" subtle>{((suspendedCount / Math.max(users.length, 1)) * 100).toFixed(0)}%</Badge>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400">À réactiver ou supprimer</p>
        </div>
      </div>

      {/* Stats par pays */}
      {Object.keys(usersByCountry).length > 0 && (
        <div className="rounded-3xl border border-white/70 bg-white/90 px-6 py-5 shadow-sm ring-1 ring-black/5 backdrop-blur dark:border-gray-800/80 dark:bg-gray-900/70">
          <h3 className="mb-4 text-lg font-bold text-gray-900 dark:text-white">
            Utilisateurs par pays ({Object.keys(usersByCountry).length} pays)
          </h3>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {Object.entries(usersByCountry)
              .sort((a, b) => b[1] - a[1])
              .slice(0, 12)
              .map(([code, count]) => (
                <button
                  key={code}
                  type="button"
                  onClick={() => setFilterCountry(code)}
                  className={`group flex flex-col items-center gap-2 rounded-xl border p-3 transition ${
                    filterCountry === code
                      ? 'border-[var(--brand)] bg-[var(--brand)]/10'
                      : 'border-gray-200 bg-white/50 hover:border-[var(--brand)]/50 dark:border-gray-700 dark:bg-gray-800/50'
                  }`}
                >
                  <span className="text-3xl">
                    {code !== 'unknown' ? String.fromCodePoint(...[...code.toUpperCase()].map(c => 127397 + c.charCodeAt(0))) : '🌍'}
                  </span>
                  <div className="text-center">
                    <p className="text-xs font-bold text-gray-600 dark:text-gray-400">
                      {code.toUpperCase()}
                    </p>
                    <p className="text-lg font-bold text-gray-900 dark:text-white">
                      {count}
                    </p>
                  </div>
                </button>
              ))}
          </div>
          {Object.keys(usersByCountry).length > 12 && (
            <p className="mt-4 text-center text-xs text-gray-500 dark:text-gray-400">
              +{Object.keys(usersByCountry).length - 12} autres pays dans le filtre
            </p>
          )}
        </div>
      )}

      {/* Filters + Sorting / Pagination */}
      <div className="rounded-3xl border border-white/70 bg-white/90 px-4 py-5 shadow-sm ring-1 ring-black/5 backdrop-blur dark:border-gray-800/80 dark:bg-gray-900/70">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
          <button
            type="button"
            onClick={() => setRefreshTrigger(prev => prev + 1)}
            disabled={isLoadingPage}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[var(--brand)] to-[var(--brand-secondary)] px-4 py-2 text-sm font-semibold text-white shadow-lg transition hover:brightness-110 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${isLoadingPage ? 'animate-spin' : ''}`} />
            Actualiser
          </button>
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 transform text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher par email ou nom..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-white/70 pl-10 pr-4 py-3 text-gray-900 shadow-inner shadow-black/5 focus:border-[var(--brand)] focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/30 dark:border-gray-700 dark:bg-gray-800/70 dark:text-white"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Filter className="h-5 w-5 text-gray-400" />
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="rounded-xl border border-gray-200 bg-white/70 px-4 py-3 text-sm font-semibold text-gray-800 shadow-inner shadow-black/5 focus:border-[var(--brand)] focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/30 dark:border-gray-700 dark:bg-gray-800/70 dark:text-white"
            >
              <option value="all">Tous les rôles</option>
              <option value="admin">Admin</option>
              <option value="premium">Premium</option>
              <option value="user">User</option>
            </select>
            <select
              value={filterCountry}
              onChange={(e) => setFilterCountry(e.target.value)}
              className="rounded-xl border border-gray-200 bg-white/70 px-4 py-3 text-sm font-semibold text-gray-800 shadow-inner shadow-black/5 focus:border-[var(--brand)] focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/30 dark:border-gray-700 dark:bg-gray-800/70 dark:text-white"
            >
              <option value="all">Tous les pays ({Object.values(usersByCountry).reduce((a,b) => a+b, 0)})</option>
              {Object.entries(usersByCountry)
                .sort((a, b) => b[1] - a[1])
                .map(([code, count]) => (
                  <option key={code} value={code}>
                    {code.toUpperCase()} ({count})
                  </option>
                ))}
            </select>
            <div className="flex gap-2">
              {['all', 'admin', 'premium', 'user'].map((role) => {
                const label = role === 'all' ? 'Tous' : role;
                return (
                  <button
                    key={role}
                    type="button"
                    onClick={() => setFilterRole(role)}
                    className={`rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-black/5 transition ${filterRole === role ? 'bg-gradient-to-r from-[var(--brand)] to-[var(--brand-secondary)] text-white' : 'bg-white/70 text-gray-600 hover:bg-gray-100 dark:bg-gray-800/70 dark:text-gray-200'}`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
            <div className="flex gap-2 items-center">
              <SortAsc className="h-5 w-5 text-gray-400" />
              <select
                value={sortField}
                onChange={e => setSortField(e.target.value as 'createdAt' | 'balance' | 'email')}
                className="rounded-xl border border-gray-200 bg-white/70 px-3 py-2 text-xs font-semibold text-gray-800 shadow-inner dark:border-gray-700 dark:bg-gray-800/70 dark:text-white"
              >
                <option value="createdAt">Date</option>
                <option value="balance">Solde</option>
                <option value="email">Email</option>
              </select>
              <button
                type="button"
                onClick={() => setSortDir(d => d === 'desc' ? 'asc' : 'desc')}
                className="rounded-full border border-gray-200 bg-white/70 px-3 py-2 text-xs font-semibold text-gray-700 shadow-inner dark:border-gray-700 dark:bg-gray-800/70 dark:text-gray-200"
              >{sortDir === 'desc' ? '↓' : '↑'} {sortDir}</button>
              <select
                value={pageSize}
                onChange={e => setPageSize(Number(e.target.value))}
                className="rounded-xl border border-gray-200 bg-white/70 px-3 py-2 text-xs font-semibold text-gray-800 shadow-inner dark:border-gray-700 dark:bg-gray-800/70 dark:text-white"
              >
                {[10,20,50].map(s => <option key={s} value={s}>{s}/page</option>)}
              </select>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={pageHistory.length <= 1 || isLoadingPage}
                  onClick={() => loadPage(false, 'prev')}
                  className="inline-flex items-center justify-center rounded-lg border border-gray-200 bg-white/70 px-2 py-2 text-xs font-semibold text-gray-700 shadow-sm disabled:opacity-40 dark:border-gray-700 dark:bg-gray-800/70 dark:text-gray-200"
                ><ArrowLeft className="h-4 w-4" /></button>
                <button
                  type="button"
                  disabled={!hasNextPage || isLoadingPage}
                  onClick={() => loadPage(false, 'next')}
                  className="inline-flex items-center justify-center rounded-lg border border-gray-200 bg-white/70 px-2 py-2 text-xs font-semibold text-gray-700 shadow-sm disabled:opacity-40 dark:border-gray-700 dark:bg-gray-800/70 dark:text-gray-200"
                ><ArrowRight className="h-4 w-4" /></button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="overflow-hidden rounded-3xl border border-white/70 bg-white/90 shadow-lg ring-1 ring-black/5 backdrop-blur dark:border-gray-800/80 dark:bg-gray-900/70">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
            <thead className="bg-gray-50/80 text-left text-xs uppercase tracking-wide text-gray-500 backdrop-blur dark:bg-gray-900/80 dark:text-gray-400">
              <tr>
                <th className="px-6 py-3">Utilisateur</th>
                <th className="px-6 py-3">Pays</th>
                <th className="px-6 py-3">Rôle</th>
                <th className="px-6 py-3">Statut</th>
                <th className="px-6 py-3">Solde</th>
                <th className="px-6 py-3">Dernière activité</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100/70 dark:divide-gray-800/80">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="transition hover:-translate-y-[1px] hover:bg-gray-50/80 dark:hover:bg-gray-800/70">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-white font-semibold shadow-md">
                        {user.displayName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-gray-900 dark:text-white">{user.displayName}</div>
                        <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                          <Mail className="h-3 w-3" />
                          {user.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{user.countryCode ? String.fromCodePoint(...[...user.countryCode.toUpperCase()].map(c => 127397 + c.charCodeAt(0))) : '🌍'}</span>
                      <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">
                        {user.countryCode?.toUpperCase() || 'N/A'}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-3">{roleBadge(user.role)}</td>
                  <td className="px-6 py-4">{statusBadge(user.status)}</td>
                  <td className="px-6 py-4 text-sm font-semibold text-gray-900 dark:text-white">
                    {user.balance.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                    {new Date(user.lastActive).toLocaleDateString('fr-FR')}
                  </td>
                  <td className="px-6 py-4 text-right text-sm font-medium">
                    <div className="relative inline-block text-left">
                      <button
                        type="button"
                        onClick={() => toggleMenu(user.id)}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white/80 text-gray-600 shadow-sm transition hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
                        aria-haspopup="menu"
                        aria-expanded={openMenu === user.id}
                      >
                        <MoreVertical className="h-4 w-4" />
                        <span className="sr-only">Actions</span>
                      </button>
                      {openMenu === user.id && (
                        <div
                          className="absolute right-0 z-50 mt-2 w-52 origin-top-right overflow-hidden rounded-xl border border-white/70 bg-white/95 shadow-xl ring-1 ring-black/5 dark:border-gray-800/80 dark:bg-gray-900/95"
                          role="menu"
                        >
                          <div className="py-1">
                            <button
                              onClick={() => { toggleSuspend(user); setOpenMenu(null); }}
                              className="flex w-full items-center gap-2 px-4 py-2 text-left text-xs font-semibold text-gray-800 transition hover:bg-gray-50 dark:text-gray-100 dark:hover:bg-gray-800/80"
                            >
                              {user.status === 'active' ? <X className="h-3 w-3" /> : <Check className="h-3 w-3" />} {user.status === 'active' ? 'Suspendre' : 'Activer'}
                            </button>
                            {user.role !== 'admin' && (
                              <button
                                onClick={async () => { await makeAdmin(user); setOpenMenu(null); }}
                                className="flex w-full items-center gap-2 px-4 py-2 text-left text-xs font-semibold text-gray-800 transition hover:bg-gray-50 dark:text-gray-100 dark:hover:bg-gray-800/80"
                              >
                                <UserPlus className="h-3 w-3" /> Promouvoir Admin
                              </button>
                            )}
                            {user.role === 'admin' && (
                              <button
                                onClick={async () => { await revokeAdmin(user); setOpenMenu(null); }}
                                className="flex w-full items-center gap-2 px-4 py-2 text-left text-xs font-semibold text-gray-800 transition hover:bg-gray-50 dark:text-gray-100 dark:hover:bg-gray-800/80"
                              >
                                <UserMinus className="h-3 w-3" /> Révoquer Admin
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create User */}
      <div className="rounded-3xl border border-white/70 bg-white/90 px-6 py-6 shadow-lg ring-1 ring-black/5 backdrop-blur dark:border-gray-800/80 dark:bg-gray-900/70">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Créer un utilisateur</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">Auth Firebase + document Firestore synchronisé.</p>
          </div>
          <Badge variant="brand" subtle icon={<Sparkles className="h-3 w-3" />}>Instantané</Badge>
        </div>
        <form onSubmit={createUser} className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <input name="newEmail" type="email" required placeholder="Email" className="rounded-xl border border-gray-200 bg-white/70 px-4 py-3 text-sm text-gray-900 shadow-inner shadow-black/5 focus:border-[var(--brand)] focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/30 dark:border-gray-700 dark:bg-gray-800/70 dark:text-white" />
          <input name="newName" type="text" placeholder="Nom" className="rounded-xl border border-gray-200 bg-white/70 px-4 py-3 text-sm text-gray-900 shadow-inner shadow-black/5 focus:border-[var(--brand)] focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/30 dark:border-gray-700 dark:bg-gray-800/70 dark:text-white" />
          <input name="newPassword" type="password" required placeholder="Mot de passe" className="rounded-xl border border-gray-200 bg-white/70 px-4 py-3 text-sm text-gray-900 shadow-inner shadow-black/5 focus:border-[var(--brand)] focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/30 dark:border-gray-700 dark:bg-gray-800/70 dark:text-white" />
          <button type="submit" className="rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-500/25 transition hover:brightness-110">Créer</button>
        </form>
        <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
          Les identifiants sont générés dans Firebase Auth puis répliqués dans la collection users (isAdmin, role).
        </p>
      </div>
    </div>
  );
}

export default function AdminUsersPage() {
  return <AdminShell><UsersContent /></AdminShell>;
}
