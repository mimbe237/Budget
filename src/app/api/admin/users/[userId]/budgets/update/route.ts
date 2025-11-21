import { NextRequest } from 'next/server';
import { z } from 'zod';
import { requireAdmin } from '@/lib/adminAuth';
import { getAdminFirestore } from '@/firebase/admin';

const BodySchema = z.object({
  categoryId: z.string().min(1),
  budgetedAmount: z.number().min(0),
});

export async function POST(request: NextRequest, { params }: { params: { userId: string } }) {
  await requireAdmin();
  try {
    const json = await request.json();
    const data = BodySchema.parse(json);

    const db = getAdminFirestore();
    const ref = db.collection(`users/${params.userId}/categories`).doc(data.categoryId);

    await ref.update({
      budgetedAmount: data.budgetedAmount,
      updatedAt: new Date(),
      updatedBy: 'admin',
    });

    // TODO: écrire dans admin_logs un historique de révision

    return new Response(JSON.stringify({ success: true }), { headers: { 'Content-Type': 'application/json' } });
  } catch (error) {
    console.error('Budget update error:', error);
    return new Response(JSON.stringify({ success: false, error: 'Update failed' }), { status: 400 });
  }
}