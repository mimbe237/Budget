'use client';

import { AppLayout } from '@/components/dashboard/dashboard-client';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { FileAttachment } from '@/components/ui/file-attachment';
import { useUser, useFirestore, addDocumentNonBlocking, useMemoFirebase, useCollection } from '@/firebase';
import { addGoalTransaction } from '@/firebase/firestore/use-goal-transactions';
import { collection, doc, query, where, updateDoc, increment } from 'firebase/firestore';
import { Suspense, useEffect, useMemo, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import type { Currency, CategoryDocument, Goal } from '@/lib/types';
import { useRouter, useSearchParams } from 'next/navigation';
import { subMonths, format, addYears } from 'date-fns';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function AddTransactionPageWrapper() {
  return (
    <Suspense fallback={<div className="p-6 text-sm text-muted-foreground">Chargement…</div>}>
      <AddTransactionPage />
    </Suspense>
  );
}

// Categories are now loaded dynamically from Firestore

const DEFAULT_TEST_CATEGORIES = ['Housing', 'Food', 'Transport', 'Entertainment', 'Health', 'Shopping', 'Utilities'];

const generateTestData = (userId: string) => {
  const transactions: any[] = [];
  const budgets: any[] = [];
  const goals: any[] = [];
  const now = new Date();

  // Generate transactions for the last 12 months
  for (let i = 0; i < 12; i++) {
    const monthDate = subMonths(now, i);
    
    // 3-4 expenses per category
    DEFAULT_TEST_CATEGORIES.forEach((category: string) => {
      const numTransactions = Math.floor(Math.random() * 2) + 3; // 3 or 4
      for(let j=0; j < numTransactions; j++) {
        transactions.push({
          type: 'expense',
          description: `${category} charge #${j+1}`,
          amountInCents: Math.floor(Math.random() * 15000) + 1000, // $10 to $150
          currency: 'USD' as Currency,
          category: category,
          date: format(monthDate, 'yyyy-MM-dd'),
          userId: userId,
        });
      }
    });

    // 1-2 income transactions
     for(let j=0; j < 2; j++) {
        transactions.push({
          type: 'income',
          description: `Paycheck #${j+1}`,
          amountInCents: Math.floor(Math.random() * 200000) + 150000, // $1500 to $3500
          currency: 'USD' as Currency,
          category: 'Salary',
          date: format(monthDate, 'yyyy-MM-dd'),
          userId: userId,
        });
      }
  }

  // Generate Budgets
  const budgetAmounts: Record<string, number> = {
    Housing: 1200,
    Food: 500,
    Transport: 250,
    Entertainment: 150,
    Health: 200,
    Shopping: 300,
    Utilities: 180,
  };

  DEFAULT_TEST_CATEGORIES.forEach((category: string) => {
    budgets.push({
      name: category,
      budgetedAmount: budgetAmounts[category] || 200,
      userId: userId,
    });
  });

  // Generate Goals
  goals.push({
    name: 'Save for Vacation',
    targetAmountInCents: 300000,
    currentAmountInCents: 75000,
    currency: 'USD' as Currency,
    targetDate: format(addYears(now, 1), 'yyyy-MM-dd'),
    userId: userId,
  });

  goals.push({
    name: 'New Laptop Fund',
    targetAmountInCents: 150000,
    currentAmountInCents: 110000,
    currency: 'USD' as Currency,
    targetDate: format(addYears(now, 1), 'yyyy-MM-dd'),
    userId: userId,
  });


  return {transactions, budgets, goals};
};


function AddTransactionPage() {
  const { user, userProfile } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]); // Default to today
  const [attachment, setAttachment] = useState<{ url: string; name: string; type: string } | null>(null);
  const [goalAllocations, setGoalAllocations] = useState<Record<string, string>>({});
  const [allocationError, setAllocationError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isFrench = userProfile?.locale === 'fr-CM';
  const currency = (userProfile?.displayCurrency || 'USD') as Currency;
  const displayLocale = userProfile?.locale || (isFrench ? 'fr-CM' : 'en-US');
  const requestedType = searchParams?.get('type');

  const formatMoney = (valueInCents: number, targetCurrency: Currency = currency) => {
    return new Intl.NumberFormat(displayLocale, {
      style: 'currency',
      currency: targetCurrency,
    }).format((valueInCents || 0) / 100);
  };

  const parseAmount = (value: string) => {
    if (!value) return 0;
    const normalized = value.replace(',', '.');
    const parsed = parseFloat(normalized);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
  };

  useEffect(() => {
    if (requestedType === 'income' || requestedType === 'expense') {
      setType(prev => (prev === requestedType ? prev : requestedType));
    }
  }, [requestedType]);

  const handleAllocationChange = (goalId: string, rawValue: string) => {
    const sanitizedInput = rawValue.replace(',', '.');
    if (!/^\d*(?:[.,]\d{0,2})?$/.test(rawValue)) {
      return;
    }
    setGoalAllocations(prev => {
      const next = { ...prev };
      if (!sanitizedInput) {
        delete next[goalId];
      } else {
        next[goalId] = rawValue;
      }
      return next;
    });
  };

  // Load categories from Firestore
  const categoriesQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(
      collection(firestore, `users/${user.uid}/categories`),
      where('type', '==', type)
    );
  }, [firestore, user, type]);

  const { data: categories } = useCollection<CategoryDocument>(categoriesQuery);

  const goalsQuery = useMemoFirebase(() => {
    if (!firestore || !user || type !== 'income') return null;
    return collection(firestore, `users/${user.uid}/budgetGoals`);
  }, [firestore, user, type]);

  const { data: goalsRaw } = useCollection<Goal>(goalsQuery);
  const activeGoals = useMemo(() => goalsRaw?.filter(goal => !goal.archived) || [], [goalsRaw]);

  const allocationEntries = useMemo(() => {
    return Object.entries(goalAllocations).map(([goalId, rawValue]) => {
      const numeric = parseAmount(rawValue);
      return [goalId, numeric] as [string, number];
    }).filter(([, numeric]) => numeric > 0);
  }, [goalAllocations]);

  const amountNumeric = parseAmount(amount);
  const amountInCents = Math.round(amountNumeric * 100);
  const totalAllocatedValue = allocationEntries.reduce((sum, [, value]) => sum + value, 0);
  const totalAllocatedInCents = Math.round(totalAllocatedValue * 100);
  const remainingAllocationInCents = Math.max(amountInCents - totalAllocatedInCents, 0);
  const isOverAllocated = type === 'income' && amountInCents > 0 && totalAllocatedInCents > amountInCents;

  useEffect(() => {
    if (type !== 'income') {
      setGoalAllocations({});
      setAllocationError(null);
      return;
    }
    if (isOverAllocated) {
      setAllocationError(isFrench ? 'Le montant alloué dépasse le revenu saisi.' : 'Allocated amount exceeds the income.');
    } else {
      setAllocationError(null);
    }
  }, [type, isOverAllocated, isFrench]);

  useEffect(() => {
    if (type !== 'income') return;
    if (!activeGoals.length) {
      setGoalAllocations(prev => (Object.keys(prev).length ? {} : prev));
      return;
    }
    const activeIds = new Set(activeGoals.map(goal => goal.id));
    setGoalAllocations(prev => {
      let changed = false;
      const next: Record<string, string> = {};
      for (const [goalId, value] of Object.entries(prev)) {
        if (activeIds.has(goalId)) {
          next[goalId] = value;
        } else {
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [activeGoals, type]);

  const handleGenerateData = () => {
    if (!user || !firestore) return;
    const { transactions, budgets, goals } = generateTestData(user.uid);
    
    const promises = [];

    // Add transactions
    const expensesCollection = collection(firestore, `users/${user.uid}/expenses`);
    promises.push(...transactions.map(data => addDocumentNonBlocking(expensesCollection, data)));

    // Add budgets
    const categoriesCollection = collection(firestore, `users/${user.uid}/categories`);
    promises.push(...budgets.map(data => addDocumentNonBlocking(categoriesCollection, data)));

    // Add goals
    const goalsCollection = collection(firestore, `users/${user.uid}/budgetGoals`);
    promises.push(...goals.map(data => addDocumentNonBlocking(goalsCollection, data)));
    
    Promise.all(promises).then(() => {
        toast({
            title: isFrench ? "Données générées" : "Data Generated",
            description: isFrench ? "Données de test pour transactions, budgets et objectifs ont été ajoutées." : "Test data for transactions, budgets, and goals has been added.",
        });
        router.push('/transactions');
    }).catch((e) => {
         toast({
            variant: 'destructive',
            title: isFrench ? "Erreur" : "Error",
            description: isFrench ? "Impossible de générer les données de test." : "Could not generate test data.",
        });
        console.error(e);
    });
  };

  const handleSubmit = async () => {
    if (!user || !firestore || isSubmitting) return;

    if (!description || !amount || !category || !date) {
      toast({
        variant: 'destructive',
        title: isFrench ? 'Champs manquants' : 'Missing fields',
        description: isFrench ? 'Veuillez remplir tous les champs pour ajouter une transaction.' : 'Please fill out all fields to add a transaction.',
      });
      return;
    }

    if (type === 'income' && isOverAllocated) {
      setAllocationError(isFrench ? 'Le montant alloué dépasse le revenu saisi.' : 'Allocated amount exceeds the income.');
      return;
    }

    if (amountNumeric <= 0) {
      toast({
        variant: 'destructive',
        title: isFrench ? 'Montant invalide' : 'Invalid amount',
        description: isFrench ? 'Veuillez saisir un montant positif.' : 'Please enter a positive amount.',
      });
      return;
    }

    setIsSubmitting(true);

    const transactionData = {
      type,
      description,
      amountInCents,
      currency,
      category,
      date,
      userId: user.uid,
      attachmentUrl: attachment?.url,
      attachmentName: attachment?.name,
      attachmentType: attachment?.type,
    };

    try {
      const expensesCollection = collection(firestore, `users/${user.uid}/expenses`);
      const newTransactionRef = await addDocumentNonBlocking(expensesCollection, transactionData);

      if (type === 'income' && allocationEntries.length > 0) {
        const transactionId = newTransactionRef?.id;
        const allocationPromises = allocationEntries.map(async ([goalId, allocatedAmount]) => {
          const allocationInCents = Math.round(allocatedAmount * 100);
          if (allocationInCents <= 0) return;

          const goalRef = doc(firestore, `users/${user.uid}/budgetGoals`, goalId);
          await updateDoc(goalRef, {
            currentAmountInCents: increment(allocationInCents),
            updatedAt: new Date().toISOString(),
          });

          const goalDetails = activeGoals.find(g => g.id === goalId);
          const allocationNote = isFrench
            ? `Allocation de ${formatMoney(allocationInCents, goalDetails?.currency || currency)} depuis le revenu « ${description} » du ${date}`
            : `Allocated ${formatMoney(allocationInCents, goalDetails?.currency || currency)} from income "${description}" dated ${date}`;

          await addGoalTransaction(
            firestore,
            user.uid,
            goalId,
            allocationInCents,
            allocationNote,
            undefined,
            {
              sourceTransactionId: transactionId,
              sourceType: 'income_allocation',
            }
          );
        });

        await Promise.all(allocationPromises);
      }

      toast({
        title: isFrench ? 'Transaction ajoutée' : 'Transaction Added',
        description:
          type === 'income' && allocationEntries.length > 0
            ? (isFrench
                ? 'Revenu enregistré et montants alloués à vos objectifs.'
                : 'Income recorded and allocations applied to your goals.')
            : (isFrench
                ? 'Votre transaction a été ajoutée avec succès.'
                : 'Your transaction has been successfully added.'),
      });

      router.push('/transactions');
    } catch (error) {
      console.error('[AddTransaction] Failed to add transaction', error);
      toast({
        variant: 'destructive',
        title: isFrench ? 'Erreur' : 'Error',
        description: isFrench ? 'Impossible d\'ajouter la transaction.' : 'Could not add the transaction.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Suspense fallback={null}>
      <AppLayout>
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="font-headline">{isFrench ? 'Ajouter une Transaction' : 'Add a Transaction'}</CardTitle>
            <CardDescription>
              {isFrench ? "Enregistrez un nouveau revenu ou une nouvelle dépense. Cliquez sur Enregistrer lorsque vous avez terminé." : "Log a new income or expense. Click save when you're done."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6">
              {/* ...existing code... */}
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-3 sm:flex-row sm:justify-between">
            {/* ...existing code... */}
          </CardFooter>
        </Card>
      </AppLayout>
    </Suspense>
  );
}
