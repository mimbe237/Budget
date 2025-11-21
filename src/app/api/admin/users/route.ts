import { NextRequest } from 'next/server';
import { z } from 'zod';
import { requireAdmin } from '@/lib/adminAuth';
import {
  getAllUsersWithStats,
  type AdminUserFilters,
  type AdminUserSort,
} from '@/lib/analyticsAdmin';

const querySchema = z.object({
  search: z.string().optional(),
  country: z.string().optional(),
  gender: z.enum(['male', 'female']).optional(),
  language: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  status: z.enum(['active', 'suspended']).optional(),
  sortField: z
    .enum(['createdAt', 'balanceInCents', 'transactionCount', 'firstName', 'country'])
    .default('createdAt'),
  sortDir: z.enum(['asc', 'desc']).default('desc'),
  limit: z
    .string()
    .optional()
    .transform(value => (value ? Number.parseInt(value, 10) : 25))
    .pipe(z.number().int().min(1).max(100)),
  offset: z
    .string()
    .optional()
    .transform(value => (value ? Number.parseInt(value, 10) : 0))
    .pipe(z.number().int().min(0)),
});

export async function GET(request: NextRequest) {
  await requireAdmin();

  try {
    const parsed = querySchema.parse(Object.fromEntries(new URL(request.url).searchParams));

    const filters: AdminUserFilters = {
      search: parsed.search,
      country: parsed.country,
      gender: parsed.gender,
      language: parsed.language,
      dateFrom: parsed.dateFrom,
      dateTo: parsed.dateTo,
      status: parsed.status,
    };

    const sort: AdminUserSort = {
      field: parsed.sortField,
      direction: parsed.sortDir,
    };

    const { users, totalCount } = await getAllUsersWithStats(
      filters,
      sort,
      parsed.limit,
      parsed.offset,
    );

    const serialisedUsers = users.map(user => ({
      ...user,
      createdAt: user.createdAt?.toDate ? user.createdAt.toDate().toISOString() : user.createdAt,
      lastLoginAt: user.lastLoginAt?.toDate
        ? user.lastLoginAt.toDate().toISOString()
        : user.lastLoginAt,
    }));

    return new Response(
      JSON.stringify({
        users: serialisedUsers,
        totalCount,
      }),
      { headers: { 'Content-Type': 'application/json' } },
    );
  } catch (error) {
    console.error('Erreur API admin users:', error);
    return new Response(
      JSON.stringify({
        error: "Impossible de récupérer les utilisateurs",
        details: error instanceof Error ? error.message : 'Erreur inconnue',
      }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      },
    );
  }
}
