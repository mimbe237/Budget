'use client';

import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { refreshAIInsights } from './actions';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

export function RefreshInsightsButton() {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleRefresh = () => {
    setError(null);
    startTransition(async () => {
      const result = await refreshAIInsights();
      
      if (result.success) {
        // Forcer le rechargement de la page
        router.refresh();
      } else {
        setError(result.error || 'Erreur lors du rafraîchissement');
      }
    });
  };

  return (
    <div className="flex flex-col gap-2">
      <Button 
        onClick={handleRefresh}
        disabled={isPending}
        variant="outline"
        className="inline-flex items-center gap-2"
      >
        <RefreshCw className={`h-4 w-4 ${isPending ? 'animate-spin' : ''}`} />
        {isPending ? 'Actualisation...' : 'Actualiser l\'analyse'}
      </Button>
      {error && (
        <p className="text-xs text-red-600">{error}</p>
      )}
    </div>
  );
}
