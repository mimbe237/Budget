'use client';
import { useState, useEffect } from 'react';
import type { ComponentType } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import {
  Target as TargetIcon,
  Plane,
  Car,
  Home,
  PiggyBank,
  Gift,
  Heart,
  Book,
  Dumbbell,
  Briefcase,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from '@/components/ui/dialog';
import { COMMON_GOAL_SUGGESTIONS } from '@/lib/goal-suggestions';
import type { Goal, Currency, GoalType } from '@/lib/types';

const GOAL_TYPE_OPTIONS: { value: GoalType; labelFr: string; labelEn: string }[] = [
  { value: 'epargne', labelFr: 'Épargne', labelEn: 'Savings' },
  { value: 'achat', labelFr: 'Dépense à réduire', labelEn: 'Spending reduction' },
  { value: 'dette', labelFr: 'Dette à solder', labelEn: 'Debt payoff' },
  { value: 'plafond', labelFr: 'Plafond de dépenses', labelEn: 'Spending cap' },
];

const GOAL_ICON_OPTIONS = [
  { value: 'target', label: 'Target' },
  { value: 'plane', label: 'Plane' },
  { value: 'car', label: 'Car' },
  { value: 'home', label: 'Home' },
  { value: 'piggy-bank', label: 'Piggy bank' },
  { value: 'gift', label: 'Gift' },
  { value: 'heart', label: 'Heart' },
  { value: 'book', label: 'Book' },
  { value: 'dumbbell', label: 'Fitness' },
  { value: 'briefcase', label: 'Business' },
];

const ICON_PREVIEW_MAP: Record<string, ComponentType<{ className?: string }>> = {
  target: TargetIcon,
  plane: Plane,
  car: Car,
  home: Home,
  'piggy-bank': PiggyBank,
  gift: Gift,
  heart: Heart,
  book: Book,
  dumbbell: Dumbbell,
  briefcase: Briefcase,
};

const GOAL_COLOR_OPTIONS = [
  '#2563eb',
  '#10b981',
  '#f59e0b',
  '#ef4444',
  '#8b5cf6',
  '#ec4899',
  '#14b8a6',
  '#f97316',
  '#0ea5e9',
  '#64748b',
];

interface OptionItem {
  value: string;
  label: string;
}

interface GoalFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (goalData: Partial<Goal>) => void;
  currentGoal: Goal | null;
  displayCurrency: Currency;
  isFrench: boolean;
  categoryOptions: OptionItem[];
  debtOptions: OptionItem[];
}

export function GoalForm({
  isOpen,
  onClose,
  onSave,
  currentGoal,
  displayCurrency,
  isFrench,
  categoryOptions,
  debtOptions,
}: GoalFormProps) {
  const [goalName, setGoalName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [currentAmount, setCurrentAmount] = useState('0');
  const [targetDate, setTargetDate] = useState('');
  const [description, setDescription] = useState('');
  const [storageAccount, setStorageAccount] = useState('');
  const [goalType, setGoalType] = useState<GoalType>('epargne');
  const [goalIcon, setGoalIcon] = useState<string>('target');
  const [goalColor, setGoalColor] = useState<string>(GOAL_COLOR_OPTIONS[0]);
  const [linkedCategory, setLinkedCategory] = useState<string>('none');
  const [linkedDebt, setLinkedDebt] = useState<string>('none');
  const [suggestionIndex, setSuggestionIndex] = useState<number | null>(null);
  const [isAISuggesting, setIsAISuggesting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isDirty, setIsDirty] = useState(false);
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  useEffect(() => {
    if (currentGoal) {
      setGoalName(currentGoal.name);
      setTargetAmount(String((currentGoal.targetAmountInCents || 0) / 100));
      setCurrentAmount(String((currentGoal.currentAmountInCents || 0) / 100));
      setTargetDate(new Date(currentGoal.targetDate).toISOString().split('T')[0]);
      setDescription(currentGoal.description || '');
      setStorageAccount(currentGoal.storageAccount || '');
      setGoalType(currentGoal.type || 'epargne');
      setGoalIcon(currentGoal.icon || 'target');
      setGoalColor(currentGoal.color || GOAL_COLOR_OPTIONS[0]);
      setLinkedCategory(currentGoal.linkedCategoryId || 'none');
      setLinkedDebt(currentGoal.linkedDebtId || 'none');
      setSuggestionIndex(null);
    } else {
      // restore draft if available
      const draftKey = 'goalForm:draft';
      try {
        const raw = localStorage.getItem(draftKey);
        if (raw) {
          const draft = JSON.parse(raw);
          setGoalName(draft.goalName || '');
          setTargetAmount(draft.targetAmount || '');
          setCurrentAmount(draft.currentAmount || '0');
          setTargetDate(draft.targetDate || '');
          setDescription(draft.description || '');
          setStorageAccount(draft.storageAccount || '');
          setIsDirty(!!raw);
        } else {
          resetForm();
        }
      } catch (e) {
        resetForm();
      }
    }
  }, [currentGoal]);

  const resetForm = () => {
    setGoalName('');
    setTargetAmount('');
    setCurrentAmount('0');
    setTargetDate('');
    setDescription('');
    setStorageAccount('');
    setGoalType('epargne');
    setGoalIcon('target');
    setGoalColor(GOAL_COLOR_OPTIONS[0]);
    setLinkedCategory('none');
    setLinkedDebt('none');
    setSuggestionIndex(null);
    setErrors({});
    setIsDirty(false);
    setAutoSaveStatus('idle');
  };

  const applySuggestion = (idx: number) => {
    const s = COMMON_GOAL_SUGGESTIONS[idx];
    setGoalName(isFrench ? s.name : s.name_en);
    setTargetAmount(String(Math.round(s.defaultAmount / 100)));
    setCurrentAmount('0');
    const d = new Date();
    d.setMonth(d.getMonth() + s.defaultMonths);
    setTargetDate(d.toISOString().split('T')[0]);
    setGoalType('epargne');
    if (s.icon) setGoalIcon(s.icon);
    setSuggestionIndex(idx);
    setIsDirty(true);
  };

  const handleAISuggestion = async () => {
    setIsAISuggesting(true);
    try {
      const res = await fetch('/api/ai/goal-suggestion', {
        method: 'POST',
        body: JSON.stringify({ prompt: 'Suggest a financial goal', userProfile: {} })
      });
      const data = await res.json();
      if (data && data.name && data.amount && data.date) {
        setGoalName(data.name);
        setTargetAmount(String(data.amount));
        setCurrentAmount('0');
        setTargetDate(data.date);
        setGoalType('epargne');
        setSuggestionIndex(null);
      }
    } catch (e) {
      console.error('AI suggestion failed', e);
    }
    setIsAISuggesting(false);
  };

  const handleSave = () => {
    // final validation
    const vErrors: Record<string, string> = {};
    if (!goalName.trim()) vErrors.goalName = isFrench ? 'Le nom est requis' : 'Name is required';
    const t = parseFloat(targetAmount as any);
    if (!targetAmount || Number.isNaN(t) || t <= 0) vErrors.targetAmount = isFrench ? 'Montant cible invalide' : 'Invalid target amount';
    if (!targetDate) vErrors.targetDate = isFrench ? 'La date cible est requise' : 'Target date is required';

    if (Object.keys(vErrors).length) {
      setErrors(vErrors);
      return;
    }

    const targetAmountInCents = Math.round(parseFloat(targetAmount) * 100);
    const currentAmountInCents = Math.round(parseFloat(currentAmount) * 100);
    const selectedCategory = categoryOptions.find((option) => option.value === linkedCategory);
    const selectedDebt = debtOptions.find((option) => option.value === linkedDebt);

    onSave({
      name: goalName.trim(),
      targetAmountInCents,
      currentAmountInCents,
      currency: displayCurrency,
      targetDate,
      description: description.trim() || undefined,
      storageAccount: storageAccount.trim() || undefined,
      createdAt: currentGoal?.createdAt || new Date().toISOString(),
      type: goalType,
      icon: goalIcon,
      color: goalColor,
      linkedCategoryId: linkedCategory === 'none' ? null : linkedCategory,
      linkedCategoryName:
        linkedCategory === 'none' ? null : selectedCategory?.label ?? null,
      linkedDebtId: linkedDebt === 'none' ? null : linkedDebt,
      linkedDebtTitle:
        linkedDebt === 'none' ? null : selectedDebt?.label ?? null,
    });

    // clear draft
    try { localStorage.removeItem('goalForm:draft'); } catch (e) {}

    resetForm();
    onClose();
  };

  // auto-save draft (debounced)
  useEffect(() => {
    if (!isDirty) return;
    const key = 'goalForm:draft';
    setIsAutoSaving(true);
    setAutoSaveStatus('saving');
    const id = setTimeout(() => {
      try {
        const payload = JSON.stringify({ goalName, targetAmount, currentAmount, targetDate, description, storageAccount });
        localStorage.setItem(key, payload);
      } catch (e) {}
      setIsAutoSaving(false);
      setAutoSaveStatus('saved');
      // hide the saved badge after a short delay
      setTimeout(() => setAutoSaveStatus((prev) => (prev === 'saved' ? 'idle' : prev)), 2000);
    }, 500);
    return () => clearTimeout(id);
  }, [goalName, targetAmount, currentAmount, targetDate, description, storageAccount, isDirty]);

  // simple realtime validation
  useEffect(() => {
    const v: Record<string, string> = {};
    if (!goalName.trim()) v.goalName = isFrench ? 'Le nom est requis' : 'Name is required';
    const t = parseFloat(targetAmount as any);
    if (!targetAmount) v.targetAmount = isFrench ? 'Montant cible requis' : 'Target amount required';
    else if (Number.isNaN(t) || t <= 0) v.targetAmount = isFrench ? 'Montant cible invalide' : 'Invalid target amount';
    if (!targetDate) v.targetDate = isFrench ? 'La date cible est requise' : 'Target date is required';
    setErrors(v);
  }, [goalName, targetAmount, targetDate, isFrench]);

  // autofocus first input when dialog opens
  useEffect(() => {
    if (!isOpen) return;
    const id = setTimeout(() => {
      const el = document.getElementById('name') as HTMLInputElement | null;
      el?.focus();
    }, 120);
    return () => clearTimeout(id);
  }, [isOpen]);

  const translations = {
    editTitle: isFrench ? 'Modifier Objectif' : 'Edit Goal',
    addTitle: isFrench ? 'Ajouter Nouvel Objectif' : 'Add New Goal',
    editDesc: isFrench ? 'Apportez des modifications à votre objectif.' : 'Make changes to your goal.',
    addDesc: isFrench ? 'Créez un nouvel objectif financier.' : 'Create a new financial goal.',
    nameLabel: isFrench ? 'Nom' : 'Name',
    typeLabel: isFrench ? 'Type' : 'Type',
    targetLabel: isFrench ? 'Cible' : 'Target',
    savedLabel: isFrench ? 'Économisé' : 'Saved',
    targetDateLabel: isFrench ? 'Date Cible' : 'Target Date',
    descriptionLabel: isFrench ? 'Description' : 'Description',
    accountLabel: isFrench ? 'Compte de dépôt' : 'Holding account',
    accountPlaceholder: isFrench ? 'ex: Banque X - Épargne' : 'e.g. Bank X – Savings',
    iconLabel: isFrench ? 'Icône' : 'Icon',
    colorLabel: isFrench ? 'Couleur' : 'Color',
    categoryLinkLabel: isFrench ? 'Associer à une catégorie' : 'Link to category',
    debtLinkLabel: isFrench ? 'Associer à une dette' : 'Link to debt',
    noneOption: isFrench ? 'Aucun' : 'None',
    spendingTypeHelp: isFrench
      ? 'Type d’objectif : épargne, réduction de dépense ou remboursement.'
      : 'Goal type: savings, spending reduction, or payoff.',
    cancel: isFrench ? 'Annuler' : 'Cancel',
    save: isFrench ? 'Enregistrer' : 'Save',
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{currentGoal ? translations.editTitle : translations.addTitle}</DialogTitle>
          <DialogDescription>{currentGoal ? translations.editDesc : translations.addDesc}</DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          {/* Suggestions rapides */}
          <div className="flex flex-wrap gap-2">
            {COMMON_GOAL_SUGGESTIONS.map((s, idx) => (
              <Button 
                key={s.name} 
                size="sm" 
                variant={suggestionIndex === idx ? 'default' : 'outline'} 
                onClick={() => applySuggestion(idx)}
              >
                {isFrench ? s.name : s.name_en}
              </Button>
            ))}
            <Button 
              size="sm" 
              variant="secondary" 
              onClick={handleAISuggestion} 
              disabled={isAISuggesting}
            >
              {isAISuggesting ? (isFrench ? 'Chargement...' : 'Loading...') : (isFrench ? 'IA' : 'AI')}
            </Button>
          </div>

          {/* Formulaire */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">{translations.nameLabel}</Label>
            <div className="col-span-3">
              <div className="flex items-center gap-2">
                <Input 
                  id="name" 
                  value={goalName} 
                  onChange={(e) => { setGoalName(e.target.value); setIsDirty(true); }} 
                  className="flex-1" 
                  placeholder={isFrench ? 'ex: Épargner pour des vacances' : 'e.g. Save for Vacation'}
                  aria-invalid={!!errors.goalName}
                  aria-describedby={errors.goalName ? 'err-name' : undefined}
                />
                <span className="text-muted-foreground" aria-hidden> *</span>
              </div>
              {errors.goalName && (<div id="err-name" role="alert" className="text-sm text-destructive mt-1">{errors.goalName}</div>)}
            </div>
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="target-amount" className="text-right">
              {translations.targetLabel} ({displayCurrency})
            </Label>
            <div className="col-span-3">
              <div className="flex items-center gap-2">
                <Input 
                  id="target-amount" 
                  type="number" 
                  value={targetAmount} 
                  onChange={(e) => { setTargetAmount(e.target.value); setIsDirty(true); }} 
                  className="flex-1" 
                  placeholder="1000"
                  aria-invalid={!!errors.targetAmount}
                  aria-describedby={errors.targetAmount ? 'err-target' : undefined}
                />
                <span className="text-muted-foreground" aria-hidden> *</span>
              </div>
              {errors.targetAmount && (<div id="err-target" role="alert" className="text-sm text-destructive mt-1">{errors.targetAmount}</div>)}
            </div>
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="current-amount" className="text-right">{translations.savedLabel}</Label>
            <div className="col-span-3">
              <Input 
                id="current-amount" 
                type="number" 
                value={currentAmount} 
                onChange={(e) => { setCurrentAmount(e.target.value); setIsDirty(true); }} 
                className="flex-1" 
                placeholder="0"
              />
            </div>
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="target-date" className="text-right">{translations.targetDateLabel}</Label>
            <div className="col-span-3">
              <div className="flex items-center gap-2">
                <Input 
                  id="target-date" 
                  type="date" 
                  value={targetDate} 
                  onChange={(e) => { setTargetDate(e.target.value); setIsDirty(true); }} 
                  className="flex-1"
                  aria-invalid={!!errors.targetDate}
                  aria-describedby={errors.targetDate ? 'err-date' : undefined}
                />
                <span className="text-muted-foreground" aria-hidden> *</span>
              </div>
              {errors.targetDate && (<div id="err-date" role="alert" className="text-sm text-destructive mt-1">{errors.targetDate}</div>)}
            </div>
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="goal-type" className="text-right">{translations.typeLabel}</Label>
            <div className="col-span-3 space-y-2">
              <Select
                value={goalType}
                onValueChange={(value) => {
                  setGoalType(value as GoalType);
                  setIsDirty(true);
                }}
              >
                <SelectTrigger id="goal-type">
                  <SelectValue placeholder={translations.typeLabel} />
                </SelectTrigger>
                <SelectContent>
                  {GOAL_TYPE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {isFrench ? option.labelFr : option.labelEn}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">{translations.spendingTypeHelp}</p>
            </div>
          </div>

          <div className="grid grid-cols-4 items-start gap-4">
            <Label className="text-right pt-1">{translations.iconLabel}</Label>
            <div className="col-span-3">
              <div className="grid grid-cols-5 gap-2">
                {GOAL_ICON_OPTIONS.map((option) => {
                  const Icon = ICON_PREVIEW_MAP[option.value];
                  const isSelected = goalIcon === option.value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => {
                        setGoalIcon(option.value);
                        setIsDirty(true);
                      }}
                      className={cn(
                        'flex items-center justify-center rounded-md border bg-background p-2 transition-colors focus:outline-none focus-visible:ring',
                        isSelected ? 'border-primary text-primary shadow-sm' : 'border-muted text-muted-foreground'
                      )}
                      aria-pressed={isSelected}
                    >
                      <Icon className="h-5 w-5" />
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-4 items-start gap-4">
            <Label className="text-right pt-1">{translations.colorLabel}</Label>
            <div className="col-span-3">
              <div className="flex flex-wrap gap-2">
                {GOAL_COLOR_OPTIONS.map((color) => {
                  const isSelected = goalColor === color;
                  return (
                    <button
                      key={color}
                      type="button"
                      onClick={() => {
                        setGoalColor(color);
                        setIsDirty(true);
                      }}
                      className={cn(
                        'h-8 w-8 rounded-full border-2 transition-all focus:outline-none focus-visible:ring',
                        isSelected ? 'border-primary scale-105' : 'border-transparent'
                      )}
                      style={{ backgroundColor: color }}
                      aria-label={isFrench ? `Choisir la couleur ${color}` : `Choose color ${color}`}
                      aria-pressed={isSelected}
                    />
                  );
                })}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="linked-category" className="text-right">{translations.categoryLinkLabel}</Label>
            <div className="col-span-3">
              <Select
                value={linkedCategory}
                onValueChange={(value) => {
                  setLinkedCategory(value);
                  setIsDirty(true);
                }}
              >
                <SelectTrigger id="linked-category">
                  <SelectValue placeholder={translations.categoryLinkLabel} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">{translations.noneOption}</SelectItem>
                  {categoryOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="linked-debt" className="text-right">{translations.debtLinkLabel}</Label>
            <div className="col-span-3">
              <Select
                value={linkedDebt}
                onValueChange={(value) => {
                  setLinkedDebt(value);
                  setIsDirty(true);
                }}
              >
                <SelectTrigger id="linked-debt">
                  <SelectValue placeholder={translations.debtLinkLabel} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">{translations.noneOption}</SelectItem>
                  {debtOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="description" className="text-right">{translations.descriptionLabel}</Label>
            <div className="col-span-3">
              <Textarea
                id="description" 
                value={description} 
                onChange={e => { setDescription(e.target.value); setIsDirty(true); }} 
                className="flex-1" 
                placeholder={isFrench ? 'Description de l\'objectif (optionnel)' : 'Goal description (optional)'}
                rows={2}
              />
            </div>
          </div>

          <div className="grid grid-cols-4 items-start gap-4">
            <Label htmlFor="storage-account" className="text-right pt-1">{translations.accountLabel}</Label>
            <div className="col-span-3 space-y-2">
              <Input
                id="storage-account"
                value={storageAccount}
                onChange={e => { setStorageAccount(e.target.value); setIsDirty(true); }}
                placeholder={translations.accountPlaceholder}
              />
              <p className="text-xs text-muted-foreground">
                {isFrench
                  ? 'Précisez où est conservé l’argent de cet objectif (banque, mobile money, cash, etc.).'
                  : 'Note where the funds for this goal are stored (bank, mobile money, cash, etc.).'}
              </p>
            </div>
          </div>
        </div>

        {/* aria-live region for autosave status */}
        <div aria-live="polite" aria-atomic="true" className="sr-only">
          {autoSaveStatus === 'saving' ? (isFrench ? 'Enregistrement du brouillon en cours' : 'Saving draft...') :
            autoSaveStatus === 'saved' ? (isFrench ? 'Brouillon enregistré' : 'Draft saved') : ''}
        </div>

        <DialogFooter className="flex items-center justify-between gap-2">
          {/* visible lightweight status */}
          <div className="text-xs text-muted-foreground min-h-[1.25rem]">
            {autoSaveStatus === 'saving' && (
              <span>{isFrench ? 'Enregistrement...' : 'Saving...'}</span>
            )}
            {autoSaveStatus === 'saved' && (
              <span>{isFrench ? 'Brouillon enregistré' : 'Draft saved'}</span>
            )}
          </div>
          <DialogClose asChild>
            <Button variant="outline">{translations.cancel}</Button>
          </DialogClose>
          <Button onClick={handleSave} disabled={Boolean(Object.keys(errors).length) || isAutoSaving}>{translations.save}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
