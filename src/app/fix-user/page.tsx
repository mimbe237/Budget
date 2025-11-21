'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { initializeFirebase } from '@/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export default function FixUserPage() {
  const [userId, setUserId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleFix = async () => {
    if (!userId.trim()) {
      toast({
        title: 'Erreur',
        description: 'Veuillez entrer un ID utilisateur',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      const { firestore } = initializeFirebase();
      const userRef = doc(firestore, 'users', userId);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        toast({
          title: 'Erreur',
          description: 'Utilisateur non trouvé',
          variant: 'destructive',
        });
        return;
      }

      const existingData = userSnap.data();
      
      // Merge with required fields
      const updatedData = {
        ...existingData,
        id: userId,
        locale: existingData.locale || existingData.language === 'fr' ? 'fr-CM' : 'en-US',
        displayCurrency: existingData.displayCurrency || 'XAF',
        monthlyExpenseBudget: existingData.monthlyExpenseBudget || 0,
        hasCompletedOnboarding: existingData.hasCompletedOnboarding || false,
        hasCompletedTour: existingData.hasCompletedTour || false,
        updatedAt: new Date().toISOString(),
        createdAt: existingData.createdAt?.toDate?.()?.toISOString() || existingData.createdAt || new Date().toISOString(),
      };

      await setDoc(userRef, updatedData, { merge: true });

      toast({
        title: 'Succès',
        description: 'Document utilisateur réparé avec succès',
      });
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Réparer un document utilisateur</CardTitle>
          <CardDescription>
            Ajoute les champs manquants à un document utilisateur existant
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="userId">ID Utilisateur</Label>
            <Input
              id="userId"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              placeholder="QE79kfsdIDMVn94c129WVygjMh32"
            />
          </div>
          <Button onClick={handleFix} disabled={isLoading} className="w-full">
            {isLoading ? 'Réparation...' : 'Réparer le document'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
