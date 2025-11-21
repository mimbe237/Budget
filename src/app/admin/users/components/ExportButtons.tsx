'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { AdminUserFilters } from '@/lib/analyticsAdmin';
import { Download, FileSpreadsheet, FileText, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ExportButtonsProps {
  filters: AdminUserFilters;
  totalUsers: number;
  disabled?: boolean;
}

export function ExportButtons({ filters, totalUsers, disabled }: ExportButtonsProps) {
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();

  const handleExport = async (format: 'csv' | 'xlsx') => {
    setIsExporting(true);
    
    try {
      const formData = new FormData();
      
      // Ajouter tous les filtres au FormData
      Object.entries(filters).forEach(([key, value]) => {
        if (value) {
          formData.append(key, value);
        }
      });

      // Endpoint selon le format
      const endpoint = format === 'csv' 
        ? '/api/admin/users/export/csv'
        : '/api/admin/users/export/xlsx';

      const response = await fetch(endpoint, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de l\'exportation');
      }

      // Récupérer le nom du fichier depuis les headers
      const contentDisposition = response.headers.get('Content-Disposition');
      const filename = contentDisposition
        ? contentDisposition.split('filename=')[1]?.replace(/"/g, '')
        : `utilisateurs_${new Date().toISOString().split('T')[0]}.${format}`;

      // Créer le blob et télécharger
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: 'Export réussi',
        description: `Le fichier ${format.toUpperCase()} a été téléchargé avec succès.`,
      });

    } catch (error) {
      console.error('Erreur export:', error);
      toast({
        title: 'Erreur d\'exportation',
        description: error instanceof Error ? error.message : 'Une erreur inattendue s\'est produite.',
        variant: 'destructive',
      });
    } finally {
      setIsExporting(false);
    }
  };

  const hasFilters = Object.values(filters).some(Boolean);

  return (
    <Card className="rounded-2xl shadow-sm">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Download className="h-5 w-5 text-green-600" />
          Exportation
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm text-gray-600">
          {hasFilters ? (
            <p>
              Exporter <strong>{totalUsers.toLocaleString('fr-FR')}</strong> utilisateur{totalUsers > 1 ? 's' : ''} 
              {' '}correspondant aux filtres actifs.
            </p>
          ) : (
            <p>
              Exporter <strong>tous les {totalUsers.toLocaleString('fr-FR')}</strong> utilisateurs.
            </p>
          )}
        </div>

        <div className="flex gap-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                className="flex-1" 
                disabled={disabled || isExporting || totalUsers === 0}
              >
                {isExporting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Export en cours...
                  </>
                ) : (
                  <>
                    <Download className="mr-2 h-4 w-4" />
                    Exporter
                  </>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem 
                onClick={() => handleExport('csv')}
                disabled={isExporting}
              >
                <FileText className="mr-2 h-4 w-4" />
                Format CSV
                <span className="ml-auto text-xs text-gray-500">Léger</span>
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => handleExport('xlsx')}
                disabled={isExporting}
              >
                <FileSpreadsheet className="mr-2 h-4 w-4" />
                Format Excel
                <span className="ml-auto text-xs text-gray-500">Riche</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Guide d'utilisation */}
        <div className="text-xs text-gray-500 space-y-1">
          <p><strong>CSV :</strong> Idéal pour l'import dans d'autres outils</p>
          <p><strong>Excel :</strong> Avec formatage et colonnes ajustées</p>
          {hasFilters && (
            <p className="text-blue-600 font-medium">
              ℹ️ Seuls les utilisateurs filtrés seront exportés
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}