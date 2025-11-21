'use client';

import { useDeferredValue, useMemo, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { differenceInCalendarDays, format } from 'date-fns';
import {
  AlertTriangle,
  CalendarDays,
  FileBarChart,
  Filter,
  Gauge,
  LayoutDashboard,
  PiggyBank,
  Plus,
  ShieldAlert,
  Sparkles,
  Table as TableIcon,
  Wallet,
} from 'lucide-react';
import { collection, limit, orderBy, query } from 'firebase/firestore';

import { AppLayout } from '@/components/dashboard/dashboard-client';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useCollection, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import type { Debt } from '@/types/debt';

const STATUS_FILTERS = [
  { value: 'ALL', label: 'Toutes les dettes' },
  { value: 'EN_COURS', label: 'En cours' },
  { value: 'EN_RETARD', label: 'En retard' },
  { value: 'RESTRUCTUREE', label: 'Restructurées' },
  { value: 'SOLDEE', label: 'Soldées' },
] as const;

const TYPE_FILTERS = [
  { value: 'ALL', label: 'Tous les types' },
  { value: 'EMPRUNT', label: 'Emprunt' },
  { value: 'PRET', label: 'Prêt' },
] as const;

const RISK_FILTERS = [
  { value: 'ALL', label: 'Tous les risques' },
  { value: 'high', label: 'Critique' },
  { value: 'medium', label: 'À surveiller' },
  { value: 'low', label: 'Stable' },
  { value: 'none', label: 'Non défini' },
] as const;

type StatusFilterValue = (typeof STATUS_FILTERS)[number]['value'];
type TypeFilterValue = (typeof TYPE_FILTERS)[number]['value'];
type RiskFilterValue = (typeof RISK_FILTERS)[number]['value'];
type ViewMode = 'table' | 'board';
type RiskLevel = 'high' | 'medium' | 'low' | 'none';

const VIEW_OPTIONS: Array<{ value: ViewMode; label: string; icon: ReactNode }> = [
  { value: 'table', label: 'Tableau', icon: <TableIcon className="h-4 w-4" /> },
  { value: 'board', label: 'Fiches', icon: <LayoutDashboard className="h-4 w-4" /> },
];

const MAX_CRITICAL = 4;
const MAX_UPCOMING = 5;

const STATUS_LABEL: Record<Debt['status'], string> = {
  EN_COURS: 'En cours',
  EN_RETARD: 'En retard',
  RESTRUCTUREE: 'Restructurée',
  SOLDEE: 'Soldée',
};

const STATUS_VARIANT: Record<Debt['status'], 'outline' | 'secondary' | 'destructive' | 'default'> = {
  EN_COURS: 'secondary',
  EN_RETARD: 'destructive',
  RESTRUCTUREE: 'outline',
  SOLDEE: 'default',
};

const TYPE_LABEL: Record<Debt['type'], string> = {
  EMPRUNT: 'Emprunt',
  PRET: 'Prêt',
};

const RISK_LABEL: Record<RiskLevel, string> = {
  high: 'Critique',
  medium: 'À surveiller',
  low: 'Stable',
  none: 'Non défini',
};

const RISK_VARIANT: Record<RiskLevel, 'destructive' | 'secondary' | 'outline' | 'default'> = {
  high: 'destructive',
  medium: 'secondary',
  low: 'outline',
  none: 'default',
};

type NumericMetrics = {
  outstanding: number;
  initial: number;
  lateCount: number;
  upcomingCount: number;
  averageRate: number | null;
};

type DecoratedDebt = Debt & {
  createdAtDate: Date | null;
  nextDueDateDate: Date | null;
  dueInDays: number | null;
  riskLevel: RiskLevel;
  progressPct: number | null;
};

function DebtsPageContent() {
  const { user, userProfile, isUserLoading } = useUser();
  const firestore = useFirestore();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<StatusFilterValue>('ALL');
  const [typeFilter, setTypeFilter] = useState<TypeFilterValue>('ALL');
  const [risk, setRisk] = useState<RiskFilterValue>('ALL');
  const [viewMode, setViewMode] = useState<ViewMode>('table');

  const locale = userProfile?.locale ?? 'fr-FR';
  const currency = userProfile?.displayCurrency ?? 'EUR';
  const formatCurrency = useMemo(() => buildCurrencyFormatter(locale, currency), [locale, currency]);

  const deferredSearch = useDeferredValue(search.trim().toLowerCase());

  const debtsQuery = useMemoFirebase(() => {
    if (!firestore || !user) {
      return null;
    }
    return query(
      collection(firestore, `users/${user.uid}/debts`),
      orderBy('createdAt', 'desc'),
      limit(500)
    );
  }, [firestore, user]);

  const { data: rawDebts, isLoading, error } = useCollection<Debt>(debtsQuery);
  const decoratedDebts = useMemo(() => sortDebts(decorateDebts(rawDebts ?? [])), [rawDebts]);
  const statusCounts = useMemo(() => computeStatusCounts(decoratedDebts), [decoratedDebts]);
  const typeCounts = useMemo(() => computeTypeCounts(decoratedDebts), [decoratedDebts]);
  const riskCounts = useMemo(() => computeRiskCounts(decoratedDebts), [decoratedDebts]);

  const filteredDebts = useMemo(() => {
    return decoratedDebts.filter((debt) => {
      if (status !== 'ALL' && debt.status !== status) return false;
      if (typeFilter !== 'ALL' && debt.type !== typeFilter) return false;
      if (risk !== 'ALL' && debt.riskLevel !== risk) return false;
      if (!deferredSearch) return true;
      const haystack = `${debt.title ?? ''} ${debt.counterparty ?? ''} ${debt.currency ?? ''}`.toLowerCase();
      return haystack.includes(deferredSearch);
    });
  }, [decoratedDebts, status, typeFilter, risk, deferredSearch]);

  const totalMetrics = useMemo(() => deriveMetrics(decoratedDebts), [decoratedDebts]);
  const filteredMetrics = useMemo(() => deriveMetrics(filteredDebts), [filteredDebts]);

  const totalCount = decoratedDebts.length;
  const filteredCount = filteredDebts.length;
  const hasActiveFilters = Boolean(deferredSearch) || status !== 'ALL' || typeFilter !== 'ALL' || risk !== 'ALL';

  const averageOutstanding = totalCount === 0 ? null : totalMetrics.outstanding / totalCount;
  const averageInitial = totalCount === 0 ? null : totalMetrics.initial / totalCount;
  const upcomingLabel =
    totalMetrics.upcomingCount === 0
      ? 'Aucune échéance à venir'
      : `${totalMetrics.upcomingCount} échéance(s) programmée(s)`;

  const criticalDebts = useMemo(() => {
    return decoratedDebts
      .filter((debt) => debt.riskLevel === 'high')
      .sort((a, b) => {
        const aDue = a.dueInDays ?? Number.POSITIVE_INFINITY;
        const bDue = b.dueInDays ?? Number.POSITIVE_INFINITY;
        return aDue - bDue;
      })
      .slice(0, MAX_CRITICAL);
  }, [decoratedDebts]);

  const upcomingDebts = useMemo(() => {
    return decoratedDebts
      .filter((debt) => typeof debt.dueInDays === 'number' && (debt.dueInDays ?? 0) >= 0)
      .sort((a, b) => (a.dueInDays ?? 0) - (b.dueInDays ?? 0))
      .slice(0, MAX_UPCOMING);
  }, [decoratedDebts]);

  const portfolioProgress = useMemo(() => {
    if (totalMetrics.initial === 0) {
      return null;
    }
    const progress = ((totalMetrics.initial - totalMetrics.outstanding) / totalMetrics.initial) * 100;
    return Math.min(100, Math.max(0, progress));
  }, [totalMetrics]);

  const filteredProgress = useMemo(() => {
    if (filteredMetrics.initial === 0) {
      return null;
    }
    const progress = ((filteredMetrics.initial - filteredMetrics.outstanding) / filteredMetrics.initial) * 100;
    return Math.min(100, Math.max(0, progress));
  }, [filteredMetrics]);

  if (isUserLoading) {
    return (
      <AppLayout>
        <div className="flex h-full items-center justify-center py-20">
          <Skeleton className="h-10 w-48" />
        </div>
      </AppLayout>
    );
  }

  if (!user) {
    return (
      <AppLayout>
        <Card className="mx-auto mt-12 max-w-xl text-center">
          <CardHeader>
            <CardTitle>Connexion requise</CardTitle>
            <CardDescription>Identifiez-vous pour visualiser vos dettes et échéanciers.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/login">Se connecter</Link>
            </Button>
          </CardContent>
        </Card>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="flex flex-col gap-6">
        <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <Badge variant="secondary" className="w-fit items-center gap-1">
              <Sparkles className="h-3.5 w-3.5" />
              Nouvelle vue portefeuille
            </Badge>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Pilotage des dettes</h1>
              <p className="text-sm text-muted-foreground">
                {filteredCount} dettes visibles sur {totalCount}. Suivez vos engagements, priorisez les actions et
                accédez aux fiches détaillées.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" asChild>
              <Link href="/reports?tab=debts" className="flex items-center gap-2">
                <FileBarChart className="h-4 w-4" />
                Rapport détaillé
              </Link>
            </Button>
            <Button asChild>
              <Link href="/debts/new" className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Ajouter une dette
              </Link>
            </Button>
          </div>
        </header>

        {error && (
          <Alert variant="destructive">
            <ShieldAlert className="h-4 w-4" />
            <AlertTitle>Impossible de charger vos données</AlertTitle>
            <AlertDescription>{error.message}</AlertDescription>
          </Alert>
        )}

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <OverviewCard
            icon={<PiggyBank className="h-5 w-5 text-primary" />}
            title="Encours restant"
            description="Capital à rembourser sur l’ensemble du portefeuille."
            value={formatCurrency(totalMetrics.outstanding, currency)}
            filteredValue={formatCurrency(filteredMetrics.outstanding, currency)}
            hasActiveFilters={hasActiveFilters}
            hint={averageOutstanding != null ? `Moyenne ${formatCurrency(averageOutstanding)}` : undefined}
          />
          <OverviewCard
            icon={<Wallet className="h-5 w-5 text-primary" />}
            title="Montant initial"
            description="Somme contractée à l’origine de vos dettes."
            value={formatCurrency(totalMetrics.initial, currency)}
            filteredValue={formatCurrency(filteredMetrics.initial, currency)}
            hasActiveFilters={hasActiveFilters}
            hint={averageInitial != null ? `Ticket moyen ${formatCurrency(averageInitial)}` : undefined}
          />
          <OverviewCard
            icon={<ShieldAlert className="h-5 w-5 text-destructive" />}
            title="Dettes en retard"
            description="Dossiers à traiter en priorité."
            value={`${totalMetrics.lateCount}`}
            filteredValue={`${filteredMetrics.lateCount}`}
            hasActiveFilters={hasActiveFilters}
            hint={upcomingLabel}
          />
          <PortfolioProgressCard
            hasActiveFilters={hasActiveFilters}
            progress={portfolioProgress}
            filteredProgress={filteredProgress}
            averageRate={totalMetrics.averageRate}
          />
        </section>

        <section className="grid gap-4 lg:grid-cols-[2fr_1fr]">
          <Card>
            <CardHeader className="space-y-1">
              <CardTitle className="text-lg font-semibold text-slate-900">Portefeuille des dettes</CardTitle>
              <CardDescription>
                Filtrez et comparez vos engagements. {filteredCount} résultat(s) sur {totalCount}.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <FiltersBar
                search={search}
                onSearch={setSearch}
                status={status}
                onStatus={setStatus}
                typeFilter={typeFilter}
                onTypeFilter={setTypeFilter}
                risk={risk}
                onRisk={setRisk}
                statusCounts={statusCounts}
                typeCounts={typeCounts}
                riskCounts={riskCounts}
                hasActiveFilters={hasActiveFilters}
                onResetFilters={() => {
                  setSearch('');
                  setStatus('ALL');
                  setTypeFilter('ALL');
                  setRisk('ALL');
                }}
              />

              <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as ViewMode)} className="space-y-4">
                <TabsList className="w-full sm:w-auto">
                  {VIEW_OPTIONS.map((option) => (
                    <TabsTrigger
                      key={option.value}
                      value={option.value}
                      className="flex flex-1 items-center justify-center gap-2 sm:flex-none"
                    >
                      {option.icon}
                      {option.label}
                    </TabsTrigger>
                  ))}
                </TabsList>
                <TabsContent value="table">
                  <DebtsTable
                    debts={filteredDebts}
                    isLoading={isLoading}
                    formatCurrency={formatCurrency}
                    hasFiltersApplied={hasActiveFilters}
                    defaultCurrency={currency}
                  />
                </TabsContent>
                <TabsContent value="board">
                  <DebtsBoard
                    debts={filteredDebts}
                    formatCurrency={formatCurrency}
                    defaultCurrency={currency}
                    hasFiltersApplied={hasActiveFilters}
                  />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          <div className="grid gap-4">
            <CriticalDebtsCard debts={criticalDebts} formatCurrency={formatCurrency} fallbackCurrency={currency} />
            <UpcomingTimelineCard debts={upcomingDebts} formatCurrency={formatCurrency} fallbackCurrency={currency} />
            <StatusBreakdownCard counts={statusCounts} total={totalCount} />
          </div>
        </section>
      </div>
    </AppLayout>
  );
}

export default function DebtsPage() {
  return <DebtsPageContent />;
}

type OverviewCardProps = {
  icon: ReactNode;
  title: string;
  description: string;
  value: string;
  filteredValue?: string;
  hasActiveFilters: boolean;
  hint?: string;
};

function OverviewCard({ icon, title, description, value, filteredValue, hasActiveFilters, hint }: OverviewCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        <div>
          <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </div>
        {icon}
      </CardHeader>
      <CardContent className="space-y-2">
        <p className="text-2xl font-semibold text-slate-900">{value}</p>
        {hasActiveFilters && filteredValue && filteredValue !== value && (
          <p className="text-xs font-medium text-emerald-600">Filtré : {filteredValue}</p>
        )}
        {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      </CardContent>
    </Card>
  );
}

type PortfolioProgressCardProps = {
  hasActiveFilters: boolean;
  progress: number | null;
  filteredProgress: number | null;
  averageRate: number | null;
};

function PortfolioProgressCard({
  hasActiveFilters,
  progress,
  filteredProgress,
  averageRate,
}: PortfolioProgressCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        <div>
          <CardTitle className="text-sm font-medium text-muted-foreground">Progression du portefeuille</CardTitle>
          <CardDescription>Suivi du capital déjà remboursé.</CardDescription>
        </div>
        <Gauge className="h-5 w-5 text-primary" />
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>Global</span>
            <span className="font-medium text-slate-900">
              {progress != null ? `${Math.round(progress)}%` : 'N/A'}
            </span>
          </div>
          <Progress value={progress ?? 0} className="h-2" />
        </div>
        {hasActiveFilters && filteredProgress != null && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Vue filtrée</span>
              <span className="font-medium text-slate-900">{Math.round(filteredProgress)}%</span>
            </div>
            <Progress value={filteredProgress ?? 0} className="h-1.5" />
          </div>
        )}
        <Separator />
        <p className="text-xs text-muted-foreground">
          Taux moyen pondéré{' '}
          <span className="font-semibold text-slate-900">
            {averageRate != null ? `${(averageRate * 100).toFixed(1)} %` : '—'}
          </span>
        </p>
      </CardContent>
    </Card>
  );
}

type FiltersBarProps = {
  search: string;
  onSearch: (value: string) => void;
  status: StatusFilterValue;
  onStatus: (value: StatusFilterValue) => void;
  typeFilter: TypeFilterValue;
  onTypeFilter: (value: TypeFilterValue) => void;
  risk: RiskFilterValue;
  onRisk: (value: RiskFilterValue) => void;
  statusCounts: Record<StatusFilterValue, number>;
  typeCounts: Record<TypeFilterValue, number>;
  riskCounts: Record<RiskFilterValue, number>;
  hasActiveFilters: boolean;
  onResetFilters: () => void;
};

function FiltersBar({
  search,
  onSearch,
  status,
  onStatus,
  typeFilter,
  onTypeFilter,
  risk,
  onRisk,
  statusCounts,
  typeCounts,
  riskCounts,
  hasActiveFilters,
  onResetFilters,
}: FiltersBarProps) {
  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-1 items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => onSearch(event.target.value)}
            placeholder="Rechercher par intitulé, contrepartie ou devise"
            autoComplete="off"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <Select value={typeFilter} onValueChange={(value) => onTypeFilter(value as TypeFilterValue)}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              {TYPE_FILTERS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label} ({typeCounts[option.value] ?? 0})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={risk} onValueChange={(value) => onRisk(value as RiskFilterValue)}>
            <SelectTrigger className="w-[170px]">
              <SelectValue placeholder="Risque" />
            </SelectTrigger>
            <SelectContent>
              {RISK_FILTERS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label} ({riskCounts[option.value] ?? 0})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={onResetFilters}>
            Réinitialiser
          </Button>
        )}
      </div>
      <ScrollArea className="w-full whitespace-nowrap">
        <div className="flex items-center gap-2 pb-1">
          {STATUS_FILTERS.map((option) => (
            <Button
              key={option.value}
              variant={status === option.value ? 'default' : 'outline'}
              size="sm"
              className="justify-between gap-2"
              onClick={() => onStatus(option.value)}
            >
              <span>{option.label}</span>
              <Badge variant={status === option.value ? 'secondary' : 'outline'}>
                {statusCounts[option.value] ?? 0}
              </Badge>
            </Button>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}

type DebtsTableProps = {
  debts: DecoratedDebt[];
  isLoading: boolean;
  formatCurrency: (value: number, currency?: string) => string;
  hasFiltersApplied: boolean;
  defaultCurrency: string;
};

function DebtsTable({ debts, isLoading, formatCurrency, hasFiltersApplied, defaultCurrency }: DebtsTableProps) {
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="min-w-[220px]">Intitulé</TableHead>
            <TableHead className="min-w-[150px]">Contrepartie</TableHead>
            <TableHead className="w-[110px]">Type</TableHead>
            <TableHead className="w-[120px]">Statut</TableHead>
            <TableHead className="w-[120px]">Risque</TableHead>
            <TableHead className="min-w-[170px]">Prochaine échéance</TableHead>
            <TableHead className="w-[140px]">Progression</TableHead>
            <TableHead className="text-right min-w-[170px]">Capital restant</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading && (
            <TableRow>
              <TableCell colSpan={8}>
                <div className="grid gap-3 p-4">
                  <Skeleton className="h-6 w-full" />
                  <Skeleton className="h-6 w-full" />
                  <Skeleton className="h-6 w-full" />
                </div>
              </TableCell>
            </TableRow>
          )}

          {!isLoading && debts.length === 0 && (
            <TableRow>
              <TableCell colSpan={8} className="py-12 text-center text-muted-foreground">
                <DebtsEmptyState hasFiltersApplied={hasFiltersApplied} />
              </TableCell>
            </TableRow>
          )}

          {debts.map((debt) => (
            <TableRow key={debt.id} className="hover:bg-muted/40">
              <TableCell>
                <div className="flex flex-col gap-1">
                  <Link href={`/debts/${debt.id}`} className="font-semibold text-slate-900 hover:underline">
                    {debt.title || 'Sans intitulé'}
                  </Link>
                  <span className="text-xs text-muted-foreground">
                    Créée{' '}
                    {debt.createdAtDate ? format(debt.createdAtDate, 'dd/MM/yyyy') : 'à une date inconnue'}
                  </span>
                </div>
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">{debt.counterparty || '—'}</TableCell>
              <TableCell>
                <Badge variant="outline">{TYPE_LABEL[debt.type]}</Badge>
              </TableCell>
              <TableCell>
                <Badge variant={STATUS_VARIANT[debt.status]}>{STATUS_LABEL[debt.status]}</Badge>
              </TableCell>
              <TableCell>
                <Badge variant={RISK_VARIANT[debt.riskLevel]}>{RISK_LABEL[debt.riskLevel]}</Badge>
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {debt.nextDueDateDate ? (
                  <div className="flex flex-col gap-0.5">
                    <span>{format(debt.nextDueDateDate, 'dd/MM/yyyy')}</span>
                    <span className="text-xs text-muted-foreground">{formatDueMessage(debt.dueInDays)}</span>
                    {typeof debt.nextDueAmount === 'number' && (
                      <span className="text-xs text-muted-foreground">
                        {formatCurrency(debt.nextDueAmount, debt.currency ?? defaultCurrency)} à régler
                      </span>
                    )}
                  </div>
                ) : (
                  '—'
                )}
              </TableCell>
              <TableCell>
                {debt.progressPct != null ? (
                  <div className="space-y-1">
                    <Progress value={debt.progressPct} className="h-1.5" />
                    <p className="text-xs text-muted-foreground">{Math.round(debt.progressPct)}%</p>
                  </div>
                ) : (
                  <span className="text-xs text-muted-foreground">—</span>
                )}
              </TableCell>
              <TableCell className="text-right font-semibold text-slate-900">
                {formatCurrency(debt.remainingPrincipal ?? 0, debt.currency ?? defaultCurrency)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

type DebtsBoardProps = {
  debts: DecoratedDebt[];
  formatCurrency: (value: number, currency?: string) => string;
  defaultCurrency: string;
  hasFiltersApplied: boolean;
};

function DebtsBoard({ debts, formatCurrency, defaultCurrency, hasFiltersApplied }: DebtsBoardProps) {
  if (debts.length === 0) {
    return (
      <div className="py-10">
        <DebtsEmptyState hasFiltersApplied={hasFiltersApplied} />
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {debts.map((debt) => (
        <Card key={debt.id} className="flex flex-col">
          <CardHeader className="space-y-1">
            <div className="flex items-center justify-between gap-2">
              <Link href={`/debts/${debt.id}`} className="font-semibold text-slate-900 hover:underline">
                {debt.title || 'Sans intitulé'}
              </Link>
              <Badge variant={STATUS_VARIANT[debt.status]}>{STATUS_LABEL[debt.status]}</Badge>
            </div>
            <p className="text-sm text-muted-foreground">{debt.counterparty || 'Contrepartie inconnue'}</p>
          </CardHeader>
          <CardContent className="mt-auto space-y-3 text-sm">
            <div className="flex items-center justify-between text-muted-foreground">
              <span>Capital restant</span>
              <span className="font-semibold text-slate-900">
                {formatCurrency(debt.remainingPrincipal ?? 0, debt.currency ?? defaultCurrency)}
              </span>
            </div>
            {debt.nextDueDateDate && (
              <div className="flex items-center justify-between text-muted-foreground">
                <span>Prochaine échéance</span>
                <div className="text-right">
                  <p className="font-semibold text-slate-900">{format(debt.nextDueDateDate, 'dd/MM/yyyy')}</p>
                  <p className="text-xs text-muted-foreground">{formatDueMessage(debt.dueInDays)}</p>
                </div>
              </div>
            )}
            <div className="flex items-center justify-between text-muted-foreground">
              <span>Risque</span>
              <Badge variant={RISK_VARIANT[debt.riskLevel]}>{RISK_LABEL[debt.riskLevel]}</Badge>
            </div>
            <div>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Progression</span>
                <span className="font-medium text-slate-900">
                  {debt.progressPct != null ? `${Math.round(debt.progressPct)}%` : '—'}
                </span>
              </div>
              <Progress value={debt.progressPct ?? 0} className="mt-1 h-1.5" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function DebtsEmptyState({ hasFiltersApplied }: { hasFiltersApplied: boolean }) {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-3 text-center">
      <Sparkles className="h-8 w-8 text-muted-foreground" />
      {hasFiltersApplied ? (
        <>
          <p>Aucune dette ne correspond aux filtres actifs. Ajustez vos critères ou effacez la recherche.</p>
          <Button variant="outline" asChild>
            <Link href="/debts/new">Créer une nouvelle dette</Link>
          </Button>
        </>
      ) : (
        <>
          <p>Vous n’avez pas encore enregistré de dettes. Créez votre premier dossier pour suivre les échéances.</p>
          <Button asChild>
            <Link href="/debts/new" className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Ajouter une dette
            </Link>
          </Button>
        </>
      )}
    </div>
  );
}

type CriticalDebtsCardProps = {
  debts: DecoratedDebt[];
  formatCurrency: (value: number, currency?: string) => string;
  fallbackCurrency: string;
};

function CriticalDebtsCard({ debts, formatCurrency, fallbackCurrency }: CriticalDebtsCardProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold text-slate-900">Échéances critiques</CardTitle>
        <CardDescription>Détectez les dossiers nécessitant une action immédiate.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {debts.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aucune alerte critique. Continuez à suivre vos échéances.</p>
        ) : (
          <ul className="space-y-4">
            {debts.map((debt) => (
              <li key={debt.id} className="rounded-lg border border-border p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <Link href={`/debts/${debt.id}`} className="font-medium text-slate-900 hover:underline">
                      {debt.title || 'Sans intitulé'}
                    </Link>
                    <p className="text-xs text-muted-foreground">
                      {formatDueMessage(debt.dueInDays)} • {debt.counterparty || 'Contrepartie inconnue'}
                    </p>
                  </div>
                  <Badge variant={RISK_VARIANT[debt.riskLevel]} className="flex items-center gap-1">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    {RISK_LABEL[debt.riskLevel]}
                  </Badge>
                </div>
                <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                  <span>{STATUS_LABEL[debt.status]}</span>
                  <span className="font-semibold text-slate-900">
                    {formatCurrency(debt.nextDueAmount ?? debt.remainingPrincipal ?? 0, debt.currency ?? fallbackCurrency)}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

type UpcomingTimelineCardProps = {
  debts: DecoratedDebt[];
  formatCurrency: (value: number, currency?: string) => string;
  fallbackCurrency: string;
};

function UpcomingTimelineCard({ debts, formatCurrency, fallbackCurrency }: UpcomingTimelineCardProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base font-semibold text-slate-900">Calendrier imminent</CardTitle>
            <CardDescription>Préparez les règlements attendus.</CardDescription>
          </div>
          <CalendarDays className="h-4 w-4 text-primary" />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {debts.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Aucune échéance proche. Pensez à maintenir vos échéanciers à jour.
          </p>
        ) : (
          <ul className="space-y-4">
            {debts.map((debt) => (
              <li key={debt.id} className="flex items-center justify-between gap-4">
                <div className="space-y-1">
                  <p className="font-medium text-slate-900">{debt.title || 'Sans intitulé'}</p>
                  <p className="text-xs text-muted-foreground">{formatDueMessage(debt.dueInDays)}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-slate-900">
                    {formatCurrency(debt.nextDueAmount ?? debt.remainingPrincipal ?? 0, debt.currency ?? fallbackCurrency)}
                  </p>
                  {debt.nextDueDateDate && (
                    <p className="text-xs text-muted-foreground">{format(debt.nextDueDateDate, 'dd/MM/yyyy')}</p>
                  )}
                  <Badge variant={STATUS_VARIANT[debt.status]} className="mt-1">
                    {STATUS_LABEL[debt.status]}
                  </Badge>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

type StatusBreakdownCardProps = {
  counts: Record<StatusFilterValue, number>;
  total: number;
};

function StatusBreakdownCard({ counts, total }: StatusBreakdownCardProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold text-slate-900">Répartition par statut</CardTitle>
        <CardDescription>Analyse rapide de la composition du portefeuille.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {STATUS_FILTERS.slice(1).map((option) => {
          const count = counts[option.value] ?? 0;
          const ratio = total === 0 ? 0 : Math.round((count / total) * 100);
          return (
            <div key={option.value} className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>{option.label}</span>
                <span className="font-medium text-slate-900">{count}</span>
              </div>
              <Progress value={ratio} aria-valuetext={`${ratio}%`} />
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

function buildCurrencyFormatter(locale: string, fallbackCurrency: string) {
  const cache = new Map<string, Intl.NumberFormat>();
  return (value: number, currency?: string) => {
    const targetCurrency = currency ?? fallbackCurrency;
    if (!cache.has(targetCurrency)) {
      cache.set(targetCurrency, new Intl.NumberFormat(locale, { style: 'currency', currency: targetCurrency }));
    }
    return cache.get(targetCurrency)!.format(value ?? 0);
  };
}

function coerceDate(value: Debt['nextDueDate'] | Debt['createdAt'] | undefined | null): Date | null {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value === 'string') {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }
  const maybeTimestamp = value as { toDate?: () => Date };
  if (maybeTimestamp?.toDate) {
    try {
      return maybeTimestamp.toDate();
    } catch (error) {
      console.warn('[debts] unable to convert timestamp', error);
      return null;
    }
  }
  return null;
}

function decorateDebts(debts: Debt[]): DecoratedDebt[] {
  const now = new Date();
  return debts.map((debt) => {
    const createdAtDate = coerceDate(debt.createdAt);
    const nextDueDateDate = coerceDate(debt.nextDueDate);
    const dueInDays = nextDueDateDate ? differenceInCalendarDays(nextDueDateDate, now) : null;
    const progressPct =
      typeof debt.principalInitial === 'number' && debt.principalInitial > 0
        ? Math.min(
            100,
            Math.max(0, ((debt.principalInitial - (debt.remainingPrincipal ?? 0)) / debt.principalInitial) * 100)
          )
        : null;

    return {
      ...debt,
      createdAtDate,
      nextDueDateDate,
      dueInDays,
      riskLevel: deriveRiskLevel(debt.status, dueInDays),
      progressPct,
    };
  });
}

function deriveRiskLevel(status: Debt['status'], dueInDays: number | null): RiskLevel {
  if (status === 'EN_RETARD') return 'high';
  if (dueInDays === null) return 'none';
  if (dueInDays < 0) return 'high';
  if (dueInDays <= 3) return 'high';
  if (dueInDays <= 7) return 'medium';
  return 'low';
}

function deriveMetrics(debts: DecoratedDebt[]): NumericMetrics {
  if (debts.length === 0) {
    return { outstanding: 0, initial: 0, lateCount: 0, upcomingCount: 0, averageRate: null };
  }

  const totals = debts.reduce(
    (acc, debt) => {
      acc.outstanding += debt.remainingPrincipal ?? 0;
      acc.initial += debt.principalInitial ?? 0;
      if (debt.status === 'EN_RETARD') {
        acc.lateCount += 1;
      }
      if (debt.nextDueDateDate) {
        acc.upcomingCount += 1;
      }
      acc.sumRate += debt.annualRate ?? 0;
      return acc;
    },
    { outstanding: 0, initial: 0, lateCount: 0, upcomingCount: 0, sumRate: 0 }
  );

  return {
    outstanding: totals.outstanding,
    initial: totals.initial,
    lateCount: totals.lateCount,
    upcomingCount: totals.upcomingCount,
    averageRate: totals.sumRate / debts.length,
  };
}

function sortDebts(debts: DecoratedDebt[]): DecoratedDebt[] {
  const riskOrder: Record<RiskLevel, number> = { high: 0, medium: 1, low: 2, none: 3 };
  return [...debts].sort((a, b) => {
    const riskDiff = riskOrder[a.riskLevel] - riskOrder[b.riskLevel];
    if (riskDiff !== 0) return riskDiff;

    const aDue = a.nextDueDateDate?.getTime() ?? Number.POSITIVE_INFINITY;
    const bDue = b.nextDueDateDate?.getTime() ?? Number.POSITIVE_INFINITY;
    if (aDue !== bDue) {
      return aDue - bDue;
    }

    const aCreated = a.createdAtDate?.getTime() ?? 0;
    const bCreated = b.createdAtDate?.getTime() ?? 0;
    return bCreated - aCreated;
  });
}

function formatDueMessage(dueInDays: number | null) {
  if (dueInDays === null) return 'Échéance non définie';
  if (dueInDays < -1) return `En retard de ${Math.abs(dueInDays)} jours`;
  if (dueInDays === -1) return 'En retard depuis hier';
  if (dueInDays === 0) return "Échéance aujourd'hui";
  if (dueInDays === 1) return 'Échéance demain';
  return `Dans ${dueInDays} jours`;
}

function computeStatusCounts(debts: DecoratedDebt[]): Record<StatusFilterValue, number> {
  const counts: Record<StatusFilterValue, number> = {
    ALL: debts.length,
    EN_COURS: 0,
    EN_RETARD: 0,
    RESTRUCTUREE: 0,
    SOLDEE: 0,
  };

  for (const debt of debts) {
    counts[debt.status] += 1;
  }

  return counts;
}

function computeRiskCounts(debts: DecoratedDebt[]): Record<RiskFilterValue, number> {
  const counts: Record<RiskFilterValue, number> = {
    ALL: debts.length,
    high: 0,
    medium: 0,
    low: 0,
    none: 0,
  };

  for (const debt of debts) {
    counts[debt.riskLevel] += 1;
  }

  return counts;
}

function computeTypeCounts(debts: DecoratedDebt[]): Record<TypeFilterValue, number> {
  const counts: Record<TypeFilterValue, number> = {
    ALL: debts.length,
    EMPRUNT: 0,
    PRET: 0,
  };

  for (const debt of debts) {
    counts[debt.type] += 1;
  }

  return counts;
}
