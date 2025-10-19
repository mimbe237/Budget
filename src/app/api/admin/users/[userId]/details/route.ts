import { NextRequest } from 'next/server';
import { requireAdmin } from '@/lib/adminAuth';
import { getUserDetails } from '@/lib/analyticsAdmin';

export async function GET(request: NextRequest, { params }: { params: { userId: string } }) {
  await requireAdmin();
  try {
    const data = await getUserDetails(params.userId);
    return new Response(JSON.stringify(data), { headers: { 'Content-Type': 'application/json' } });
  } catch (error) {
    console.error('Details error:', error);
    return new Response(JSON.stringify({ error: 'Failed to get user details' }), { status: 500 });
  }
}