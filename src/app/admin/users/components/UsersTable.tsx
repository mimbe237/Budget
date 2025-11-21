'use client';

import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AdminUserData, AdminUserSort } from '@/lib/adminTypes';
import { formatMoneyFromCents, formatDate } from '@/lib/format';
import {
  ChevronUp,
  ChevronDown,
  MoreHorizontal,
  Eye,
  Edit,
  UserX,
  UserCheck,
  Trash2,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
} from 'lucide-react';

interface UsersTableProps {
  users: AdminUserData[];
  totalUsers: number;
  currentPage: number;
  pageSize: number;
  sort: AdminUserSort;
  isLoading?: boolean;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  onSortChange: (sort: AdminUserSort) => void;
  onViewUser: (user: AdminUserData) => void;
  onEditUser: (user: AdminUserData) => void;
  onToggleStatus: (user: AdminUserData) => void;
  onDeleteUser: (user: AdminUserData) => void;
}

const COUNTRIES_FLAGS: Record<string, string> = {
  'France': '🇫🇷',
  'Belgique': '🇧🇪',
  'Cameroun': '🇨🇲',
  'Canada': '🇨🇦',
  'Suisse': '🇨🇭',
  'Allemagne': '🇩🇪',
  'États-Unis': '🇺🇸',
  'Maroc': '🇲🇦',
  'Algérie': '🇩🇿',
  'Tunisie': '🇹🇳',
  'Sénégal': '🇸🇳',
  'Côte d\'Ivoire': '🇨🇮',
};

const LANGUAGES_NAMES: Record<string, string> = {
  'fr': 'Français',
  'en': 'Anglais',
  'es': 'Espagnol',
  'de': 'Allemand',
  'ar': 'Arabe',
};

export function UsersTable({
  users,
  totalUsers,
  currentPage,
  pageSize,
  sort,
  isLoading,
  onPageChange,
  onPageSizeChange,
  onSortChange,
  onViewUser,
  onEditUser,
  onToggleStatus,
  onDeleteUser,
}: UsersTableProps) {
  const totalPages = Math.ceil(totalUsers / pageSize);
  const startIndex = (currentPage - 1) * pageSize + 1;
  const endIndex = Math.min(currentPage * pageSize, totalUsers);

  const handleSort = (field: AdminUserSort['field']) => {
    if (sort.field === field) {
      onSortChange({
        field,
        direction: sort.direction === 'asc' ? 'desc' : 'asc',
      });
    } else {
      onSortChange({ field, direction: 'desc' });
    }
  };

  const SortIcon = ({ field }: { field: AdminUserSort['field'] }) => {
    if (sort.field !== field) {
      return <ArrowUpDown className="ml-2 h-4 w-4 text-gray-400" />;
    }
    return sort.direction === 'asc' ? (
      <ChevronUp className="ml-2 h-4 w-4 text-blue-600" />
    ) : (
      <ChevronDown className="ml-2 h-4 w-4 text-blue-600" />
    );
  };

  const getUserInitials = (user: AdminUserData) => {
    return `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase();
  };

  if (isLoading) {
    return <UsersTableSkeleton />;
  }

  return (
    <Card className="rounded-2xl shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>
            Utilisateurs ({totalUsers.toLocaleString('fr-FR')})
          </span>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span>Afficher</span>
              <Select
                value={pageSize.toString()}
                onValueChange={(value) => onPageSizeChange(parseInt(value))}
              >
                <SelectTrigger className="w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                </SelectContent>
              </Select>
              <span>par page</span>
            </div>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-lg border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="w-12">#</TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    onClick={() => handleSort('firstName')}
                    className="h-auto p-0 font-semibold text-left justify-start"
                  >
                    Utilisateur
                    <SortIcon field="firstName" />
                  </Button>
                </TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    onClick={() => handleSort('country')}
                    className="h-auto p-0 font-semibold text-left justify-start"
                  >
                    Pays
                    <SortIcon field="country" />
                  </Button>
                </TableHead>
                <TableHead>Sexe</TableHead>
                <TableHead>Langue</TableHead>
                <TableHead>Téléphone</TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    onClick={() => handleSort('transactionCount')}
                    className="h-auto p-0 font-semibold text-left justify-start"
                  >
                    Transactions
                    <SortIcon field="transactionCount" />
                  </Button>
                </TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    onClick={() => handleSort('balanceInCents')}
                    className="h-auto p-0 font-semibold text-left justify-start"
                  >
                    Solde
                    <SortIcon field="balanceInCents" />
                  </Button>
                </TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    onClick={() => handleSort('createdAt')}
                    className="h-auto p-0 font-semibold text-left justify-start"
                  >
                    Inscription
                    <SortIcon field="createdAt" />
                  </Button>
                </TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="w-12">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user, index) => (
                <TableRow key={user.id} className="hover:bg-gray-50/50">
                  <TableCell className="text-gray-500 text-sm">
                    {startIndex + index}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="text-xs bg-blue-100 text-blue-700">
                          {getUserInitials(user)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium text-gray-900">
                          {user.firstName} {user.lastName}
                        </div>
                        <div className="text-sm text-gray-500">
                          {user.email}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="text-lg">
                        {COUNTRIES_FLAGS[user.country] || '🌍'}
                      </span>
                      <span className="text-sm">
                        {user.country}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs">
                      {user.gender === 'male' ? '♂ H' : '♀ F'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">
                      {LANGUAGES_NAMES[user.language] || user.language}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-gray-600 font-mono">
                      {user.phoneCountryCode && user.phoneNumber
                        ? `${user.phoneCountryCode} ${user.phoneNumber}`
                        : '—'
                      }
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant={user.transactionCount > 0 ? 'default' : 'secondary'}
                      className="text-xs"
                    >
                      {user.transactionCount}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span 
                      className={`text-sm font-medium ${
                        user.balanceInCents >= 0 
                          ? 'text-green-600' 
                          : 'text-red-600'
                      }`}
                    >
                      {formatMoneyFromCents(user.balanceInCents)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-gray-600">
                      {formatDate(user.createdAt)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={user.status === 'active' ? 'default' : 'destructive'}
                      className="text-xs"
                    >
                      {user.status === 'active' ? 'Actif' : 'Suspendu'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem onClick={() => onViewUser(user)}>
                          <Eye className="mr-2 h-4 w-4" />
                          Voir détails
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onEditUser(user)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Modifier
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => onToggleStatus(user)}>
                          {user.status === 'active' ? (
                            <>
                              <UserX className="mr-2 h-4 w-4" />
                              Suspendre
                            </>
                          ) : (
                            <>
                              <UserCheck className="mr-2 h-4 w-4" />
                              Activer
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => onDeleteUser(user)}
                          className="text-red-600 focus:text-red-600"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Supprimer
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-gray-600">
              Affichage de {startIndex} à {endIndex} sur {totalUsers.toLocaleString('fr-FR')} utilisateurs
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage <= 1}
              >
                <ChevronLeft className="h-4 w-4" />
                Précédent
              </Button>
              
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }

                  return (
                    <Button
                      key={pageNum}
                      variant={currentPage === pageNum ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => onPageChange(pageNum)}
                      className="w-8 h-8 p-0"
                    >
                      {pageNum}
                    </Button>
                  );
                })}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage >= totalPages}
              >
                Suivant
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function UsersTableSkeleton() {
  return (
    <Card className="rounded-2xl shadow-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="h-6 w-48 bg-gray-200 rounded animate-pulse" />
          <div className="h-8 w-32 bg-gray-200 rounded animate-pulse" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-lg border overflow-hidden">
          <div className="bg-gray-50 h-12 border-b" />
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="h-16 border-b border-gray-100 flex items-center px-4 gap-4">
              <div className="h-8 w-8 bg-gray-200 rounded-full animate-pulse" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
                <div className="h-3 w-48 bg-gray-200 rounded animate-pulse" />
              </div>
              <div className="h-4 w-16 bg-gray-200 rounded animate-pulse" />
              <div className="h-4 w-12 bg-gray-200 rounded animate-pulse" />
              <div className="h-4 w-16 bg-gray-200 rounded animate-pulse" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}