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
  useMemoFirebase,
  useUser,
  addDocumentNonBlocking,
  updateDocumentNonBlocking,
  deleteDocumentNonBlocking,
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
  const amount = amountInCents / 100;
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
  }).format(amount);
}

export default function GoalsPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

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

  const userProfileRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, `users/${user.uid}`);
    }, [firestore, user]);
  const { data: userProfile } = useDoc<UserProfile>(userProfileRef);

  const displayCurrency = userProfile?.displayCurrency || 'USD';
  const displayLocale = userProfile?.locale || 'en-US';

  useEffect(() => {
    if (userProfile) {
        setCurrency(userProfile.displayCurrency || 'USD');
    }
  }, [userProfile]);

  useEffect(() => {
    if (currentGoal) {
      setGoalName(currentGoal.name);
      setTargetAmount(String(currentGoal.targetAmountInCents / 100));
      setCurrentAmount(String(currentGoal.currentAmountInCents / 100));
      setCurrency(currentGoal.currency);
      setTargetDate(new Date(currentGoal.targetDate).toISOString().split('T')[0]);
    } else {
      setGoalName('');
      setTargetAmount('');
      setCurrentAmount('0');
      setCurrency(displayCurrency);
      setTargetDate('');
    }
  }, [currentGoal, displayCurrency]);

  const handleOpenDialog = (goal: Goal | null = null) => {
    setCurrentGoal(goal);
    setIsDialogOpen(true);
  };

  const handleSaveGoal = () => {
    if (!user || !firestore) return;

    if (!goalName || !targetAmount || !targetDate) {
      toast({
        variant: 'destructive',
        title: 'Missing Fields',
        description: 'Please provide a name, target amount, and target date.',
      });
      return;
    }
    
    const targetAmountInCents = Math.round(parseFloat(targetAmount) * 100);
    const currentAmountInCents = Math.round(parseFloat(currentAmount) * 100);

    if (isNaN(targetAmountInCents) || isNaN(currentAmountInCents)) {
        toast({
            variant: 'destructive',
            title: 'Invalid Amount',
            description: 'Please enter a valid number for the amounts.',
        });
        return;
    }

    const goalData = {
        name: goalName,
        targetAmountInCents,
        currentAmountInCents,
        currency,
        targetDate: new Date(targetDate).toISOString(),
        userId: user.uid,
    };

    if (currentGoal) {
      const goalRef = doc(firestore, `users/${user.uid}/budgetGoals`, currentGoal.id);
      updateDocumentNonBlocking(goalRef, goalData);
      toast({ title: 'Goal Updated', description: `"${goalName}" has been updated.` });
    } else {
      const goalsCollection = collection(firestore, `users/${user.uid}/budgetGoals`);
      addDocumentNonBlocking(goalsCollection, goalData);
      toast({ title: 'Goal Added', description: `"${goalName}" has been created.` });
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
    toast({ title: 'Goal Deleted', description: `"${goalToDelete.name}" has been removed.` });
    setIsAlertOpen(false);
    setGoalToDelete(null);
  };

  return (
    <AppLayout>
      <Card>
        <CardHeader className="flex flex-row items-center">
          <div className="grid gap-2">
            <CardTitle className="font-headline flex items-center"><Target className="w-6 h-6 mr-2" /> Financial Goals</CardTitle>
            <CardDescription>
              Set, track, and manage your financial goals.
            </CardDescription>
          </div>
          <div className="ml-auto gap-1">
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="h-8 gap-1" onClick={() => handleOpenDialog()}>
                  <PlusCircle className="h-3.5 w-3.5" />
                  <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                    Add Goal
                  </span>
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>{currentGoal ? 'Edit Goal' : 'Add New Goal'}</DialogTitle>
                  <DialogDescription>
                    {currentGoal ? "Make changes to your goal." : "Create a new financial goal to track."}
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="name" className="text-right">Name</Label>
                        <Input id="name" value={goalName} onChange={(e) => setGoalName(e.target.value)} className="col-span-3" placeholder="e.g. Save for a car"/>
                    </div>
                     <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="target-amount" className="text-right">Target</Label>
                        <Input id="target-amount" type="number" value={targetAmount} onChange={(e) => setTargetAmount(e.target.value)} className="col-span-3" placeholder="e.g. 10000"/>
                    </div>
                     <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="current-amount" className="text-right">Saved</Label>
                        <Input id="current-amount" type="number" value={currentAmount} onChange={(e) => setCurrentAmount(e.target.value)} className="col-span-3" placeholder="e.g. 500"/>
                    </div>
                     <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="currency" className="text-right">Currency</Label>
                        <Select value={currency} onValueChange={(v) => setCurrency(v as Currency)} >
                            <SelectTrigger className="col-span-3">
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
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="target-date" className="text-right">Target Date</Label>
                        <Input id="target-date" type="date" value={targetDate} onChange={(e) => setTargetDate(e.target.value)} className="col-span-3"/>
                    </div>
                </div>
                <DialogFooter>
                  <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
                  <Button onClick={handleSaveGoal}>Save Goal</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50%]">Goal</TableHead>
                <TableHead>Progress</TableHead>
                <TableHead>Target Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && (
                <TableRow><TableCell colSpan={4} className="text-center">Loading goals...</TableCell></TableRow>
              )}
              {goals && goals.length > 0 ? (
                goals.map(goal => {
                    const progress = goal.targetAmountInCents > 0 ? (goal.currentAmountInCents / goal.targetAmountInCents) * 100 : 0;
                    return (
                        <TableRow key={goal.id}>
                            <TableCell className="font-medium">{goal.name}</TableCell>
                            <TableCell>
                                <div className="flex flex-col gap-2">
                                    <Progress value={progress} aria-label={`${goal.name} progress`} />
                                    <div className="text-xs text-muted-foreground">
                                        {formatMoney(goal.currentAmountInCents, goal.currency || displayCurrency, displayLocale)} of {formatMoney(goal.targetAmountInCents, goal.currency || displayCurrency, displayLocale)}
                                    </div>
                                </div>
                            </TableCell>
                            <TableCell>{new Date(goal.targetDate).toLocaleDateString(displayLocale, { month: 'short', year: 'numeric' })}</TableCell>
                            <TableCell className="text-right">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild><Button variant="ghost" className="h-8 w-8 p-0"><span className="sr-only">Open menu</span><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => handleOpenDialog(goal)}><Pencil className="mr-2 h-4 w-4" /><span>Edit</span></DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => openDeleteConfirm(goal)} className="text-destructive"><Trash2 className="mr-2 h-4 w-4" /><span>Delete</span></DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                            </TableCell>
                        </TableRow>
                    )
                })
              ) : !isLoading ? (
                <TableRow><TableCell colSpan={4} className="h-24 text-center">No goals found. Start by adding one!</TableCell></TableRow>
              ) : null}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the goal "{goalToDelete?.name}".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteGoal} className="bg-destructive hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
}
