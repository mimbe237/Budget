'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  collection,
  doc,
  orderBy,
  query,
  where,
  setDoc,
} from 'firebase/firestore';
import {
  useCollection,
  useDoc,
  useFirestore,
  useMemoFirebase,
  useUser,
} from '@/firebase';
import { AppLayout } from '@/components/dashboard/dashboard-client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import type { Debt, DebtPayment, DebtSchedule } from '@/types/debt';
import {
  buildDebtSchedule,
  getDebtSummary,
  recordDebtPayment,
  restructureDebt,
  simulateDebtPrepayment,
  applyDebtPrepayment,
  uploadDebtContract,
} from '@/lib/debts/api';
import { downloadCSV, generateFilename } from '@/lib/export-utils';
import { format, endOfMonth, startOfMonth, isWithinInterval } from 'date-fns';
import { fr as frLocale } from 'date-fns/locale';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  AlarmClock,
  AlertTriangle,
  BarChart3,
  Bell,
  Download,
  FileSpreadsheet,
  FileText,
  Loader2,
  Percent,
  Upload,
  Wallet,
} from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { useNotifications } from '@/hooks/use-notifications';
import Link from 'next/link';
import {
  ResponsiveContainer,
  ComposedChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Bar,
  Line,
} from 'recharts';
import { formatDistanceStrict } from 'date-fns';

const paymentSchema = z.object({
  amount: z.number().positive(),
  paidAt: z.string(),
  method: z.enum(['virement', 'especes', 'carte', 'autre']),
  scheduleId: z.string().optional(),
  sourceAccountId: z.string().optional(),
});

const prepaymentSchema = z.object({
  amount: z.number().positive(),
  date: z.string(),
  mode: z.enum(['RE-AMORTIR', 'RACCOURCIR_DUREE']),
});

const restructureSchema = z.object({
  title: z.string().min(2),
  principalInitial: z.number().positive(),
  annualRate: z.number().min(0),
  totalPeriods: z.number().int().positive(),
  frequency: z.enum(['MENSUEL', 'HEBDOMADAIRE', 'ANNUEL']),
  amortizationMode: z.enum(['ANNUITE', 'PRINCIPAL_CONSTANT', 'INTEREST_ONLY', 'BALLOON']),
  startDate: z.string(),
  monthlyInsurance: z.number().min(0),
  gracePeriods: z.number().int().min(0),
  balloonPct: z.number().min(0).max(1),
});

const statusColors: Record<Debt['status'], string> = {
  EN_COURS: 'bg-blue-100 text-blue-700',
  EN_RETARD: 'bg-red-100 text-red-700',
  RESTRUCTUREE: 'bg-amber-100 text-amber-700',
  SOLDEE: 'bg-emerald-100 text-emerald-700',
};

const methodLabels: Record<DebtPayment['method'], string> = {
  virement: 'Virement',
  especes: 'Espèces',
  carte: 'Carte',
  autre: 'Autre',
};

const modeLabels: Record<Debt['amortizationMode'], string> = {
  ANNUITE: 'Mensualité constante',
  PRINCIPAL_CONSTANT: 'Principal constant',
  INTEREST_ONLY: 'Intérêts seuls',
  BALLOON: 'Balloon',
};

type DebtAlertPreferences = {
  pushEnabled?: boolean;
  emailEnabled?: boolean;
  reminderLeadDays?: number;
  updatedAt?: string;
};

type AmortizationDatum = {
  date: string;
  remainingPrincipal: number;
  principalPaid: number;
  interestPaid: number;
  totalDue: number;
};

function toDate(value: any): Date {
  if (!value) return new Date();
  if (value?.toDate) return value.toDate();
  return new Date(value);
}

function formatCurrency(value: number, currency = 'EUR', locale = 'fr-FR') {
  return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(value);
}

function DebtDetailContent() {
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const router = useRouter();
  const { toast } = useToast();
  const { user, userProfile } = useUser();
  const firestore = useFirestore();
  const {
    permission,
    requestPermission,
    isSupported: notificationsSupported,
    error: notificationsError,
  } = useNotifications();

  const debtRef = useMemoFirebase(() => {
    if (!firestore || !id || !user) return null;
    return doc(firestore, `users/${user.uid}/debts`, id);
  }, [firestore, id, user]);

  const { data: debt, isLoading: debtLoading } = useDoc<Debt>(debtRef);

  const schedulesQuery = useMemoFirebase(() => {
    if (!firestore || !id) return null;
    return query(
      collection(firestore, 'debtSchedules'),
      where('debtId', '==', id),
      orderBy('periodIndex', 'asc')
    );
  }, [firestore, id]);
  const { data: schedules, isLoading: schedulesLoading } = useCollection<DebtSchedule>(schedulesQuery);

  const paymentsQuery = useMemoFirebase(() => {
    if (!firestore || !id) return null;
    return query(
      collection(firestore, 'debtPayments'),
      where('debtId', '==', id),
      orderBy('paidAt', 'desc')
    );
  }, [firestore, id]);
  const { data: payments, isLoading: paymentsLoading } = useCollection<DebtPayment>(paymentsQuery);

  const [summary, setSummary] = useState<Awaited<ReturnType<typeof getDebtSummary>> | null>(null);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [savingAlertPrefs, setSavingAlertPrefs] = useState(false);

  useEffect(() => {
    let active = true;
    const load = async () => {
      if (!id) return;
      setLoadingSummary(true);
      try {
        const data = await getDebtSummary(id);
        if (active) setSummary(data);
      } catch (error) {
        console.error(error);
      } finally {
        if (active) setLoadingSummary(false);
      }
    };
    load();
    return () => {
      active = false;
    };
  }, [id]);

  const paymentForm = useForm<z.infer<typeof paymentSchema>>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      amount: 500,
      paidAt: format(new Date(), 'yyyy-MM-dd'),
      method: 'virement',
      scheduleId: undefined,
      sourceAccountId: '',
    },
  });

  const prepaymentForm = useForm<z.infer<typeof prepaymentSchema>>({
    resolver: zodResolver(prepaymentSchema),
    defaultValues: {
      amount: 1000,
      date: format(new Date(), 'yyyy-MM-dd'),
      mode: 'RE-AMORTIR',
    },
  });

  const restructureForm = useForm<z.infer<typeof restructureSchema>>({
    resolver: zodResolver(restructureSchema),
  });

  const [isPaymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [isRestructureDialogOpen, setRestructureDialogOpen] = useState(false);
  const [isRestructuring, setRestructuring] = useState(false);
  const [prepaymentResult, setPrepaymentResult] = useState<Awaited<ReturnType<typeof simulateDebtPrepayment>> | null>(null);
  const [isApplyingPrepayment, setApplyingPrepayment] = useState(false);
  const [isContractUploading, setContractUploading] = useState(false);
  const alertDocRef = useMemoFirebase(() => {
    if (!firestore || !user || !id) return null;
    return doc(firestore, `users/${user.uid}/debtAlerts`, id);
  }, [firestore, user, id]);
  const { data: alertPrefs } = useDoc<DebtAlertPreferences>(alertDocRef);

  useEffect(() => {
    if (debt) {
      restructureForm.reset({
        title: `${debt.title} (restructurée)`,
        principalInitial: Math.max(0, debt.remainingPrincipal ?? debt.principalInitial),
        annualRate: debt.annualRate,
        totalPeriods: debt.totalPeriods,
        frequency: debt.frequency,
        amortizationMode: debt.amortizationMode,
        startDate: format(new Date(), 'yyyy-MM-dd'),
        monthlyInsurance: debt.monthlyInsurance ?? 0,
        gracePeriods: debt.gracePeriods ?? 0,
        balloonPct: debt.balloonPct ?? 0,
      });
    }
  }, [debt, restructureForm]);

  const locale = userProfile?.locale || 'fr-FR';
  const currency = debt?.currency || userProfile?.displayCurrency || 'EUR';

  if (debtLoading || !debt) {
    return (
      <AppLayout>
        <div className="space-y-4">
          <Skeleton className="h-10 w-1/3" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-[400px] w-full" />
        </div>
      </AppLayout>
    );
  }

  const upcomingSchedules = (schedules || []).filter((line) => line.status !== 'PAYEE');
  const nextInstallment = upcomingSchedules[0];
  const paymentsList = payments ?? [];
  const schedulesList = schedules ?? [];

  const monthlyMetrics = useMemo(() => {
    if (!paymentsList.length) {
      return { interest: 0, principal: 0, total: 0, count: 0 };
    }
    const now = new Date();
    const start = startOfMonth(now);
    const end = endOfMonth(now);
    let interest = 0;
    let principal = 0;
    let count = 0;
    paymentsList.forEach((payment) => {
      const paidAt = toDate(payment.paidAt);
      if (isWithinInterval(paidAt, { start, end })) {
        interest += payment.allocation?.interests ?? 0;
        principal += payment.allocation?.principal ?? 0;
        count += 1;
      }
    });
    return { interest, principal, total: interest + principal, count };
  }, [paymentsList]);

  const lateSchedulesCount = useMemo(
    () =>
      schedulesList.filter(
        (line) => line.status === 'EN_RETARD' || line.status === 'PARTIEL',
      ).length,
    [schedulesList],
  );

  const nextInstallments = useMemo(() => {
    if (summary?.nextInstallments?.length) {
      return summary.nextInstallments.slice(0, 3).map((item) => ({
        dueDate: toDate(item.dueDate),
        amount: item.totalDue ?? 0,
        status: item.status,
      }));
    }
    return upcomingSchedules.slice(0, 3).map((item) => ({
      dueDate: toDate(item.dueDate),
      amount: item.totalDue,
      status: item.status,
    }));
  }, [summary?.nextInstallments, upcomingSchedules]);

  const dtiPercent =
    summary?.debtToIncomeRatio != null ? summary.debtToIncomeRatio * 100 : null;
  const hasLateInstallment = Boolean(summary?.hasLateInstallments) || lateSchedulesCount > 0;

  const amortizationData = useMemo<AmortizationDatum[]>(() => {
    if (!schedulesList.length && !paymentsList.length) return [];
    const scheduleMap = new Map<
      string,
      { remainingPrincipalAfter?: number; totalDue: number }
    >();
    schedulesList.forEach((line) => {
      const key = format(toDate(line.dueDate), 'yyyy-MM-dd');
      scheduleMap.set(key, {
        remainingPrincipalAfter: line.remainingPrincipalAfter ?? undefined,
        totalDue: line.totalDue,
      });
    });
    const paymentMap = new Map<string, { principal: number; interest: number }>();
    paymentsList.forEach((payment) => {
      const key = format(toDate(payment.paidAt), 'yyyy-MM-dd');
      const entry = paymentMap.get(key) ?? { principal: 0, interest: 0 };
      entry.principal += payment.allocation?.principal ?? 0;
      entry.interest += payment.allocation?.interests ?? 0;
      paymentMap.set(key, entry);
    });
    const allDates = Array.from(new Set([...scheduleMap.keys(), ...paymentMap.keys()])).sort(
      (a, b) => new Date(a).getTime() - new Date(b).getTime(),
    );
    let currentRemaining =
      summary?.remainingPrincipal ?? debt.remainingPrincipal ?? debt.principalInitial;
    return allDates.map((date) => {
      const scheduleEntry = scheduleMap.get(date);
      if (scheduleEntry && typeof scheduleEntry.remainingPrincipalAfter === 'number') {
        currentRemaining = scheduleEntry.remainingPrincipalAfter;
      }
      const paymentEntry = paymentMap.get(date);
      return {
        date,
        remainingPrincipal: currentRemaining,
        principalPaid: paymentEntry?.principal ?? 0,
        interestPaid: paymentEntry?.interest ?? 0,
        totalDue: scheduleEntry?.totalDue ?? 0,
      };
    });
  }, [
    schedulesList,
    paymentsList,
    summary?.remainingPrincipal,
    debt.remainingPrincipal,
    debt.principalInitial,
  ]);

  const pushEnabled = alertPrefs?.pushEnabled ?? false;
  const emailEnabled = alertPrefs?.emailEnabled ?? false;
  const reminderLeadDays = alertPrefs?.reminderLeadDays ?? 3;

  const reportHref = useMemo(() => {
    const now = new Date();
    const params = new URLSearchParams({
      includeDebt: '1',
      debtId: debt.id,
      from: format(startOfMonth(now), 'yyyy-MM-dd'),
      to: format(endOfMonth(now), 'yyyy-MM-dd'),
    });
    return `/reports?${params.toString()}`;
  }, [debt.id]);

  const handlePrint = () => {
    window.print();
  };

  const handleExportExcel = async () => {
    try {
      const xlsx = await import('xlsx');
      const workbook = xlsx.utils.book_new();

      const overviewData = [
        ['DETTE', debt.title],
        ['Type', debt.type],
        ['Contrepartie', debt.counterparty ?? '—'],
        ['Devise', currency],
        ['Capital initial', formatCurrency(debt.principalInitial, currency, locale)],
        ['Capital restant dû', formatCurrency(summary?.remainingPrincipal ?? debt.remainingPrincipal ?? 0, currency, locale)],
        ['Taux annuel', `${(debt.annualRate * 100).toFixed(2)}%`],
        ['Périodes totales', `${debt.totalPeriods}`],
        ['Périodes restantes', `${schedulesList.length}`],
        ['Intérêts payés', formatCurrency(summary?.totalInterestsPaid ?? 0, currency, locale)],
        ['Intérêts planifiés restants', formatCurrency(summary?.totalInterestsPlanned ?? 0, currency, locale)],
        ['Service dette (mois en cours)', formatCurrency(monthlyMetrics.total, currency, locale)],
        ['Intérêts mois en cours', formatCurrency(monthlyMetrics.interest, currency, locale)],
        ['Principal mois en cours', formatCurrency(monthlyMetrics.principal, currency, locale)],
        ['Retards détectés', `${lateSchedulesCount}`],
        ['DTI', dtiPercent != null ? `${dtiPercent.toFixed(1)}%` : 'N/A'],
      ];
      const wsOverview = xlsx.utils.aoa_to_sheet(overviewData);
      xlsx.utils.book_append_sheet(workbook, wsOverview, 'Aperçu');

      const scheduleSheetData = [
        ['Échéancier'],
        [],
        ['Période', 'Date', 'Principal dû', 'Intérêt dû', 'Assurance', 'Total dû', 'Total payé', 'Statut'],
        ...schedulesList.map((line) => [
          line.periodIndex,
          format(toDate(line.dueDate), 'dd/MM/yyyy'),
          line.principalDue,
          line.interestDue,
          line.insuranceDue,
          line.totalDue,
          line.totalPaid,
          line.status,
        ]),
      ];
      const wsSchedule = xlsx.utils.aoa_to_sheet(scheduleSheetData);
      xlsx.utils.book_append_sheet(workbook, wsSchedule, 'Échéancier');

      const paymentsSheetData = [
        ['Paiements'],
        [],
        ['Date', 'Montant', 'Principal', 'Intérêts', 'Frais', 'Assurance', 'Méthode'],
        ...paymentsList.map((payment) => [
          format(toDate(payment.paidAt), 'dd/MM/yyyy'),
          payment.amount,
          payment.allocation?.principal ?? 0,
          payment.allocation?.interests ?? 0,
          payment.allocation?.fees ?? 0,
          payment.allocation?.insurance ?? 0,
          payment.method,
        ]),
      ];
      const wsPayments = xlsx.utils.aoa_to_sheet(paymentsSheetData);
      xlsx.utils.book_append_sheet(workbook, wsPayments, 'Paiements');

      if (amortizationData.length) {
        const chartSheetData = [
          ['Historique'],
          [],
          ['Date', 'Principal restant', 'Principal payé', 'Intérêts payés', 'Due théorique'],
          ...amortizationData.map((entry) => [
            entry.date,
            entry.remainingPrincipal,
            entry.principalPaid,
            entry.interestPaid,
            entry.totalDue,
          ]),
        ];
        const wsHistory = xlsx.utils.aoa_to_sheet(chartSheetData);
        xlsx.utils.book_append_sheet(workbook, wsHistory, 'Historique');
      }

      const filename = generateFilename(`dette-${debt.title}`, 'xlsx');
      xlsx.writeFile(workbook, filename);
      toast({ title: 'Export Excel généré' });
    } catch (error: any) {
      toast({
        title: 'Erreur export Excel',
        description: error?.message ?? 'Impossible de générer le fichier Excel.',
        variant: 'destructive',
      });
    }
  };

  const handleExportCSV = () => {
    try {
      const lines: string[] = [];
      lines.push('Section,Libellé,Valeur');
      lines.push(`Aperçu,Titre,"${debt.title}"`);
      lines.push(`Aperçu,Capital restant dû,"${formatCurrency(summary?.remainingPrincipal ?? debt.remainingPrincipal ?? 0, currency, locale)}"`);
      lines.push(`Aperçu,Taux annuel,${(debt.annualRate * 100).toFixed(2)}%`);
      lines.push(`Aperçu,Service dette (mois en cours),"${formatCurrency(monthlyMetrics.total, currency, locale)}"`);
      lines.push(`Aperçu,Intérêts mois en cours,"${formatCurrency(monthlyMetrics.interest, currency, locale)}"`);
      lines.push(`Aperçu,Retards,${lateSchedulesCount}`);
      if (dtiPercent != null) {
        lines.push(`Aperçu,DTI,${dtiPercent.toFixed(1)}%`);
      }
      lines.push('');
      lines.push('Échéancier,Période,Date,Principal dû,Intérêt dû,Assurance,Total dû,Total payé,Statut');
      schedulesList.forEach((line) => {
        lines.push(
          `Échéancier,#${line.periodIndex},${format(toDate(line.dueDate), 'dd/MM/yyyy')},${line.principalDue.toFixed(
            2,
          )},${line.interestDue.toFixed(2)},${line.insuranceDue.toFixed(2)},${line.totalDue.toFixed(
            2,
          )},${line.totalPaid.toFixed(2)},${line.status}`,
        );
      });
      lines.push('');
      lines.push('Paiements,Date,Montant,Principal,Intérêts,Frais,Assurance,Méthode');
      paymentsList.forEach((payment) => {
        lines.push(
          `Paiements,${format(toDate(payment.paidAt), 'dd/MM/yyyy')},${payment.amount.toFixed(2)},${(
            payment.allocation?.principal ?? 0
          ).toFixed(2)},${(payment.allocation?.interests ?? 0).toFixed(2)},${(
            payment.allocation?.fees ?? 0
          ).toFixed(2)},${(payment.allocation?.insurance ?? 0).toFixed(2)},${payment.method}`,
        );
      });

      if (amortizationData.length) {
        lines.push('');
        lines.push('Historique,Date,Principal restant,Principal payé,Intérêts payés,Due théorique');
        amortizationData.forEach((entry) => {
          lines.push(
            `Historique,${entry.date},${entry.remainingPrincipal.toFixed(2)},${entry.principalPaid.toFixed(
              2,
            )},${entry.interestPaid.toFixed(2)},${entry.totalDue.toFixed(2)}`,
          );
        });
      }

      const filename = generateFilename(`dette-${debt.title}`, 'csv');
      downloadCSV(lines.join('\n'), filename);
      toast({ title: 'Export CSV généré' });
    } catch (error: any) {
      toast({
        title: 'Erreur export CSV',
        description: error?.message ?? 'Export CSV impossible.',
        variant: 'destructive',
      });
    }
  };

  const handlePaymentSubmit = async (values: z.infer<typeof paymentSchema>) => {
    try {
      await recordDebtPayment({
        debtId: debt.id,
        amount: values.amount,
        paidAt: values.paidAt,
        currency,
        method: values.method,
        scheduleId: values.scheduleId,
        sourceAccountId: values.sourceAccountId,
      });
      toast({ title: 'Paiement enregistré' });
      setPaymentDialogOpen(false);
      paymentForm.reset();
      const refreshed = await getDebtSummary(debt.id);
      setSummary(refreshed);
    } catch (error: any) {
      toast({ title: 'Erreur', description: error?.message ?? 'Impossible d’enregistrer le paiement.', variant: 'destructive' });
    }
  };

  const handleSimulate = async (values: z.infer<typeof prepaymentSchema>) => {
    try {
      const result = await simulateDebtPrepayment({ ...values, debtId: debt.id });
      setPrepaymentResult(result);
    } catch (error: any) {
      toast({ title: 'Erreur', description: error?.message ?? 'Simulation impossible.', variant: 'destructive' });
    }
  };

  const handleApplyPrepayment = async () => {
    if (!prepaymentResult) return;
    setApplyingPrepayment(true);
    try {
      const values = prepaymentForm.getValues();
      await applyDebtPrepayment({ ...values, debtId: debt.id });
      toast({ title: 'Remboursement anticipé appliqué' });
      setPrepaymentResult(null);
      const refreshed = await getDebtSummary(debt.id);
      setSummary(refreshed);
    } catch (error: any) {
      toast({ title: 'Erreur', description: error?.message ?? 'Échec du remboursement anticipé.', variant: 'destructive' });
    } finally {
      setApplyingPrepayment(false);
    }
  };

  const handleContractUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setContractUploading(true);
    try {
      await uploadDebtContract(debt.id, file);
      toast({ title: 'Contrat téléversé' });
    } catch (error: any) {
      toast({ title: 'Erreur', description: error?.message ?? 'Téléversement impossible.', variant: 'destructive' });
    } finally {
      setContractUploading(false);
    }
  };

  const handleRestructure = async (values: z.infer<typeof restructureSchema>) => {
    setRestructuring(true);
    try {
      const result = await restructureDebt({
        debtId: debt.id,
        newTerms: {
          title: values.title,
          type: debt.type,
          counterparty: debt.counterparty ?? null,
          currency: debt.currency,
          principalInitial: values.principalInitial,
          annualRate: values.annualRate,
          rateType: debt.rateType,
          amortizationMode: values.amortizationMode,
          totalPeriods: values.totalPeriods,
          frequency: values.frequency,
          startDate: values.startDate,
          gracePeriods: values.gracePeriods,
          balloonPct: values.balloonPct,
          upfrontFees: debt.upfrontFees ?? 0,
          monthlyInsurance: values.monthlyInsurance,
          prepaymentPenaltyPct: debt.prepaymentPenaltyPct ?? 0,
          variableIndexCode: debt.variableIndexCode ?? null,
          variableMarginBps: debt.variableMarginBps ?? null,
          recalcEachPeriod: debt.recalcEachPeriod ?? false,
        },
      });
      await buildDebtSchedule(result.newDebtId);
      toast({ title: 'Dette restructurée', description: 'Une nouvelle dette a été créée avec le nouveau plan.' });
      setRestructureDialogOpen(false);
      router.push(`/debts/${result.newDebtId}`);
    } catch (error: any) {
      toast({ title: 'Erreur', description: error?.message ?? 'Restructuration impossible.', variant: 'destructive' });
    } finally {
      setRestructuring(false);
    }
  };

  const handleAlertUpdate = async (patch: Partial<DebtAlertPreferences>) => {
    if (!alertDocRef) return;
    setSavingAlertPrefs(true);
    try {
      await setDoc(
        alertDocRef,
        {
          reminderLeadDays: alertPrefs?.reminderLeadDays ?? 3,
          pushEnabled: alertPrefs?.pushEnabled ?? false,
          emailEnabled: alertPrefs?.emailEnabled ?? false,
          ...patch,
          updatedAt: new Date().toISOString(),
        },
        { merge: true },
      );
      toast({
        title: 'Préférences mises à jour',
        description: 'Vos alertes pour cette dette sont enregistrées.',
      });
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: error?.message ?? 'Impossible de mettre à jour les alertes.',
        variant: 'destructive',
      });
    } finally {
      setSavingAlertPrefs(false);
    }
  };

  const handleToggleAlert = async (field: 'pushEnabled' | 'emailEnabled', value: boolean) => {
    if (
      field === 'pushEnabled' &&
      value &&
      notificationsSupported &&
      permission !== 'granted'
    ) {
      const token = await requestPermission();
      if (!token) {
        toast({
          title: 'Notifications refusées',
          description:
            'Activez les notifications dans votre navigateur pour recevoir les rappels automatiques.',
          variant: 'destructive',
        });
        return;
      }
    }
    await handleAlertUpdate({ [field]: value });
  };

  const handleReminderLeadChange = async (value: number) => {
    await handleAlertUpdate({ reminderLeadDays: value });
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{debt.title}</h1>
            <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <Badge className={statusColors[debt.status]}>{debt.status}</Badge>
              <span>Type&nbsp;: {debt.type}</span>
              <span>Mode&nbsp;: {modeLabels[debt.amortizationMode]}</span>
              <span>Taux&nbsp;: {(debt.annualRate * 100).toFixed(2)}%</span>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" onClick={handlePrint}>
              <FileText className="mr-2 h-4 w-4" />
              Imprimer / PDF
            </Button>
            <Button variant="outline" onClick={handleExportExcel}>
              <FileSpreadsheet className="mr-2 h-4 w-4" />
              Export Excel
            </Button>
            <Button variant="outline" onClick={handleExportCSV}>
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
            <Button asChild variant="secondary">
              <Link href={reportHref} prefetch={false}>
                Voir dans les rapports
              </Link>
            </Button>
            <Separator orientation="vertical" className="hidden h-6 md:block" />
            <Dialog open={isPaymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
              <DialogTrigger asChild>
                <Button>Enregistrer un paiement</Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                  <DialogTitle>Nouveau paiement</DialogTitle>
                  <DialogDescription>
                    Alloue automatiquement le montant selon l’ordre frais → intérêts → assurance → principal.
                  </DialogDescription>
                </DialogHeader>
                <Form {...paymentForm}>
                  <form className="grid gap-4" onSubmit={paymentForm.handleSubmit(handlePaymentSubmit)}>
                    <FormField
                      control={paymentForm.control}
                      name="amount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Montant</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.01"
                              value={field.value ?? ''}
                              onChange={(event) => field.onChange(Number(event.target.value))}
                              required
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="grid gap-4 md:grid-cols-2">
                      <FormField
                        control={paymentForm.control}
                        name="paidAt"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Date</FormLabel>
                            <FormControl>
                              <Input type="date" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={paymentForm.control}
                        name="method"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Méthode</FormLabel>
                            <Select value={field.value} onValueChange={field.onChange}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="virement">Virement</SelectItem>
                                <SelectItem value="especes">Espèces</SelectItem>
                                <SelectItem value="carte">Carte</SelectItem>
                                <SelectItem value="autre">Autre</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <FormField
                      control={paymentForm.control}
                      name="scheduleId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Associer à l’échéance</FormLabel>
                          <Select
                            value={field.value ?? ''}
                            onValueChange={(value) => field.onChange(value || undefined)}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Allocation automatique" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="">Allocation automatique</SelectItem>
                              {(schedules || []).map((line) => (
                                <SelectItem key={line.id} value={line.id}>
                                  Période #{line.periodIndex} • dû {format(toDate(line.dueDate), 'dd/MM/yyyy')}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={paymentForm.control}
                      name="sourceAccountId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Compte source (facultatif)</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <DialogFooter>
                      <Button type="submit">Enregistrer</Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>

            <label className="inline-flex items-center">
              <input
                type="file"
                accept="application/pdf"
                className="hidden"
                onChange={handleContractUpload}
                disabled={isContractUploading}
              />
              <Button asChild variant="outline" disabled={isContractUploading}>
                <span>
                  {isContractUploading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Upload className="mr-2 h-4 w-4" />
                  )}
                  Contrat PDF
                </span>
              </Button>
            </label>

            <Dialog open={isRestructureDialogOpen} onOpenChange={setRestructureDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">Restructurer</Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Restructurer la dette</DialogTitle>
                  <DialogDescription>
                    Génère une nouvelle dette avec un nouvel échéancier tout en archivant celle-ci comme restructurée.
                  </DialogDescription>
                </DialogHeader>
                <Form {...restructureForm}>
                  <form className="grid gap-4" onSubmit={restructureForm.handleSubmit(handleRestructure)}>
                    <div className="grid gap-4 md:grid-cols-2">
                      <FormField
                        control={restructureForm.control}
                        name="title"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nom</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={restructureForm.control}
                        name="principalInitial"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nouveau principal</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                step="0.01"
                                value={field.value ?? ''}
                                onChange={(event) => field.onChange(Number(event.target.value))}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={restructureForm.control}
                        name="annualRate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Taux annuel (%)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                step="0.001"
                                value={(field.value * 100).toFixed(3)}
                                onChange={(event) => field.onChange(Number(event.target.value) / 100)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={restructureForm.control}
                        name="totalPeriods"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Périodes</FormLabel>
                            <FormControl>
                              <Input type="number" min={1} {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={restructureForm.control}
                        name="frequency"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Fréquence</FormLabel>
                            <Select value={field.value} onValueChange={field.onChange}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="MENSUEL">Mensuelle</SelectItem>
                                <SelectItem value="HEBDOMADAIRE">Hebdomadaire</SelectItem>
                                <SelectItem value="ANNUEL">Annuelle</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={restructureForm.control}
                        name="amortizationMode"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Mode</FormLabel>
                            <Select value={field.value} onValueChange={field.onChange}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="ANNUITE">Mensualité constante</SelectItem>
                                <SelectItem value="PRINCIPAL_CONSTANT">Principal constant</SelectItem>
                                <SelectItem value="INTEREST_ONLY">Intérêts seuls</SelectItem>
                                <SelectItem value="BALLOON">Balloon</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={restructureForm.control}
                        name="gracePeriods"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Différé</FormLabel>
                            <FormControl>
                              <Input type="number" min={0} {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={restructureForm.control}
                        name="balloonPct"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Balloon (%)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                step="0.01"
                                value={(field.value * 100).toFixed(2)}
                                onChange={(event) => field.onChange(Number(event.target.value) / 100)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={restructureForm.control}
                        name="monthlyInsurance"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Assurance périodique</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                step="0.01"
                                value={field.value ?? ''}
                                onChange={(event) => field.onChange(Number(event.target.value))}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={restructureForm.control}
                        name="startDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Date de départ</FormLabel>
                            <FormControl>
                              <Input type="date" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <DialogFooter>
                      <Button type="submit" disabled={isRestructuring}>
                        {isRestructuring ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        Confirmer
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Reste dû</CardTitle>
              <Wallet className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardContent>
              {loadingSummary ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <div className="text-2xl font-semibold">
                  {formatCurrency(summary?.remainingPrincipal ?? debt.remainingPrincipal ?? 0, currency, locale)}
                </div>
              )}
              <p className="text-xs text-muted-foreground">Capital restant après allocations</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Service dette (mois en cours)
              </CardTitle>
              <BarChart3 className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardContent>
              {loadingSummary ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <div className="text-2xl font-semibold">
                  {formatCurrency(monthlyMetrics.total, currency, locale)}
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                Principal&nbsp;: {formatCurrency(monthlyMetrics.principal, currency, locale)} ·
                Intérêts&nbsp;: {formatCurrency(monthlyMetrics.interest, currency, locale)}
              </p>
              <p className="text-xs text-muted-foreground">
                {monthlyMetrics.count > 0
                  ? `${monthlyMetrics.count} paiement(s) enregistré(s) ce mois-ci`
                  : 'Aucun paiement enregistré pour le moment'}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Intérêts sur la période
              </CardTitle>
              <Percent className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold">
                {formatCurrency(summary?.totalInterestsPaid ?? 0, currency, locale)}
              </div>
              <p className="text-xs text-muted-foreground">
                Total des intérêts déjà payés (toutes périodes)
              </p>
              <Separator className="my-2" />
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Intérêts restants estimés</span>
                <span className="font-semibold">
                  {formatCurrency(summary?.totalInterestsPlanned ?? 0, currency, locale)}
                </span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Risques & échéances
              </CardTitle>
              <AlarmClock className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <div className="text-xs text-muted-foreground">Prochaine échéance</div>
                <div className="text-lg font-semibold">
                  {nextInstallment
                    ? formatCurrency(
                        nextInstallment.totalDue - nextInstallment.totalPaid,
                        currency,
                        locale,
                      )
                    : '—'}
                </div>
                <div className="text-xs text-muted-foreground">
                  {nextInstallment
                    ? `Due le ${format(toDate(nextInstallment.dueDate), 'dd/MM/yyyy')}`
                    : 'Aucune échéance planifiée'}
                </div>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Échéances en retard</span>
                <Badge variant={lateSchedulesCount > 0 ? 'destructive' : 'outline'}>
                  {lateSchedulesCount}
                </Badge>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">DTI</span>
                <Badge variant="outline">
                  {dtiPercent != null ? `${dtiPercent.toFixed(1)}%` : 'N/A'}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="overview">
          <TabsList className="mb-4">
            <TabsTrigger value="overview">Aperçu</TabsTrigger>
            <TabsTrigger value="schedule">Échéancier</TabsTrigger>
            <TabsTrigger value="payments">Paiements</TabsTrigger>
            <TabsTrigger value="simulation">Simulations</TabsTrigger>
            <TabsTrigger value="contract">Contrat</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            {hasLateInstallment && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Échéances en retard détectées</AlertTitle>
                <AlertDescription>
                  Pensez à régulariser les échéances en retard pour éviter les pénalités et préserver votre scoring.
                </AlertDescription>
              </Alert>
            )}

            <div className="grid gap-4 lg:grid-cols-[2fr,1fr]">
              <Card>
                <CardHeader>
                  <CardTitle>Résumé</CardTitle>
                  <CardDescription>Informations clés et projection financière.</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-2">
                  <div>
                    <div className="text-sm text-muted-foreground">Contrepartie</div>
                    <div className="font-medium">{debt.counterparty || '—'}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Taux annuel</div>
                    <div className="font-medium">{(debt.annualRate * 100).toFixed(2)}%</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Périodes totales</div>
                    <div className="font-medium">{debt.totalPeriods}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Périodes de différé</div>
                    <div className="font-medium">{debt.gracePeriods ?? 0}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Assurance périodique</div>
                    <div className="font-medium">{formatCurrency(debt.monthlyInsurance ?? 0, currency, locale)}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Pénalité de remboursement anticipé</div>
                    <div className="font-medium">{((debt.prepaymentPenaltyPct ?? 0) * 100).toFixed(2)}%</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Intérêts déjà payés</div>
                    <div className="font-medium">{formatCurrency(summary?.totalInterestsPaid ?? 0, currency, locale)}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Intérêts restants estimés</div>
                    <div className="font-medium">{formatCurrency(summary?.totalInterestsPlanned ?? 0, currency, locale)}</div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-start justify-between">
                  <div>
                    <CardTitle>Alertes automatiques</CardTitle>
                    <CardDescription>Recevez un rappel avant les prochaines échéances.</CardDescription>
                  </div>
                  <Bell className="mt-1 h-5 w-5 text-primary" />
                </CardHeader>
                <CardContent className="space-y-4">
                  {notificationsSupported ? (
                    <>
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="text-sm font-medium">Notification push</div>
                          <p className="text-xs text-muted-foreground">
                            Alerte navigateur envoyée quelques jours avant l’échéance.
                          </p>
                        </div>
                        <Switch
                          checked={pushEnabled}
                          onCheckedChange={(checked) => handleToggleAlert('pushEnabled', checked)}
                          disabled={savingAlertPrefs}
                        />
                      </div>
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="text-sm font-medium">Notification e-mail</div>
                          <p className="text-xs text-muted-foreground">
                            Résumé des échéances envoyé à votre adresse principale.
                          </p>
                        </div>
                        <Switch
                          checked={emailEnabled}
                          onCheckedChange={(checked) => handleToggleAlert('emailEnabled', checked)}
                          disabled={savingAlertPrefs}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="reminder-lead" className="text-xs font-medium uppercase tracking-wide">
                          Préavis
                        </Label>
                        <Select
                          value={String(reminderLeadDays)}
                          onValueChange={(value) => handleReminderLeadChange(Number(value))}
                          disabled={savingAlertPrefs}
                        >
                          <SelectTrigger id="reminder-lead">
                            <SelectValue placeholder="Sélectionner" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1">1 jour avant</SelectItem>
                            <SelectItem value="3">3 jours avant</SelectItem>
                            <SelectItem value="7">7 jours avant</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      {notificationsError && (
                        <p className="text-xs text-destructive">
                          {notificationsError}
                        </p>
                      )}
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Les notifications ne sont pas supportées sur cet appareil. Configurez des rappels manuels.
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>

            <DebtAmortizationChart
              data={amortizationData}
              currency={currency}
              locale={locale}
              isFrench={(userProfile?.locale || 'fr-CM').startsWith('fr')}
            />

            <div className="grid gap-4 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Prochaines échéances</CardTitle>
                  <CardDescription>Trois prochaines échéances à surveiller.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {nextInstallments.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Aucune échéance planifiée.</p>
                  ) : (
                    nextInstallments.map((item, index) => {
                      const relative = formatDistanceStrict(new Date(), item.dueDate, {
                        addSuffix: true,
                        locale: locale.startsWith('fr') ? frLocale : undefined,
                      });
                      return (
                        <div
                          key={`${item.dueDate.toISOString()}-${index}`}
                          className="flex items-center justify-between rounded-md border p-3"
                        >
                          <div>
                            <div className="font-medium">
                              {formatCurrency(item.amount, currency, locale)}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {format(item.dueDate, 'dd MMM yyyy', { locale: locale.startsWith('fr') ? frLocale : undefined })}
                              {' '}
                              • {relative}
                            </div>
                          </div>
                          <Badge variant="outline">{item.status}</Badge>
                        </div>
                      );
                    })
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>État des retards</CardTitle>
                  <CardDescription>Liste des échéances à régulariser.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {lateSchedulesCount === 0 ? (
                    <p className="text-sm text-muted-foreground">Tout est à jour.</p>
                  ) : (
                    schedulesList
                      .filter((line) => line.status === 'EN_RETARD' || line.status === 'PARTIEL')
                      .map((line) => (
                        <div key={line.id} className="rounded-md border border-red-200 bg-red-50 p-3 text-sm">
                          <div className="flex items-center justify-between">
                            <span className="font-medium">Période #{line.periodIndex}</span>
                            <Badge variant="destructive">En retard</Badge>
                          </div>
                          <div className="mt-1 text-xs text-muted-foreground">
                            Due le {format(toDate(line.dueDate), 'dd/MM/yyyy')} — Montant restant :{' '}
                            {formatCurrency(Math.max(0, line.totalDue - line.totalPaid), currency, locale)}
                          </div>
                        </div>
                      ))
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="schedule">
            <Card>
              <CardHeader>
                <CardTitle>Échéancier</CardTitle>
                <CardDescription>Montants dus par période.</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[420px] rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Période</TableHead>
                        <TableHead>Échéance</TableHead>
                        <TableHead className="text-right">Principal</TableHead>
                        <TableHead className="text-right">Intérêt</TableHead>
                        <TableHead className="text-right">Assurance</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                        <TableHead className="text-right">Payé</TableHead>
                        <TableHead>Statut</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {schedulesLoading && (
                        <TableRow>
                          <TableCell colSpan={8}>
                            <Skeleton className="h-6 w-full" />
                          </TableCell>
                        </TableRow>
                      )}
                      {!schedulesLoading && (schedules || []).length === 0 && (
                        <TableRow>
                          <TableCell colSpan={8} className="py-10 text-center text-muted-foreground">
                            Aucun échéancier généré.
                          </TableCell>
                        </TableRow>
                      )}
                      {(schedules || []).map((line) => (
                        <TableRow
                          key={line.id}
                          className={
                            line.status === 'EN_RETARD' || line.status === 'PARTIEL'
                              ? 'bg-red-50'
                              : undefined
                          }
                        >
                          <TableCell>#{line.periodIndex}</TableCell>
                          <TableCell>{format(toDate(line.dueDate), 'dd/MM/yyyy')}</TableCell>
                          <TableCell className="text-right">{line.principalDue.toFixed(2)}</TableCell>
                          <TableCell className="text-right">{line.interestDue.toFixed(2)}</TableCell>
                          <TableCell className="text-right">{line.insuranceDue.toFixed(2)}</TableCell>
                          <TableCell className="text-right font-medium">{line.totalDue.toFixed(2)}</TableCell>
                          <TableCell className="text-right">{line.totalPaid.toFixed(2)}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{line.status}</Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="payments">
            <Card>
              <CardHeader>
                <CardTitle>Paiements</CardTitle>
                <CardDescription>Historique des encaissements liés à cette dette.</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[360px] rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Montant</TableHead>
                        <TableHead>Principal</TableHead>
                        <TableHead>Intérêts</TableHead>
                        <TableHead>Frais</TableHead>
                        <TableHead>Assurance</TableHead>
                        <TableHead>Méthode</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paymentsLoading && (
                        <TableRow>
                          <TableCell colSpan={7}>
                            <Skeleton className="h-6 w-full" />
                          </TableCell>
                        </TableRow>
                      )}
                      {!paymentsLoading && (payments || []).length === 0 && (
                        <TableRow>
                          <TableCell colSpan={7} className="py-10 text-center text-muted-foreground">
                            Aucun paiement enregistré.
                          </TableCell>
                        </TableRow>
                      )}
                      {(payments || []).map((payment) => (
                        <TableRow key={payment.id}>
                          <TableCell>{format(toDate(payment.paidAt), 'dd/MM/yyyy')}</TableCell>
                          <TableCell>{formatCurrency(payment.amount, currency, locale)}</TableCell>
                          <TableCell>{formatCurrency(payment.allocation.principal, currency, locale)}</TableCell>
                          <TableCell>{formatCurrency(payment.allocation.interests, currency, locale)}</TableCell>
                          <TableCell>{formatCurrency(payment.allocation.fees, currency, locale)}</TableCell>
                          <TableCell>{formatCurrency(payment.allocation.insurance, currency, locale)}</TableCell>
                          <TableCell>{methodLabels[payment.method]}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="simulation">
            <Card>
              <CardHeader>
                <CardTitle>Simulation de remboursement anticipé</CardTitle>
                <CardDescription>Évaluez l’impact avant d’appliquer la modification.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Form {...prepaymentForm}>
                  <form className="grid gap-4 md:grid-cols-3" onSubmit={prepaymentForm.handleSubmit(handleSimulate)}>
                    <FormField
                      control={prepaymentForm.control}
                      name="amount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Montant</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.01"
                              value={field.value ?? ''}
                              onChange={(event) => field.onChange(Number(event.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={prepaymentForm.control}
                      name="date"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Date</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={prepaymentForm.control}
                      name="mode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Mode</FormLabel>
                          <Select value={field.value} onValueChange={field.onChange}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="RE-AMORTIR">Ré-amortir (mensualité réduite)</SelectItem>
                              <SelectItem value="RACCOURCIR_DUREE">Raccourcir la durée</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="md:col-span-3 flex justify-end gap-2">
                      <Button type="submit" variant="outline">
                        Simuler
                      </Button>
                      <Button
                        type="button"
                        onClick={handleApplyPrepayment}
                        disabled={!prepaymentResult || isApplyingPrepayment}
                      >
                        {isApplyingPrepayment ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        Appliquer
                      </Button>
                    </div>
                  </form>
                </Form>

                {prepaymentResult && (
                  <Alert>
                    <AlertTitle>Résultats</AlertTitle>
                    <AlertDescription>
                      <div className="mt-2 grid gap-2 md:grid-cols-2">
                        <div>
                          <div className="text-sm text-muted-foreground">Capital remboursé</div>
                          <div className="font-medium">{formatCurrency(prepaymentResult.prepaymentApplied, currency, locale)}</div>
                        </div>
                        <div>
                          <div className="text-sm text-muted-foreground">Pénalité</div>
                          <div className="font-medium">{formatCurrency(prepaymentResult.penalty, currency, locale)}</div>
                        </div>
                        <div>
                          <div className="text-sm text-muted-foreground">Nouvelle durée</div>
                          <div className="font-medium">{prepaymentResult.newDuration} périodes</div>
                        </div>
                        <div>
                          <div className="text-sm text-muted-foreground">Nouvelle échéance</div>
                          <div className="font-medium">{formatCurrency(prepaymentResult.newInstallment, currency, locale)}</div>
                        </div>
                        <div>
                          <div className="text-sm text-muted-foreground">Intérêts économisés</div>
                          <div className="font-medium">{formatCurrency(prepaymentResult.interestsSaved, currency, locale)}</div>
                        </div>
                      </div>
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="contract">
            <Card>
              <CardHeader>
                <CardTitle>Contrat</CardTitle>
                <CardDescription>Téléversez ou consultez la version PDF du contrat associé.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <div className="text-sm text-muted-foreground">Chemin de stockage</div>
                  <div className="font-mono text-sm">
                    {debt.contractFilePath ? debt.contractFilePath : 'Aucun contrat téléversé'}
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  Pour remplacer le fichier, utilisez le bouton « Contrat PDF » dans la barre d’actions.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}

type DebtAmortizationChartProps = {
  data: AmortizationDatum[];
  currency: string;
  locale: string;
  isFrench: boolean;
};

function DebtAmortizationChart({ data, currency, locale, isFrench }: DebtAmortizationChartProps) {
  const translations = {
    title: isFrench ? 'Amortissement et paiements' : 'Amortisation & payments',
    principalPaid: isFrench ? 'Principal payé' : 'Principal paid',
    interestPaid: isFrench ? 'Intérêts payés' : 'Interest paid',
    remainingPrincipal: isFrench ? 'Principal restant' : 'Remaining principal',
    theoreticalDue: isFrench ? 'Échéance théorique' : 'Scheduled due',
    noData: isFrench ? 'Pas encore de données pour ce graphique.' : 'No data available yet.',
  };

  if (!data.length) {
    return (
      <Card className="print:break-inside-avoid">
        <CardHeader>
          <CardTitle>{translations.title}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="py-10 text-center text-sm text-muted-foreground">{translations.noData}</p>
        </CardContent>
      </Card>
    );
  }

  const numberFormatter = new Intl.NumberFormat(locale || (isFrench ? 'fr-FR' : 'en-US'), {
    style: 'currency',
    currency: currency || 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });

  const formattedData = data.map((item) => ({
    ...item,
    principalPaid: Number(item.principalPaid.toFixed(2)),
    interestPaid: Number(item.interestPaid.toFixed(2)),
    remainingPrincipal: Number(item.remainingPrincipal.toFixed(2)),
    totalDue: Number(item.totalDue.toFixed(2)),
  }));

  const formatLabel = (value: string) => {
    try {
      return format(new Date(value), 'dd MMM yyyy', {
        locale: locale.startsWith('fr') ? frLocale : undefined,
      });
    } catch {
      return value;
    }
  };

  return (
    <Card className="print:break-inside-avoid">
      <CardHeader>
        <CardTitle>{translations.title}</CardTitle>
        <CardDescription>
          {isFrench
            ? 'Visualisez le capital restant et le détail des paiements réalisés dans le temps.'
            : 'Track remaining principal alongside payments over time.'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={formattedData} margin={{ top: 16, right: 32, bottom: 24, left: 0 }}>
              <CartesianGrid strokeDasharray="4 4" stroke="#e2e8f0" />
              <XAxis
                dataKey="date"
                tickFormatter={formatLabel}
                stroke="#64748b"
                fontSize={12}
              />
              <YAxis
                tickFormatter={(value) => numberFormatter.format(value as number)}
                stroke="#64748b"
                fontSize={12}
              />
              <Tooltip
                labelFormatter={formatLabel}
                formatter={(value: number, name: string) => [numberFormatter.format(value), name]}
              />
              <Legend />
              <Bar
                dataKey="principalPaid"
                name={translations.principalPaid}
                fill="#2563eb"
                radius={[4, 4, 0, 0]}
              />
              <Bar
                dataKey="interestPaid"
                name={translations.interestPaid}
                fill="#d946ef"
                radius={[4, 4, 0, 0]}
              />
              <Line
                type="monotone"
                dataKey="remainingPrincipal"
                name={translations.remainingPrincipal}
                stroke="#0f172a"
                strokeWidth={2}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="totalDue"
                name={translations.theoreticalDue}
                stroke="#f97316"
                strokeDasharray="6 4"
                dot={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

export default function DebtDetailPage() {
  return <DebtDetailContent />;
}
