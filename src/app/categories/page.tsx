'use client';
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
import { Wallet, PiggyBank, Scale, Plus, Edit2, Trash2 } from 'lucide-react';
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
import { collection, query, doc } from 'firebase/firestore';
import { useState, useEffect, useMemo } from 'react';
import type { CategoryDocument } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { createDefaultCategories } from '@/lib/default-categories';
import { Badge } from '@/components/ui/badge';

function formatMoney(amount: number, currency: string = 'USD', locale: string = 'en-US') {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
  }).format(amount || 0);
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
  const [globalBudget, setGlobalBudget] = useState(0);
  
  // Dialog states for adding/editing categories
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
  
  // Initialize default categories if none exist
  useEffect(() => {
    if (user && firestore && categories && categories.length === 0 && !isLoading) {
      const defaultCategories = createDefaultCategories(user.uid);
      const categoriesCollection = collection(firestore, `users/${user.uid}/categories`);
      defaultCategories.forEach(cat => {
        addDocumentNonBlocking(categoriesCollection, cat);
      });
    }
  }, [user, firestore, categories, isLoading]);
  
  // Effect to initialize budgetValues from Firestore data
  useEffect(() => {
    if (categories) {
        const initialBudgets: Record<string, number> = {};
        categories.forEach(cat => {
            initialBudgets[cat.id] = cat.budgetedAmount || 0;
        });
        setBudgetValues(initialBudgets);
    }
  }, [categories]);


  const handleBudgetChange = (categoryId: string, value: string) => {
    const amount = parseFloat(value) || 0;
    setBudgetValues(prev => ({ ...prev, [categoryId]: amount }));
    if (!hasChanges) setHasChanges(true);
  };
  
  const handleSaveAllBudgets = () => {
    if (!user || !firestore || !categories) return;

    categories.forEach(category => {
      const newBudget = budgetValues[category.id];
      if (newBudget !== undefined && category.budgetedAmount !== newBudget) {
        const categoryRef = doc(firestore, `users/${user.uid}/categories`, category.id);
        updateDocumentNonBlocking(categoryRef, { budgetedAmount: newBudget });
      }
    });

    toast({ title: translations.budgetsSaved, description: translations.budgetsSavedDesc });
    setHasChanges(false);
  };

  const handleAddCategory = () => {
    if (!user || !firestore || !newCategoryName.trim()) {
      toast({
        variant: 'destructive',
        title: isFrench ? 'Erreur' : 'Error',
        description: isFrench ? 'Le nom de la catégorie est requis.' : 'Category name is required.',
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
      title: isFrench ? 'Catégorie ajoutée' : 'Category Added',
      description: isFrench ? `La catégorie "${newCategoryName}" a été créée.` : `Category "${newCategoryName}" has been created.`,
    });

    // Reset form
    setNewCategoryName('');
    setNewCategoryType('expense');
    setNewCategoryBudget('');
    setIsAddDialogOpen(false);
  };

  const handleEditCategory = (category: CategoryDocument) => {
    setEditingCategory(category);
    setNewCategoryName(category.name);
    setNewCategoryType(category.type);
    setNewCategoryBudget(category.budgetedAmount.toString());
  };

  const handleUpdateCategory = () => {
    if (!user || !firestore || !editingCategory || !newCategoryName.trim()) return;

    const categoryRef = doc(firestore, `users/${user.uid}/categories`, editingCategory.id);
    updateDocumentNonBlocking(categoryRef, {
      name: newCategoryName.trim(),
      type: newCategoryType,
      budgetedAmount: parseFloat(newCategoryBudget) || 0,
    });

    toast({
      title: isFrench ? 'Catégorie mise à jour' : 'Category Updated',
      description: isFrench ? `La catégorie a été modifiée.` : `Category has been updated.`,
    });

    // Reset form
    setEditingCategory(null);
    setNewCategoryName('');
    setNewCategoryType('expense');
    setNewCategoryBudget('');
  };

  const handleDeleteCategory = (categoryId: string, categoryName: string) => {
    if (!user || !firestore) return;
    
    if (!confirm(isFrench ? `Supprimer la catégorie "${categoryName}" ?` : `Delete category "${categoryName}"?`)) {
      return;
    }

    const categoryRef = doc(firestore, `users/${user.uid}/categories`, categoryId);
    deleteDocumentNonBlocking(categoryRef);

    toast({
      title: isFrench ? 'Catégorie supprimée' : 'Category Deleted',
      description: isFrench ? `La catégorie "${categoryName}" a été supprimée.` : `Category "${categoryName}" has been deleted.`,
    });
  };

  const expenseCategories = useMemo(() => {
    return categories?.filter(c => c.type === 'expense') || [];
  }, [categories]);

  const incomeCategories = useMemo(() => {
    return categories?.filter(c => c.type === 'income') || [];
  }, [categories]);

  const totalAllocated = useMemo(() => {
    if (!categories) return 0;
    return categories
      .filter(c => c.type === 'expense')
      .reduce((acc, cat) => acc + (budgetValues[cat.id] || cat.budgetedAmount || 0), 0);
  }, [budgetValues, categories]);

  const remainingToAllocate = globalBudget - totalAllocated;

  
  const translations = {
      title: isFrench ? 'Budgets Mensuels par Catégorie' : 'Monthly Category Budgets',
      description: isFrench ? 'Gérez vos catégories et définissez les budgets mensuels par défaut.' : 'Manage your categories and set default monthly budgets.',
      budgetsSaved: isFrench ? 'Budgets sauvegardés' : 'Budgets Saved',
      budgetsSavedDesc: isFrench ? 'Vos allocations budgétaires ont été mises à jour.' : 'Your budget allocations have been updated.',
      saveBudgets: isFrench ? 'Enregistrer les budgets' : 'Save Budgets',
      addCategory: isFrench ? 'Ajouter Catégorie' : 'Add Category',
      categoryNameHeader: isFrench ? 'Nom de la catégorie' : 'Category Name',
      typeHeader: isFrench ? 'Type' : 'Type',
      budgetedAmountHeader: isFrench ? 'Montant Budgété' : 'Budgeted Amount',
      actionsHeader: 'Actions',
      loading: isFrench ? 'Chargement des catégories...' : 'Loading categories...',
      globalBudgetTitle: isFrench ? 'Budget Mensuel Global (Dépenses)' : 'Global Monthly Budget (Expenses)',
      totalAllocatedTitle: isFrench ? 'Total Alloué (Dépenses)' : 'Total Allocated (Expenses)',
      remainingTitle: isFrench ? 'Restant à Allouer' : 'Remaining to Allocate',
      expenseCategories: isFrench ? 'Catégories de Dépenses' : 'Expense Categories',
      incomeCategories: isFrench ? 'Catégories de Revenus' : 'Income Categories',
      expense: isFrench ? 'Dépense' : 'Expense',
      income: isFrench ? 'Revenu' : 'Income',
      edit: isFrench ? 'Modifier' : 'Edit',
      delete: isFrench ? 'Supprimer' : 'Delete',
      addCategoryTitle: isFrench ? 'Ajouter une catégorie' : 'Add a category',
      editCategoryTitle: isFrench ? 'Modifier la catégorie' : 'Edit category',
      categoryName: isFrench ? 'Nom de la catégorie' : 'Category name',
      categoryType: isFrench ? 'Type de catégorie' : 'Category type',
      defaultBudget: isFrench ? 'Budget par défaut' : 'Default budget',
      cancel: isFrench ? 'Annuler' : 'Cancel',
      save: isFrench ? 'Enregistrer' : 'Save',
      custom: isFrench ? 'Personnalisée' : 'Custom',
  };

  return (
    <AppLayout>
      <div className="grid gap-6">
        <div className="grid md:grid-cols-3 gap-4">
            <Card>
                <CardHeader className='flex-row items-center justify-between pb-2'>
                    <CardTitle className="text-sm font-medium">{translations.globalBudgetTitle}</CardTitle>
                    <Wallet className="h-4 w-4 text-muted-foreground"/>
                </CardHeader>
                <CardContent>
                    <Input 
                        type="number"
                        placeholder={formatMoney(0, displayCurrency, displayLocale)}
                        className="text-2xl font-bold border-none shadow-none focus-visible:ring-0 p-0 h-auto"
                        value={globalBudget || ''}
                        onChange={e => setGlobalBudget(parseFloat(e.target.value) || 0)}
                    />
                </CardContent>
            </Card>
             <Card>
                <CardHeader className='flex-row items-center justify-between pb-2'>
                    <CardTitle className="text-sm font-medium">{translations.totalAllocatedTitle}</CardTitle>
                    <PiggyBank className="h-4 w-4 text-muted-foreground"/>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{formatMoney(totalAllocated, displayCurrency, displayLocale)}</div>
                </CardContent>
            </Card>
             <Card>
                <CardHeader className='flex-row items-center justify-between pb-2'>
                    <CardTitle className="text-sm font-medium">{translations.remainingTitle}</CardTitle>
                    <Scale className="h-4 w-4 text-muted-foreground"/>
                </CardHeader>
                <CardContent>
                    <div className={`text-2xl font-bold ${remainingToAllocate < 0 ? 'text-destructive' : ''}`}>
                      {formatMoney(remainingToAllocate, displayCurrency, displayLocale)}
                    </div>
                </CardContent>
            </Card>
        </div>

        {/* Expense Categories */}
        <Card>
          <CardHeader className="flex flex-row items-center">
            <div className="grid gap-2">
              <CardTitle className="font-headline">{translations.expenseCategories}</CardTitle>
              <CardDescription>{translations.description}</CardDescription>
            </div>
            <div className="ml-auto flex gap-2">
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
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid gap-2">
                        <Label htmlFor="name">{translations.categoryName}</Label>
                        <Input
                          id="name"
                          value={newCategoryName}
                          onChange={(e) => setNewCategoryName(e.target.value)}
                          placeholder={isFrench ? "ex: Loisirs" : "e.g. Hobbies"}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="type">{translations.categoryType}</Label>
                        <Select value={newCategoryType} onValueChange={(v) => setNewCategoryType(v as 'income' | 'expense')}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="expense">{translations.expense}</SelectItem>
                            <SelectItem value="income">{translations.income}</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="budget">{translations.defaultBudget}</Label>
                        <Input
                          id="budget"
                          type="number"
                          value={newCategoryBudget}
                          onChange={(e) => setNewCategoryBudget(e.target.value)}
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
                <Button size="sm" className="h-8 gap-1" onClick={handleSaveAllBudgets} disabled={!hasChanges}>
                    {translations.saveBudgets}
                </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{translations.categoryNameHeader}</TableHead>
                  <TableHead className="text-right">{translations.budgetedAmountHeader}</TableHead>
                  <TableHead className="text-right">{translations.actionsHeader}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                        <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                        <TableCell className="text-right"><Skeleton className="h-5 w-32 inline-block" /></TableCell>
                        <TableCell className="text-right"><Skeleton className="h-5 w-16 inline-block" /></TableCell>
                    </TableRow>
                  ))
                ) : (
                  expenseCategories.map(category => (
                    <TableRow key={category.id}>
                      <TableCell className="font-medium">
                        {category.name}
                        {category.isCustom && (
                          <Badge variant="secondary" className="ml-2 text-xs">
                            {translations.custom}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Input
                          type="number"
                          value={budgetValues[category.id] ?? category.budgetedAmount ?? ''}
                          onChange={(e) => handleBudgetChange(category.id, e.target.value)}
                          className="text-right"
                          placeholder="0.00"
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Dialog open={editingCategory?.id === category.id} onOpenChange={(open) => !open && setEditingCategory(null)}>
                            <DialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => handleEditCategory(category)}
                              >
                                <Edit2 className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>{translations.editCategoryTitle}</DialogTitle>
                              </DialogHeader>
                              <div className="grid gap-4 py-4">
                                <div className="grid gap-2">
                                  <Label htmlFor="edit-name">{translations.categoryName}</Label>
                                  <Input
                                    id="edit-name"
                                    value={newCategoryName}
                                    onChange={(e) => setNewCategoryName(e.target.value)}
                                  />
                                </div>
                                <div className="grid gap-2">
                                  <Label htmlFor="edit-type">{translations.categoryType}</Label>
                                  <Select value={newCategoryType} onValueChange={(v) => setNewCategoryType(v as 'income' | 'expense')}>
                                    <SelectTrigger>
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="expense">{translations.expense}</SelectItem>
                                      <SelectItem value="income">{translations.income}</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div className="grid gap-2">
                                  <Label htmlFor="edit-budget">{translations.defaultBudget}</Label>
                                  <Input
                                    id="edit-budget"
                                    type="number"
                                    value={newCategoryBudget}
                                    onChange={(e) => setNewCategoryBudget(e.target.value)}
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
                          {category.isCustom && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive"
                              onClick={() => handleDeleteCategory(category.id, category.name)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Income Categories */}
        <Card>
          <CardHeader>
            <CardTitle className="font-headline">{translations.incomeCategories}</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{translations.categoryNameHeader}</TableHead>
                  <TableHead className="text-right">{translations.budgetedAmountHeader}</TableHead>
                  <TableHead className="text-right">{translations.actionsHeader}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <TableRow key={i}>
                        <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                        <TableCell className="text-right"><Skeleton className="h-5 w-32 inline-block" /></TableCell>
                        <TableCell className="text-right"><Skeleton className="h-5 w-16 inline-block" /></TableCell>
                    </TableRow>
                  ))
                ) : (
                  incomeCategories.map(category => (
                    <TableRow key={category.id}>
                      <TableCell className="font-medium">
                        {category.name}
                        {category.isCustom && (
                          <Badge variant="secondary" className="ml-2 text-xs">
                            {translations.custom}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Input
                          type="number"
                          value={budgetValues[category.id] ?? category.budgetedAmount ?? ''}
                          onChange={(e) => handleBudgetChange(category.id, e.target.value)}
                          className="text-right"
                          placeholder="0.00"
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
                          {category.isCustom && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive"
                              onClick={() => handleDeleteCategory(category.id, category.name)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
