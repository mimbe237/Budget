import { requireAdmin } from '@/lib/adminAuth';
import { getAdminKPIs } from '@/lib/analyticsAdmin';

export async function GET() {
  await requireAdmin();

  try {
    const kpis = await getAdminKPIs();
    return new Response(JSON.stringify({ kpis }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Erreur API KPIs admin:', error);
    return new Response(
      JSON.stringify({
        error: 'Impossible de récupérer les KPIs',
        details: error instanceof Error ? error.message : 'Erreur inconnue',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }
}
