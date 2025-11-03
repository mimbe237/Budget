'use client';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { ComponentType, CSSProperties } from 'react';
import {
  MoreHorizontal,
  Pencil,
  Trash2,
  Target,
  Plus,
  Target as TargetIcon,
  Plane,
  Car,
  Home,
  PiggyBank as PiggyBankIcon,
  Gift,
  Heart,
  Book,
  Dumbbell,
  Briefcase,
} from 'lucide-react';
import type { Goal, Currency, GoalType } from '@/lib/types';
import type { Locale } from 'date-fns';
import { formatDistanceStrict } from 'date-fns';

type GoalProgressInsight = {
  progressPct: number;
  expectedProgressPct: number;
  probabilityPct: number;
  pace: 'ahead' | 'on-track' | 'behind';
  daysRemaining: number;
};

type IconComponent = ComponentType<{ className?: string; style?: CSSProperties }>;

const ICON_MAP: Record<string, IconComponent> = {
  target: TargetIcon,
  plane: Plane,
  car: Car,
  home: Home,
  'piggy-bank': PiggyBankIcon,
  gift: Gift,
  heart: Heart,
  book: Book,
  dumbbell: Dumbbell,
  briefcase: Briefcase,
};

const TYPE_LABELS: Record<GoalType, { fr: string; en: string }> = {
  epargne: { fr: 'Épargne', en: 'Savings' },
  achat: { fr: 'Dépense à réduire', en: 'Spending cap' },
  dette: { fr: 'Dette à solder', en: 'Debt payoff' },
  plafond: { fr: 'Plafond de dépenses', en: 'Budget cap' },
};

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
  insight?: GoalProgressInsight;
  dateLocale?: Locale;
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
  insight,
  dateLocale,
}: GoalCardProps) {
  const progress = goal.targetAmountInCents > 0
    ? Math.min(((goal.currentAmountInCents || 0) / goal.targetAmountInCents) * 100, 100)
    : 0;
  const Icon = ICON_MAP[goal.icon ?? 'target'] ?? TargetIcon;
  const accentColor = goal.color ?? '#2563eb';
  const typeLabel = goal.type ? (isFrench ? TYPE_LABELS[goal.type]?.fr : TYPE_LABELS[goal.type]?.en) : null;
  const targetDate = goal.targetDate ? new Date(goal.targetDate) : null;
  const relativeDate = targetDate
    ? formatDistanceStrict(new Date(), targetDate, { addSuffix: true, locale: dateLocale })
    : null;
  const probability = insight ? insight.probabilityPct : null;
  const pace = insight?.pace ?? null;
  const paceBadgeVariant = pace === 'ahead' ? 'secondary' : pace === 'on-track' ? 'outline' : 'destructive';
  const paceLabel = pace === 'ahead' ? (isFrench ? 'En avance' : 'Ahead') : pace === 'on-track' ? (isFrench ? 'Sur la bonne voie' : 'On track') : pace === 'behind' ? (isFrench ? 'En retard' : 'Behind') : null;

  const translations = {
    edit: isFrench ? 'Modifier' : 'Edit',
    delete: isFrench ? 'Supprimer' : 'Delete',
    markCompleted: isFrench ? 'Marquer comme atteint' : 'Mark as completed',
    abandon: isFrench ? 'Abandonner' : 'Abandon',
    history: isFrench ? 'Historique' : 'History',
    aiAnalysis: isFrench ? 'Analyse IA' : 'AI Analysis',
    addContribution: isFrench ? 'Ajouter contribution' : 'Add contribution',
    account: isFrench ? 'Compte :' : 'Account:',
    notSpecified: isFrench ? 'Non renseigné' : 'Not specified',
    probability: isFrench ? 'Probabilité' : 'Probability',
    remaining: isFrench ? 'Reste' : 'Remaining',
  };

  return (
    <tr className="border-b align-top">
      <td className="p-4">
        <div className="flex items-start gap-3">
          <div
            className="mt-1 flex h-10 w-10 items-center justify-center rounded-full border"
            style={{ borderColor: accentColor, backgroundColor: `${accentColor}1a` }}
          >
            <Icon className="h-5 w-5" style={{ color: accentColor }} />
          </div>
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-semibold leading-tight">{goal.name}</span>
              {typeLabel && <Badge variant="outline" className="text-[11px] uppercase tracking-wide">{typeLabel}</Badge>}
            </div>
            {goal.description && (
              <p className="text-xs text-muted-foreground line-clamp-2">{goal.description}</p>
            )}
            <div className="text-xs text-muted-foreground">
              {translations.account}{' '}
              {goal.storageAccount || translations.notSpecified}
            </div>
            <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
              {goal.linkedCategoryName && <Badge variant="secondary">{goal.linkedCategoryName}</Badge>}
              {goal.linkedDebtTitle && <Badge variant="secondary">{goal.linkedDebtTitle}</Badge>}
            </div>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="outline" onClick={onShowHistory}>
                {translations.history}
              </Button>
              <Button size="sm" variant="secondary" onClick={onShowAIAnalysis}>
                {translations.aiAnalysis}
              </Button>
            </div>
          </div>
        </div>
      </td>

      <td className="p-4">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <Progress value={progress} className="flex-1" />
            {progress >= 100 && (
              <span className="whitespace-nowrap text-xs font-bold text-emerald-600">
                {isFrench ? 'Objectif atteint ! 🎉' : 'Goal reached! 🎉'}
              </span>
            )}
          </div>
          <div className="text-xs text-muted-foreground">
            {formatMoney(goal.currentAmountInCents || 0, goal.currency || displayCurrency, displayLocale)} /{' '}
            {formatMoney(goal.targetAmountInCents || 0, goal.currency || displayCurrency, displayLocale)}
          </div>
          {progress >= 100 ? (
            <div className="w-fit rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
              {isFrench 
                ? '✓ Objectif atteint ! Plus de contributions nécessaires.' 
                : '✓ Goal reached! No more contributions needed.'}
            </div>
          ) : (
            <Button size="sm" variant="outline" onClick={onAddContribution} className="w-fit">
              <Plus className="mr-1 h-4 w-4" />
              {translations.addContribution}
            </Button>
          )}
        </div>
      </td>

      <td className="p-4 text-sm">
        {probability !== null ? (
          <div className="space-y-1">
            <div className="text-lg font-semibold">{probability.toFixed(0)}%</div>
            {paceLabel && <Badge variant={paceBadgeVariant}>{paceLabel}</Badge>}
          </div>
        ) : (
          <span className="text-muted-foreground">—</span>
        )}
      </td>

      <td className="p-4 text-sm">
        {targetDate ? (
          <div className="space-y-1">
            <div className="font-medium">
              {targetDate.toLocaleDateString(displayLocale, { year: 'numeric', month: 'long', day: 'numeric' })}
            </div>
            {relativeDate && <div className="text-xs text-muted-foreground">{relativeDate}</div>}
          </div>
        ) : (
          <span className="text-muted-foreground">—</span>
        )}
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
