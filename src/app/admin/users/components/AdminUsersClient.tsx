'use client';

import { useState, useEffect, useCallback } from 'react';
import { KpiCards } from './KpiCards';
import { FiltersBar } from './FiltersBar';
import { UsersTable } from './UsersTable';
import { UserDrawer } from './UserDrawer';
import { ExportButtons } from './ExportButtons';
// Note: fetch via API routes to avoid importing server-only modules in client
import { AdminUserData, AdminUserFilters, AdminUserSort, AdminKPIs } from '@/lib/adminTypes';
import { updateUser, toggleUserStatus, deleteUser } from '../actions/userMutations';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

const DEFAULT_FILTERS: AdminUserFilters = {};
const DEFAULT_SORT: AdminUserSort = { field: 'createdAt', direction: 'desc' };

export function AdminUsersClient() {
  // États
  const [users, setUsers] = useState<AdminUserData[]>([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [kpis, setKpis] = useState<AdminKPIs | null>(null);
  const [filters, setFilters] = useState<AdminUserFilters>(DEFAULT_FILTERS);
  const [sort, setSort] = useState<AdminUserSort>(DEFAULT_SORT);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [selectedUser, setSelectedUser] = useState<AdminUserData | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  
  // États de chargement
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const [isLoadingKpis, setIsLoadingKpis] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  
  const { toast } = useToast();

  // Charger les données initiales
  useEffect(() => {
    loadKpis();
    loadUsers();
  }, []);

  // Recharger les utilisateurs quand les filtres/tri/pagination changent
  useEffect(() => {
    loadUsers();
  }, [filters, sort, currentPage, pageSize]);

  const loadKpis = async () => {
    try {
      setIsLoadingKpis(true);
      const res = await fetch('/api/admin/users/[userId]/overview', { method: 'GET' });
      // Placeholder: if there's a dedicated KPIs endpoint, replace this.
      if (!res.ok) throw new Error('Failed to load KPIs');
      const data = await res.json();
      const kpisData = data.kpis as AdminKPIs;
      setKpis(kpisData);
    } catch (error) {
      console.error('Erreur chargement KPIs:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les statistiques.',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingKpis(false);
    }
  };

  const loadUsers = async () => {
    try {
      setIsLoadingUsers(true);
      const params = new URLSearchParams();
      if (filters.search) params.set('search', filters.search);
      if (filters.country) params.set('country', filters.country);
      if (filters.gender) params.set('gender', filters.gender);
      if (filters.language) params.set('language', filters.language);
      if (filters.dateFrom) params.set('dateFrom', filters.dateFrom);
      if (filters.dateTo) params.set('dateTo', filters.dateTo);
      if (filters.status) params.set('status', filters.status);
      params.set('sortField', sort.field);
      params.set('sortDir', sort.direction);
      params.set('limit', String(pageSize));
      params.set('offset', String((currentPage - 1) * pageSize));
      const res = await fetch(`/api/admin/users/export/csv?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to load users');
      const json = await res.json();
      const usersData = (json.users || []) as AdminUserData[];
      const totalCount = Number(json.totalCount || usersData.length);
      setUsers(usersData);
      setTotalUsers(totalCount);
    } catch (error) {
      console.error('Erreur chargement utilisateurs:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les utilisateurs.',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingUsers(false);
    }
  };

  // Gestionnaires d'événements
  const handleFiltersChange = (newFilters: AdminUserFilters) => {
    setFilters(newFilters);
    setCurrentPage(1); // Reset à la première page
  };

  const handleFiltersReset = () => {
    setFilters(DEFAULT_FILTERS);
    setSort(DEFAULT_SORT);
    setCurrentPage(1);
  };

  const handleSortChange = (newSort: AdminUserSort) => {
    setSort(newSort);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setCurrentPage(1);
  };

  const handleViewUser = (user: AdminUserData) => {
    setSelectedUser(user);
    setIsDrawerOpen(true);
  };

  const handleEditUser = (user: AdminUserData) => {
    // Pour l'instant, on affiche juste les détails
    // TODO: Implémenter un modal d'édition
    handleViewUser(user);
    toast({
      title: 'Fonctionnalité à venir',
      description: 'L\'édition d\'utilisateur sera disponible bientôt.',
    });
  };

  const handleToggleStatus = async (user: AdminUserData) => {
    setIsUpdating(true);
    try {
      const formData = new FormData();
      formData.append('userId', user.id);
      formData.append('status', user.status === 'active' ? 'suspended' : 'active');
      
      const result = await toggleUserStatus(formData);
      
      if (result.success) {
        toast({
          title: 'Statut modifié',
          description: `L'utilisateur a été ${user.status === 'active' ? 'suspendu' : 'activé'}.`,
        });
        
        // Recharger les données
        await loadUsers();
        await loadKpis();
        
        if (selectedUser?.id === user.id) {
          setIsDrawerOpen(false);
        }
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Erreur toggle status:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de modifier le statut.',
        variant: 'destructive',
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteUser = async (user: AdminUserData) => {
    setIsUpdating(true);
    try {
      const formData = new FormData();
      formData.append('userId', user.id);
      formData.append('confirmEmail', user.email);
      
      const result = await deleteUser(formData);
      
      if (result.success) {
        toast({
          title: 'Utilisateur supprimé',
          description: 'L\'utilisateur et toutes ses données ont été supprimés.',
        });
        
        // Recharger les données
        await loadUsers();
        await loadKpis();
        
        setIsDrawerOpen(false);
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Erreur suppression:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de supprimer l\'utilisateur.',
        variant: 'destructive',
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCloseDrawer = () => {
    setIsDrawerOpen(false);
    setSelectedUser(null);
  };

  // Affichage principal
  if (isLoadingKpis && isLoadingUsers) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Chargement des données administratives...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* KPIs */}
      {kpis && (
        <KpiCards 
          kpis={kpis} 
          isLoading={isLoadingKpis}
        />
      )}

      {/* Filtres et Exportation */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3">
          <FiltersBar
            filters={filters}
            onFiltersChange={handleFiltersChange}
            onReset={handleFiltersReset}
            isLoading={isLoadingUsers}
          />
        </div>
        <div className="lg:col-span-1">
          <ExportButtons
            filters={filters}
            totalUsers={totalUsers}
            disabled={isLoadingUsers}
          />
        </div>
      </div>

      {/* Tableau des utilisateurs */}
      <UsersTable
        users={users}
        totalUsers={totalUsers}
        currentPage={currentPage}
        pageSize={pageSize}
        sort={sort}
        isLoading={isLoadingUsers}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
        onSortChange={handleSortChange}
        onViewUser={handleViewUser}
        onEditUser={handleEditUser}
        onToggleStatus={handleToggleStatus}
        onDeleteUser={handleDeleteUser}
      />

      {/* Drawer de détails utilisateur */}
      <UserDrawer
        user={selectedUser}
        isOpen={isDrawerOpen}
        onClose={handleCloseDrawer}
        onEdit={handleEditUser}
        onToggleStatus={handleToggleStatus}
        onDelete={handleDeleteUser}
      />

      {/* Overlay de chargement global */}
      {isUpdating && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 flex items-center gap-3">
            <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
            <span>Mise à jour en cours...</span>
          </div>
        </div>
      )}
    </div>
  );
}