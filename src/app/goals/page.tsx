"use client";

import { useState, lazy, Suspense, useEffect, useMemo } from "react";
import { AppLayout } from "@/components/dashboard/dashboard-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { PlusCircle, PiggyBank, Activity, AlarmClock, Bell, Target } from "lucide-react";
import { useFirestore, useUser, addDocumentNonBlocking, updateDocumentNonBlocking, deleteDocumentNonBlocking, useCollection, useMemoFirebase } from "@/firebase";
import { collection, doc, query, where, orderBy, updateDoc, limit } from "firebase/firestore";
import type { Goal, Currency, CategoryDocument } from "@/lib/types";
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
import type { Debt } from "@/types/debt";
import { useNotifications } from "@/hooks/use-notifications";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { differenceInDays, formatDistanceStrict, isBefore, parseISO } from "date-fns";
import { fr as frLocale } from "date-fns/locale";
import { ResponsiveContainer, RadialBarChart, RadialBar, PolarAngleAxis } from "recharts";

type GoalHistoryEntry = {
  id: string;
  goalName: string;
  achievedAt: string;
  targetAmountInCents: number;
  status: "completed" | "abandoned";
  archivedAt?: string;
};

type PaceCategory = "ahead" | "on-track" | "behind";

type GoalProgressInsight = {
  progressPct: number;
  expectedProgressPct: number;
  probabilityPct: number;
  pace: PaceCategory;
  daysRemaining: number;
};
const GoalHistoryDialog = lazy(() => import("@/components/goals/GoalHistoryDialog").then((m) => ({ default: m.GoalHistoryDialog })));
const GoalAIDialog = lazy(() => import("@/components/goals/GoalAIDialog").then((m) => ({ default: m.GoalAIDialog })));

function formatMoney(amountInCents: number, currency: Currency, locale: string) {
  const amount = (amountInCents || 0) / 100;
  return new Intl.NumberFormat(locale, { style: "currency", currency }).format(amount);
}

export default function GoalsPage() {
  return (
    <Suspense fallback={<GoalsSkeleton />}>
      <GoalsPageContent />
    </Suspense>
  );
}

function GoalsPageContent() {
  const { user, userProfile } = useUser();
  const firestore = useFirestore();
  const { success, error, info, loading } = useEnhancedToast();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { permission, requestPermission, error: notificationsError, isSupported: notificationsSupported } = useNotifications();

  const isFrench = userProfile?.locale === "fr-CM";
  const displayCurrency = (userProfile?.displayCurrency || "USD") as Currency;
  const displayLocale = userProfile?.locale || "en-US";
  const dateLocale = isFrench ? frLocale : undefined;
  const now = new Date();

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
  const [forecastMap, setForecastMap] = useState<Record<string, number>>({});
  const [isForecastLoading, setIsForecastLoading] = useState(false);
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

  const categoriesQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(
      collection(firestore, `users/${user.uid}/categories`),
      orderBy("name", "asc")
    );
  }, [firestore, user]);

  const debtsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, "debts"), where("userId", "==", user.uid));
  }, [firestore, user]);

  const { data: categoriesDocs } = useCollection<CategoryDocument>(categoriesQuery);
  const { data: debtsDocs } = useCollection<Debt>(debtsQuery);
  const goalsHistoryQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(
      collection(firestore, `users/${user.uid}/goalsHistory`),
      orderBy("achievedAt", "desc"),
      limit(8)
    );
  }, [firestore, user]);
  const { data: goalsHistoryDocs } = useCollection<GoalHistoryEntry>(goalsHistoryQuery);

  const categoryOptions = useMemo(() => {
    if (!categoriesDocs) return [];
    return categoriesDocs
      .map((category) => ({
        value: category.id,
        label: `${category.name} ${
          category.type === "income"
            ? isFrench
              ? "(revenu)"
              : "(income)"
            : isFrench
              ? "(dépense)"
              : "(expense)"
        }`,
      }))
      .sort((a, b) => a.label.localeCompare(b.label, isFrench ? "fr" : "en"));
  }, [categoriesDocs, isFrench]);

  const debtOptions = useMemo(() => {
    if (!debtsDocs) return [];
    return debtsDocs
      .filter((debt) => debt.userId === user?.uid)
      .map((debt) => ({
        value: debt.id,
        label: `${debt.title ?? debt.id} ${
          debt.type === "PRET"
            ? isFrench
              ? "• prêt"
              : "• loaned out"
            : isFrench
              ? "• emprunt"
              : "• borrowed"
        }`,
      }))
      .sort((a, b) => a.label.localeCompare(b.label, isFrench ? "fr" : "en"));
  }, [debtsDocs, isFrench, user?.uid]);

  const goalInsights = useMemo<Record<string, GoalProgressInsight>>(() => {
    if (!goals || goals.length === 0) return {};
    return goals.reduce((acc, goal) => {
      const targetAmount = goal.targetAmountInCents || 0;
      const currentAmount = goal.currentAmountInCents || 0;
      const progressPct = targetAmount > 0 ? Math.min(100, Math.max(0, (currentAmount / targetAmount) * 100)) : 0;

      const createdAt = goal.createdAt ? parseISO(goal.createdAt) : null;
      const targetDate = goal.targetDate ? parseISO(goal.targetDate) : null;

      let expectedProgressPct = 100;
      if (createdAt && targetDate && isBefore(createdAt, targetDate)) {
        const totalDuration = Math.max(1, differenceInDays(targetDate, createdAt));
        const elapsedDuration = Math.max(0, differenceInDays(now, createdAt));
        expectedProgressPct = Math.min(100, Math.max(0, (elapsedDuration / totalDuration) * 100));
      }

      let pace: PaceCategory = "on-track";
      if (progressPct >= expectedProgressPct + 10) {
        pace = "ahead";
      } else if (progressPct < expectedProgressPct - 10) {
        pace = "behind";
      }

      const baseProbability = progressPct / 100;
      const modifier = pace === "ahead" ? 0.15 : pace === "behind" ? -0.1 : 0.05;
      const probabilityPct = Math.min(95, Math.max(5, (baseProbability + modifier) * 100));
      const daysRemaining = targetDate ? differenceInDays(targetDate, now) : 0;

      acc[goal.id] = {
        progressPct,
        expectedProgressPct,
        probabilityPct,
        pace,
        daysRemaining,
      };
      return acc;
    }, {} as Record<string, GoalProgressInsight>);
  }, [goals, now]);

  const totalTargetInCents = useMemo(
    () => goals.reduce((sum, goal) => sum + (goal.targetAmountInCents || 0), 0),
    [goals]
  );
  const totalSavedInCents = useMemo(
    () => goals.reduce((sum, goal) => sum + (goal.currentAmountInCents || 0), 0),
    [goals]
  );

  const averageProgressPct = useMemo(() => {
    if (!goals.length) return 0;
    const total = goals.reduce((sum, goal) => sum + (goalInsights[goal.id]?.progressPct ?? 0), 0);
    return total / goals.length;
  }, [goals, goalInsights]);

  const averageProbabilityPct = useMemo(() => {
    if (!goals.length) return 0;
    const total = goals.reduce((sum, goal) => sum + (goalInsights[goal.id]?.probabilityPct ?? 0), 0);
    return total / goals.length;
  }, [goals, goalInsights]);

  const highRiskGoalsCount = useMemo(
    () =>
      goals.filter(
        (goal) => goalInsights[goal.id]?.pace === "behind" && (goalInsights[goal.id]?.probabilityPct ?? 0) < 55
      ).length,
    [goals, goalInsights]
  );

  const upcomingGoal = useMemo(() => {
    return [...goals]
      .filter((goal) => {
        if (!goal.targetDate) return false;
        const targetDate = parseISO(goal.targetDate);
        return differenceInDays(targetDate, now) >= 0;
      })
      .sort((a, b) => new Date(a.targetDate).getTime() - new Date(b.targetDate).getTime())[0] || null;
  }, [goals, now]);

  const radialData = useMemo(() => {
    if (!goals.length) return [];
    return goals.slice(0, 6).map((goal) => {
      const insight = goalInsights[goal.id];
      return {
        name: goal.name,
        progress: insight?.progressPct ?? 0,
        fill: goal.color ?? "#2563eb",
      };
    });
  }, [goals, goalInsights]);

  const aiHighlights = useMemo(() => {
    return [...goals]
      .map((goal) => ({ goal, insight: goalInsights[goal.id] }))
      .filter((item) => item.insight !== undefined)
      .sort((a, b) => (a.insight!.probabilityPct ?? 0) - (b.insight!.probabilityPct ?? 0))
      .slice(0, 3);
  }, [goals, goalInsights]);

  const historyEntries = useMemo(() => goalsHistoryDocs ?? [], [goalsHistoryDocs]);

  const savingsRatePct = useMemo(() => {
    if (totalTargetInCents === 0) return 0;
    return (totalSavedInCents / totalTargetInCents) * 100;
  }, [totalSavedInCents, totalTargetInCents]);

  const upcomingGoalLabel = useMemo(() => {
    if (!upcomingGoal || !upcomingGoal.targetDate) {
      return isFrench ? "Aucune échéance planifiée" : "No upcoming milestone";
    }
    const targetDate = parseISO(upcomingGoal.targetDate);
    const relative = formatDistanceStrict(now, targetDate, {
      addSuffix: true,
      locale: dateLocale,
    });
    return `${new Date(upcomingGoal.targetDate).toLocaleDateString(displayLocale, {
      day: "numeric",
      month: "long",
      year: "numeric",
    })} • ${relative}`;
  }, [upcomingGoal, displayLocale, dateLocale, now, isFrench]);
  const hasGoals = goals.length > 0;

  const translations = {
    title: isFrench ? "Objectifs financiers" : "Financial Goals",
    description: isFrench ? "Créez, suivez et atteignez vos objectifs d'épargne." : "Create, track and reach your saving goals.",
    addGoal: isFrench ? "Nouvel objectif" : "New Goal",
    goals: isFrench ? "Objectifs" : "Goals",
    progress: isFrench ? "Progression" : "Progress",
    probability: isFrench ? "Probabilité" : "Probability",
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
    savedAmountKpi: isFrench ? "Épargné" : "Saved",
    savingsRateKpi: isFrench ? "Taux d'épargne" : "Savings rate",
    avgProgressKpi: isFrench ? "Progression moyenne" : "Average progress",
    avgProbabilityKpi: isFrench ? "Probabilité moyenne" : "Average probability",
    upcomingMilestoneKpi: isFrench ? "Prochaine échéance" : "Next milestone",
    highRiskKpi: isFrench ? "Objectifs à risque" : "Goals at risk",
    notifyCta: isFrench ? "Activer les notifications" : "Enable notifications",
    notifyDescription: isFrench
      ? "Recevez des rappels avant vos échéances et des alertes de retard."
      : "Get reminded before due dates and receive late alerts.",
    notifyError: isFrench
      ? "Impossible d'activer les notifications. Vérifiez vos paramètres navigateur."
      : "Unable to enable notifications. Check your browser settings.",
    insightsTitle: isFrench ? "IA & recommandations" : "AI & Recommendations",
    insightsSubtitle: isFrench ? "Résumé automatique de vos objectifs" : "Automated summary of your goals",
    insightsEmpty: isFrench ? "Configurez un objectif pour débloquer les recommandations." : "Create a goal to unlock recommendations.",
    historyTitle: isFrench ? "Historique des réussites" : "Goal history",
    historyEmpty: isFrench ? "Aucune réussite enregistrée pour le moment." : "No history recorded yet.",
    paceAhead: isFrench ? "En avance" : "Ahead",
    paceOnTrack: isFrench ? "Sur la bonne voie" : "On track",
    paceBehind: isFrench ? "En retard" : "Behind",
    enableNotifications: isFrench ? "Autoriser les notifications" : "Allow notifications",
    chartTitle: isFrench ? "Progression par objectif" : "Goal progress",
    chartEmpty: isFrench ? "Ajoutez un objectif pour visualiser vos progrès." : "Add a goal to visualise your progress.",
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
        await updateDocumentNonBlocking(goalRef, {
          ...fullGoalData,
          updatedAt: new Date().toISOString(),
        });
  queryClient.invalidateQueries({ queryKey: [user ? `users/${user?.uid}/budgetGoals` : ""] });
        loadingToast.dismiss();
        success(
          isFrench ? "Objectif mis à jour" : "Goal Updated",
          `"${goalData.name}"`
        );
      } else {
        const goalsCollection = collection(firestore, `users/${user.uid}/budgetGoals`);
        await addDocumentNonBlocking(goalsCollection, {
          ...fullGoalData,
          updatedAt: new Date().toISOString(),
        });
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
      await updateDoc(goalRef, { 
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
      if (process.env.NODE_ENV !== 'production') {
        console.error('[Goals] Contribution failed', err);
      }
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
      <div className="space-y-6 animate-fade-in">
        {isLoading ? (
          <GoalsSkeleton />
        ) : (
          <>
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h1 className="font-headline text-2xl" id="goals-heading">
                  {translations.title}
                </h1>
                <p className="text-muted-foreground">{translations.description}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {notificationsSupported && permission !== "granted" && (
                  <Button
                    variant="outline"
                    onClick={requestPermission}
                    className="flex items-center gap-2"
                  >
                    <Bell className="h-4 w-4" />
                    {translations.enableNotifications}
                  </Button>
                )}
                <Button
                  onClick={() => handleOpenForm(null)}
                  disabled={isSaving}
                  aria-label={translations.addGoal}
                  className="flex items-center gap-2"
                >
                  <PlusCircle className="h-4 w-4" aria-hidden="true" />
                  {translations.addGoal}
                </Button>
              </div>
            </div>

            {notificationsError && (
              <Alert variant="destructive" className="border border-destructive/40">
                <AlertTitle>{translations.notifyCta}</AlertTitle>
                <AlertDescription>{translations.notifyError}</AlertDescription>
              </Alert>
            )}

            {notificationsSupported && permission !== "granted" && !notificationsError && (
              <Alert className="border-dashed">
                <AlertTitle className="flex items-center gap-2">
                  <Bell className="h-4 w-4" />
                  {translations.notifyCta}
                </AlertTitle>
                <AlertDescription className="flex flex-col gap-2 text-sm md:flex-row md:items-center md:justify-between">
                  <span>{translations.notifyDescription}</span>
                  <Button size="sm" variant="secondary" onClick={requestPermission} className="w-fit">
                    {translations.enableNotifications}
                  </Button>
                </AlertDescription>
              </Alert>
            )}

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {translations.savedAmountKpi}
                  </CardTitle>
                  <PiggyBank className="h-4 w-4 text-emerald-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-semibold">
                    {formatMoney(totalSavedInCents, displayCurrency, displayLocale)}
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {translations.savingsRateKpi}: {savingsRatePct.toFixed(1)}%
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {translations.avgProgressKpi}
                  </CardTitle>
                  <Activity className="h-4 w-4 text-blue-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-semibold">
                    {averageProgressPct.toFixed(0)}%
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {isFrench ? "Par rapport aux objectifs actifs" : "Across active goals"}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {translations.avgProbabilityKpi}
                  </CardTitle>
                  <Target className="h-4 w-4 text-indigo-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-semibold">
                    {averageProbabilityPct.toFixed(0)}%
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {isFrench ? "Probabilité moyenne de réussite" : "Average success probability"}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {translations.upcomingMilestoneKpi}
                  </CardTitle>
                  <AlarmClock className="h-4 w-4 text-amber-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-sm font-semibold leading-tight">
                    {upcomingGoal ? upcomingGoal.name : isFrench ? "Aucun objectif actif" : "No active goal"}
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{upcomingGoalLabel}</p>
                  <div className="mt-2">
                    <Badge variant={highRiskGoalsCount > 0 ? "destructive" : "secondary"}>
                      {translations.highRiskKpi}: {highRiskGoalsCount}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <Card className="print:break-inside-avoid">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold">{translations.chartTitle}</CardTitle>
                  <CardDescription>
                    {isFrench
                      ? "Visualisez votre progression totale par objectif."
                      : "Track cumulative progress for each goal."}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {hasGoals && radialData.length > 0 ? (
                    <div className="h-72 lg:h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <RadialBarChart
                          data={radialData}
                          innerRadius="25%"
                          outerRadius="90%"
                          startAngle={90}
                          endAngle={-270}
                        >
                          <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
                          <RadialBar dataKey="progress" cornerRadius={12} background />
                        </RadialBarChart>
                      </ResponsiveContainer>
                      <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
                        {radialData.map((item) => (
                          <div
                            key={item.name}
                            className="flex items-center justify-between rounded-md border px-3 py-2 text-sm"
                          >
                            <span className="truncate pr-2">{item.name}</span>
                            <span className="font-semibold">{item.progress.toFixed(0)}%</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">{translations.chartEmpty}</p>
                  )}
                </CardContent>
              </Card>

              <Card className="print:break-inside-avoid">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold">{translations.insightsTitle}</CardTitle>
                  <CardDescription>{translations.insightsSubtitle}</CardDescription>
                </CardHeader>
                <CardContent>
                  {aiHighlights.length > 0 ? (
                    <div className="space-y-3">
                      {aiHighlights.map(({ goal, insight }) => {
                        if (!insight) return null;
                        const paceBadge =
                          insight.pace === "ahead"
                            ? { label: translations.paceAhead, variant: "secondary" as const }
                            : insight.pace === "on-track"
                              ? { label: translations.paceOnTrack, variant: "outline" as const }
                              : { label: translations.paceBehind, variant: "destructive" as const };
                        return (
                          <div
                            key={goal.id}
                            className="rounded-lg border border-border/70 bg-card/60 p-3"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div className="truncate font-medium">{goal.name}</div>
                              <Badge variant="secondary">{insight.probabilityPct.toFixed(0)}%</Badge>
                            </div>
                            <div className="mt-2 flex items-center justify-between gap-2 text-xs text-muted-foreground">
                              <Badge variant={paceBadge.variant} className="uppercase tracking-wide">
                                {paceBadge.label}
                              </Badge>
                              <span>
                                {insight.daysRemaining >= 0
                                  ? `${insight.daysRemaining} ${isFrench ? "j restants" : "days left"}`
                                  : `${Math.abs(insight.daysRemaining)} ${
                                      isFrench ? "j de retard" : "days overdue"
                                    }`}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">{translations.insightsEmpty}</p>
                  )}
                  <Separator className="my-4" />
                  <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                    <span className="text-muted-foreground">{translations.upcomingMilestoneKpi}</span>
                    <span className="font-medium text-right">{upcomingGoalLabel}</span>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-sm">
                    <span className="text-muted-foreground">{translations.highRiskKpi}</span>
                    <Badge variant={highRiskGoalsCount > 0 ? "destructive" : "secondary"}>
                      {highRiskGoalsCount}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="print:break-inside-avoid">
              <CardHeader className="flex flex-row items-center justify-between gap-2">
                <div>
                  <CardTitle className="font-headline text-lg">{translations.title}</CardTitle>
                  <CardDescription>{translations.description}</CardDescription>
                </div>
                <Button onClick={() => handleOpenForm(null)} disabled={isSaving} aria-label={translations.addGoal}>
                  <PlusCircle className="mr-2 h-4 w-4" aria-hidden="true" />
                  {translations.addGoal}
                </Button>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border overflow-hidden">
                  <Table aria-labelledby="goals-heading">
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[34%]" scope="col">
                          {translations.goals}
                        </TableHead>
                        <TableHead className="w-[28%]" scope="col">
                          {translations.progress}
                        </TableHead>
                        <TableHead className="w-[14%]" scope="col">
                          {translations.probability}
                        </TableHead>
                        <TableHead className="w-[14%]" scope="col">
                          {translations.targetDate}
                        </TableHead>
                        <TableHead className="w-[10%] text-right" scope="col">
                          {translations.actions}
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {goals.length === 0 && !isLoading ? (
                        <TableRow>
                          <TableCell colSpan={5} className="py-8 text-center" role="status">
                            {translations.noGoals}
                          </TableCell>
                        </TableRow>
                      ) : (
                        goals.map((goal) => (
                          <GoalCard
                            key={goal.id}
                            goal={goal}
                            displayCurrency={goal.currency || displayCurrency}
                            displayLocale={displayLocale}
                            isFrench={isFrench}
                            onEdit={() => handleOpenForm(goal)}
                            onDelete={() => handleConfirmDelete(goal)}
                            onArchive={(status) => handleArchiveGoal(goal, status)}
                            onAddContribution={() => handleOpenContributionDialog(goal)}
                            onShowHistory={() => {
                              setShowHistoryGoal(goal);
                              setIsHistoryOpen(true);
                            }}
                            onShowAIAnalysis={() => {
                              setShowAIGoal(goal);
                              setIsAIDialogOpen(true);
                            }}
                            formatMoney={formatMoney}
                            insight={goalInsights[goal.id]}
                            dateLocale={dateLocale}
                          />
                        ))
                      )}
                      {archivedGoals.length > 0 && (
                        <TableRow>
                          <TableCell
                            colSpan={5}
                            className="pt-6 pb-2 text-xs font-bold uppercase tracking-wide text-muted-foreground"
                          >
                            {translations.archivedGoals}
                          </TableCell>
                        </TableRow>
                      )}
                      {archivedGoals.map((goal) => (
                        <TableRow key={goal.id} className="opacity-80">
                          <TableCell className="p-4 align-top">
                            <div className="font-medium">{goal.name}</div>
                            <div className="text-xs text-muted-foreground">
                              {translations.archivedOn}:{" "}
                              {goal.archivedAt
                                ? new Date(goal.archivedAt).toLocaleDateString(displayLocale)
                                : ""}
                              {goal.archiveStatus
                                ? ` • ${
                                    goal.archiveStatus === "completed"
                                      ? translations.completed
                                      : translations.abandoned
                                  }`
                                : ""}
                            </div>
                          </TableCell>
                          <TableCell className="p-4 text-sm text-muted-foreground">
                            {formatMoney(goal.currentAmountInCents || 0, goal.currency || displayCurrency, displayLocale)}
                            {" / "}
                            {formatMoney(goal.targetAmountInCents || 0, goal.currency || displayCurrency, displayLocale)}
                          </TableCell>
                          <TableCell className="p-4 text-sm text-muted-foreground">—</TableCell>
                          <TableCell className="p-4 text-sm">
                            {new Date(goal.targetDate).toLocaleDateString(displayLocale, {
                              year: "numeric",
                              month: "long",
                            })}
                          </TableCell>
                          <TableCell className="p-4 text-right">
                            <Button variant="ghost" className="h-8 px-2" onClick={() => handleConfirmDelete(goal)}>
                              {translations.delete}
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                {hasNextPage && (
                  <div className="mt-6 flex justify-center">
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

            <Card className="print:break-inside-avoid">
              <CardHeader>
                <CardTitle className="text-lg font-semibold">{translations.historyTitle}</CardTitle>
              </CardHeader>
              <CardContent>
                {historyEntries.length > 0 ? (
                  <div className="space-y-3">
                    {historyEntries.map((entry) => {
                      const achievedRaw = entry.achievedAt as unknown;
                      const achievedDate = achievedRaw instanceof Date
                        ? achievedRaw
                        : typeof achievedRaw === "string"
                          ? new Date(achievedRaw)
                          : achievedRaw && typeof (achievedRaw as any).toDate === "function"
                            ? (achievedRaw as any).toDate()
                            : null;
                      const historyName = entry.goalName || (entry as any).name || (isFrench ? "Objectif" : "Goal");
                      const amountInCents = entry.targetAmountInCents ?? (entry as any).amountInCents ?? 0;
                      const statusLabel = entry.status === "completed" ? translations.completed : translations.abandoned;

                      return (
                        <div
                          key={entry.id}
                          className="flex flex-col gap-1 rounded-lg border border-border/60 bg-card/60 p-3 text-sm sm:flex-row sm:items-center sm:justify-between"
                        >
                          <div>
                            <div className="font-medium">{historyName}</div>
                            {achievedDate && (
                              <div className="text-xs text-muted-foreground">
                                {achievedDate.toLocaleDateString(displayLocale, {
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                })}
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-4 sm:justify-end">
                            <span className="text-xs uppercase tracking-wide text-muted-foreground">
                              {statusLabel}
                            </span>
                            <span className="font-semibold">
                              {formatMoney(amountInCents, displayCurrency, displayLocale)}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">{translations.historyEmpty}</p>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
      <GoalForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSave={handleSaveGoal}
        currentGoal={currentGoal}
        displayCurrency={displayCurrency}
        isFrench={isFrench}
        categoryOptions={categoryOptions}
        debtOptions={debtOptions}
      />
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
