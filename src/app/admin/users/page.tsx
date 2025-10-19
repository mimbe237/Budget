import { Suspense } from 'react';
import { requireAdmin } from '@/lib/adminAuth';
import { AdminUsersClient } from './components/AdminUsersClient';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Administration - Utilisateurs | Budget App',
  description: 'Gestion des utilisateurs de la plateforme',
};

export default async function AdminUsersPage() {
  // Vérifier les permissions admin côté serveur
  await requireAdmin();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* En-tête de page */}
        <div className="mb-8">
          <h1 className="text-3xl font-headline font-bold text-gray-900">
            Administration des Utilisateurs
          </h1>
          <p className="mt-2 text-gray-600">
            Gérez les utilisateurs de la plateforme : statistiques, recherche, actions administratives
          </p>
        </div>

        {/* Contenu principal avec Suspense pour le chargement */}
        <Suspense fallback={<AdminUsersPageSkeleton />}>
          <AdminUsersClient />
        </Suspense>
      </div>
    </div>
  );
}

function AdminUsersPageSkeleton() {
  return (
    <div className="space-y-8">
      {/* KPIs Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white rounded-2xl shadow-sm p-6">
            <div className="h-4 w-32 bg-gray-200 rounded animate-pulse mb-4" />
            <div className="h-8 w-20 bg-gray-200 rounded animate-pulse mb-2" />
            <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
          </div>
        ))}
      </div>

      {/* Charts Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bg-white rounded-2xl shadow-sm p-6">
            <div className="h-5 w-40 bg-gray-200 rounded animate-pulse mb-4" />
            <div className="h-64 bg-gray-100 rounded animate-pulse" />
          </div>
        ))}
      </div>

      {/* Filters & Table Skeleton */}
      <div className="space-y-6">
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <div className="h-6 w-48 bg-gray-200 rounded animate-pulse mb-4" />
          <div className="space-y-4">
            <div className="h-11 bg-gray-200 rounded animate-pulse" />
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-11 bg-gray-200 rounded animate-pulse" />
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-6">
          <div className="h-6 w-40 bg-gray-200 rounded animate-pulse mb-4" />
          <div className="space-y-4">
            <div className="h-12 bg-gray-100 rounded" />
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="h-16 bg-gray-50 rounded" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}