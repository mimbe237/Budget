/**
 * Dynamic Imports pour Recharts
 * Lazy loading des graphiques lourds pour optimiser le bundle initial
 * 
 * @phase Phase 3.1 - Code Splitting
 * @savings ~45-60 kB par composant (Recharts non chargé au démarrage)
 */

import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';

// Loading fallback component
const ChartSkeleton = () => (
  <div className="w-full h-[300px] flex items-center justify-center">
    <Skeleton className="w-full h-full rounded-lg" />
  </div>
);

// Dashboard Components
export const SpendingOverviewLazy = dynamic(
  () => import('@/components/dashboard/spending-overview').then(mod => ({ default: mod.SpendingOverview })),
  {
    loading: () => <ChartSkeleton />,
    ssr: false, // Désactive SSR car Recharts utilise window
  }
);

export const GoalsOverviewLazy = dynamic(
  () => import('@/components/dashboard/goals-overview-new'),
  {
    loading: () => <ChartSkeleton />,
    ssr: false,
  }
);

// Reports Components
export const CashFlowChartLazy = dynamic(
  () => import('@/app/reports/_components/cashflow-chart').then(mod => ({ default: mod.CashflowChart })),
  {
    loading: () => <ChartSkeleton />,
    ssr: false,
  }
);

export const CategoryBreakdownLazy = dynamic(
  () => import('@/app/reports/_components/category-breakdown').then(mod => ({ default: mod.CategoryBreakdown })),
  {
    loading: () => <ChartSkeleton />,
    ssr: false,
  }
);

export const ChartFinanceDebtLazy = dynamic(
  () => import('@/app/reports/_components/chart-finance-debt').then(mod => ({ default: mod.ChartFinanceDebt })),
  {
    loading: () => <ChartSkeleton />,
    ssr: false,
  }
);

// Category Component
export const CategoryDistributionChartLazy = dynamic(
  () => import('@/components/categories/category-distribution-chart').then(mod => ({ default: mod.CategoryDistributionChart })),
  {
    loading: () => <ChartSkeleton />,
    ssr: false,
  }
);

// Affiliates Component
export const AffiliateStatsClientLazy = dynamic(
  () => import('@/app/affiliates/_components/affiliate-stats-client').then(mod => ({ default: mod.AffiliateStatsClient })),
  {
    loading: () => <ChartSkeleton />,
    ssr: false,
  }
);

// Debt Detail Chart (utilisé dans /debts/[id])
export const DebtDetailChartLazy = dynamic(
  () => import('@/app/debts/[id]/page').then(mod => ({ default: mod.default })),
  {
    loading: () => <div className="animate-pulse"><Skeleton className="w-full h-[400px]" /></div>,
    ssr: true, // Page component, garde SSR
  }
);
