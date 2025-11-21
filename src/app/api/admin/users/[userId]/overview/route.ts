import { NextRequest } from 'next/server';
import { getAdminFirestore } from '@/firebase/admin';
import { requireAdmin } from '@/lib/adminAuth';
import { parseISO, endOfMonth, startOfMonth, addMonths, subMonths, formatISO } from 'date-fns';

function getPeriodRange(params: URLSearchParams) {
  const period = params.get('period') || 'month'; // month | quarter | year | custom
  const fromParam = params.get('from');
  const toParam = params.get('to');

  const now = new Date();

  if (period === 'custom' && fromParam && toParam) {
    const from = parseISO(fromParam);
    const to = parseISO(toParam);
    return { from, to };
  }

  if (period === 'year') {
    const from = new Date(now.getFullYear(), 0, 1);
    const to = new Date(now.getFullYear(), 11, 31);
    return { from, to };
  }

  if (period === 'quarter') {
    const q = Math.floor(now.getMonth() / 3); // 0..3
    const from = new Date(now.getFullYear(), q * 3, 1);
    const to = new Date(now.getFullYear(), q * 3 + 3, 0);
    return { from, to };
  }

  // default month
  const from = startOfMonth(now);
  const to = endOfMonth(now);
  return { from, to };
}

export async function GET(request: NextRequest, { params }: { params: { userId: string } }) {
  await requireAdmin();

  const { searchParams } = new URL(request.url);
  const { from, to } = getPeriodRange(searchParams);

  try {
    const db = getAdminFirestore();
    const userId = params.userId;

    // Fetch transactions in range
    const expensesRef = db.collection(`users/${userId}/expenses`);
    const fromStr = formatISO(from, { representation: 'date' });
    const toStr = formatISO(to, { representation: 'date' });

    const txSnap = await expensesRef
      .where('date', '>=', fromStr)
      .where('date', '<=', toStr)
      .get();

    const transactions = txSnap.docs.map(d => ({ id: d.id, ...d.data() }));

    // Fetch categories/budgets
    const catSnap = await db.collection(`users/${userId}/categories`).get();
  const categories = catSnap.docs.map(d => ({ id: d.id, ...(d.data() as any) } as any));

    // KPIs calc
    const totalIncomeInCents = transactions
      .filter((t: any) => t.type === 'income')
      .reduce((sum: number, t: any) => sum + (t.amountInCents || 0), 0);
    const totalExpensesInCents = transactions
      .filter((t: any) => t.type === 'expense')
      .reduce((sum: number, t: any) => sum + (t.amountInCents || 0), 0);
    const netBalanceInCents = totalIncomeInCents - totalExpensesInCents;

    // Previous period for delta
    const prevFrom = subMonths(from, 1);
    const prevTo = subMonths(to, 1);
    const prevFromStr = formatISO(prevFrom, { representation: 'date' });
    const prevToStr = formatISO(prevTo, { representation: 'date' });

    const prevSnap = await expensesRef
      .where('date', '>=', prevFromStr)
      .where('date', '<=', prevToStr)
      .get();
    const prevTx = prevSnap.docs.map(d => d.data());
    const prevExpenses = prevTx.filter((t: any) => t.type === 'expense').reduce((s: number, t: any) => s + (t.amountInCents || 0), 0);

    const expenseDelta = prevExpenses === 0 ? null : ((totalExpensesInCents - prevExpenses) / prevExpenses) * 100;

    // Donut: spending by category
    const spendingByCategory: { name: string; value: number; categoryId?: string; budgetedAmount?: number }[] = [];
    const categoryMap: Record<string, any> = {};
  (categories as any[]).forEach((c: any) => { categoryMap[c.name] = c; });

    const expensesByCategory: Record<string, number> = {};
    transactions.filter((t: any) => t.type === 'expense').forEach((t: any) => {
      const cat = typeof t.category === 'string' ? t.category : t.category?.name;
      const key = cat || 'Autres';
      expensesByCategory[key] = (expensesByCategory[key] || 0) + (t.amountInCents || 0);
    });

    Object.entries(expensesByCategory).forEach(([name, value]) => {
      const cat = categoryMap[name];
      spendingByCategory.push({ name, value, categoryId: cat?.id, budgetedAmount: cat?.budgetedAmount || 0 });
    });

    // Cashflow per day
    const cashflowMap: Record<string, { income: number; expenses: number }> = {};
    transactions.forEach((t: any) => {
      const d = t.date; // YYYY-MM-DD
      if (!cashflowMap[d]) cashflowMap[d] = { income: 0, expenses: 0 };
      if (t.type === 'income') cashflowMap[d].income += (t.amountInCents || 0);
      if (t.type === 'expense') cashflowMap[d].expenses += (t.amountInCents || 0);
    });
    const cashflow = Object.entries(cashflowMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, v]) => ({ date, income: v.income, expenses: v.expenses }));

    // Budget summary & alerts
    const totalPlannedInCents = categories.reduce((sum, c: any) => sum + (c.budgetedAmount || 0), 0);
    const alerts: { category: string; level: 'warning' | 'danger'; percent: number }[] = [];
    spendingByCategory.forEach(item => {
      const planned = item.budgetedAmount || 0;
      if (planned > 0) {
        const used = item.value / planned;
        const percent = used * 100;
        if (percent >= 100) {
          alerts.push({ category: item.name, level: 'danger', percent });
        } else if (percent >= 80) {
          alerts.push({ category: item.name, level: 'warning', percent });
        }
      }
    });

    return new Response(JSON.stringify({
      period: { from: fromStr, to: toStr },
      kpis: {
        totalIncomeInCents,
        totalExpensesInCents,
        netBalanceInCents,
        expenseDelta,
        totalPlannedInCents,
      },
      spendingByCategory,
      cashflow,
      categories,
      transactions: transactions.slice(0, 200), // limiter
      alerts,
    }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Overview error:', error);
    return new Response(JSON.stringify({ error: 'Failed to compute overview' }), { status: 500 });
  }
}