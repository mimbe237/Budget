
'use server';

import { AppLayout } from '@/components/dashboard/dashboard-client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { getTransactionsForPeriod } from './_actions/get-transactions';
import { DateRangePicker } from './_components/date-range-picker';
import { Suspense } from 'react';

export default async function ReportsPage({
  searchParams,
}: {
  searchParams?: { [key: string]: string | string[] | undefined };
}) {
  const from = searchParams?.from as string | undefined;
  const to = searchParams?.to as string | undefined;

  return (
    <AppLayout>
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
            <h1 className="text-2xl font-semibold font-headline">Rapports</h1>
            <DateRangePicker />
        </div>
        <Suspense fallback={<Card><CardHeader><CardTitle>Chargement...</CardTitle></CardHeader></Card>}>
          {/* @ts-expect-error Server Component */}
          <ReportContent from={from} to={to} />
        </Suspense>
      </div>
    </AppLayout>
  );
}

async function ReportContent({ from, to }: { from?: string; to?: string }) {
    const transactions = await getTransactionsForPeriod({ from, to });

    return (
        <Card>
            <CardHeader>
                <CardTitle>Vue Synthétique (Début)</CardTitle>
            </CardHeader>
            <CardContent>
                <p>Transactions trouvées pour la période sélectionnée : {transactions.length}</p>
                {/*  Ici, nous allons construire le reste du rapport  */}
            </CardContent>
        </Card>
    )
}
