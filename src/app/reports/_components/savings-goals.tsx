'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Target, Calendar } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { fr } from 'date-fns/locale';

interface Goal {
  id: string;
  userId: string;
  name: string;
  targetAmountInCents: number;
  currentAmountInCents: number;
  currency: string;
  targetDate: string;
}

interface SavingsGoalsProps {
  goals: Goal[];
  formatMoney: (amount: number) => string;
  isFrench: boolean;
}

export function SavingsGoals({ goals, formatMoney, isFrench }: SavingsGoalsProps) {
  const translations = {
    title: isFrench ? 'Objectifs d\'épargne' : 'Savings Goals',
    saved: isFrench ? 'Épargné' : 'Saved',
    target: isFrench ? 'Objectif' : 'Target',
    remaining: isFrench ? 'Restant' : 'Remaining',
    daysLeft: isFrench ? 'jours restants' : 'days left',
    dayLeft: isFrench ? 'jour restant' : 'day left',
    overdue: isFrench ? 'En retard' : 'Overdue',
    completed: isFrench ? 'Complété' : 'Completed',
    onTrack: isFrench ? 'En bonne voie' : 'On track',
    noGoals: isFrench ? 'Aucun objectif d\'épargne configuré' : 'No savings goals configured',
  };

  const locale = isFrench ? fr : undefined;

  if (goals.length === 0) {
    return (
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Target className="h-5 w-5" />
            {translations.title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32 text-gray-500">
            {translations.noGoals}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Limiter à 3 objectifs maximum et trier par progression
  const displayGoals = goals
    .sort((a, b) => {
      const aProgress = (a.currentAmountInCents / a.targetAmountInCents) * 100;
      const bProgress = (b.currentAmountInCents / b.targetAmountInCents) * 100;
      return bProgress - aProgress;
    })
    .slice(0, 3);

  const getETA = (goal: Goal) => {
    const now = new Date();
    const targetDate = new Date(goal.targetDate);
    const daysRemaining = differenceInDays(targetDate, now);
    
    if (daysRemaining < 0) {
      return { text: translations.overdue, color: 'text-red-600' };
    }
    
    if (goal.currentAmountInCents >= goal.targetAmountInCents) {
      return { text: translations.completed, color: 'text-green-600' };
    }
    
    if (daysRemaining === 0) {
      return { text: translations.dayLeft, color: 'text-orange-600' };
    }
    
    if (daysRemaining === 1) {
      return { text: `1 ${translations.dayLeft}`, color: 'text-orange-600' };
    }
    
    return { 
      text: `${daysRemaining} ${translations.daysLeft}`, 
      color: daysRemaining <= 30 ? 'text-orange-600' : 'text-gray-600' 
    };
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Target className="h-5 w-5" />
          {translations.title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {displayGoals.map((goal) => {
            const progress = (goal.currentAmountInCents / goal.targetAmountInCents) * 100;
            const remaining = goal.targetAmountInCents - goal.currentAmountInCents;
            const eta = getETA(goal);
            
            return (
              <div 
                key={goal.id} 
                className="p-4 border border-gray-200 rounded-lg bg-white hover:shadow-sm transition-shadow"
              >
                {/* Goal Title */}
                <h4 className="font-semibold text-gray-900 mb-3 truncate" title={goal.name}>
                  {goal.name}
                </h4>
                
                {/* Progress Bar */}
                <div className="mb-3">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-600">
                      {Math.min(100, progress).toFixed(0)}%
                    </span>
                    <span className={`text-xs ${eta.color}`}>
                      {eta.text}
                    </span>
                  </div>
                  <Progress 
                    value={Math.min(100, progress)} 
                    className="h-2"
                  />
                </div>
                
                {/* Amounts */}
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">{translations.saved}:</span>
                    <span className="font-medium text-green-700">
                      {formatMoney(goal.currentAmountInCents)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">{translations.target}:</span>
                    <span className="font-medium text-gray-900">
                      {formatMoney(goal.targetAmountInCents)}
                    </span>
                  </div>
                  {remaining > 0 && (
                    <div className="flex justify-between border-t pt-1 mt-2">
                      <span className="text-gray-600">{translations.remaining}:</span>
                      <span className="font-medium text-orange-700">
                        {formatMoney(remaining)}
                      </span>
                    </div>
                  )}
                </div>
                
                {/* Target Date */}
                <div className="flex items-center gap-1 mt-3 text-xs text-gray-500">
                  <Calendar className="h-3 w-3" />
                  {format(new Date(goal.targetDate), 'd MMM yyyy', { locale })}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}