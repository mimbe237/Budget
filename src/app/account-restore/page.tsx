"use client";

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useUser } from '@/firebase';
import { ShieldCheck, Clock, ArrowPath } from 'lucide-react';

export default function AccountRestorePage() {
  const { userProfile } = useUser();
  const router = useRouter();
  const toast = useToast();
  const [isRestoring, setIsRestoring] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isFrench = userProfile?.locale === 'fr-CM';
  const deletionExpiresAt = useMemo(() => {
    if (!userProfile?.deletionExpiresAt) return null;
    return new Date(userProfile.deletionExpiresAt);
  }, [userProfile?.deletionExpiresAt]);

  useEffect(() => {
    if (!userProfile) {
      router.push('/login');
      return;
    }

    if (userProfile.status !== 'pending_deletion') {
      router.push('/dashboard');
    }
  }, [userProfile, router]);

  const handleRestore = async () => {
    setIsRestoring(true);
    setError(null);
    try {
      const response = await fetch('/api/user/me/restore', { method: 'POST' });
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload?.message || 'Unable to restore account.');
      }
      toast({
        title: isFrench ? 'Compte restauré' : 'Account restored',
        description: isFrench
          ? 'Votre compte est de nouveau accessible. Redirection vers le tableau de bord.'
          : 'Your account is restored. Redirecting to your dashboard.',
      });
      router.push('/dashboard');
    } catch (fetchError: any) {
      setError(fetchError?.message ?? 'Unable to restore account.');
    } finally {
      setIsRestoring(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-white px-4 py-12">
      <Card className="w-full max-w-lg text-center space-y-4">
        <CardHeader>
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-blue-50 text-blue-600">
            <ShieldCheck className="h-7 w-7" />
          </div>
          <CardTitle className="mt-4 text-2xl">{isFrench ? 'Compte en suppression' : 'Account marked for deletion'}</CardTitle>
          <CardDescription className="text-sm text-muted-foreground">
            {isFrench
              ? 'Votre compte est bloqué tant que les données ne sont pas effacées. Vous disposez de 30 jours pour annuler cette action.'
              : 'Your account is blocked while deletion is pending. You have 30 days to restore it before the process completes.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-slate-600">
          <p className="flex items-center justify-center gap-2">
            <Clock className="h-4 w-4" />
            {deletionExpiresAt
              ? isFrench
                ? `Suppression automatique programmée le ${deletionExpiresAt.toLocaleDateString()}`
                : `Automatic deletion scheduled for ${deletionExpiresAt.toLocaleDateString()}`
              : isFrench
                ? 'La suppression est en cours de préparation.'
                : 'Deletion is being prepared.'}
          </p>
          <p>
            {isFrench
              ? 'Une fois supprimé, vous ne pourrez plus accéder à vos budgets, vos objectifs et vos historiques.'
              : 'Once deleted, you will lose access to your budgets, goals, and history.'}
          </p>
        </CardContent>
        {error && (
          <div className="text-sm text-destructive">{error}</div>
        )}
        <div className="px-6 pb-6">
          <Button
            onClick={handleRestore}
            isLoading={isRestoring}
            className="w-full"
            size="lg"
          >
            <ArrowPath className="mr-2 h-4 w-4" />
            {isRestoring
              ? (isFrench ? 'Restoration en cours...' : 'Restoring account...')
              : (isFrench ? 'Restaurer mon compte' : 'Restore my account')}
          </Button>
          <p className="mt-3 text-xs text-muted-foreground">
            {isFrench
              ? 'Contactez privacy@budgetpro.net si vous avez besoin d’aide.'
              : 'Contact privacy@budgetpro.net if you need help.'}
          </p>
        </div>
      </Card>
    </div>
  );
}
