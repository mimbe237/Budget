'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { AdminUserFilters } from '@/lib/adminTypes';
import { Search, Filter, Calendar as CalendarIcon, X, RotateCcw } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface FiltersBarProps {
  filters: AdminUserFilters;
  onFiltersChange: (filters: AdminUserFilters) => void;
  onReset: () => void;
  isLoading?: boolean;
}

const COUNTRIES = [
  'Belgique', 'Cameroun', 'France', 'Canada', 'Suisse', 'Allemagne',
  'États-Unis', 'Maroc', 'Algérie', 'Tunisie', 'Sénégal', 'Côte d\'Ivoire'
];

const LANGUAGES = [
  { code: 'fr', name: 'Français' },
  { code: 'en', name: 'Anglais' },
  { code: 'es', name: 'Espagnol' },
  { code: 'de', name: 'Allemand' },
  { code: 'ar', name: 'Arabe' }
];

export function FiltersBar({ filters, onFiltersChange, onReset, isLoading }: FiltersBarProps) {
  const [dateFromOpen, setDateFromOpen] = useState(false);
  const [dateToOpen, setDateToOpen] = useState(false);

  const handleFilterChange = (key: keyof AdminUserFilters, value: string | undefined) => {
    onFiltersChange({
      ...filters,
      [key]: value || undefined
    });
  };

  const activeFiltersCount = Object.values(filters).filter(Boolean).length;

  return (
    <Card className="rounded-2xl shadow-sm">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center justify-between text-lg">
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-blue-600" />
            Filtres & Recherche
            {activeFiltersCount > 0 && (
              <Badge variant="secondary" className="ml-2">
                {activeFiltersCount} actif{activeFiltersCount > 1 ? 's' : ''}
              </Badge>
            )}
          </div>
          {activeFiltersCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={onReset}
              className="text-gray-600 hover:text-gray-900"
              disabled={isLoading}
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Réinitialiser
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Barre de recherche */}
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Rechercher par nom, email ou pays..."
            value={filters.search || ''}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            className="pl-10 h-11"
            disabled={isLoading}
          />
          {filters.search && (
            <button
              onClick={() => handleFilterChange('search', '')}
              className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
              disabled={isLoading}
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Filtres en ligne */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Pays */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Pays</Label>
            <Select
              value={filters.country || ''}
              onValueChange={(value) => handleFilterChange('country', value)}
              disabled={isLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Tous les pays" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Tous les pays</SelectItem>
                {COUNTRIES.map((country) => (
                  <SelectItem key={country} value={country}>
                    {country}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Sexe */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Sexe</Label>
            <Select
              value={filters.gender || ''}
              onValueChange={(value) => handleFilterChange('gender', value)}
              disabled={isLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Tous" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Tous</SelectItem>
                <SelectItem value="male">Homme</SelectItem>
                <SelectItem value="female">Femme</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Langue */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Langue</Label>
            <Select
              value={filters.language || ''}
              onValueChange={(value) => handleFilterChange('language', value)}
              disabled={isLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Toutes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Toutes</SelectItem>
                {LANGUAGES.map((lang) => (
                  <SelectItem key={lang.code} value={lang.code}>
                    {lang.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Date de début */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Inscrit après</Label>
            <Popover open={dateFromOpen} onOpenChange={setDateFromOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
                  disabled={isLoading}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {filters.dateFrom
                    ? format(new Date(filters.dateFrom), 'dd/MM/yyyy', { locale: fr })
                    : 'Choisir date'
                  }
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={filters.dateFrom ? new Date(filters.dateFrom) : undefined}
                  onSelect={(date) => {
                    handleFilterChange('dateFrom', date?.toISOString().split('T')[0]);
                    setDateFromOpen(false);
                  }}
                  disabled={(date) => date > new Date()}
                  initialFocus
                />
                {filters.dateFrom && (
                  <div className="p-3 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        handleFilterChange('dateFrom', '');
                        setDateFromOpen(false);
                      }}
                      className="w-full"
                    >
                      Effacer
                    </Button>
                  </div>
                )}
              </PopoverContent>
            </Popover>
          </div>

          {/* Date de fin */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Inscrit avant</Label>
            <Popover open={dateToOpen} onOpenChange={setDateToOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
                  disabled={isLoading}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {filters.dateTo
                    ? format(new Date(filters.dateTo), 'dd/MM/yyyy', { locale: fr })
                    : 'Choisir date'
                  }
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={filters.dateTo ? new Date(filters.dateTo) : undefined}
                  onSelect={(date) => {
                    handleFilterChange('dateTo', date?.toISOString().split('T')[0]);
                    setDateToOpen(false);
                  }}
                  disabled={(date) => {
                    const today = new Date();
                    const fromDate = filters.dateFrom ? new Date(filters.dateFrom) : null;
                    return date > today || (fromDate && date < fromDate);
                  }}
                  initialFocus
                />
                {filters.dateTo && (
                  <div className="p-3 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        handleFilterChange('dateTo', '');
                        setDateToOpen(false);
                      }}
                      className="w-full"
                    >
                      Effacer
                    </Button>
                  </div>
                )}
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* Statuts */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Statut</Label>
          <div className="flex gap-2">
            <Button
              variant={!filters.status ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleFilterChange('status', '')}
              disabled={isLoading}
            >
              Tous
            </Button>
            <Button
              variant={filters.status === 'active' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleFilterChange('status', 'active')}
              disabled={isLoading}
            >
              Actifs
            </Button>
            <Button
              variant={filters.status === 'suspended' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleFilterChange('status', 'suspended')}
              disabled={isLoading}
            >
              Suspendus
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}