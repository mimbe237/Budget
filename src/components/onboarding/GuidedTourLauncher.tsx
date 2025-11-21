"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Sparkles } from 'lucide-react';
import { AnchoredGuidedTour } from './AnchoredGuidedTour';
import { useFirestore, useUser, setDocumentNonBlocking } from '@/firebase';
import { doc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { ToastAction } from '@/components/ui/toast';
import { useTranslation } from '@/lib/i18n';

export function GuidedTourLauncher() {
  const [run, setRun] = useState(false);
  const { user, userProfile } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const { t } = useTranslation();

  useEffect(() => {
    // Proposer une fois un toast de découverte à la première connexion
    if (typeof window === 'undefined') return;
    if (!user || !userProfile) return;

    const key = `tourPromptShown_${user.uid}`;
    const shown = localStorage.getItem(key);
    if (!userProfile.hasCompletedTour && !shown) {
      toast({
        title: t('onboarding.welcome') + ' 👋',
        description: t('onboarding.tourPrompt'),
        action: (
          <ToastAction altText={t('onboarding.startTour')} onClick={() => setRun(true)}>
            {t('onboarding.startTour')}
          </ToastAction>
        ),
      });
      localStorage.setItem(key, '1');
    }
  }, [user, userProfile, toast, t]);

  const handleFinish = () => {
    setRun(false);
    if (user && firestore) {
      const profileRef = doc(firestore, `users/${user.uid}`);
      setDocumentNonBlocking(profileRef, { hasCompletedTour: true, updatedAt: new Date().toISOString() }, { merge: true });
    }
  };

  const handleClose = () => {
    setRun(false);
  };

  return (
    <div className="flex items-center justify-end">
      <Button variant="secondary" size="sm" onClick={() => setRun(true)}>
        <Sparkles className="mr-2 h-4 w-4" />
        {t('dashboard.discoverFeatures')}
      </Button>
      <AnchoredGuidedTour run={run} onFinish={handleFinish} onClose={handleClose} />
    </div>
  );
}
