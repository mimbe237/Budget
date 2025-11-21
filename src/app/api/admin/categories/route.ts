import { NextRequest } from 'next/server';
import { requireAdmin } from '@/lib/adminAuth';
import { getAdminFirestore } from '@/firebase/admin';

// GET /api/admin/categories?type=income|expense|all
export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
    const db = getAdminFirestore();
    const { searchParams } = new URL(request.url);
    const type = (searchParams.get('type') || 'all') as 'income'|'expense'|'all';

    const snap = await db.collection('categories').get();
    const all = snap.docs.map(d => ({ id: d.id, ...(d.data() as any) }));
    // Convention: doc: { name: string, kind: 'income'|'expense' }
    const filtered = type==='all' ? all : all.filter(c => (c.kind || 'expense') === type);

    const income = filtered.filter(c => (c.kind || 'expense') === 'income');
    const expense = filtered.filter(c => (c.kind || 'expense') === 'expense');

    return new Response(JSON.stringify({ income, expense, all: filtered }), { headers: { 'Content-Type': 'application/json' } });
  } catch (e) {
    console.error('Erreur catégories admin:', e);
    return new Response(JSON.stringify({ error: 'Impossible de récupérer les catégories' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}
