/**
 * Dynamic Imports pour Recharts
 * Lazy loading des graphiques lourds pour optimiser le bundle initial
 * 
 * @phase Phase 3.1 - Code Splitting + Phase 4 - Skeleton Loaders
 * @savings ~45-60 kB par composant (Recharts non chargé au démarrage)
 */

import dynamic from 'next/dynamic';
import { ChartSkeleton, PieChartSkeleton, LineChartSkeleton } from '@/components/skeletons/ChartSkeleton';

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
    loading: () => <PieChartSkeleton />,
    ssr: false,
  }
);

// Reports Components
export const CashFlowChartLazy = dynamic(
  () => import('@/app/reports/_components/cashflow-chart').then(mod => ({ default: mod.CashflowChart })),
  {
    loading: () => <LineChartSkeleton />,
    ssr: false,
  }
);

export const CategoryBreakdownLazy = dynamic(
  () => import('@/app/reports/_components/category-breakdown').then(mod => ({ default: mod.CategoryBreakdown })),
  {
    loading: () => <PieChartSkeleton />,
    ssr: false,
  }
);

export const ChartFinanceDebtLazy = dynamic(
  () => import('@/app/reports/_components/chart-finance-debt').then(mod => ({ default: mod.ChartFinanceDebt })),
  {
    loading: () => <LineChartSkeleton />,
    ssr: false,
  }
);

// Category Component
export const CategoryDistributionChartLazy = dynamic(
  () => import('@/components/categories/category-distribution-chart').then(mod => ({ default: mod.CategoryDistributionChart })),
  {
    loading: () => <PieChartSkeleton />,
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
