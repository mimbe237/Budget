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
  AlertDialogTrigger,
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
  useMemoFirebase,
  useUser,
  addDocumentNonBlocking,
  updateDocumentNonBlocking,
  deleteDocumentNonBlocking,
} from '@/firebase';
import { collection, query, doc } from 'firebase/firestore';
import { useState, useEffect } from 'react';
import type { Budget } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

function formatMoney(amount: number, currency: string = 'USD') {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
  }).format(amount || 0);
}

export default function CategoriesPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

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
        title: 'Missing Name',
        description: 'Please provide a name for the category.',
      });
      return;
    }
    
    const amount = parseFloat(budgetedAmount) || 0;

    if (currentCategory) {
      // Update existing category
      const categoryRef = doc(firestore, `users/${user.uid}/categories`, currentCategory.id);
      updateDocumentNonBlocking(categoryRef, { name: categoryName, budgetedAmount: amount });
      toast({ title: 'Category Updated', description: `"${categoryName}" has been updated.` });
    } else {
      // Add new category
      const categoriesCollection = collection(firestore, `users/${user.uid}/categories`);
      addDocumentNonBlocking(categoriesCollection, {
        name: categoryName,
        budgetedAmount: amount,
        userId: user.uid,
      });
      toast({ title: 'Category Added', description: `"${categoryName}" has been created.` });
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
    toast({ title: 'Category Deleted', description: `"${categoryToDelete.name}" has been removed.` });
    setIsAlertOpen(false);
    setCategoryToDelete(null);
  };

  return (
    <AppLayout>
      <Card>
        <CardHeader className="flex flex-row items-center">
          <div className="grid gap-2">
            <CardTitle className="font-headline">Categories & Budgets</CardTitle>
            <CardDescription>
              Manage your expense categories and their monthly budgets.
            </CardDescription>
          </div>
          <div className="ml-auto gap-1">
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="h-8 gap-1" onClick={() => handleOpenDialog()}>
                  <PlusCircle className="h-3.5 w-3.5" />
                  <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                    Add Category
                  </span>
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>{currentCategory ? 'Edit Category' : 'Add New Category'}</DialogTitle>
                  <DialogDescription>
                    {currentCategory
                      ? "Make changes to your category here."
                      : "Create a new category for your expenses."}
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="name" className="text-right">
                      Name
                    </Label>
                    <Input
                      id="name"
                      value={categoryName}
                      onChange={(e) => setCategoryName(e.target.value)}
                      className="col-span-3"
                      placeholder="e.g. Groceries"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="budget" className="text-right">
                      Budget
                    </Label>
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
                    <Button variant="outline">Cancel</Button>
                  </DialogClose>
                  <Button onClick={handleSaveCategory}>Save changes</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Category Name</TableHead>
                <TableHead>Budgeted Amount</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && (
                <TableRow>
                  <TableCell colSpan={3} className="text-center">
                    Loading categories...
                  </TableCell>
                </TableRow>
              )}
              {categories && categories.length > 0 ? (
                categories.map(category => (
                  <TableRow key={category.id}>
                    <TableCell className="font-medium">{category.name}</TableCell>
                    <TableCell>{formatMoney(category.budgetedAmount, 'USD')}</TableCell>
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
                            <span>Edit</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openDeleteConfirm(category)} className="text-destructive">
                             <Trash2 className="mr-2 h-4 w-4" />
                            <span>Delete</span>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              ) : !isLoading ? (
                <TableRow>
                  <TableCell colSpan={3} className="h-24 text-center">
                    No categories found.
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
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the 
              category "{categoryToDelete?.name}".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteCategory} className="bg-destructive hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
}
