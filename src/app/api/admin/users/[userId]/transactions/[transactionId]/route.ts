import { NextRequest } from 'next/server';
import { requireAdmin } from '@/lib/adminAuth';
import { getAdminFirestore } from '@/firebase/admin';
import { z } from 'zod';

const UpdateSchema = z.object({
  description: z.string().min(1).optional(),
  category: z.string().min(1).optional(),
  type: z.enum(['income','expense']).optional(),
  amountInCents: z.number().int().nonnegative().optional(),
  date: z.string().or(z.date()).optional(),
  notes: z.string().optional(),
});

export async function PATCH(request: NextRequest, { params }: { params: { userId: string; transactionId: string } }) {
  try {
    await requireAdmin();
    const db = getAdminFirestore();
    const body = await request.json();
    const parsed = UpdateSchema.parse(body);
    const updates: any = { updatedAt: new Date() };
    if (parsed.description !== undefined) updates.description = parsed.description;
    if (parsed.category !== undefined) updates.category = parsed.category;
    if (parsed.type !== undefined) updates.type = parsed.type;
    if (parsed.amountInCents !== undefined) updates.amountInCents = parsed.amountInCents;
    if (parsed.date !== undefined) updates.date = typeof parsed.date === 'string' ? new Date(parsed.date) : parsed.date;
    if (parsed.notes !== undefined) updates.notes = parsed.notes;

    await db.doc(`users/${params.userId}/expenses/${params.transactionId}`).update(updates);
    return new Response(JSON.stringify({ success: true }), { headers: { 'Content-Type': 'application/json' } });
  } catch (error) {
    console.error('Erreur mise à jour transaction:', error);
    return new Response(JSON.stringify({ error: 'Mise à jour impossible' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { userId: string; transactionId: string } }) {
  try {
    await requireAdmin();
    const db = getAdminFirestore();
    await db.doc(`users/${params.userId}/expenses/${params.transactionId}`).delete();
    return new Response(JSON.stringify({ success: true }), { headers: { 'Content-Type': 'application/json' } });
  } catch (error) {
    console.error('Erreur suppression transaction:', error);
    return new Response(JSON.stringify({ error: 'Suppression impossible' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }
}
