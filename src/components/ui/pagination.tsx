import React from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, MoreHorizontal } from 'lucide-react';
import { Button } from './button';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  showFirstLast?: boolean;
  maxVisiblePages?: number;
}

export const Pagination: React.FC<PaginationProps> = ({ 
  currentPage, 
  totalPages, 
  onPageChange,
  showFirstLast = true,
  maxVisiblePages = 7
}) => {
  if (totalPages <= 1) return null;

  // Générer les numéros de page visibles avec ellipsis
  const getPageNumbers = () => {
    const pages: (number | 'ellipsis')[] = [];
    
    if (totalPages <= maxVisiblePages) {
      // Afficher toutes les pages si le total est petit
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Logique avec ellipsis pour grandes listes
      const leftSiblingIndex = Math.max(currentPage - 1, 1);
      const rightSiblingIndex = Math.min(currentPage + 1, totalPages);

      const shouldShowLeftEllipsis = leftSiblingIndex > 2;
      const shouldShowRightEllipsis = rightSiblingIndex < totalPages - 1;

      // Toujours afficher la première page
      pages.push(1);

      if (shouldShowLeftEllipsis) {
        pages.push('ellipsis');
      } else if (leftSiblingIndex === 2) {
        pages.push(2);
      }

      // Pages autour de la page courante
      for (let i = leftSiblingIndex; i <= rightSiblingIndex; i++) {
        if (i > 1 && i < totalPages) {
          pages.push(i);
        }
      }

      if (shouldShowRightEllipsis) {
        pages.push('ellipsis');
      } else if (rightSiblingIndex === totalPages - 1) {
        pages.push(totalPages - 1);
      }

      // Toujours afficher la dernière page
      if (totalPages > 1) {
        pages.push(totalPages);
      }
    }

    return pages;
  };

  const pages = getPageNumbers();

  return (
    <nav className="flex flex-col sm:flex-row justify-between items-center gap-2 mt-4" aria-label="Pagination">
      {/* Informations sur la page */}
      <div className="text-sm text-muted-foreground">
        Page {currentPage} sur {totalPages}
      </div>

      {/* Contrôles de navigation */}
      <div className="flex items-center gap-1">
        {/* Première page */}
        {showFirstLast && (
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => onPageChange(1)}
            disabled={currentPage === 1}
            aria-label="Première page"
          >
            <ChevronsLeft className="h-4 w-4" />
          </Button>
        )}

        {/* Page précédente */}
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          aria-label="Page précédente"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        {/* Numéros de page */}
        <div className="hidden sm:flex items-center gap-1">
          {pages.map((page, index) => {
            if (page === 'ellipsis') {
              return (
                <div key={`ellipsis-${index}`} className="px-2">
                  <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                </div>
              );
            }

            return (
              <Button
                key={page}
                variant={page === currentPage ? 'default' : 'outline'}
                size="icon"
                className="h-8 w-8"
                onClick={() => onPageChange(page)}
                disabled={page === currentPage}
                aria-label={`Page ${page}`}
                aria-current={page === currentPage ? 'page' : undefined}
              >
                {page}
              </Button>
            );
          })}
        </div>

        {/* Page suivante */}
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          aria-label="Page suivante"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>

        {/* Dernière page */}
        {showFirstLast && (
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => onPageChange(totalPages)}
            disabled={currentPage === totalPages}
            aria-label="Dernière page"
          >
            <ChevronsRight className="h-4 w-4" />
          </Button>
        )}
      </div>
    </nav>
  );
};
