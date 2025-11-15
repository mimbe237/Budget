'use server';

import { AppLayout } from '@/components/dashboard/dashboard-client';
import { loadAIInsights } from '@/components/dashboard/ai-insights-wrapper';
import { AIInsights } from '@/components/dashboard/ai-insights';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Lightbulb, TrendingUp, LayoutDashboard } from 'lucide-react';
import { RefreshInsightsButton } from './refresh-button';

export default async function AIInsightsPage() {
  const data = await loadAIInsights();

  return (
    <AppLayout>
      <div className="space-y-8 pb-12">
        <header className="flex flex-col gap-3 rounded-3xl bg-gradient-to-br from-indigo-50 via-white to-cyan-50 p-8 shadow-sm border border-indigo-100">
          <div className="inline-flex items-center gap-2 rounded-full bg-indigo-600/10 px-4 py-1 text-sm font-medium text-indigo-700 w-fit">
            <Lightbulb className="h-4 w-4" aria-hidden="true" />
            Intelligence budgétaire
          </div>
          <h1 className="text-3xl md:text-4xl font-headline font-bold text-slate-900">
            Analyse IA approfondie
          </h1>
          <p className="max-w-3xl text-base text-slate-600">
            Visualisez l’intégralité des insights générés par notre moteur IA : tendances fortes, alertes budgétaires
            et recommandations d’optimisation basées sur vos transactions, budgets et dettes.
          </p>
          <div className="flex flex-wrap gap-3 pt-2">
            <Button asChild variant="secondary">
              <Link href="/dashboard" className="inline-flex items-center gap-2">
                <LayoutDashboard className="h-4 w-4" aria-hidden="true" />
                Retour au tableau de bord
              </Link>
            </Button>
            <Button asChild>
              <Link href="/debts" className="inline-flex items-center gap-2">
                <TrendingUp className="h-4 w-4" aria-hidden="true" />
                Suivre mes dettes
              </Link>
            </Button>
            <RefreshInsightsButton />
          </div>
        </header>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          <AIInsights
            mode="full"
            status={data.status}
            insights={data.insights}
            recommendations={data.recommendations}
            lastUpdatedLabel={data.lastUpdatedLabel}
          />

          <div className="space-y-6 lg:space-y-5">
            <Card className="border-slate-200/70 shadow-sm backdrop-blur">
              <CardHeader>
                <CardTitle className="text-base font-semibold text-slate-800">Couverture de l’analyse</CardTitle>
                <CardDescription>Sources utilisées pour générer les suggestions IA.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 text-sm text-slate-600">
                <div className="flex items-baseline justify-between rounded-2xl bg-slate-100/60 px-4 py-3">
                  <span className="font-medium text-slate-700">Transactions analysées</span>
                  <span className="text-lg font-semibold text-slate-900">{data.sample.transactionCount}</span>
                </div>
                <div className="flex items-baseline justify-between rounded-2xl bg-slate-100/60 px-4 py-3">
                  <span className="font-medium text-slate-700">Budgets &amp; catégories</span>
                  <span className="text-lg font-semibold text-slate-900">{data.sample.budgetCount}</span>
                </div>
                <ul className="list-disc space-y-2 pl-4">
                  <li>Les dettes actives contribuent aux recommandations de trésorerie.</li>
                  <li>La précision augmente avec des données récentes et catégorisées.</li>
                  <li>Complétez vos objectifs pour des alertes encore plus pertinentes.</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-0 bg-gradient-to-br from-slate-50 via-white to-cyan-50 shadow-[0_20px_60px_-25px_rgba(8,47,73,0.45)] ring-1 ring-cyan-100">
              <CardHeader className="space-y-1">
                <CardTitle className="text-base font-semibold text-slate-800">Conseils pour enrichir l’IA</CardTitle>
                <CardDescription>Étapes rapides pour améliorer la pertinence des insights.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 text-sm text-slate-700">
                <div className="rounded-2xl bg-white/70 px-4 py-3 shadow-sm ring-1 ring-white/60">
                  <p>Ajoutez vos dettes récentes et précisez les échéances pour anticiper les pics de trésorerie.</p>
                </div>
                <div className="rounded-2xl bg-white/70 px-4 py-3 shadow-sm ring-1 ring-white/60">
                  <p>Utilisez les catégories personnalisées afin d’identifier les clusters de dépenses.</p>
                </div>
                <div className="rounded-2xl bg-white/70 px-4 py-3 shadow-sm ring-1 ring-white/60">
                  <p>Programmez des objectifs d’épargne pour détecter automatiquement les écarts mensuels.</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
