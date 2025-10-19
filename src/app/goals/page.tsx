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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { MoreHorizontal, PlusCircle, Pencil, Trash2, Target } from 'lucide-react';
import {
  useCollection,
  useDoc,
  useFirestore,
  useUser,
  addDocumentNonBlocking,
  updateDocumentNonBlocking,
  deleteDocumentNonBlocking,
  useMemoFirebase,
} from '@/firebase';
import { collection, query, doc } from 'firebase/firestore';
import { useState, useEffect } from 'react';
import type { Goal, Currency, UserProfile } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Progress } from '@/components/ui/progress';

function formatMoney(amountInCents: number, currency: Currency, locale: string) {
  const amount = (amountInCents || 0) / 100;
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
  }).format(amount);
}

export default function GoalsPage() {
  const { user, userProfile } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const isFrench = userProfile?.locale === 'fr-CM';

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  
  const [currentGoal, setCurrentGoal] = useState<Goal | null>(null);
  const [goalName, setGoalName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [currentAmount, setCurrentAmount] = useState('0');
  const [currency, setCurrency] = useState<Currency>('USD');
  const [targetDate, setTargetDate] = useState('');
  const [goalToDelete, setGoalToDelete] = useState<Goal | null>(null);

  const goalsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, `users/${user.uid}/budgetGoals`));
  }, [firestore, user]);

  const { data: goals, isLoading } = useCollection<Goal>(goalsQuery);
  
  const displayCurrency = userProfile?.displayCurrency || 'USD';
  const displayLocale = userProfile?.locale || 'en-US';

  useEffect(() => {
    if (currentGoal) {
      setGoalName(currentGoal.name);
      setTargetAmount(String((currentGoal.targetAmountInCents || 0) / 100));
      setCurrentAmount(String((currentGoal.currentAmountInCents || 0) / 100));
      setCurrency(currentGoal.currency || 'USD');
      setTargetDate(new Date(currentGoal.targetDate).toISOString().split('T')[0]);
    } else {
      setGoalName('');
      setTargetAmount('');
      setCurrentAmount('0');
      setCurrency(userProfile?.displayCurrency || 'USD');
      setTargetDate('');
    }
  }, [currentGoal, userProfile]);

  const handleOpenDialog = (goal: Goal | null = null) => {
    setCurrentGoal(goal);
    setIsDialogOpen(true);
  };

  const handleSaveGoal = () => {
    if (!user || !firestore) return;
    if (!goalName || !targetAmount || !targetDate) {
      toast({
        variant: 'destructive',
        title: isFrench ? 'Champs manquants' : 'Missing Fields',
        description: isFrench ? 'Veuillez fournir un nom, un montant cible et une date cible.' : 'Please provide a name, target amount, and target date.',
      });
      return;
    }
    
    const targetAmountInCents = Math.round(parseFloat(targetAmount) * 100);
    const currentAmountInCents = Math.round(parseFloat(currentAmount) * 100);

    const goalData = {
      name: goalName,
      targetAmountInCents,
      currentAmountInCents,
      currency,
      targetDate,
      userId: user.uid,
    };

    if (currentGoal) {
      const goalRef = doc(firestore, `users/${user.uid}/budgetGoals`, currentGoal.id);
      updateDocumentNonBlocking(goalRef, goalData);
      toast({ title: isFrench ? 'Objectif mis à jour' : 'Goal Updated', description: `"${goalName}" ${isFrench ? 'a été mis à jour.' : 'has been updated.'}` });
    } else {
      const goalsCollection = collection(firestore, `users/${user.uid}/budgetGoals`);
      addDocumentNonBlocking(goalsCollection, goalData);
      toast({ title: isFrench ? 'Objectif ajouté' : 'Goal Added', description: `"${goalName}" ${isFrench ? 'a été créé.' : 'has been created.'}` });
    }

    setIsDialogOpen(false);
    setCurrentGoal(null);
  };

  const openDeleteConfirm = (goal: Goal) => {
    setGoalToDelete(goal);
    setIsAlertOpen(true);
  };

  const handleDeleteGoal = () => {
    if (!user || !firestore || !goalToDelete) return;
    const goalRef = doc(firestore, `users/${user.uid}/budgetGoals`, goalToDelete.id);
    deleteDocumentNonBlocking(goalRef);
    toast({ title: isFrench ? 'Objectif supprimé' : 'Goal Deleted', description: `"${goalToDelete.name}" ${isFrench ? 'a été supprimé.' : 'has been removed.'}` });
    setIsAlertOpen(false);
    setGoalToDelete(null);
  };

  const translations = {
    title: isFrench ? 'Objectifs Financiers' : 'Financial Goals',
    description: isFrench ? 'Définissez et suivez vos objectifs financiers pour rester motivé.' : 'Set and track your financial targets to stay motivated.',
    addGoal: isFrench ? 'Ajouter Objectif' : 'Add Goal',
    editGoalTitle: isFrench ? 'Modifier Objectif' : 'Edit Goal',
    addGoalTitle: isFrench ? 'Ajouter Nouvel Objectif' : 'Add New Goal',
    editGoalDesc: isFrench ? 'Apportez des modifications à votre objectif.' : 'Make changes to your goal.',
    addGoalDesc: isFrench ? 'Créez un nouvel objectif financier.' : 'Create a new financial goal.',
    nameLabel: isFrench ? 'Nom' : 'Name',
    targetLabel: isFrench ? 'Cible' : 'Target',
    savedLabel: isFrench ? 'Économisé' : 'Saved',
    targetDateLabel: isFrench ? 'Date Cible' : 'Target Date',
    cancel: isFrench ? 'Annuler' : 'Cancel',
    save: isFrench ? 'Enregistrer Objectif' : 'Save Goal',
    goalHeader: isFrench ? 'Objectif' : 'Goal',
    progressHeader: isFrench ? 'Progression' : 'Progress',
    targetDateHeader: isFrench ? 'Date Cible' : 'Target Date',
    actionsHeader: 'Actions',
    loading: isFrench ? 'Chargement des objectifs...' : 'Loading goals...',
    noGoals: isFrench ? 'Aucun objectif trouvé.' : 'No goals found.',
    deleteConfirmTitle: isFrench ? 'Êtes-vous sûr ?' : 'Are you sure?',
    deleteConfirmDesc: isFrench ? `Cela supprimera définitivement l'objectif "${goalToDelete?.name}". Cette action est irréversible.` : `This will permanently delete the goal "${goalToDelete?.name}". This action cannot be undone.`,
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
                    {translations.addGoal}
                  </span>
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>{currentGoal ? translations.editGoalTitle : translations.addGoalTitle}</DialogTitle>
                  <DialogDescription>{currentGoal ? translations.editGoalDesc : translations.addGoalDesc}</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="name" className="text-right">{translations.nameLabel}</Label>
                    <Input id="name" value={goalName} onChange={(e) => setGoalName(e.target.value)} className="col-span-3" placeholder={isFrench ? 'ex: Épargner pour des vacances' : 'e.g. Save for Vacation'}/>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                     <Label htmlFor="target-amount" className="text-right">{translations.targetLabel}</Label>
                     <Input id="target-amount" type="number" value={targetAmount} onChange={(e) => setTargetAmount(e.target.value)} className="col-span-2" placeholder="1000"/>
                     <Select value={currency} onValueChange={(v) => setCurrency(v as Currency)}>
                        <SelectTrigger className="col-span-1"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="USD">USD</SelectItem>
                            <SelectItem value="EUR">EUR</SelectItem>
                            <SelectItem value="XOF">XOF</SelectItem>
                            <SelectItem value="XAF">XAF</SelectItem>
                        </SelectContent>
                     </Select>
                  </div>
                   <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="current-amount" className="text-right">{translations.savedLabel}</Label>
                    <Input id="current-amount" type="number" value={currentAmount} onChange={(e) => setCurrentAmount(e.target.value)} className="col-span-3" placeholder="0"/>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="target-date" className="text-right">{translations.targetDateLabel}</Label>
                    <Input id="target-date" type="date" value={targetDate} onChange={(e) => setTargetDate(e.target.value)} className="col-span-3"/>
                  </div>
                </div>
                <DialogFooter>
                  <DialogClose asChild><Button variant="outline">{translations.cancel}</Button></DialogClose>
                  <Button onClick={handleSaveGoal}>{translations.save}</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{translations.goalHeader}</TableHead>
                <TableHead>{translations.progressHeader}</TableHead>
                <TableHead>{translations.targetDateHeader}</TableHead>
                <TableHead className="text-right">{translations.actionsHeader}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && <TableRow><TableCell colSpan={4} className="text-center">{translations.loading}</TableCell></TableRow>}
              {goals && goals.length > 0 ? (
                goals.map(goal => {
                    const progress = goal.targetAmountInCents > 0 ? Math.min(((goal.currentAmountInCents || 0) / goal.targetAmountInCents) * 100, 100) : 0;
                    return (
                      <TableRow key={goal.id}>
                        <TableCell className="font-medium">{goal.name}</TableCell>
                        <TableCell>
                            <div className="flex flex-col gap-2">
                                <Progress value={progress} aria-label={`${goal.name} progress`} />
                                <div className="text-xs text-muted-foreground">
                                    {formatMoney(goal.currentAmountInCents || 0, goal.currency || displayCurrency, displayLocale)} / {formatMoney(goal.targetAmountInCents || 0, goal.currency || displayCurrency, displayLocale)}
                                </div>
                            </div>
                        </TableCell>
                        <TableCell>{new Date(goal.targetDate).toLocaleDateString(displayLocale, { year: 'numeric', month: 'long' })}</TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0"><span className="sr-only">Open menu</span><MoreHorizontal className="h-4 w-4" /></Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleOpenDialog(goal)}><Pencil className="mr-2 h-4 w-4" /><span>{translations.edit}</span></DropdownMenuItem>
                              <DropdownMenuItem onClick={() => openDeleteConfirm(goal)} className="text-destructive"><Trash2 className="mr-2 h-4 w-4" /><span>{translations.delete}</span></DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    )
                })
              ) : !isLoading ? (
                <TableRow><TableCell colSpan={4} className="h-24 text-center">{translations.noGoals}</TableCell></TableRow>
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
            <AlertDialogAction onClick={handleDeleteGoal} className="bg-destructive hover:bg-destructive/90">{translations.delete}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
}
