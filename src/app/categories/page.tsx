'use client';

import { useEffect, useMemo, useState } from 'react';
import { AppLayout } from '@/components/dashboard/dashboard-client';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import {
  Wallet,
  PiggyBank,
  Scale,
  Plus,
  Edit2,
  Trash2,
  Sparkles,
} from 'lucide-react';
import {
  useCollection,
  useFirestore,
  useUser,
  updateDocumentNonBlocking,
  useMemoFirebase,
  setDocumentNonBlocking,
  addDocumentNonBlocking,
  deleteDocumentNonBlocking,
} from '@/firebase';
import { collection, doc, orderBy, query, where } from 'firebase/firestore';
import { startOfMonth, endOfMonth, format } from 'date-fns';
import type { CategoryDocument, Transaction, MonthlyBudgetPlan, CategoryBudgetAllocation } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { createDefaultCategories } from '@/lib/default-categories';
import { cn } from '@/lib/utils';
import { formatBudgetPeriod } from '@/lib/budget-utils';

const DEFAULT_EXPENSE_WEIGHTS: Record<string, number> = {
  Housing: 30,
  Food: 15,
  Transport: 10,
  Entertainment: 8,
  Health: 7,
  Shopping: 5,
  Utilities: 10,
  Savings: 10,
  'Other Expenses': 5,
  Misc: 5,
};

const CUSTOM_CATEGORY_WEIGHT = 5;

function formatMoney(amount: number, currency: string = 'USD', locale: string = 'en-US') {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
  }).format(Number.isFinite(amount) ? amount : 0);
}

type SpendingStatus = 'healthy' | 'warning' | 'over';

function getRowClass(status: SpendingStatus) {
  switch (status) {
    case 'over':
      return 'bg-red-50 dark:bg-red-950/30';
    case 'warning':
      return 'bg-amber-50 dark:bg-amber-950/30';
    default:
      return '';
  }
}

function getStatusLabel(status: SpendingStatus, isFrench: boolean) {
  if (status === 'over') return isFrench ? 'Dépassement' : 'Over budget';
  if (status === 'warning') return isFrench ? 'Surveillance' : 'Watch closely';
  return isFrench ? 'Sain' : 'Healthy';
}

function getStatusBadgeClass(status: SpendingStatus) {
  if (status === 'over') return 'bg-red-100 text-red-700';
  if (status === 'warning') return 'bg-amber-100 text-amber-700';
  return 'bg-emerald-100 text-emerald-700';
}

function getVarianceClass(variance: number) {
  if (variance < 0) return 'text-red-600 dark:text-red-400';
  if (variance === 0) return 'text-muted-foreground';
  return 'text-emerald-600 dark:text-emerald-400';
}

export default function CategoriesPage() {
  const { user, userProfile } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const isFrench = userProfile?.locale === 'fr-CM';
  const displayCurrency = userProfile?.displayCurrency || 'USD';
  const displayLocale = userProfile?.locale || 'en-US';

  const [budgetValues, setBudgetValues] = useState<Record<string, number>>({});
  const [hasChanges, setHasChanges] = useState(false);
  const [globalBudgetInput, setGlobalBudgetInput] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryDocument | null>(null);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryType, setNewCategoryType] = useState<'income' | 'expense'>('expense');
  const [newCategoryBudget, setNewCategoryBudget] = useState('');

  const categoriesQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, `users/${user.uid}/categories`));
  }, [firestore, user]);
  const { data: categories, isLoading } = useCollection<CategoryDocument>(categoriesQuery);

  useEffect(() => {
    if (!categories) return;
    setBudgetValues(prev => {
      const next: Record<string, number> = {};
      categories.forEach(cat => {
        const existing = prev[cat.id];
        next[cat.id] = typeof existing === 'number' ? existing : (cat.budgetedAmount || 0);
      });
      return next;
    });
  }, [categories]);

  useEffect(() => {
    if (userProfile && typeof userProfile.monthlyExpenseBudget === 'number') {
      setGlobalBudgetInput(userProfile.monthlyExpenseBudget.toString());
    }
  }, [userProfile?.monthlyExpenseBudget]);

  const monthRange = useMemo(() => {
    const now = new Date();
    return {
      start: format(startOfMonth(now), 'yyyy-MM-dd'),
      end: format(endOfMonth(now), 'yyyy-MM-dd'),
    };
  }, []);

  const currentMonthLabel = useMemo(() => {
    return new Intl.DateTimeFormat(displayLocale, {
      month: 'long',
      year: 'numeric',
    }).format(new Date());
  }, [displayLocale]);

  const expensesQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(
      collection(firestore, `users/${user.uid}/expenses`),
      where('type', '==', 'expense'),
      where('date', '>=', monthRange.start),
      where('date', '<=', monthRange.end),
      orderBy('date')
    );
  }, [firestore, user, monthRange.start, monthRange.end]);
  const { data: expenseDocs, isLoading: isExpensesLoading } = useCollection<Transaction>(expensesQuery);
  const expenses = expenseDocs ?? [];

  const globalBudget = useMemo(() => {
    const normalized = globalBudgetInput.replace(',', '.');
    const parsed = parseFloat(normalized);
    return Number.isFinite(parsed) ? parsed : 0;
  }, [globalBudgetInput]);

  const expenseCategories = useMemo(
    () => categories?.filter(cat => cat.type === 'expense') ?? [],
    [categories]
  );
  const incomeCategories = useMemo(
    () => categories?.filter(cat => cat.type === 'income') ?? [],
    [categories]
  );

  const spendingByCategory = useMemo(() => {
    const byId = new Map<string, number>();
    const byName = new Map<string, number>();
    expenses.forEach(tx => {
      const amount = (tx.amountInCents || 0) / 100;
      if (!Number.isFinite(amount)) return;
      if (tx.categoryId) {
        byId.set(tx.categoryId, (byId.get(tx.categoryId) ?? 0) + amount);
      }
      if (tx.category) {
        byName.set(tx.category, (byName.get(tx.category) ?? 0) + amount);
      }
    });
    return { byId, byName };
  }, [expenses]);

  const expenseRows = useMemo(() => {
    return expenseCategories.map(category => {
      const budget = budgetValues[category.id] ?? category.budgetedAmount ?? 0;
      const spent =
        spendingByCategory.byId.get(category.id) ??
        spendingByCategory.byName.get(category.name) ??
        0;
      const variance = budget - spent;
      const utilization =
        budget > 0 ? spent / budget : spent > 0 ? Number.POSITIVE_INFINITY : 0;

      let status: SpendingStatus = 'healthy';
      if (variance < 0 || utilization >= 1) {
        status = 'over';
      } else if (utilization >= 0.85) {
        status = 'warning';
      }

      return {
        category,
        budget,
        spent,
        variance,
        utilization: Number.isFinite(utilization) ? utilization : 1.5,
        status,
      };
    });
  }, [expenseCategories, budgetValues, spendingByCategory]);

  const totalAllocated = useMemo(() => {
    return expenseCategories.reduce((acc, category) => {
      const value = budgetValues[category.id] ?? category.budgetedAmount ?? 0;
      return acc + value;
    }, 0);
  }, [expenseCategories, budgetValues]);

  const totalSpent = useMemo(() => {
    return expenseRows.reduce((acc, row) => acc + row.spent, 0);
  }, [expenseRows]);

  const remainingToAllocate = globalBudget - totalAllocated;
  const remainingBudget = globalBudget - totalSpent;

  const isLoadingData = isLoading || isExpensesLoading;

  const handleBudgetChange = (categoryId: string, value: string) => {
    const parsed = parseFloat(value);
    setBudgetValues(prev => ({
      ...prev,
      [categoryId]: Number.isFinite(parsed) ? parsed : 0,
    }));
    if (!hasChanges) setHasChanges(true);
  };

  const handleGlobalBudgetChange = (value: string) => {
    setGlobalBudgetInput(value);
    if (!hasChanges) setHasChanges(true);
  };

  const handleSaveAllBudgets = async () => {
    if (!user || !firestore || !categories) return;

    // 1. Sauvegarder les budgets individuels des catégories (ancien système)
    categories.forEach(category => {
      const currentBudget = budgetValues[category.id];
      if (
        typeof currentBudget === 'number' &&
        currentBudget >= 0 &&
        currentBudget !== category.budgetedAmount
      ) {
        const categoryRef = doc(firestore, `users/${user.uid}/categories`, category.id);
        updateDocumentNonBlocking(categoryRef, { budgetedAmount: currentBudget });
      }
    });

    // 2. Sauvegarder le budget global dans le profil (ancien système)
    if (Number.isFinite(globalBudget)) {
      const profileRef = doc(firestore, `users/${user.uid}`);
      setDocumentNonBlocking(
        profileRef,
        { monthlyExpenseBudget: globalBudget },
        { merge: true }
      );
    }

    // 3. NOUVEAU : Créer un plan budgétaire mensuel pour le mois en cours
    const currentPeriod = formatBudgetPeriod(new Date());
    const categoryAllocations: CategoryBudgetAllocation[] = expenseCategories.map(cat => ({
      categoryId: cat.id,
      categoryName: cat.name,
      allocatedAmount: budgetValues[cat.id] ?? cat.budgetedAmount ?? 0,
    }));

    const monthlyBudgetPlan: Omit<MonthlyBudgetPlan, 'id'> = {
      userId: user.uid,
      period: currentPeriod,
      totalBudget: globalBudget,
      categoryAllocations,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Sauvegarder le plan mensuel avec l'ID de période comme clé du document
    const monthlyBudgetRef = doc(firestore, `users/${user.uid}/monthlyBudgets/${currentPeriod}`);
    setDocumentNonBlocking(monthlyBudgetRef, monthlyBudgetPlan);

    toast({
      title: isFrench ? 'Budgets sauvegardés' : 'Budgets saved',
      description: isFrench
        ? 'Vos paramètres budgétaires ont été mis à jour pour ce mois.'
        : 'Your budgeting preferences have been updated for this month.',
    });
    setHasChanges(false);
  };

  const handleAddCategory = () => {
    if (!user || !firestore || !newCategoryName.trim()) {
      toast({
        variant: 'destructive',
        title: isFrench ? 'Erreur' : 'Error',
        description: isFrench
          ? 'Le nom de la catégorie est requis.'
          : 'Category name is required.',
      });
      return;
    }

    const categoriesCollection = collection(firestore, `users/${user.uid}/categories`);
    const newCategory: Omit<CategoryDocument, 'id'> = {
      userId: user.uid,
      name: newCategoryName.trim(),
      type: newCategoryType,
      budgetedAmount: parseFloat(newCategoryBudget) || 0,
      isCustom: true,
    };

    addDocumentNonBlocking(categoriesCollection, newCategory);

    toast({
      title: isFrench ? 'Catégorie ajoutée' : 'Category added',
      description: isFrench
        ? `La catégorie "${newCategoryName}" a été créée.`
        : `Category "${newCategoryName}" has been created.`,
    });

    setNewCategoryName('');
    setNewCategoryType('expense');
    setNewCategoryBudget('');
    setIsAddDialogOpen(false);
  };

  const handleEditCategory = (category: CategoryDocument) => {
    setEditingCategory(category);
    setNewCategoryName(category.name);
    setNewCategoryType(category.type);
    setNewCategoryBudget((category.budgetedAmount ?? 0).toString());
  };

  const handleUpdateCategory = () => {
    if (!user || !firestore || !editingCategory || !newCategoryName.trim()) return;

    const categoryRef = doc(firestore, `users/${user.uid}/categories`, editingCategory.id);
    const updatedBudget = parseFloat(newCategoryBudget) || 0;
    updateDocumentNonBlocking(categoryRef, {
      name: newCategoryName.trim(),
      type: newCategoryType,
      budgetedAmount: updatedBudget,
    });

    toast({
      title: isFrench ? 'Catégorie mise à jour' : 'Category updated',
      description: isFrench
        ? 'La catégorie a été modifiée.'
        : 'Category has been updated.',
    });

    setBudgetValues(prev => ({
      ...prev,
      [editingCategory.id]: updatedBudget,
    }));
    setEditingCategory(null);
    setNewCategoryName('');
    setNewCategoryBudget('');
    setHasChanges(true);
  };

  const handleDeleteCategory = (categoryId: string, categoryName: string) => {
    if (!user || !firestore) return;

    const confirmed = window.confirm(
      isFrench
        ? `Supprimer la catégorie "${categoryName}" ?`
        : `Delete category "${categoryName}"?`
    );
    if (!confirmed) return;

    const categoryRef = doc(firestore, `users/${user.uid}/categories`, categoryId);
    deleteDocumentNonBlocking(categoryRef);

    toast({
      title: isFrench ? 'Catégorie supprimée' : 'Category deleted',
      description: isFrench
        ? `La catégorie "${categoryName}" a été supprimée.`
        : `Category "${categoryName}" has been removed.`,
    });
  };

  const handleSeedDefaults = async () => {
    if (!user || !firestore) return;
    if (categories && categories.length > 0) {
      toast({
        title: isFrench ? 'Catégories déjà présentes' : 'Categories already exist',
        description: isFrench
          ? 'Les catégories par défaut ne sont ajoutées que si la liste est vide.'
          : 'Default categories are only added when the list is empty.',
      });
      return;
    }
    try {
      const defaults = createDefaultCategories(user.uid);
      const categoriesCollection = collection(firestore, `users/${user.uid}/categories`);
      await Promise.all(defaults.map(cat => addDocumentNonBlocking(categoriesCollection, cat)));
      toast({
        title: isFrench ? 'Catégories créées' : 'Categories created',
        description: isFrench
          ? 'Les catégories par défaut ont été ajoutées.'
          : 'Default categories have been added.',
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: isFrench ? 'Erreur' : 'Error',
        description: isFrench
          ? 'Impossible de créer les catégories par défaut.'
          : 'Failed to create default categories.',
      });
    }
  };

  const handleApplyAutoDistribution = () => {
    if (!expenseCategories.length) {
      toast({
        variant: 'destructive',
        title: isFrench ? 'Aucune catégorie' : 'No categories',
        description: isFrench
          ? 'Ajoutez des catégories de dépenses avant de proposer une répartition.'
          : 'Add expense categories before suggesting a distribution.',
      });
      return;
    }
    if (globalBudget <= 0) {
      toast({
        variant: 'destructive',
        title: isFrench ? 'Budget requis' : 'Budget required',
        description: isFrench
          ? 'Saisissez un budget global avant de lancer la répartition automatique.'
          : 'Enter a global budget before running the automatic distribution.',
      });
      return;
    }

    const weights = expenseCategories.map(category => {
      return DEFAULT_EXPENSE_WEIGHTS[category.name] ?? CUSTOM_CATEGORY_WEIGHT;
    });
    const totalWeight = weights.reduce((acc, weight) => acc + weight, 0) || 1;

    setBudgetValues(prev => {
      const next = { ...prev };
      expenseCategories.forEach((category, index) => {
        const weight = weights[index];
        const allocation = (globalBudget * weight) / totalWeight;
        next[category.id] = parseFloat(allocation.toFixed(2));
      });
      return next;
    });

    toast({
      title: isFrench ? 'Répartition appliquée' : 'Distribution applied',
      description: isFrench
        ? 'Les montants ont été répartis automatiquement. Ajustez-les si nécessaire.'
        : 'Budgets were auto-distributed. Adjust them if needed.',
    });
    setHasChanges(true);
  };

  const translations = {
    title: isFrench ? 'Budgets & Catégories' : 'Budgets & Categories',
    description: isFrench
      ? 'Définissez votre budget mensuel, répartissez-le par catégorie et suivez vos dépenses en temps réel.'
      : 'Set your monthly budget, allocate it per category, and monitor spending in real time.',
    globalBudgetTitle: isFrench ? 'Budget mensuel global' : 'Monthly global budget',
    globalBudgetHelper: isFrench
      ? 'Montant prévu pour les dépenses de ce mois.'
      : 'Planned spending for this month.',
    totalAllocatedTitle: isFrench ? 'Montant alloué' : 'Allocated amount',
    toAllocateLabel: isFrench ? 'Reste à répartir' : 'Still to allocate',
    totalSpentTitle: isFrench ? 'Dépensé ce mois' : 'Spent this month',
    remainingBudgetTitle: isFrench ? 'Solde disponible' : 'Available balance',
    expensesTitle: isFrench ? 'Catégories de dépenses' : 'Expense categories',
    expensesDescription: isFrench
      ? `Analyse sur ${currentMonthLabel}. Les dépenses dépassant le budget sont signalées.`
      : `Analysis for ${currentMonthLabel}. Overspending is highlighted automatically.`,
    incomeTitle: isFrench ? 'Catégories de revenus' : 'Income categories',
    incomeDescription: isFrench
      ? 'Suivez vos sources de revenus planifiées.'
      : 'Track your planned income sources.',
    tableCategory: isFrench ? 'Catégorie' : 'Category',
    tableBudget: isFrench ? 'Budget' : 'Budgeted',
    tableSpent: isFrench ? 'Dépensé' : 'Spent',
    tableVariance: isFrench ? 'Solde' : 'Variance',
    tableStatus: isFrench ? 'Statut' : 'Status',
    tableActions: isFrench ? 'Actions' : 'Actions',
    addCategory: isFrench ? 'Ajouter une catégorie' : 'Add category',
    editCategoryTitle: isFrench ? 'Modifier la catégorie' : 'Edit category',
    addCategoryTitle: isFrench ? 'Nouvelle catégorie' : 'New category',
    categoryName: isFrench ? 'Nom de la catégorie' : 'Category name',
    categoryType: isFrench ? 'Type de catégorie' : 'Category type',
    defaultBudget: isFrench ? 'Budget par défaut' : 'Default budget',
    expense: isFrench ? 'Dépense' : 'Expense',
    income: isFrench ? 'Revenu' : 'Income',
    cancel: isFrench ? 'Annuler' : 'Cancel',
    save: isFrench ? 'Enregistrer' : 'Save',
    saveBudgets: isFrench ? 'Sauvegarder' : 'Save changes',
    autoDistribute: isFrench ? 'Proposer une répartition' : 'Suggest distribution',
    seedDefaults: isFrench ? 'Catégories par défaut' : 'Default categories',
    noExpenseCategories: isFrench
      ? 'Aucune catégorie de dépenses. Ajoutez-en ou utilisez les catégories par défaut.'
      : 'No expense categories yet. Add one or seed the defaults.',
    noIncomeCategories: isFrench
      ? 'Aucune catégorie de revenus.'
      : 'No income categories yet.',
    custom: isFrench ? 'Personnalisée' : 'Custom',
  };

  return (
    <AppLayout>
      <div className="grid gap-6">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center justify-between text-sm font-medium">
                {translations.globalBudgetTitle}
                <Wallet className="h-4 w-4 text-muted-foreground" />
              </CardTitle>
              <CardDescription>{translations.globalBudgetHelper}</CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <Input
                type="number"
                value={globalBudgetInput}
                placeholder="0.00"
                onChange={e => handleGlobalBudgetChange(e.target.value)}
                className="text-2xl font-bold border-none shadow-none focus-visible:ring-0 p-0 h-auto"
              />
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center justify-between text-sm font-medium">
                {translations.totalAllocatedTitle}
                <PiggyBank className="h-4 w-4 text-muted-foreground" />
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 space-y-2">
              <div className="text-2xl font-bold">
                {formatMoney(totalAllocated, displayCurrency, displayLocale)}
              </div>
              <div className="text-xs text-muted-foreground">
                {translations.toAllocateLabel}:{' '}
                <span
                  className={cn(
                    'font-medium',
                    remainingToAllocate < 0
                      ? 'text-red-600 dark:text-red-400'
                      : 'text-emerald-600 dark:text-emerald-400'
                  )}
                >
                  {formatMoney(remainingToAllocate, displayCurrency, displayLocale)}
                </span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center justify-between text-sm font-medium">
                {translations.totalSpentTitle}
                <Scale className="h-4 w-4 text-muted-foreground" />
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-2xl font-bold">
                {formatMoney(totalSpent, displayCurrency, displayLocale)}
              </div>
              <div className="text-xs text-muted-foreground">
                {currentMonthLabel}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center justify-between text-sm font-medium">
                {translations.remainingBudgetTitle}
                <Scale className="h-4 w-4 rotate-90 text-muted-foreground" />
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div
                className={cn(
                  'text-2xl font-bold',
                  remainingBudget < 0
                    ? 'text-red-600 dark:text-red-400'
                    : 'text-emerald-600 dark:text-emerald-400'
                )}
              >
                {formatMoney(remainingBudget, displayCurrency, displayLocale)}
              </div>
              <div className="text-xs text-muted-foreground">
                {remainingBudget < 0
                  ? isFrench
                    ? 'Dépassement constaté'
                    : 'Budget exceeded'
                  : isFrench
                    ? 'Vous êtes dans le vert'
                    : 'You are on track'}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <CardTitle className="font-headline">{translations.expensesTitle}</CardTitle>
              <CardDescription>{translations.expensesDescription}</CardDescription>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                size="sm"
                variant="secondary"
                className="h-8 gap-1"
                onClick={handleApplyAutoDistribution}
                disabled={isLoadingData}
              >
                <Sparkles className="h-3.5 w-3.5" />
                {translations.autoDistribute}
              </Button>
              {!isLoading && (categories?.length ?? 0) === 0 && (
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8"
                  onClick={handleSeedDefaults}
                >
                  {translations.seedDefaults}
                </Button>
              )}
              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" variant="outline" className="h-8 gap-1">
                    <Plus className="h-3.5 w-3.5" />
                    {translations.addCategory}
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{translations.addCategoryTitle}</DialogTitle>
                    <DialogDescription>
                      {isFrench
                        ? 'Définissez un nom, un type et un budget initial (facultatif).'
                        : 'Set a name, type, and optional initial budget.'}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="new-category-name">{translations.categoryName}</Label>
                      <Input
                        id="new-category-name"
                        value={newCategoryName}
                        onChange={e => setNewCategoryName(e.target.value)}
                        placeholder={isFrench ? 'ex: Marketing' : 'e.g. Marketing'}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="new-category-type">{translations.categoryType}</Label>
                      <Select
                        value={newCategoryType}
                        onValueChange={value => setNewCategoryType(value as 'income' | 'expense')}
                      >
                        <SelectTrigger id="new-category-type">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="expense">{translations.expense}</SelectItem>
                          <SelectItem value="income">{translations.income}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="new-category-budget">{translations.defaultBudget}</Label>
                      <Input
                        id="new-category-budget"
                        type="number"
                        value={newCategoryBudget}
                        onChange={e => setNewCategoryBudget(e.target.value)}
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                      {translations.cancel}
                    </Button>
                    <Button onClick={handleAddCategory}>{translations.save}</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              <Button
                size="sm"
                className="h-8"
                onClick={handleSaveAllBudgets}
                disabled={!hasChanges}
              >
                {translations.saveBudgets}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {isLoadingData ? (
              <div className="space-y-3">
                {Array.from({ length: 6 }).map((_, index) => (
                  <Skeleton key={index} className="h-12 w-full" />
                ))}
              </div>
            ) : expenseCategories.length === 0 ? (
              <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
                {translations.noExpenseCategories}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{translations.tableCategory}</TableHead>
                    <TableHead className="text-right">{translations.tableBudget}</TableHead>
                    <TableHead className="text-right">{translations.tableSpent}</TableHead>
                    <TableHead className="text-right">{translations.tableVariance}</TableHead>
                    <TableHead>{translations.tableStatus}</TableHead>
                    <TableHead className="text-right">{translations.tableActions}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {expenseRows.map(row => (
                    <TableRow
                      key={row.category.id}
                      className={cn('transition-colors', getRowClass(row.status))}
                    >
                      <TableCell className="align-middle">
                        <div className="flex flex-col gap-1">
                          <span className="font-medium">{row.category.name}</span>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Badge
                              variant="secondary"
                              className={cn(
                                'px-2 py-0.5',
                                row.category.isCustom ? 'bg-primary/10 text-primary' : 'bg-muted'
                              )}
                            >
                              {row.category.isCustom ? translations.custom : 'Default'}
                            </Badge>
                            <span>
                              {formatMoney(
                                row.spent,
                                displayCurrency,
                                displayLocale
                              )}{' '}
                              /{' '}
                              {formatMoney(
                                row.budget,
                                displayCurrency,
                                displayLocale
                              )}
                            </span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Input
                          type="number"
                          value={
                            Number.isFinite(budgetValues[row.category.id])
                              ? budgetValues[row.category.id]
                              : row.category.budgetedAmount ?? 0
                          }
                          onChange={e => handleBudgetChange(row.category.id, e.target.value)}
                          className="h-9 w-28 text-right"
                        />
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatMoney(row.spent, displayCurrency, displayLocale)}
                      </TableCell>
                      <TableCell
                        className={cn(
                          'text-right font-semibold',
                          getVarianceClass(row.variance)
                        )}
                      >
                        {formatMoney(row.variance, displayCurrency, displayLocale)}
                      </TableCell>
                      <TableCell className="space-y-2">
                        <Progress
                          value={Math.min(row.utilization * 100, 150)}
                          aria-label={getStatusLabel(row.status, isFrench)}
                          className={cn(
                            row.status === 'over'
                              ? 'bg-red-200'
                              : row.status === 'warning'
                                ? 'bg-amber-200'
                                : 'bg-emerald-200'
                          )}
                        />
                        <Badge
                          variant="secondary"
                          className={cn('px-2 py-0.5 text-xs', getStatusBadgeClass(row.status))}
                        >
                          {getStatusLabel(row.status, isFrench)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleEditCategory(row.category)}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-red-500 hover:text-red-600"
                            onClick={() =>
                              handleDeleteCategory(row.category.id, row.category.name)
                            }
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-headline">{translations.incomeTitle}</CardTitle>
            <CardDescription>{translations.incomeDescription}</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, index) => (
                  <Skeleton key={index} className="h-10 w-full" />
                ))}
              </div>
            ) : incomeCategories.length === 0 ? (
              <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                {translations.noIncomeCategories}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{translations.tableCategory}</TableHead>
                    <TableHead className="text-right">{translations.tableBudget}</TableHead>
                    <TableHead className="text-right">{translations.tableActions}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {incomeCategories.map(category => (
                    <TableRow key={category.id}>
                      <TableCell className="font-medium">{category.name}</TableCell>
                      <TableCell className="text-right">
                        <Input
                          type="number"
                          value={
                            Number.isFinite(budgetValues[category.id])
                              ? budgetValues[category.id]
                              : category.budgetedAmount ?? 0
                          }
                          onChange={e => handleBudgetChange(category.id, e.target.value)}
                          className="h-9 w-28 text-right"
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleEditCategory(category)}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-red-500 hover:text-red-600"
                            onClick={() => handleDeleteCategory(category.id, category.name)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog
        open={editingCategory !== null}
        onOpenChange={open => {
          if (!open) {
            setEditingCategory(null);
            setNewCategoryName('');
            setNewCategoryBudget('');
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{translations.editCategoryTitle}</DialogTitle>
            <DialogDescription>
              {isFrench
                ? 'Modifiez le nom, le type ou le budget de cette catégorie.'
                : 'Update the name, type or budget for this category.'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-category-name">{translations.categoryName}</Label>
              <Input
                id="edit-category-name"
                value={newCategoryName}
                onChange={e => setNewCategoryName(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-category-type">{translations.categoryType}</Label>
              <Select
                value={newCategoryType}
                onValueChange={value => setNewCategoryType(value as 'income' | 'expense')}
              >
                <SelectTrigger id="edit-category-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="expense">{translations.expense}</SelectItem>
                  <SelectItem value="income">{translations.income}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-category-budget">{translations.defaultBudget}</Label>
              <Input
                id="edit-category-budget"
                type="number"
                value={newCategoryBudget}
                onChange={e => setNewCategoryBudget(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingCategory(null)}>
              {translations.cancel}
            </Button>
            <Button onClick={handleUpdateCategory}>{translations.save}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
