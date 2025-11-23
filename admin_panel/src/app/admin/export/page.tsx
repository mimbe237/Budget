"use client";
import { useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import * as XLSX from 'xlsx';
import { FileDown, FileSpreadsheet, RefreshCw } from 'lucide-react';
import AdminShell from '@/components/AdminShell';
import { Badge } from '@/components/Badge';

interface TxRow { id: string; userId?: string; amount?: number; type?: string; category?: string; date?: string; description?: string }

function ExportContent() {
  const [rows, setRows] = useState<TxRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function load() {
    setLoading(true); setError('');
    try {
      const snap = await getDocs(collection(db, 'transactions'));
      const list: TxRow[] = snap.docs.map(d => {
        const data = d.data();
        return {
          id: d.id,
          userId: data.userId,
          amount: data.amount,
          type: data.type,
          category: data.category,
          date: data.date?.toDate ? data.date.toDate().toISOString() : data.date,
          description: data.description
        };
      });
      setRows(list);
    } catch {
      setError('Impossible de charger les transactions (collection absente ?)');
      setRows([]);
    } finally {
      setLoading(false);
    }
  }

  function exportCSV() {
    if (!rows.length) return;
    const header = ['id','userId','amount','type','category','date','description'];
    const csv = [header.join(','), ...rows.map(r => header.map(h => JSON.stringify((r as any)[h] ?? '')).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'transactions.csv'; a.click(); URL.revokeObjectURL(url);
  }

  function exportExcel() {
    if (!rows.length) return;
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Transactions');
    XLSX.writeFile(wb, 'transactions.xlsx');
  }

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <section className="relative overflow-hidden rounded-3xl border border-white/70 bg-white/85 px-6 py-6 shadow-2xl backdrop-blur dark:border-gray-800/70 dark:bg-gray-900/75">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-10 top-0 h-40 w-40 rounded-full bg-[radial-gradient(circle_at_center,rgba(62,99,221,0.16),transparent_55%)] blur-2xl" />
          <div className="absolute right-0 top-10 h-56 w-56 rounded-full bg-[radial-gradient(circle_at_center,rgba(124,58,237,0.18),transparent_55%)] blur-2xl" />
        </div>
        <div className="relative space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="brand" subtle icon={<FileSpreadsheet className="h-3 w-3" />}>Export</Badge>
            <Badge variant="info" subtle icon={<RefreshCw className="h-3 w-3" />}>Synchronisé</Badge>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Exports Transactions</h1>
          <p className="text-gray-600 dark:text-gray-300">
            Chargez les transactions Firestore puis générez des exports CSV ou Excel prêts à être partagés avec l&apos;équipe finance.
          </p>
          <Badge variant="neutral" subtle>{rows.length} lignes chargées</Badge>
        </div>
      </section>

      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={load}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[var(--color-brand,#3E63DD)] to-[var(--color-brand-hover,#3257c7)] px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-[rgba(62,99,221,0.25)] transition hover:brightness-105 disabled:opacity-60"
        >
          <RefreshCw className={loading ? 'h-4 w-4 animate-spin' : 'h-4 w-4'} />
          {loading ? 'Chargement...' : 'Charger les transactions'}
        </button>
        <button
          onClick={exportCSV}
          disabled={!rows.length}
          className="inline-flex items-center gap-2 rounded-xl bg-white/90 px-4 py-3 text-sm font-semibold text-gray-800 shadow-sm ring-1 ring-black/5 transition hover:-translate-y-[1px] disabled:opacity-60 dark:bg-gray-900/80 dark:text-gray-100"
        >
          <FileDown className="h-4 w-4" />
          Export CSV
        </button>
        <button
          onClick={exportExcel}
          disabled={!rows.length}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-500/25 transition hover:brightness-105 disabled:opacity-60"
        >
          <FileSpreadsheet className="h-4 w-4" />
          Export Excel
        </button>
        <Badge variant="info" subtle>{rows.length ? 'Prêt à exporter' : 'Chargez les données'}</Badge>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-2xl border border-rose-200 bg-rose-50/70 px-4 py-3 text-sm text-rose-700 dark:border-rose-800/60 dark:bg-rose-900/30 dark:text-rose-200">
          <RefreshCw className="h-4 w-4" />
          {error}
        </div>
      )}

      <div className="overflow-hidden rounded-3xl border border-white/70 bg-white/90 shadow-lg ring-1 ring-black/5 backdrop-blur dark:border-gray-800/80 dark:bg-gray-900/70">
        <div className="flex items-center justify-between px-6 py-4">
          <div>
            <p className="text-sm font-semibold text-gray-900 dark:text-white">Transactions</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Liste brute avant export</p>
          </div>
          <Badge variant="brand" subtle>{rows.length} lignes</Badge>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50/80 text-left text-xs uppercase tracking-wide text-gray-500 backdrop-blur dark:bg-gray-900/80 dark:text-gray-400">
              <tr>
                {['ID','User','Montant','Type','Catégorie','Date','Description'].map(h => <th key={h} className="px-5 py-3 font-semibold">{h}</th>)}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100/70 dark:divide-gray-800/80">
              {rows.map(r => (
                <tr key={r.id} className="transition hover:-translate-y-[1px] hover:bg-gray-50/80 dark:hover:bg-gray-800/70">
                  <td className="px-5 py-3 font-mono text-xs text-gray-500 dark:text-gray-300">{r.id}</td>
                  <td className="px-5 py-3">{r.userId}</td>
                  <td className="px-5 py-3 font-semibold text-gray-900 dark:text-white">{typeof r.amount === 'number' ? r.amount.toLocaleString('fr-FR',{style:'currency',currency:'EUR'}) : ''}</td>
                  <td className="px-5 py-3">{r.type}</td>
                  <td className="px-5 py-3">{r.category}</td>
                  <td className="px-5 py-3">{r.date?.slice(0,10)}</td>
                  <td className="px-5 py-3">{r.description}</td>
                </tr>
              ))}
              {!rows.length && !loading && (
                <tr><td colSpan={7} className="px-5 py-6 text-center text-gray-500 dark:text-gray-400">Aucune donnée chargée.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default function ExportPage() {
  return <AdminShell><ExportContent /></AdminShell>;
}
