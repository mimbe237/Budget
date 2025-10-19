'use server';

import { z } from 'zod';
import { requireAdmin } from '@/lib/adminAuth';
import { getAllUsersWithStats, AdminUserFilters, AdminUserSort } from '@/lib/analyticsAdmin';
import { formatUsersForExcel, generateCSV } from '@/lib/format';

// Schemas de validation
const ExportFiltersSchema = z.object({
  search: z.string().optional(),
  country: z.string().optional(),
  gender: z.enum(['male', 'female']).optional(),
  language: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  status: z.enum(['active', 'suspended']).optional(),
});

const ExportFormatSchema = z.enum(['csv', 'xlsx']);

/**
 * Exporte les utilisateurs en CSV
 */
export async function exportUsersCSV(formData: FormData) {
  try {
    // Vérifier les permissions admin
    await requireAdmin();
    
    // Valider les données
    const filters = ExportFiltersSchema.parse({
      search: formData.get('search') || undefined,
      country: formData.get('country') || undefined,
      gender: formData.get('gender') || undefined,
      language: formData.get('language') || undefined,
      dateFrom: formData.get('dateFrom') || undefined,
      dateTo: formData.get('dateTo') || undefined,
      status: formData.get('status') || undefined,
    });

    // Récupérer tous les utilisateurs correspondants (sans pagination pour l'export)
    const { users } = await getAllUsersWithStats(
      filters,
      { field: 'createdAt', direction: 'desc' },
      10000, // Limite élevée pour l'export
      0
    );

    // Formater pour l'export
    const exportData = formatUsersForExcel(users);
    const csvContent = generateCSV(exportData);

    // Créer la réponse avec les headers appropriés
    const filename = `utilisateurs_${new Date().toISOString().split('T')[0]}.csv`;
    
    return new Response(csvContent, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-cache',
      },
    });

  } catch (error) {
    console.error('Erreur export CSV:', error);
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

/**
 * Exporte les utilisateurs en Excel
 */
export async function exportUsersExcel(formData: FormData) {
  try {
    // Vérifier les permissions admin
    await requireAdmin();
    
    // Valider les données
    const filters = ExportFiltersSchema.parse({
      search: formData.get('search') || undefined,
      country: formData.get('country') || undefined,
      gender: formData.get('gender') || undefined,
      language: formData.get('language') || undefined,
      dateFrom: formData.get('dateFrom') || undefined,
      dateTo: formData.get('dateTo') || undefined,
      status: formData.get('status') || undefined,
    });

    // Récupérer tous les utilisateurs correspondants
    const { users } = await getAllUsersWithStats(
      filters,
      { field: 'createdAt', direction: 'desc' },
      10000,
      0
    );

    // Formater pour l'export
    const exportData = formatUsersForExcel(users);
    
    // Import dynamique d'xlsx pour éviter d'alourdir le bundle
    const { generateExcelFile } = await import('@/lib/format');
    const excelBuffer = await generateExcelFile(exportData);

    const filename = `utilisateurs_${new Date().toISOString().split('T')[0]}.xlsx`;

    // Convertir Buffer -> ArrayBuffer pour compatibilité fetch/Response (DOM types)
    const uint8 = excelBuffer instanceof Uint8Array ? excelBuffer : new Uint8Array(excelBuffer as any);
    const arrayBuffer = uint8.buffer.slice(uint8.byteOffset, uint8.byteOffset + uint8.byteLength);

    return new Response(arrayBuffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-cache',
      },
    });

  } catch (error) {
    console.error('Erreur export Excel:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Erreur lors de l\'exportation Excel',
        details: error instanceof Error ? error.message : 'Erreur inconnue'
      }), 
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

/**
 * Action générique d'export basée sur le format
 */
export async function exportUsers(
  filters: AdminUserFilters,
  format: 'csv' | 'xlsx'
) {
  try {
    // Vérifier les permissions admin
    await requireAdmin();
    
    // Valider les entrées
    const validatedFilters = ExportFiltersSchema.parse(filters);
    const validatedFormat = ExportFormatSchema.parse(format);

    // Récupérer les utilisateurs
    const { users } = await getAllUsersWithStats(
      validatedFilters,
      { field: 'createdAt', direction: 'desc' },
      10000,
      0
    );

    // Formater les données
    const exportData = formatUsersForExcel(users);

    if (validatedFormat === 'csv') {
      const csvContent = generateCSV(exportData);
      return {
        success: true,
        data: csvContent,
        filename: `utilisateurs_${new Date().toISOString().split('T')[0]}.csv`,
        contentType: 'text/csv'
      };
    } else {
      const { generateExcelFile } = await import('@/lib/format');
      const excelBuffer = await generateExcelFile(exportData);
      const uint8 = excelBuffer instanceof Uint8Array ? excelBuffer : new Uint8Array(excelBuffer as any);
      const arrayBuffer = uint8.buffer.slice(uint8.byteOffset, uint8.byteOffset + uint8.byteLength);
      return {
        success: true,
        data: arrayBuffer,
        filename: `utilisateurs_${new Date().toISOString().split('T')[0]}.xlsx`,
        contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      };
    }

  } catch (error) {
    console.error('Erreur export utilisateurs:', error);
    return {
      success: false,
      error: 'Erreur lors de l\'exportation',
      details: error instanceof Error ? error.message : 'Erreur inconnue'
    };
  }
}