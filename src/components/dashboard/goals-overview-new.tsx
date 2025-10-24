'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Target, TrendingUp, Calendar, Plus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import type { Goal, Currency } from '@/lib/types';
import { useUser, useFirestore, useMemoFirebase, useCollection } from '@/firebase';
import { collection, query, where, orderBy, limit } from 'firebase/firestore';

export default function GoalsOverview() {
  const { user, userProfile } = useUser();
  const firestore = useFirestore();

  const isFrench = userProfile?.locale === 'fr-CM';
  const displayCurrency = (userProfile?.displayCurrency || 'USD') as Currency;
  const displayLocale = userProfile?.locale || 'en-US';

  // Récupérer les 3 objectifs actifs les plus récents
  const goalsQuery = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return query(
      collection(firestore, `users/${user.uid}/budgetGoals`),
      orderBy('createdAt', 'desc'),
      limit(3)
    );
  }, [user, firestore]);
  // Fallback legacy: certaines règles/prods anciennes utilisent encore `/goals`
  const legacyGoalsQuery = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return query(
      collection(firestore, `users/${user.uid}/goals`),
      orderBy('createdAt', 'desc'),
      limit(3)
    );
  }, [user, firestore]);

  const { data: goalsPrimary, isLoading: isLoadingPrimary, error: errorPrimary } = useCollection<Goal>(goalsQuery);
  const { data: goalsLegacy } = useCollection<Goal>(legacyGoalsQuery);
  // Filtrer côté client pour éviter les problèmes de règles Firestore avec where()
  const goalsPrimaryFiltered = goalsPrimary?.filter(g => !g.archived) || [];
  const goalsLegacyFiltered = goalsLegacy?.filter(g => !g.archived) || [];
  const goals = goalsPrimaryFiltered.length > 0 ? goalsPrimaryFiltered : goalsLegacyFiltered;
  const isLoading = isLoadingPrimary;

  const formatMoney = (amountInCents: number) => {
    const amount = (amountInCents || 0) / 100;
    return new Intl.NumberFormat(displayLocale, {
      style: 'currency',
      currency: displayCurrency,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(displayLocale, {
      year: 'numeric',
      month: 'short',
    });
  };

  const getProgress = (current: number, target: number) => {
    if (target === 0) return 0;
    return Math.min((current / target) * 100, 100);
  };

  const translations = {
    title: isFrench ? 'Objectifs d\'épargne' : 'Savings Goals',
    description: isFrench ? 'Suivez vos objectifs financiers' : 'Track your financial goals',
    viewAll: isFrench ? 'Voir tous les objectifs' : 'View All Goals',
    addGoal: isFrench ? 'Nouvel objectif' : 'New Goal',
    noGoals: isFrench ? 'Aucun objectif actif' : 'No active goals',
    target: isFrench ? 'Objectif' : 'Target',
    current: isFrench ? 'Actuel' : 'Current',
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="font-headline flex items-center gap-2">
            <Target className="h-5 w-5 text-green-600" />
            {translations.title}
          </CardTitle>
          <CardDescription>{translations.description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-2 bg-muted rounded w-full mb-1"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="font-headline flex items-center gap-2">
            <Target className="h-5 w-5 text-green-600" />
            {translations.title}
          </CardTitle>
          <CardDescription>{translations.description}</CardDescription>
        </div>
        <Link href="/goals">
          <Button variant="outline" size="sm">
            {translations.viewAll}
          </Button>
        </Link>
      </CardHeader>
      <CardContent>
        {!goals || goals.length === 0 ? (
          <div className="text-center py-8">
            <Target className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-50" />
            <p className="text-muted-foreground mb-4">{translations.noGoals}</p>
            <Link href="/goals">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                {translations.addGoal}
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {goals.map((goal) => {
              const progress = getProgress(
                goal.currentAmountInCents || 0,
                goal.targetAmountInCents || 0
              );
              const remaining =
                (goal.targetAmountInCents || 0) - (goal.currentAmountInCents || 0);

              return (
                <div
                  key={goal.id}
                  className="p-4 rounded-lg border bg-card hover:shadow-md transition-shadow"
                >
                  {/* En-tête */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">{goal.name}</h3>
                        {goal.description && (
                          <p className="text-sm text-muted-foreground line-clamp-1">
                            {goal.description}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">
                          {isFrench ? 'Compte :' : 'Account:'}{' '}
                          {goal.storageAccount ? goal.storageAccount : isFrench ? 'Non renseigné' : 'Not specified'}
                        </p>
                      </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-3.5 w-3.5" />
                      <span>{formatDate(goal.targetDate)}</span>
                    </div>
                  </div>

                  {/* Barre de progression */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-green-600">
                        {progress.toFixed(0)}%
                      </span>
                      <span className="text-muted-foreground">
                        {formatMoney(goal.currentAmountInCents || 0)} /{' '}
                        {formatMoney(goal.targetAmountInCents || 0)}
                      </span>
                    </div>
                    <Progress value={progress} className="h-2" />
                  </div>

                  {/* Statut */}
                  <div className="mt-3 flex items-center justify-between">
                    {progress >= 100 ? (
                      <Badge variant="default" className="bg-green-600">
                        <TrendingUp className="mr-1 h-3 w-3" />
                        {isFrench ? 'Objectif atteint !' : 'Goal reached!'}
                      </Badge>
                    ) : (
                      <span className="text-sm text-muted-foreground">
                        {isFrench ? 'Reste' : 'Remaining'}: {formatMoney(remaining)}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Bouton Voir tout */}
            <Link href="/goals">
              <Button variant="outline" className="w-full mt-2">
                {translations.viewAll}
              </Button>
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
