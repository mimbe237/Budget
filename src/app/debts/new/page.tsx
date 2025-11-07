'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { addDays, format } from 'date-fns';

import { AppLayout } from '@/components/dashboard/dashboard-client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { useUser } from '@/firebase';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  buildSchedule as computeSchedule,
  type BuildScheduleInput,
} from '@/lib/debts/amortization';
import {
  buildDebtSchedule,
  createDebt,
  type CreateDebtInput,
} from '@/lib/debts/api';

const MAX_START_OFFSET_DAYS = 30;

const SUPPORTED_CURRENCIES = ['XAF', 'XOF', 'EUR', 'USD'];

const debtFormSchema = z.object({
  type: z.enum(['EMPRUNT', 'PRET']),
  title: z.string().min(2, 'Nom requis'),
  principal: z.number().positive('Montant requis'),
  currency: z.string().length(3, 'Devise ISO (3 lettres)'),
  startDate: z
    .string()
    .refine(
      (value) => {
        const parsed = new Date(value);
        if (Number.isNaN(parsed.getTime())) return false;
        const maxDate = addDays(new Date(), MAX_START_OFFSET_DAYS);
        return parsed <= maxDate;
      },
      { message: 'La date doit être dans les 30 prochains jours.' }
    ),
  termMonths: z.number().int().min(1, 'Durée minimale : 1 mois'),
  annualRatePct: z.number().min(0, 'Taux invalide'),
  counterpart: z.string().optional(),
  upfrontFees: z.number().min(0).optional(),
  monthlyInsurance: z.number().min(0).optional(),
  prepaymentPenaltyPct: z.number().min(0).max(1).optional(),
  interestOnly: z.boolean(),
  enableVariableRate: z.boolean(),
  variableIndexCode: z.string().optional(),
  variableMarginBps: z.number().min(0).nullable().optional(),
  enableBalloon: z.boolean(),
  balloonPct: z.number().min(0).max(1).optional(),
  gracePeriods: z.number().int().min(0).optional(),
});

type DebtFormValues = z.infer<typeof debtFormSchema>;

const buildDefaultValues = (currency: string): DebtFormValues => ({
  type: 'EMPRUNT',
  title: '',
  principal: 1000,
  currency,
  startDate: format(new Date(), 'yyyy-MM-dd'),
  termMonths: 12,
  annualRatePct: 0,
  counterpart: '',
  upfrontFees: 0,
  monthlyInsurance: 0,
  prepaymentPenaltyPct: 0,
  interestOnly: false,
  enableVariableRate: false,
  variableIndexCode: '',
  variableMarginBps: null,
  enableBalloon: false,
  balloonPct: 0,
  gracePeriods: 0,
});

const currencyFormatter = (value: number, currency: string) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency }).format(value);

export default function NewDebtPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { userProfile } = useUser();
  const defaultCurrency = (userProfile?.displayCurrency ?? 'EUR').toUpperCase();

  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<DebtFormValues>({
    resolver: zodResolver(debtFormSchema),
    defaultValues: buildDefaultValues(defaultCurrency.toUpperCase()),
    mode: 'onBlur',
  });

  const watchAll = form.watch();
  const resolvedCurrency = (watchAll.currency || defaultCurrency).toUpperCase();

  const preview = useMemo(() => {
    try {
      if (!watchAll.principal || !watchAll.termMonths || !watchAll.startDate) {
        return null;
      }
      const input: BuildScheduleInput = {
        principal: watchAll.principal,
        annualRate: (watchAll.annualRatePct ?? 0) / 100,
        amortizationMode: watchAll.interestOnly ? 'INTEREST_ONLY' : 'ANNUITE',
        totalPeriods: watchAll.termMonths,
        gracePeriods: watchAll.gracePeriods ?? 0,
        balloonPct: watchAll.enableBalloon ? watchAll.balloonPct ?? 0 : 0,
        monthlyInsurance: watchAll.monthlyInsurance ?? 0,
        upfrontFees: watchAll.upfrontFees ?? 0,
        frequency: 'MENSUEL',
        startDate: new Date(watchAll.startDate),
        variableRates: undefined,
        recalcEachPeriod: false,
      };
      const lines = computeSchedule(input);
      if (!lines?.length) return null;
      const totalInterest = lines.reduce((acc, line) => acc + line.interestDue, 0);
      const totalPaid = lines.reduce((acc, line) => acc + line.totalDue, 0);
      return {
        lines: lines.slice(0, 6),
        totalInterest,
        totalPaid,
        avgInstallment: lines.reduce((acc, line) => acc + line.totalDue, 0) / lines.length,
      };
    } catch (_error) {
      return null;
    }
  }, [watchAll]);

  const handleSubmit = async (values: DebtFormValues) => {
    setIsSubmitting(true);
    try {
      const payload: CreateDebtInput = {
        title: values.title,
        type: values.type,
        counterparty: values.counterpart || null,
        currency: resolvedCurrency,
        principalInitial: values.principal,
        annualRate: (values.annualRatePct ?? 0) / 100,
        rateType: values.enableVariableRate ? 'VARIABLE' : 'FIXE',
        amortizationMode: values.interestOnly ? 'INTEREST_ONLY' : 'ANNUITE',
        totalPeriods: values.termMonths,
        frequency: 'MENSUEL',
        startDate: values.startDate,
        gracePeriods: values.gracePeriods ?? 0,
        balloonPct: values.enableBalloon ? values.balloonPct ?? 0 : 0,
        upfrontFees: values.upfrontFees ?? 0,
        monthlyInsurance: values.monthlyInsurance ?? 0,
        prepaymentPenaltyPct: values.prepaymentPenaltyPct ?? 0,
        variableIndexCode: values.enableVariableRate ? values.variableIndexCode || null : null,
        variableMarginBps: values.enableVariableRate ? values.variableMarginBps ?? null : null,
        recalcEachPeriod: values.enableVariableRate ? true : false,
      };

      const created = await createDebt(payload);
      await buildDebtSchedule(created.id);

      toast({
        title: 'Dette créée',
        description: 'Nous avons généré les premières mensualités automatiquement.',
      });
      router.push(`/debts/${created.id}`);
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: error?.message ?? 'Impossible de créer la dette.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AppLayout>
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 pb-12">
        <div className="space-y-2">
          <Badge variant="secondary" className="w-fit">
            {watchAll.type === 'EMPRUNT' ? 'Je dois' : 'On me doit'}
          </Badge>
          <h1 className="text-2xl font-semibold tracking-tight">Nouvelle dette</h1>
          <p className="text-sm text-muted-foreground">
            Remplissez les informations essentielles pour suivre rapidement vos prêts et emprunts.
          </p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle>Essentiel</CardTitle>
                <CardDescription>
                  7 champs pour enregistrer la dette et générer l’échéancier automatiquement.
                </CardDescription>
              </div>
              <Badge variant="outline" className="text-xs uppercase tracking-wide">
                Devise utilisée&nbsp;: {resolvedCurrency}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form className="space-y-8" onSubmit={form.handleSubmit(handleSubmit)}>
                <section className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Type</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Sélectionner" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="EMPRUNT">Emprunt (je dois)</SelectItem>
                            <SelectItem value="PRET">Prêt (on me doit)</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nom de la dette</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex. Crédit immobilier" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="principal"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Montant initial ({resolvedCurrency})</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={field.value ?? ''}
                            onChange={(event) =>
                              field.onChange(
                                event.target.value === '' ? undefined : Number(event.target.value)
                              )
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="currency"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Devise</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {SUPPORTED_CURRENCIES.map((currency) => (
                              <SelectItem key={currency} value={currency}>
                                {currency}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
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
                  <FormField
                    control={form.control}
                    name="termMonths"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Durée (mois)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="1"
                            value={field.value ?? ''}
                            onChange={(event) =>
                              field.onChange(
                                event.target.value === '' ? undefined : Number(event.target.value)
                              )
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="annualRatePct"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Taux annuel (%)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={field.value ?? ''}
                            onChange={(event) =>
                              field.onChange(
                                event.target.value === '' ? undefined : Number(event.target.value)
                              )
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </section>

                <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
                  <section className="space-y-4 rounded-2xl border p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-base font-semibold">Options avancées</h3>
                        <p className="text-sm text-muted-foreground">
                          Renseignez ces champs uniquement si vous avez besoin de personnaliser davantage le calcul.
                        </p>
                      </div>
                      <CollapsibleTrigger asChild>
                        <Button type="button" variant="outline" size="sm">
                          {showAdvanced ? 'Masquer' : 'Afficher'}
                        </Button>
                      </CollapsibleTrigger>
                    </div>
                    <CollapsibleContent className="grid gap-4 md:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="counterpart"
                        render={({ field }) => (
                          <FormItem className="md:col-span-2">
                            <FormLabel>Contrepartie</FormLabel>
                            <FormControl>
                              <Input placeholder="Banque, client..." {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="upfrontFees"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Frais initiaux ({resolvedCurrency})</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min="0"
                                step="0.01"
                                value={field.value ?? ''}
                                onChange={(event) =>
                                  field.onChange(
                                    event.target.value === '' ? undefined : Number(event.target.value)
                                  )
                                }
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="monthlyInsurance"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Assurance par échéance ({resolvedCurrency})</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min="0"
                                step="0.01"
                                value={field.value ?? ''}
                                onChange={(event) =>
                                  field.onChange(
                                    event.target.value === '' ? undefined : Number(event.target.value)
                                  )
                                }
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="prepaymentPenaltyPct"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Pénalité remboursement anticipé (%)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min="0"
                                max="100"
                                step="0.01"
                                value={
                                  field.value === undefined || field.value === null
                                    ? ''
                                    : (field.value ?? 0) * 100
                                }
                                onChange={(event) => {
                                  const raw = event.target.value;
                                  field.onChange(raw === '' ? undefined : Number(raw) / 100);
                                }}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="interestOnly"
                        render={({ field }) => (
                          <FormItem className="flex items-start justify-between rounded-lg border p-4">
                            <div className="space-y-1">
                              <FormLabel>Mode intérêts seuls</FormLabel>
                              <p className="text-sm text-muted-foreground">
                                Les mensualités couvrent uniquement les intérêts. À réserver aux cas particuliers.
                              </p>
                            </div>
                            <FormControl>
                              <Switch checked={field.value} onCheckedChange={field.onChange} />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="gracePeriods"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Périodes de différé</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min="0"
                                value={field.value ?? ''}
                                onChange={(event) =>
                                  field.onChange(
                                    event.target.value === '' ? undefined : Number(event.target.value)
                                  )
                                }
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="enableVariableRate"
                        render={({ field }) => (
                          <FormItem className="flex items-start justify-between rounded-lg border p-4 md:col-span-2">
                            <div className="space-y-1">
                              <FormLabel>Taux variable</FormLabel>
                              <p className="text-sm text-muted-foreground">
                                Activez uniquement si la dette dépend d’un indice (type Euribor).
                              </p>
                            </div>
                            <FormControl>
                              <Switch checked={field.value} onCheckedChange={field.onChange} />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      {watchAll.enableVariableRate && (
                        <>
                          <FormField
                            control={form.control}
                            name="variableIndexCode"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Indice</FormLabel>
                                <FormControl>
                                  <Input placeholder="Ex. EURIBOR 3M" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="variableMarginBps"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Marge (bps)</FormLabel>
                                <FormControl>
                                  <Input
                                    type="number"
                                    min="0"
                                    value={field.value ?? ''}
                                    onChange={(event) =>
                                      field.onChange(
                                        event.target.value === '' ? null : Number(event.target.value)
                                      )
                                    }
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </>
                      )}
                      <FormField
                        control={form.control}
                        name="enableBalloon"
                        render={({ field }) => (
                          <FormItem className="flex items-start justify-between rounded-lg border p-4 md:col-span-2">
                            <div className="space-y-1">
                              <FormLabel>Balloon / remboursement final</FormLabel>
                              <p className="text-sm text-muted-foreground">
                                Utilisez-le pour prévoir un capital restant dû important à la dernière échéance.
                              </p>
                            </div>
                            <FormControl>
                              <Switch checked={field.value} onCheckedChange={field.onChange} />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      {watchAll.enableBalloon && (
                        <FormField
                          control={form.control}
                          name="balloonPct"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Pourcentage balloon (%)</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  min="0"
                                  max="100"
                                  step="0.1"
                                  value={
                                    field.value === undefined || field.value === null
                                      ? ''
                                      : (field.value ?? 0) * 100
                                  }
                                  onChange={(event) => {
                                    const raw = event.target.value;
                                    field.onChange(raw === '' ? undefined : Number(raw) / 100);
                                  }}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}
                    </CollapsibleContent>
                  </section>
                </Collapsible>

                <section className="space-y-4">
                  <div>
                    <h3 className="text-base font-semibold">Aperçu</h3>
                    <p className="text-sm text-muted-foreground">
                      Mensualité moyenne, intérêts estimés et premiers mois calculés automatiquement.
                    </p>
                  </div>
                  {preview ? (
                    <>
                      <div className="grid gap-3 md:grid-cols-3">
                        <Card>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm text-muted-foreground">Mensualité moyenne</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <p className="text-2xl font-semibold">
                              {currencyFormatter(preview.avgInstallment, resolvedCurrency)}
                            </p>
                            <p className="text-xs text-muted-foreground">Basée sur le plan prévisionnel</p>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm text-muted-foreground">Intérêts estimés</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <p className="text-2xl font-semibold">
                              {currencyFormatter(preview.totalInterest, resolvedCurrency)}
                            </p>
                            <p className="text-xs text-muted-foreground">Sur toute la durée</p>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm text-muted-foreground">Total à rembourser</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <p className="text-2xl font-semibold">
                              {currencyFormatter(preview.totalPaid, resolvedCurrency)}
                            </p>
                            <p className="text-xs text-muted-foreground">Hors remboursements anticipés</p>
                          </CardContent>
                        </Card>
                      </div>
                      <div className="overflow-hidden rounded-lg border">
                        <table className="w-full text-sm">
                          <thead className="bg-muted/40">
                            <tr>
                              <th className="px-3 py-2 text-left">Période</th>
                              <th className="px-3 py-2 text-right">Principal</th>
                              <th className="px-3 py-2 text-right">Intérêts</th>
                              <th className="px-3 py-2 text-right">Total</th>
                            </tr>
                          </thead>
                          <tbody>
                            {preview.lines.map((line) => (
                              <tr key={line.periodIndex} className="border-t">
                                <td className="px-3 py-2">#{line.periodIndex}</td>
                                <td className="px-3 py-2 text-right">
                                  {currencyFormatter(line.principalDue, resolvedCurrency)}
                                </td>
                                <td className="px-3 py-2 text-right">
                                  {currencyFormatter(line.interestDue, resolvedCurrency)}
                                </td>
                                <td className="px-3 py-2 text-right font-medium">
                                  {currencyFormatter(line.totalDue, resolvedCurrency)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Renseignez les champs essentiels pour calculer l’échéancier.
                    </p>
                  )}
                </section>

                <div className="flex justify-end">
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? 'Création...' : 'Créer la dette'}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
