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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useUser, useFirestore, addDocumentNonBlocking, useDoc, useMemoFirebase, useCollection } from '@/firebase';
import { collection, doc, query, where } from 'firebase/firestore';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import type { Currency, UserProfile, CategoryDocument } from '@/lib/types';
import { useRouter } from 'next/navigation';
import { subMonths, format, addYears } from 'date-fns';

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


export default function AddTransactionPage() {
  const { user, userProfile } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const router = useRouter();
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState<Currency>('USD');
  const [category, setCategory] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]); // Default to today

  const isFrench = userProfile?.locale === 'fr-CM';

  // Load categories from Firestore
  const categoriesQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(
      collection(firestore, `users/${user.uid}/categories`),
      where('type', '==', type)
    );
  }, [firestore, user, type]);

  const { data: categories } = useCollection<CategoryDocument>(categoriesQuery);

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

  const handleSubmit = () => {
    if (!user || !firestore) return;

    if (!description || !amount || !category || !date) {
      toast({
        variant: 'destructive',
        title: isFrench ? 'Champs manquants' : 'Missing fields',
        description: isFrench ? 'Veuillez remplir tous les champs pour ajouter une transaction.' : 'Please fill out all fields to add a transaction.',
      });
      return;
    }

    const amountInCents = Math.round(parseFloat(amount) * 100);

    const transactionData = {
      type,
      description,
      amountInCents,
      currency,
      category,
      date,
      userId: user.uid,
    };

    const expensesCollection = collection(firestore, `users/${user.uid}/expenses`);
    addDocumentNonBlocking(expensesCollection, transactionData);

    toast({
      title: isFrench ? 'Transaction ajoutée' : 'Transaction Added',
      description: isFrench ? 'Votre transaction a été ajoutée avec succès.' : 'Your transaction has been successfully added.',
    });

    router.push('/transactions');
  };

  return (
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
            <div className="grid gap-2">
              <Label htmlFor="type">{isFrench ? 'Type' : 'Type'}</Label>
              <RadioGroup
                defaultValue="expense"
                value={type}
                onValueChange={(value) => setType(value as 'income' | 'expense')}
                className="flex"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="expense" id="r1" />
                  <Label htmlFor="r1">{isFrench ? 'Dépense' : 'Expense'}</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="income" id="r2" />
                  <Label htmlFor="r2">{isFrench ? 'Revenu' : 'Income'}</Label>
                </div>
              </RadioGroup>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                placeholder={isFrench ? 'ex: Courses' : 'e.g. Groceries'}
                value={description}
                onChange={e => setDescription(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-2">
                <Label htmlFor="amount">{isFrench ? 'Montant' : 'Amount'}</Label>
                <Input
                  id="amount"
                  type="number"
                  placeholder="0.00"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="currency">{isFrench ? 'Devise' : 'Currency'}</Label>
                <Select
                  value={currency}
                  onValueChange={value => setCurrency(value as Currency)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="EUR">EUR</SelectItem>
                    <SelectItem value="XOF">XOF</SelectItem>
                    <SelectItem value="XAF">XAF</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="category">{isFrench ? 'Catégorie' : 'Category'}</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue placeholder={isFrench ? 'Sélectionner une catégorie' : 'Select a category'} />
                </SelectTrigger>
                <SelectContent>
                  {categories && categories.length > 0 ? (
                    categories.map(cat => (
                      <SelectItem key={cat.id} value={cat.name}>
                        {cat.name}
                      </SelectItem>
                    ))
                  ) : (
                    <div className="px-2 py-1.5 text-sm text-muted-foreground">
                      {isFrench ? 'Aucune catégorie disponible' : 'No categories available'}
                    </div>
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
            <Button type="button" variant="outline" onClick={handleGenerateData}>
                {isFrench ? 'Générer Données de Test' : 'Generate Test Data'}
            </Button>
          <Button type="submit" onClick={handleSubmit}>
            {isFrench ? 'Enregistrer Transaction' : 'Save Transaction'}
          </Button>
        </CardFooter>
      </Card>
    </AppLayout>
  );
}
