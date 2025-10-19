'use client';

import { useState } from 'react';
import { TransactionsView, TransactionsFetchParams, TransactionsFetchResult } from '@/components/transactions/TransactionsView';
import { useUser } from '@/firebase/provider';

export default function AdminReportsTransactionsPage() {
  const { user } = useUser();
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  // NOTE: Pour une V1, l'admin peut saisir un userId ou on pourrait proposer un select auto-complété.

  const authHeader = async (): Promise<HeadersInit> => {
    try {
      const token = await user?.getIdToken();
      return token ? { Authorization: `Bearer ${token}` } : {};
    } catch { return {}; }
  };

  const onFetch = async (p: TransactionsFetchParams): Promise<TransactionsFetchResult> => {
    if (!selectedUserId) return { items: [], total: 0, summary: { totalIncomeInCents: 0, totalExpensesInCents: 0, balanceInCents: 0 }, categoriesBreakdown: [], monthlyTrend: [] };
    const params = new URLSearchParams();
    if (p.search) params.set('search', p.search);
    if (p.from) params.set('from', p.from);
    if (p.to) params.set('to', p.to);
    if (p.category) params.set('category', p.category);
    if (p.type) params.set('type', p.type);
    params.set('page', String(p.page));
    params.set('pageSize', String(p.pageSize));
    params.set('sortField', p.sortField||'date');
    params.set('sortDir', p.sortDir||'desc');
    const headers = await authHeader();
    const res = await fetch(`/api/admin/users/${selectedUserId}/transactions?${params.toString()}`, { headers });
    if (!res.ok) throw new Error('Failed to load transactions');
    return await res.json();
  };

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center gap-2">
        <label htmlFor="uid" className="text-sm text-gray-600">User ID</label>
        <input id="uid" className="border rounded px-2 py-1" value={selectedUserId} onChange={(e)=>setSelectedUserId(e.target.value)} placeholder="Saisir un UID utilisateur" />
      </div>
      <TransactionsView
        title="Transactions (Admin)"
        subtitle="Visualisez les transactions d'un utilisateur spécifique."
        onFetch={onFetch}
        loadCategories={async (t)=>{
          const headers = await authHeader();
          const res = await fetch(`/api/admin/categories?type=${t}`, { headers });
          if (!res.ok) return { income: [], expense: [], all: [] };
          const data = await res.json();
          return { income: (data.income||[]).map((x:any)=>x.name), expense: (data.expense||[]).map((x:any)=>x.name), all: (data.all||[]).map((x:any)=>x.name) };
        }}
        onSave={async (payload, mode, current) => {
          if (!selectedUserId) return;
          const headers: HeadersInit = { 'Content-Type': 'application/json', ...(await authHeader()) };
          if (mode === 'create') {
            await fetch(`/api/admin/users/${selectedUserId}/transactions`, { method: 'POST', headers, body: JSON.stringify(payload) });
          } else if (current) {
            await fetch(`/api/admin/users/${selectedUserId}/transactions/${current.id}`, { method: 'PATCH', headers, body: JSON.stringify(payload) });
          }
        }}
        onRemove={async (t) => {
          if (!selectedUserId) return; const headers = await authHeader();
          await fetch(`/api/admin/users/${selectedUserId}/transactions/${t.id}`, { method: 'DELETE', headers });
        }}
      />
    </div>
  );
}
