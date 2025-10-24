'use client';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Pencil, Trash2, Target, Plus } from 'lucide-react';
import type { Goal, Currency } from '@/lib/types';

interface GoalCardProps {
  goal: Goal;
  displayCurrency: Currency;
  displayLocale: string;
  isFrench: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onArchive: (status: 'completed' | 'abandoned') => void;
  onAddContribution: () => void;
  onShowHistory: () => void;
  onShowAIAnalysis: () => void;
  formatMoney: (amountInCents: number, currency: Currency, locale: string) => string;
}

export function GoalCard({
  goal,
  displayCurrency,
  displayLocale,
  isFrench,
  onEdit,
  onDelete,
  onArchive,
  onAddContribution,
  onShowHistory,
  onShowAIAnalysis,
  formatMoney,
}: GoalCardProps) {
  const progress = goal.targetAmountInCents > 0 
    ? Math.min(((goal.currentAmountInCents || 0) / goal.targetAmountInCents) * 100, 100) 
    : 0;

  const translations = {
    edit: isFrench ? 'Modifier' : 'Edit',
    delete: isFrench ? 'Supprimer' : 'Delete',
    markCompleted: isFrench ? 'Marquer comme atteint' : 'Mark as completed',
    abandon: isFrench ? 'Abandonner' : 'Abandon',
    history: isFrench ? 'Historique' : 'History',
    aiAnalysis: isFrench ? 'Analyse IA' : 'AI Analysis',
    addContribution: isFrench ? 'Ajouter contribution' : 'Add contribution',
  };

  return (
    <tr className="border-b">
      <td className="p-4">
        <div className="font-medium">{goal.name}</div>
        {goal.description && (
          <div className="text-xs text-muted-foreground mt-1">
            {goal.description}
          </div>
        )}
        <div className="text-xs text-muted-foreground mt-1">
          {isFrench ? 'Compte :' : 'Account:'}{' '}
          {goal.storageAccount ? goal.storageAccount : isFrench ? 'Non renseigné' : 'Not specified'}
        </div>
        <div className="flex gap-2 mt-2">
          <Button size="sm" variant="outline" onClick={onShowHistory}>
            {translations.history}
          </Button>
          <Button size="sm" variant="secondary" onClick={onShowAIAnalysis}>
            {translations.aiAnalysis}
          </Button>
        </div>
      </td>

      <td className="p-4">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <Progress value={progress} className="flex-1" />
            {progress >= 100 && (
              <span className="text-xs font-bold text-green-600 whitespace-nowrap">
                {isFrench ? 'Objectif atteint ! 🎉' : 'Goal reached! 🎉'}
              </span>
            )}
          </div>
          <div className="text-xs text-muted-foreground">
            {formatMoney(goal.currentAmountInCents || 0, goal.currency || displayCurrency, displayLocale)} / 
            {formatMoney(goal.targetAmountInCents || 0, goal.currency || displayCurrency, displayLocale)}
          </div>
          <Button 
            size="sm" 
            variant="outline" 
            onClick={onAddContribution}
            className="w-fit"
          >
            <Plus className="w-4 h-4 mr-1" />
            {translations.addContribution}
          </Button>
        </div>
      </td>

      <td className="p-4">
        {new Date(goal.targetDate).toLocaleDateString(displayLocale, { 
          year: 'numeric', 
          month: 'long' 
        })}
      </td>

      <td className="p-4 text-right">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onEdit}>
              <Pencil className="mr-2 h-4 w-4" />
              {translations.edit}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onDelete} className="text-destructive">
              <Trash2 className="mr-2 h-4 w-4" />
              {translations.delete}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onArchive('completed')}>
              <Target className="mr-2 h-4 w-4 text-green-600" />
              {translations.markCompleted}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onArchive('abandoned')}>
              <Trash2 className="mr-2 h-4 w-4 text-orange-500" />
              {translations.abandon}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </td>
    </tr>
  );
}
