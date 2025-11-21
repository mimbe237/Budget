'use client';

import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { toast } from '@/hooks/use-toast';
import { useFirestore, useUser } from '@/firebase';
import { Button } from '@/components/ui/button';
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
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CalendarIcon, PlusCircle } from 'lucide-react';
import {
  FALLBACK_CATEGORY_ID,
  FALLBACK_SUBCATEGORY_ID,
  getCategoryOptions,
  getSubcategoryOptions,
  getSubcategoriesForCategory,
} from '@/lib/budget-categories';

const quickTransactionSchema = z.object({
  description: z.string().min(2, 'Description requise'),
  amount: z.string().regex(/^-?\d+([.,]\d{1,2})?$/, 'Montant invalide'),
  type: z.enum(['income', 'expense']),
  categoryId: z.string().min(1, 'Catégorie requise'),
  subcategoryId: z.string().min(1, 'Sous-catégorie requise'),
  date: z.string().min(1, 'Date requise'),
  account: z.string().optional(),
});

type QuickTransactionValues = z.infer<typeof quickTransactionSchema>;

const DEFAULT_VALUES: QuickTransactionValues = {
  description: '',
  amount: '',
  type: 'expense',
  categoryId: FALLBACK_CATEGORY_ID,
  subcategoryId: FALLBACK_SUBCATEGORY_ID,
  date: new Date().toISOString().slice(0, 10),
  account: '',
};

type QuickTransactionDialogProps = {
  categories: string[];
  isFrench?: boolean;
};

export function QuickTransactionDialog({ categories, isFrench }: QuickTransactionDialogProps) {
  const [open, setOpen] = useState(false);
  const { user, userProfile } = useUser();
  const firestore = useFirestore();
  const [selectedCategoryId, setSelectedCategoryId] = useState(FALLBACK_CATEGORY_ID);
  const [selectedSubcategoryId, setSelectedSubcategoryId] = useState(FALLBACK_SUBCATEGORY_ID);
  const categoryOptions = useMemo(() => getCategoryOptions(userProfile?.locale), [userProfile?.locale]);
  const subcategoryOptions = useMemo(
    () => getSubcategoryOptions(selectedCategoryId, userProfile?.locale),
    [selectedCategoryId, userProfile?.locale]
  );

  const form = useForm<QuickTransactionValues>({
    resolver: zodResolver(quickTransactionSchema),
    defaultValues: DEFAULT_VALUES,
  });

  const handleSubmit = async (values: QuickTransactionValues) => {
    if (!user || !firestore) return;
    try {
      const amountFloat = parseFloat(values.amount.replace(',', '.'));
      const amountInCents = Math.round(amountFloat * 100);

    const categoryLabel =
      values.type === 'expense'
        ? getSubcategoriesForCategory(values.categoryId).find(sub => sub.id === values.subcategoryId)?.labelEn ??
          values.categoryId
        : values.categoryId;

    await addDoc(collection(firestore, `users/${user.uid}/expenses`), {
      description: values.description,
      amountInCents,
      type: values.type,
      categoryId: values.categoryId,
      subcategoryId: values.subcategoryId,
      category: categoryLabel,
      date: values.date,
      currency: userProfile?.displayCurrency || 'USD',
      accountName: values.account || null,
      userId: user.uid,
      createdAt: serverTimestamp(),
    });

      toast({
        title: isFrench ? 'Transaction ajoutée' : 'Transaction added',
        description: isFrench ? 'Votre transaction a été enregistrée.' : 'Your transaction has been recorded.',
      });
      form.reset(DEFAULT_VALUES);
      setOpen(false);
    } catch (error: any) {
      toast({
        title: isFrench ? 'Erreur' : 'Error',
        description: error?.message ?? (isFrench ? 'Impossible d’enregistrer la transaction.' : 'Unable to save transaction.'),
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="h-9 gap-2">
          <PlusCircle className="h-4 w-4" />
          {isFrench ? 'Transaction rapide' : 'Quick transaction'}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isFrench ? 'Ajouter une transaction' : 'Add transaction'}</DialogTitle>
          <DialogDescription>
            {isFrench
              ? 'Renseignez les informations principales pour enregistrer rapidement un revenu ou une dépense.'
              : 'Fill the main fields to quickly record an income or expense.'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form className="grid gap-4 py-2" onSubmit={form.handleSubmit(handleSubmit)}>
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{isFrench ? 'Description' : 'Description'}</FormLabel>
                  <FormControl>
                    <Input placeholder={isFrench ? 'Ex. Courses supermarché' : 'e.g. Grocery shopping'} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{isFrench ? 'Montant' : 'Amount'}</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" placeholder="0.00" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{isFrench ? 'Type' : 'Type'}</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="expense">{isFrench ? 'Dépense' : 'Expense'}</SelectItem>
                        <SelectItem value="income">{isFrench ? 'Revenu' : 'Income'}</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
              <div className="space-y-3">
                <FormField
                  control={form.control}
                  name="categoryId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{isFrench ? 'Catégorie' : 'Category'}</FormLabel>
                      <FormControl>
                        <Select
                          value={field.value}
                          onValueChange={(value) => {
                            setSelectedCategoryId(value);
                            field.onChange(value);
                            const nextSubs = getSubcategoryOptions(value, userProfile?.locale);
                            const nextSub = nextSubs[0]?.value ?? FALLBACK_SUBCATEGORY_ID;
                            form.setValue('subcategoryId', nextSub);
                            setSelectedSubcategoryId(nextSub);
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder={isFrench ? 'Choisir une catégorie' : 'Select category'} />
                          </SelectTrigger>
                          <SelectContent>
                            {categoryOptions.map(option => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="subcategoryId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{isFrench ? 'Sous-catégorie' : 'Subcategory'}</FormLabel>
                      <FormControl>
                        <Select
                          value={field.value}
                          onValueChange={(value) => {
                            field.onChange(value);
                            setSelectedSubcategoryId(value);
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder={isFrench ? 'Choisir une sous-catégorie' : 'Select subcategory'} />
                          </SelectTrigger>
                          <SelectContent>
                            {subcategoryOptions.map(option => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{isFrench ? 'Date' : 'Date'}</FormLabel>
                    <FormControl>
                      <div className="flex items-center gap-2">
                        <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                        <Input type="date" {...field} />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="account"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{isFrench ? 'Compte (facultatif)' : 'Account (optional)'}</FormLabel>
                  <FormControl>
                    <Input placeholder={isFrench ? 'Ex. Carte Visa, Cash...' : 'e.g. Visa card, cash...'} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="mt-4 flex gap-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                {isFrench ? 'Annuler' : 'Cancel'}
              </Button>
              <Button type="submit">
                {isFrench ? 'Enregistrer' : 'Save'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
