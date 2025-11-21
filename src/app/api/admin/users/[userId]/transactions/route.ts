import { NextRequest } from 'next/server';
import { requireAdmin } from '@/lib/adminAuth';
import { getAdminFirestore } from '@/firebase/admin';
import { z } from 'zod';

export async function GET(request: NextRequest, { params }: { params: { userId: string } }) {
  try {
    await requireAdmin();
    const db = getAdminFirestore();
    const { searchParams } = new URL(request.url);

    const userId = params.userId;
    const search = searchParams.get('search') || '';
    const from = searchParams.get('from');
    const to = searchParams.get('to');
    const category = searchParams.get('category');
    const type = searchParams.get('type'); // 'income' | 'expense'
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = Math.min(parseInt(searchParams.get('pageSize') || '10', 10), 100);
    const sortField = searchParams.get('sortField') || 'date'; // 'date' | 'amountInCents'
    const sortDir = (searchParams.get('sortDir') || 'desc') as 'asc' | 'desc';

    let query = db.collection(`users/${userId}/expenses`).orderBy(sortField, sortDir);
    if (type) query = query.where('type', '==', type);
    if (from) query = query.where('date', '>=', new Date(from));
    if (to) query = query.where('date', '<=', new Date(to));
    if (category) query = query.where('category', '==', category);

    // Total pour pagination
    const totalSnap = await query.get();
    let items = totalSnap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));

    // Recherche par description (client-side sur l'échantillon complet du total)
    if (search) {
      const s = search.toLowerCase();
      items = items.filter((t) => (t.description || '').toLowerCase().includes(s));
    }

    const total = items.length;

    // Pagination en mémoire (offset supporté par admin SDK mais devant filtre search, on slice ici)
    const start = (page - 1) * pageSize;
    const paged = items.slice(start, start + pageSize);

    // Résumé
    const totalIncomeInCents = items.filter((t) => t.type === 'income').reduce((s, t) => s + (t.amountInCents || 0), 0);
    const totalExpensesInCents = items.filter((t) => t.type === 'expense').reduce((s, t) => s + (t.amountInCents || 0), 0);
    const balanceInCents = totalIncomeInCents - totalExpensesInCents;

    // Répartition par catégorie (dépenses)
    const categoryMap: Record<string, number> = {};
    for (const t of items) {
      if (t.type === 'expense') {
        categoryMap[t.category || 'Autres'] = (categoryMap[t.category || 'Autres'] || 0) + (t.amountInCents || 0);
      }
    }
    const categoriesBreakdown = Object.entries(categoryMap).map(([category, valueInCents]) => ({ category, valueInCents }));

    // Tendances mensuelles (YYYY-MM)
    const monthMap: Record<string, { incomeInCents: number; expenseInCents: number; netInCents: number }> = {};
    for (const t of items) {
      const d = t.date?.toDate ? t.date.toDate() : new Date(t.date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (!monthMap[key]) monthMap[key] = { incomeInCents: 0, expenseInCents: 0, netInCents: 0 };
      if (t.type === 'income') monthMap[key].incomeInCents += (t.amountInCents || 0);
      if (t.type === 'expense') monthMap[key].expenseInCents += (t.amountInCents || 0);
      monthMap[key].netInCents = monthMap[key].incomeInCents - monthMap[key].expenseInCents;
    }
    const monthlyTrend = Object.entries(monthMap)
      .sort(([a], [b]) => (a < b ? -1 : 1))
      .map(([month, v]) => ({ month, ...v }));

    return new Response(
      JSON.stringify({ items: paged, total, summary: { totalIncomeInCents, totalExpensesInCents, balanceInCents }, categoriesBreakdown, monthlyTrend }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Erreur listage transactions:', error);
    return new Response(
      JSON.stringify({ error: 'Impossible de récupérer les transactions' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

const TransactionSchema = z.object({
  description: z.string().min(1),
  category: z.string().min(1),
  type: z.enum(['income','expense']),
  amountInCents: z.number().int().nonnegative(),
  date: z.string().or(z.date()),
  notes: z.string().optional()
});

export async function POST(request: NextRequest, { params }: { params: { userId: string } }) {
  try {
    await requireAdmin();
    const db = getAdminFirestore();
    const body = await request.json();
    const parsed = TransactionSchema.parse(body);
    const dateObj = typeof parsed.date === 'string' ? new Date(parsed.date) : parsed.date;
    const docRef = db.collection(`users/${params.userId}/expenses`).doc();
    await docRef.set({
      description: parsed.description,
      category: parsed.category,
      type: parsed.type,
      amountInCents: parsed.amountInCents,
      date: dateObj,
      notes: parsed.notes || '',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    return new Response(JSON.stringify({ id: docRef.id }), { headers: { 'Content-Type': 'application/json' } });
  } catch (error) {
    console.error('Erreur création transaction:', error);
    return new Response(JSON.stringify({ error: 'Création impossible' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }
}
