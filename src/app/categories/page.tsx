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
import { Wallet, PiggyBank, Scale } from 'lucide-react';
import {
  useCollection,
  useFirestore,
  useUser,
  updateDocumentNonBlocking,
  useMemoFirebase,
  setDocumentNonBlocking,
} from '@/firebase';
import { collection, query, doc } from 'firebase/firestore';
import { useState, useEffect, useMemo } from 'react';
import type { Budget } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';

function formatMoney(amount: number, currency: string = 'USD', locale: string = 'en-US') {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
  }).format(amount || 0);
}

// Predefined categories, assuming these are static or fetched from a global config.
const ALL_CATEGORIES = ['Housing', 'Food', 'Transport', 'Entertainment', 'Health', 'Shopping', 'Utilities'];


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

  const categoriesQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, `users/${user.uid}/categories`));
  }, [firestore, user]);

  const { data: categories, isLoading } = useCollection<Budget>(categoriesQuery);
  
  // Effect to initialize budgetValues from Firestore data
  useEffect(() => {
    if (categories) {
        const initialBudgets: Record<string, number> = {};
        // Initialize from all possible categories
        ALL_CATEGORIES.forEach(catName => {
            const existingCat = categories.find(c => c.name === catName);
            initialBudgets[catName] = existingCat?.budgetedAmount || 0;
        });
        setBudgetValues(initialBudgets);
    }
  }, [categories]);


  const handleBudgetChange = (categoryName: string, value: string) => {
    const amount = parseFloat(value) || 0;
    setBudgetValues(prev => ({ ...prev, [categoryName]: amount }));
    if (!hasChanges) setHasChanges(true);
  };
  
  const handleSaveAllBudgets = () => {
    if (!user || !firestore) return;

    const promises: Promise<any>[] = [];
    
    Object.entries(budgetValues).forEach(([categoryName, amount]) => {
      const existingCategory = categories?.find(c => c.name === categoryName);
      if (existingCategory) {
        // Update existing category budget if it changed
        if (existingCategory.budgetedAmount !== amount) {
          const categoryRef = doc(firestore, `users/${user.uid}/categories`, existingCategory.id);
          updateDocumentNonBlocking(categoryRef, { budgetedAmount: amount });
        }
      } else if (amount > 0) {
        // Create new category if it doesn't exist and has a budget
        const categoryRef = doc(collection(firestore, `users/${user.uid}/categories`));
        setDocumentNonBlocking(categoryRef, {
            name: categoryName,
            budgetedAmount: amount,
            userId: user.uid,
        }, {});
      }
    });

    toast({ title: translations.budgetsSaved, description: translations.budgetsSavedDesc });
    setHasChanges(false);
  };
  

  const totalAllocated = useMemo(() => {
      return Object.values(budgetValues).reduce((acc, amount) => acc + amount, 0);
  }, [budgetValues]);

  const remainingToAllocate = globalBudget - totalAllocated;

  
  const translations = {
      title: isFrench ? 'Budgets Mensuels par Catégorie' : 'Monthly Category Budgets',
      description: isFrench ? 'Définissez un budget global et répartissez-le dans le tableau ci-dessous.' : 'Set a global budget and allocate it in the table below.',
      budgetsSaved: isFrench ? 'Budgets sauvegardés' : 'Budgets Saved',
      budgetsSavedDesc: isFrench ? 'Vos allocations budgétaires ont été mises à jour.' : 'Your budget allocations have been updated.',
      saveBudgets: isFrench ? 'Enregistrer les budgets' : 'Save Budgets',
      categoryNameHeader: isFrench ? 'Nom de la catégorie' : 'Category Name',
      budgetedAmountHeader: isFrench ? 'Montant Budgété' : 'Budgeted Amount',
      actionsHeader: 'Actions',
      loading: isFrench ? 'Chargement des catégories...' : 'Loading categories...',
      globalBudgetTitle: isFrench ? 'Budget Mensuel Global' : 'Global Monthly Budget',
      totalAllocatedTitle: isFrench ? 'Total Alloué' : 'Total Allocated',
      remainingTitle: isFrench ? 'Restant à Allouer' : 'Remaining to Allocate',
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
        <Card>
          <CardHeader className="flex flex-row items-center">
            <div className="grid gap-2">
              <CardTitle className="font-headline">{translations.title}</CardTitle>
              <CardDescription>{translations.description}</CardDescription>
            </div>
            <div className="ml-auto gap-1">
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
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                        <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                        <TableCell className="text-right"><Skeleton className="h-5 w-32 inline-block" /></TableCell>
                    </TableRow>
                  ))
                ) : (
                  ALL_CATEGORIES.map(catName => (
                    <TableRow key={catName}>
                      <TableCell className="font-medium">{catName}</TableCell>
                      <TableCell className="text-right">
                        <Input
                          type="number"
                          value={budgetValues[catName] || ''}
                          onChange={(e) => handleBudgetChange(catName, e.target.value)}
                          className="col-span-3 text-right"
                          placeholder="0.00"
                        />
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
