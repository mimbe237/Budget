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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
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
import { MoreHorizontal, PlusCircle, Pencil, Trash2 } from 'lucide-react';
import {
  useCollection,
  useFirestore,
  useUser,
  addDocumentNonBlocking,
  updateDocumentNonBlocking,
  deleteDocumentNonBlocking,
  useMemoFirebase,
} from '@/firebase';
import { collection, query, doc } from 'firebase/firestore';
import { useState, useEffect } from 'react';
import type { Budget, UserProfile } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

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

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [currentCategory, setCurrentCategory] = useState<Budget | null>(null);
  const [categoryName, setCategoryName] = useState('');
  const [budgetedAmount, setBudgetedAmount] = useState('');
  const [categoryToDelete, setCategoryToDelete] = useState<Budget | null>(null);

  const categoriesQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, `users/${user.uid}/categories`));
  }, [firestore, user]);

  const { data: categories, isLoading } = useCollection<Budget>(categoriesQuery);
  const displayCurrency = userProfile?.displayCurrency || 'USD';
  const displayLocale = userProfile?.locale || 'en-US';

  useEffect(() => {
    if (currentCategory) {
      setCategoryName(currentCategory.name);
      setBudgetedAmount(String(currentCategory.budgetedAmount || ''));
    } else {
      setCategoryName('');
      setBudgetedAmount('');
    }
  }, [currentCategory]);

  const handleOpenDialog = (category: Budget | null = null) => {
    setCurrentCategory(category);
    setIsDialogOpen(true);
  };

  const handleSaveCategory = () => {
    if (!user || !firestore) return;
    if (!categoryName) {
      toast({
        variant: 'destructive',
        title: isFrench ? 'Nom manquant' : 'Missing Name',
        description: isFrench ? 'Veuillez fournir un nom pour la catégorie.' : 'Please provide a name for the category.',
      });
      return;
    }
    
    const amount = parseFloat(budgetedAmount) || 0;

    if (currentCategory) {
      // Update existing category
      const categoryRef = doc(firestore, `users/${user.uid}/categories`, currentCategory.id);
      updateDocumentNonBlocking(categoryRef, { name: categoryName, budgetedAmount: amount });
      toast({ title: isFrench ? 'Catégorie mise à jour' : 'Category Updated', description: `"${categoryName}" ${isFrench ? 'a été mis à jour.' : 'has been updated.'}` });
    } else {
      // Add new category
      const categoriesCollection = collection(firestore, `users/${user.uid}/categories`);
      addDocumentNonBlocking(categoriesCollection, {
        name: categoryName,
        budgetedAmount: amount,
        userId: user.uid,
      });
      toast({ title: isFrench ? 'Catégorie ajoutée' : 'Category Added', description: `"${categoryName}" ${isFrench ? 'a été créé.' : 'has been created.'}` });
    }

    setIsDialogOpen(false);
    setCurrentCategory(null);
  };

  const openDeleteConfirm = (category: Budget) => {
    setCategoryToDelete(category);
    setIsAlertOpen(true);
  };

  const handleDeleteCategory = () => {
    if (!user || !firestore || !categoryToDelete) return;
    const categoryRef = doc(firestore, `users/${user.uid}/categories`, categoryToDelete.id);
    deleteDocumentNonBlocking(categoryRef);
    toast({ title: isFrench ? 'Catégorie supprimée' : 'Category Deleted', description: `"${categoryToDelete.name}" ${isFrench ? 'a été supprimé.' : 'has been removed.'}` });
    setIsAlertOpen(false);
    setCategoryToDelete(null);
  };
  
  const translations = {
      title: isFrench ? 'Catégories & Budgets' : 'Categories & Budgets',
      description: isFrench ? 'Gérez vos catégories de dépenses et leurs budgets mensuels.' : 'Manage your expense categories and their monthly budgets.',
      addCategory: isFrench ? 'Ajouter Catégorie' : 'Add Category',
      editCategoryTitle: isFrench ? 'Modifier Catégorie' : 'Edit Category',
      addCategoryTitle: isFrench ? 'Ajouter Nouvelle Catégorie' : 'Add New Category',
      editCategoryDesc: isFrench ? 'Apportez des modifications à votre catégorie ici.' : 'Make changes to your category here.',
      addCategoryDesc: isFrench ? 'Créez une nouvelle catégorie pour vos dépenses.' : 'Create a new category for your expenses.',
      nameLabel: isFrench ? 'Nom' : 'Name',
      budgetLabel: isFrench ? 'Budget' : 'Budget',
      cancel: isFrench ? 'Annuler' : 'Cancel',
      save: isFrench ? 'Enregistrer' : 'Save changes',
      categoryNameHeader: isFrench ? 'Nom de la catégorie' : 'Category Name',
      budgetedAmountHeader: isFrench ? 'Montant Budgété' : 'Budgeted Amount',
      actionsHeader: 'Actions',
      loading: isFrench ? 'Chargement des catégories...' : 'Loading categories...',
      noCategories: isFrench ? 'Aucune catégorie trouvée.' : 'No categories found.',
      deleteConfirmTitle: isFrench ? 'Êtes-vous sûr ?' : 'Are you sure?',
      deleteConfirmDesc: isFrench ? `Cette action ne peut pas être annulée. Cela supprimera définitivement la catégorie "${categoryToDelete?.name}".` : `This action cannot be undone. This will permanently delete the category "${categoryToDelete?.name}".`,
      delete: isFrench ? 'Supprimer' : 'Delete',
      edit: isFrench ? 'Modifier' : 'Edit',
  };

  return (
    <AppLayout>
      <Card>
        <CardHeader className="flex flex-row items-center">
          <div className="grid gap-2">
            <CardTitle className="font-headline">{translations.title}</CardTitle>
            <CardDescription>{translations.description}</CardDescription>
          </div>
          <div className="ml-auto gap-1">
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="h-8 gap-1" onClick={() => handleOpenDialog()}>
                  <PlusCircle className="h-3.5 w-3.5" />
                  <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                    {translations.addCategory}
                  </span>
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>{currentCategory ? translations.editCategoryTitle : translations.addCategoryTitle}</DialogTitle>
                  <DialogDescription>
                    {currentCategory ? translations.editCategoryDesc : translations.addCategoryDesc}
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="name" className="text-right">{translations.nameLabel}</Label>
                    <Input
                      id="name"
                      value={categoryName}
                      onChange={(e) => setCategoryName(e.target.value)}
                      className="col-span-3"
                      placeholder="e.g. Groceries"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="budget" className="text-right">{translations.budgetLabel}</Label>
                    <Input
                      id="budget"
                      type="number"
                      value={budgetedAmount}
                      onChange={(e) => setBudgetedAmount(e.target.value)}
                      className="col-span-3"
                      placeholder="e.g. 500"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button variant="outline">{translations.cancel}</Button>
                  </DialogClose>
                  <Button onClick={handleSaveCategory}>{translations.save}</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{translations.categoryNameHeader}</TableHead>
                <TableHead>{translations.budgetedAmountHeader}</TableHead>
                <TableHead className="text-right">{translations.actionsHeader}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && (
                <TableRow>
                  <TableCell colSpan={3} className="text-center">
                    {translations.loading}
                  </TableCell>
                </TableRow>
              )}
              {categories && categories.length > 0 ? (
                categories.map(category => (
                  <TableRow key={category.id}>
                    <TableCell className="font-medium">{category.name}</TableCell>
                    <TableCell>{formatMoney(category.budgetedAmount, displayCurrency, displayLocale)}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleOpenDialog(category)}>
                            <Pencil className="mr-2 h-4 w-4" />
                            <span>{translations.edit}</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openDeleteConfirm(category)} className="text-destructive">
                             <Trash2 className="mr-2 h-4 w-4" />
                            <span>{translations.delete}</span>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              ) : !isLoading ? (
                <TableRow>
                  <TableCell colSpan={3} className="h-24 text-center">
                    {translations.noCategories}
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{translations.deleteConfirmTitle}</AlertDialogTitle>
            <AlertDialogDescription>{translations.deleteConfirmDesc}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{translations.cancel}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteCategory} className="bg-destructive hover:bg-destructive/90">
              {translations.delete}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
}
