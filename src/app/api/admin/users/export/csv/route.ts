import { NextRequest } from 'next/server';
import { exportUsersCSV } from '@/app/admin/users/actions/exportUsers';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    return await exportUsersCSV(formData);
  } catch (error) {
    console.error('Erreur API export CSV:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Erreur lors de l\'exportation CSV',
        details: error instanceof Error ? error.message : 'Erreur inconnue'
      }), 
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}