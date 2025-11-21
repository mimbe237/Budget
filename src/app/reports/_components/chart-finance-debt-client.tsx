'use client';

/**
 * Client Wrapper pour ChartFinanceDebt
 * Permet le lazy loading dans les server components
 * 
 * @phase Phase 3.3 - Reports Optimization
 */

import { ChartFinanceDebtLazy } from '@/components/lazy-charts';
import type { FinancialReportData } from '@/lib/types';

interface ChartFinanceDebtClientProps {
  data: FinancialReportData['financialSeries'];
  currency: string;
  locale: string;
  isFrench: boolean;
}

export function ChartFinanceDebtClient({ data, currency, locale, isFrench }: ChartFinanceDebtClientProps) {
  return (
    <ChartFinanceDebtLazy
      data={data}
      currency={currency}
      locale={locale}
      isFrench={isFrench}
    />
  );
}
