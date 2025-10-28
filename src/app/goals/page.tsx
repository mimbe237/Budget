"use client";

import { useState, lazy, Suspense, useEffect } from "react";
import { AppLayout } from "@/components/dashboard/dashboard-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { PlusCircle } from "lucide-react";
import { useFirestore, useUser, addDocumentNonBlocking, updateDocumentNonBlocking, deleteDocumentNonBlocking } from "@/firebase";
import { collection, doc } from "firebase/firestore";
import type { Goal, Currency } from "@/lib/types";
import { useEnhancedToast } from "@/components/ui/enhanced-toast";
import { useFirestoreInfiniteQuery } from "@/hooks/use-firestore-infinite-query";
import { useQueryClient } from '@tanstack/react-query';
import { useSearchParams, useRouter } from "next/navigation";
// ...existing code...
import { GoalCard } from "@/components/goals/GoalCard";
import { GoalForm } from "@/components/goals/GoalForm";
import { GoalsSkeleton } from "@/components/goals/GoalsSkeleton";
import { addGoalTransaction } from "@/firebase/firestore/use-goal-transactions";
import { ContributionDialog } from "@/components/goals/ContributionDialog";

const GoalHistoryDialog = lazy(() => import("@/components/goals/GoalHistoryDialog").then((m) => ({ default: m.GoalHistoryDialog })));
const GoalAIDialog = lazy(() => import("@/components/goals/GoalAIDialog").then((m) => ({ default: m.GoalAIDialog })));

function formatMoney(amountInCents: number, currency: Currency, locale: string) {
  const amount = (amountInCents || 0) / 100;
  return new Intl.NumberFormat(locale, { style: "currency", currency }).format(amount);
}

export default function GoalsPage() {
  const { user, userProfile } = useUser();
  const firestore = useFirestore();
  const { success, error, info, loading } = useEnhancedToast();
  const searchParams = useSearchParams();
  const router = useRouter();

  const isFrench = userProfile?.locale === "fr-CM";
  const displayCurrency = (userProfile?.displayCurrency || "USD") as Currency;
  const displayLocale = userProfile?.locale || "en-US";

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isAIDialogOpen, setIsAIDialogOpen] = useState(false);
  const [isContributionDialogOpen, setIsContributionDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [currentGoal, setCurrentGoal] = useState<Goal | null>(null);
  const [goalToDelete, setGoalToDelete] = useState<Goal | null>(null);
  const [showHistoryGoal, setShowHistoryGoal] = useState<Goal | null>(null);
  const [showAIGoal, setShowAIGoal] = useState<Goal | null>(null);
  const [contributionGoal, setContributionGoal] = useState<Goal | null>(null);
  const searchParamsString = searchParams?.toString();
  const newGoalShortcut = searchParams?.get("new");

  useEffect(() => {
    if (newGoalShortcut === "goal") {
      setCurrentGoal(null);
      setIsFormOpen(true);

      if (searchParamsString !== undefined) {
        const params = new URLSearchParams(searchParamsString);
        params.delete("new");
        const queryString = params.toString();
        router.replace(queryString ? `/goals?${queryString}` : "/goals", { scroll: false });
      }
    }
  }, [newGoalShortcut, searchParamsString, router]);

  const {
    data,
    isLoading,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useFirestoreInfiniteQuery<Goal>(
    firestore,
    user ? `users/${user?.uid}/budgetGoals` : "",
    { pageSize: 20, orderByField: "createdAt", orderDirection: "desc" }
  );

  // Flatten correctement les pages
  const allGoals: Goal[] = data?.pages ? data.pages.flatMap(page => page as Goal[]) : [];
  const goals = allGoals.filter((g) => g && !g.archived);
  const archivedGoals = allGoals.filter((g) => g && g.archived);

  // Utiliser le QueryClient du contexte React Query
  const queryClient = useQueryClient();
  const handlePrefetchNextPage = () => {
    if (hasNextPage) {
      queryClient.prefetchInfiniteQuery({
        queryKey: [user ? `users/${user?.uid}/budgetGoals` : "", 20, "createdAt", "desc"],
        initialPageParam: undefined,
      });
    }
  };

  const translations = {
    title: isFrench ? "Objectifs financiers" : "Financial Goals",
    description: isFrench ? "Créez, suivez et atteignez vos objectifs d'épargne." : "Create, track and reach your saving goals.",
    addGoal: isFrench ? "Nouvel objectif" : "New Goal",
    goals: isFrench ? "Objectifs" : "Goals",
    progress: isFrench ? "Progression" : "Progress",
    targetDate: isFrench ? "Date cible" : "Target date",
    actions: isFrench ? "Actions" : "Actions",
    noGoals: isFrench ? "Aucun objectif. Ajoutez-en un pour commencer." : "No goals yet. Add one to get started.",
    archivedGoals: isFrench ? "Objectifs archivés" : "Archived Goals",
    loadMore: isFrench ? "Charger plus" : "Load more",
    deleteTitle: isFrench ? "Supprimer l'objectif" : "Delete goal",
    deleteDesc: isFrench ? "Cette action est irréversible. Voulez-vous continuer ?" : "This action cannot be undone. Do you want to continue?",
    cancel: isFrench ? "Annuler" : "Cancel",
    delete: isFrench ? "Supprimer" : "Delete",
    archivedOn: isFrench ? "Archivé le" : "Archived on",
    completed: isFrench ? "Atteint" : "Completed",
    abandoned: isFrench ? "Abandonné" : "Abandoned",
  };

  const handleOpenForm = (goal: Goal | null = null) => { setCurrentGoal(goal); setIsFormOpen(true); };

  const handleSaveGoal = async (goalData: Partial<Goal>) => {
    if (!user || !firestore) return;
    setIsSaving(true);

    const cleanedGoalData = Object.fromEntries(
      Object.entries(goalData).filter(([, value]) => value !== undefined)
    ) as Partial<Goal>;
    
    const loadingToast = loading(
      isFrench ? "Enregistrement..." : "Saving...",
      currentGoal ? (isFrench ? "Mise à jour de l'objectif" : "Updating goal") : (isFrench ? "Création de l'objectif" : "Creating goal")
    );
    
    try {
      const fullGoalData = { 
        ...cleanedGoalData, 
        userId: user.uid,
        // Ajouter createdAt si nouveau (obligatoire selon Goal type)
        ...(currentGoal ? {} : { 
          createdAt: new Date().toISOString(),
          archived: false  // Explicitement false pour les nouveaux objectifs
        })
      };
      if (currentGoal) {
        const goalRef = doc(firestore, `users/${user.uid}/budgetGoals`, currentGoal.id);
        await updateDocumentNonBlocking(goalRef, fullGoalData);
  queryClient.invalidateQueries({ queryKey: [user ? `users/${user?.uid}/budgetGoals` : ""] });
        loadingToast.dismiss();
        success(
          isFrench ? "Objectif mis à jour" : "Goal Updated",
          `"${goalData.name}"`
        );
      } else {
        const goalsCollection = collection(firestore, `users/${user.uid}/budgetGoals`);
        await addDocumentNonBlocking(goalsCollection, fullGoalData);
  queryClient.invalidateQueries({ queryKey: [user ? `users/${user?.uid}/budgetGoals` : ""] });
        loadingToast.dismiss();
        success(
          isFrench ? "Objectif ajouté" : "Goal Added",
          `"${goalData.name}"`
        );
      }
      setCurrentGoal(null);
      setIsFormOpen(false);
    } catch (err) {
      console.error('[handleSaveGoal] Erreur lors de la sauvegarde:', err);
      loadingToast.dismiss();
      error(
        isFrench ? "Erreur" : "Error",
        isFrench ? "Impossible d'enregistrer l'objectif" : "Failed to save goal"
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleConfirmDelete = (goal: Goal) => { setGoalToDelete(goal); setIsDeleteAlertOpen(true); };

  const handleDeleteGoal = async () => {
    if (!user || !firestore || !goalToDelete) return;
    
    try {
      const goalRef = doc(firestore, `users/${user.uid}/budgetGoals`, goalToDelete.id);
      await deleteDocumentNonBlocking(goalRef);
  queryClient.invalidateQueries({ queryKey: [user ? `users/${user?.uid}/budgetGoals` : ""] });
      info(
        isFrench ? "Objectif supprimé" : "Goal Deleted",
        `"${goalToDelete.name}"`
      );
      setIsDeleteAlertOpen(false);
      setGoalToDelete(null);
    } catch (err) {
      error(
        isFrench ? "Erreur" : "Error",
        isFrench ? "Impossible de supprimer l'objectif" : "Failed to delete goal"
      );
    }
  };

  const handleArchiveGoal = async (goal: Goal, status: "completed" | "abandoned") => {
    if (!user || !firestore) return;
    
    try {
      const goalRef = doc(firestore, `users/${user.uid}/budgetGoals`, goal.id);
      await updateDocumentNonBlocking(goalRef, { archived: true, archiveStatus: status, archivedAt: new Date().toISOString() });
  queryClient.invalidateQueries({ queryKey: [user ? `users/${user?.uid}/budgetGoals` : ""] });
      success(
        isFrench ? "Objectif archivé" : "Goal Archived",
        `${goal.name} - ${status === "completed" ? (isFrench ? "Atteint" : "Completed") : (isFrench ? "Abandonné" : "Abandoned")}`
      );
    } catch (err) {
      error(
        isFrench ? "Erreur" : "Error",
        isFrench ? "Impossible d'archiver l'objectif" : "Failed to archive goal"
      );
    }
  };

  const handleAddContribution = async (
    goal: Goal,
    amountInCents: number,
    note?: string,
    attachment?: { url: string; name: string; type: string }
  ) => {
    if (!user || !firestore) return;
    
    try {
      const goalRef = doc(firestore, `users/${user.uid}/budgetGoals`, goal.id);
      const newAmount = (goal.currentAmountInCents || 0) + amountInCents;
      await updateDocumentNonBlocking(goalRef, { 
        currentAmountInCents: newAmount,
        updatedAt: new Date().toISOString()
      });
      await addGoalTransaction(
        firestore,
        user.uid,
        goal.id,
        amountInCents,
        note,
        attachment,
        { sourceType: 'manual' }
      );
  queryClient.invalidateQueries({ queryKey: [user ? `users/${user?.uid}/budgetGoals` : ""] });
      success(
        isFrench ? "Contribution ajoutée" : "Contribution Added",
        formatMoney(amountInCents, displayCurrency, displayLocale)
      );
      setIsContributionDialogOpen(false);
      setContributionGoal(null);
    } catch (err) {
      error(
        isFrench ? "Erreur" : "Error",
        isFrench ? "Impossible d'ajouter la contribution" : "Failed to add contribution"
      );
    }
  };

  const handleOpenContributionDialog = (goal: Goal) => {
    setContributionGoal(goal);
    setIsContributionDialogOpen(true);
  };

  return (
    <AppLayout>
      <div className="animate-fade-in">
        {isLoading ? (
          <GoalsSkeleton />
        ) : (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2">
              <div>
                <CardTitle className="font-headline" id="goals-heading">
                  {translations.title}
                </CardTitle>
                <CardDescription>{translations.description}</CardDescription>
              </div>
              <Button 
                onClick={() => handleOpenForm(null)} 
                disabled={isSaving}
                aria-label={translations.addGoal}
              >
                <PlusCircle className="mr-2 h-4 w-4" aria-hidden="true" /> 
                {translations.addGoal}
              </Button>
            </CardHeader>
          <CardContent>
            <div className="rounded-md border overflow-hidden">
              <Table aria-labelledby="goals-heading">
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[40%]" scope="col">{translations.goals}</TableHead>
                    <TableHead className="w-[40%]" scope="col">{translations.progress}</TableHead>
                    <TableHead className="w-[20%]" scope="col">{translations.targetDate}</TableHead>
                    <TableHead className="text-right" scope="col">{translations.actions}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {goals.length === 0 && !isLoading ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8" role="status">
                      {translations.noGoals}
                    </TableCell>
                  </TableRow>
                ) : (
                  goals.map((goal) => (
                    <GoalCard key={goal.id} goal={goal} displayCurrency={goal.currency || displayCurrency} displayLocale={displayLocale} isFrench={isFrench} onEdit={() => handleOpenForm(goal)} onDelete={() => handleConfirmDelete(goal)} onArchive={(status) => handleArchiveGoal(goal, status)} onAddContribution={() => handleOpenContributionDialog(goal)} onShowHistory={() => { setShowHistoryGoal(goal); setIsHistoryOpen(true); }} onShowAIAnalysis={() => { setShowAIGoal(goal); setIsAIDialogOpen(true); }} formatMoney={formatMoney} />
                  ))
                )}
                {archivedGoals.length > 0 && (<TableRow><TableCell colSpan={4} className="pt-6 pb-2 text-xs text-muted-foreground font-bold">{translations.archivedGoals}</TableCell></TableRow>)}
                {archivedGoals.map((goal) => (
                  <TableRow key={goal.id} className="opacity-80">
                    <TableCell className="p-4">
                      <div className="font-medium">{goal.name}</div>
                      <div className="text-xs text-muted-foreground">{translations.archivedOn}: {goal.archivedAt ? new Date(goal.archivedAt).toLocaleDateString(displayLocale) : ""}{goal.archiveStatus ? ` • ${goal.archiveStatus === "completed" ? translations.completed : translations.abandoned}` : ""}</div>
                    </TableCell>
                    <TableCell className="p-4 text-sm text-muted-foreground">{formatMoney(goal.currentAmountInCents || 0, goal.currency || displayCurrency, displayLocale)}{" / "}{formatMoney(goal.targetAmountInCents || 0, goal.currency || displayCurrency, displayLocale)}</TableCell>
                    <TableCell className="p-4">{new Date(goal.targetDate).toLocaleDateString(displayLocale, { year: "numeric", month: "long" })}</TableCell>
                    <TableCell className="p-4 text-right"><Button variant="ghost" className="h-8 px-2" onClick={() => handleConfirmDelete(goal)}>{translations.delete}</Button></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {hasNextPage && (
            <div className="flex justify-center mt-4">
              <Button
                onClick={() => fetchNextPage()}
                onMouseEnter={handlePrefetchNextPage}
                disabled={isLoading || isFetchingNextPage}
                variant="outline"
              >
                {translations.loadMore}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
        )}
      </div>
      <GoalForm isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} onSave={handleSaveGoal} currentGoal={currentGoal} displayCurrency={displayCurrency} isFrench={isFrench} />
      {contributionGoal && (
        <ContributionDialog
          isOpen={isContributionDialogOpen}
          onClose={() => {
            setIsContributionDialogOpen(false);
            setContributionGoal(null);
          }}
          onSave={(amountInCents, note, attachment) => 
            handleAddContribution(contributionGoal, amountInCents, note, attachment)
          }
          goalName={contributionGoal.name}
          currentAmount={contributionGoal.currentAmountInCents || 0}
          targetAmount={contributionGoal.targetAmountInCents}
          currency={contributionGoal.currency || displayCurrency}
          locale={displayLocale}
          isFrench={isFrench}
        />
      )}
      <Suspense fallback={<div className="p-4 text-sm text-muted-foreground">{isFrench ? "Chargement..." : "Loading..."}</div>}>
        {isHistoryOpen && (<GoalHistoryDialog goal={showHistoryGoal} userId={user?.uid} firestore={firestore} isOpen={isHistoryOpen} onClose={() => setIsHistoryOpen(false)} isFrench={isFrench} />)}
      </Suspense>
      <Suspense fallback={<div className="p-4 text-sm text-muted-foreground">{isFrench ? "Chargement..." : "Loading..."}</div>}>
        {isAIDialogOpen && (<GoalAIDialog goal={showAIGoal} isOpen={isAIDialogOpen} onClose={() => setIsAIDialogOpen(false)} isFrench={isFrench} userProfile={userProfile} />)}
      </Suspense>
      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{translations.deleteTitle}</AlertDialogTitle>
            <AlertDialogDescription>{translations.deleteDesc}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{translations.cancel}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteGoal} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">{translations.delete}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
}
