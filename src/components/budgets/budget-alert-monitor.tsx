import { useEffect, useRef } from 'react';
import { useMonthlyBudgetStatus } from '@/hooks/use-monthly-budget-status';
import { useUser } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { detectBudgetOverruns } from '@/lib/budget-utils';
import { AlertTriangle, TrendingUp } from 'lucide-react';

/**
 * Composant de monitoring des dépassements budgétaires
 * Affiche automatiquement un toast quand un budget est dépassé
 * À placer dans le layout principal de l'app
 */
export function BudgetAlertMonitor() {
  const { userProfile } = useUser();
  const { budgetStatus, isLoading } = useMonthlyBudgetStatus();
  const { toast } = useToast();

  const isFrench = userProfile?.locale === 'fr-CM';
  const displayCurrency = userProfile?.displayCurrency || 'USD';
  const displayLocale = userProfile?.locale || 'en-US';

  // Garder en mémoire les catégories déjà alertées pour éviter les doublons
  const alertedCategoriesRef = useRef<Set<string>>(new Set());
  const globalAlertShownRef = useRef(false);

  useEffect(() => {
    if (isLoading || !budgetStatus) return;

    // Alerte globale si dépassement du budget total
    if (budgetStatus.isGlobalOverBudget && !globalAlertShownRef.current) {
      const overageAmount = Math.abs(budgetStatus.totalRemaining);
      const formattedAmount = new Intl.NumberFormat(displayLocale, {
        style: 'currency',
        currency: displayCurrency,
      }).format(overageAmount);

      toast({
        variant: 'destructive',
        title: isFrench ? '🚨 Budget mensuel dépassé' : '🚨 Monthly budget exceeded',
        description: isFrench
          ? `Vous avez dépassé votre budget de ${formattedAmount} (${budgetStatus.globalPercentage.toFixed(1)}%).`
          : `You've exceeded your budget by ${formattedAmount} (${budgetStatus.globalPercentage.toFixed(1)}%).`,
        duration: 8000,
      });

      globalAlertShownRef.current = true;
    }

    // Alertes par catégorie
    const overruns = detectBudgetOverruns(budgetStatus);
    overruns.forEach(overrun => {
      if (alertedCategoriesRef.current.has(overrun.categoryId)) return;

      const formattedOverage = new Intl.NumberFormat(displayLocale, {
        style: 'currency',
        currency: displayCurrency,
      }).format(overrun.overageAmount);

      toast({
        variant: 'destructive',
        title: isFrench
          ? `⚠️ Dépassement : ${overrun.categoryName}`
          : `⚠️ Overspending: ${overrun.categoryName}`,
        description: isFrench
          ? `Budget dépassé de ${formattedOverage} (${overrun.percentage.toFixed(1)}%).`
          : `Over budget by ${formattedOverage} (${overrun.percentage.toFixed(1)}%).`,
        duration: 6000,
      });

      alertedCategoriesRef.current.add(overrun.categoryId);
    });

    // Réinitialiser les alertes si le budget revient en-dessous
    if (!budgetStatus.isGlobalOverBudget) {
      globalAlertShownRef.current = false;
    }

    const currentOverBudgetIds = new Set(budgetStatus.overBudgetCategories);
    alertedCategoriesRef.current.forEach(id => {
      if (!currentOverBudgetIds.has(id)) {
        alertedCategoriesRef.current.delete(id);
      }
    });
  }, [budgetStatus, isLoading, toast, isFrench, displayCurrency, displayLocale]);

  // Composant invisible, agit uniquement sur les effets secondaires
  return null;
}

/**
 * Badge compact affichant le nombre de catégories en dépassement
 * À placer dans la barre de navigation ou le dashboard
 */
export function BudgetAlertBadge() {
  const { userProfile } = useUser();
  const { budgetStatus, isLoading } = useMonthlyBudgetStatus();

  const isFrench = userProfile?.locale === 'fr-CM';

  if (isLoading || !budgetStatus) return null;

  const overBudgetCount = budgetStatus.overBudgetCategories.length;
  const isGlobalOver = budgetStatus.isGlobalOverBudget;

  if (overBudgetCount === 0 && !isGlobalOver) return null;

  return (
    <div className="flex items-center gap-2 rounded-md bg-red-100 dark:bg-red-950/30 px-3 py-1.5 text-sm">
      <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
      <span className="font-medium text-red-700 dark:text-red-400">
        {isGlobalOver ? (
          isFrench ? (
            'Budget mensuel dépassé'
          ) : (
            'Monthly budget exceeded'
          )
        ) : (
          <>
            {overBudgetCount} {isFrench ? 'catégorie(s) en dépassement' : 'over budget'}
          </>
        )}
      </span>
    </div>
  );
}

/**
 * Indicateur de santé budgétaire avec pourcentage global
 * Affiche un indicateur visuel coloré selon le niveau de consommation
 */
export function BudgetHealthIndicator() {
  const { userProfile } = useUser();
  const { budgetStatus, isLoading } = useMonthlyBudgetStatus();

  const isFrench = userProfile?.locale === 'fr-CM';

  if (isLoading || !budgetStatus) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <div className="h-2 w-2 rounded-full bg-gray-300 animate-pulse" />
        <span>{isFrench ? 'Chargement...' : 'Loading...'}</span>
      </div>
    );
  }

  const { globalPercentage, isGlobalOverBudget } = budgetStatus;

  let color = 'bg-emerald-500';
  let status = isFrench ? 'Sain' : 'Healthy';
  let icon = '✅';

  if (isGlobalOverBudget) {
    color = 'bg-red-500';
    status = isFrench ? 'Dépassé' : 'Over budget';
    icon = '🚨';
  } else if (globalPercentage >= 90) {
    color = 'bg-orange-500';
    status = isFrench ? 'Critique' : 'Critical';
    icon = '⚠️';
  } else if (globalPercentage >= 75) {
    color = 'bg-amber-500';
    status = isFrench ? 'Attention' : 'Warning';
    icon = '⚡';
  }

  return (
    <div className="flex items-center gap-3">
      <div className={`h-3 w-3 rounded-full ${color} animate-pulse`} />
      <div className="flex flex-col">
        <span className="text-sm font-medium">
          {icon} {status}
        </span>
        <span className="text-xs text-muted-foreground">
          {globalPercentage.toFixed(1)}% {isFrench ? 'utilisé' : 'used'}
        </span>
      </div>
    </div>
  );
}
