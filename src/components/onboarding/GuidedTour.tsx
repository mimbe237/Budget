"use client";

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { StepForward, StepBack } from 'lucide-react';

const STEPS = [
  {
    title: 'Tableau de bord',
    content: `Vue d'ensemble: revenus, dépenses, solde et tendances.`,
  },
  {
    title: 'Transactions',
    content: `Ajoutez vos revenus et dépenses. Chaque transaction peut être catégorisée et annotée.`,
  },
  {
    title: 'Budgets mensuels',
    content: `Définissez un budget global, répartissez par catégorie et suivez la consommation en temps réel.`,
  },
  {
    title: 'Objectifs',
    content: `Fixez des objectifs (épargne, achats, dettes) et suivez votre progression.`,
  },
  {
    title: 'Rapports',
    content: `Analyse détaillée: cashflow, dépenses par catégorie, budget vs réalisé.`,
  },
];

export function GuidedTour({ open, onOpenChange, onFinish }: { open: boolean; onOpenChange: (v: boolean) => void; onFinish: () => void; }) {
  const [step, setStep] = useState(0);

  const handleClose = () => {
    setStep(0);
    onOpenChange(false);
  };

  const handleNext = () => {
    if (step < STEPS.length - 1) setStep(step + 1);
    else onFinish();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); else onOpenChange(v); }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-headline">{STEPS[step].title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">{STEPS[step].content}</p>
          <div className="flex justify-between items-center">
            <Button variant="outline" disabled={step === 0} onClick={() => setStep(s => Math.max(0, s - 1))}>
              <StepBack className="mr-2 h-4 w-4" /> Retour
            </Button>
            <div className="text-xs text-muted-foreground">Étape {step + 1} / {STEPS.length}</div>
            <Button onClick={handleNext}>
              {step < STEPS.length - 1 ? (
                <>
                  Suivant <StepForward className="ml-2 h-4 w-4" />
                </>
              ) : (
                'Terminer'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
