'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { Goal } from '@/lib/types';

interface GoalAIDialogProps {
  goal: Goal | null;
  isOpen: boolean;
  onClose: () => void;
  isFrench: boolean;
  userProfile: any;
}

export function GoalAIDialog({
  goal,
  isOpen,
  onClose,
  isFrench,
  userProfile,
}: GoalAIDialogProps) {
  const [aiReport, setAIReport] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const handleAnalyze = async () => {
    if (!goal) return;
    
    setLoading(true);
    setError(false);
    
    try {
      const res = await fetch('/api/ai/goal-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ goal, userProfile, transactions: [] }),
      });
      
      const data = await res.json();
      setAIReport(data.analysis || (isFrench ? 'Aucune analyse disponible.' : 'No analysis available.'));
    } catch (e) {
      setError(true);
      setAIReport(isFrench ? 'Erreur lors de l\'analyse.' : 'Analysis error.');
    }
    
    setLoading(false);
  };

  const translations = {
    title: isFrench ? 'Analyse IA de l\'objectif' : 'AI Goal Analysis',
    analyze: isFrench ? 'Analyser' : 'Analyze',
    analyzing: isFrench ? 'Analyse en cours...' : 'Analyzing...',
    close: isFrench ? 'Fermer' : 'Close',
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{translations.title}</DialogTitle>
          <DialogDescription>{goal?.name}</DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {!aiReport && !loading && (
            <div className="text-center">
              <Button onClick={handleAnalyze}>
                {translations.analyze}
              </Button>
            </div>
          )}

          {loading && (
            <div className="text-center py-8 text-muted-foreground">
              {translations.analyzing}
            </div>
          )}

          {aiReport && (
            <div className="whitespace-pre-line text-sm bg-slate-50 p-4 rounded-lg max-h-96 overflow-y-auto">
              {aiReport}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
