import { useMemo } from 'react';
import { useMonthlyBudgetStatus } from '@/hooks/use-monthly-budget-status';
import { useUser } from '@/firebase';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { getBudgetSeverity, getSeverityColor, getSeverityLabel } from '@/lib/budget-utils';
import { TrendingUp, AlertCircle, CheckCircle2, DollarSign } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n';

/**
 * Composant principal affichant l'aperçu budgétaire mensuel
 * Affiche le budget global et les détails par catégorie
 */
export function BudgetOverviewMonthly() {
  const { userProfile } = useUser();
  const { budgetStatus, budgetPlan, isLoading } = useMonthlyBudgetStatus();
  const { t } = useTranslation();

  const displayCurrency = userProfile?.displayCurrency || 'USD';
  const displayLocale = userProfile?.locale || 'en-US';

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat(displayLocale, {
      style: 'currency',
      currency: displayCurrency,
    }).format(amount);
  };

  const currentMonthLabel = useMemo(() => {
    return new Intl.DateTimeFormat(displayLocale, {
      month: 'long',
      year: 'numeric',
    }).format(new Date());
  }, [displayLocale]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64 mt-2" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!budgetStatus || !budgetPlan) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            {t('budget.monthlyBudget')}
          </CardTitle>
          <CardDescription>
            {t('budget.noBudget')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
            {t('budget.setBudget')}
          </div>
        </CardContent>
      </Card>
    );
  }

  const {
    totalBudget,
    totalSpent,
    totalRemaining,
    globalPercentage,
    isGlobalOverBudget,
    categoryStatuses,
  } = budgetStatus;

  const globalSeverity = getBudgetSeverity(globalPercentage);
  const severityLabels = {
    healthy: t('budget.healthy'),
    warning: t('budget.warning'),
    critical: t('budget.critical'),
    over: t('budget.overBudget'),
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            {t('budget.monthlyBudget')}
          </div>
          <Badge
            variant="secondary"
            className={cn(
              'px-3 py-1',
              globalSeverity === 'over'
                ? 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400'
                : globalSeverity === 'critical'
                  ? 'bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-400'
                  : globalSeverity === 'warning'
                    ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400'
                    : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400'
            )}
          >
            {severityLabels[globalSeverity]}
          </Badge>
        </CardTitle>
        <CardDescription>{currentMonthLabel}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Indicateur global */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">
              {t('budget.consumption')}
            </span>
            <span className={cn('font-bold', getSeverityColor(globalSeverity))}>
              {globalPercentage.toFixed(1)}%
            </span>
          </div>
          <Progress
            value={Math.min(globalPercentage, 150)}
            className={cn(
              'h-3',
              globalSeverity === 'over'
                ? '[&>div]:bg-red-600'
                : globalSeverity === 'critical'
                  ? '[&>div]:bg-orange-600'
                  : globalSeverity === 'warning'
                    ? '[&>div]:bg-amber-600'
                    : '[&>div]:bg-emerald-600'
            )}
          />
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>
              {formatMoney(totalSpent)} / {formatMoney(totalBudget)}
            </span>
            <span
              className={cn(
                'font-medium',
                isGlobalOverBudget
                  ? 'text-red-600 dark:text-red-400'
                  : 'text-emerald-600 dark:text-emerald-400'
              )}
            >
              {isGlobalOverBudget
                ? `${formatMoney(Math.abs(totalRemaining))}`
                : `${formatMoney(totalRemaining)}`}
            </span>
          </div>
        </div>

        {/* Détail par catégorie */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium">
            {t('budget.categoryBreakdown')}
          </h4>
          <div className="space-y-3">
            {categoryStatuses.map(status => {
              const severity = getBudgetSeverity(status.percentage);
              return (
                <div key={status.categoryId} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      {status.isOverBudget ? (
                        <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                      ) : status.percentage >= 90 ? (
                        <AlertCircle className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                      ) : (
                        <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                      )}
                      <span className="font-medium">{status.categoryName}</span>
                    </div>
                    <span className={cn('text-xs font-semibold', getSeverityColor(severity))}>
                      {status.percentage.toFixed(1)}%
                    </span>
                  </div>
                  <Progress
                    value={Math.min(status.percentage, 150)}
                    className={cn(
                      'h-2',
                      severity === 'over'
                        ? '[&>div]:bg-red-600'
                        : severity === 'critical'
                          ? '[&>div]:bg-orange-600'
                          : severity === 'warning'
                            ? '[&>div]:bg-amber-600'
                            : '[&>div]:bg-emerald-600'
                    )}
                  />
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>
                      {formatMoney(status.spent)} / {formatMoney(status.allocated)}
                    </span>
                    <span
                      className={cn(
                        status.isOverBudget
                          ? 'text-red-600 dark:text-red-400'
                          : 'text-muted-foreground'
                      )}
                    >
                      {status.isOverBudget
                        ? `+${formatMoney(Math.abs(status.remaining))}`
                        : formatMoney(status.remaining)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
