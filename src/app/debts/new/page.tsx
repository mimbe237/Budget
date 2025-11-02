'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { AppLayout } from '@/components/dashboard/dashboard-client';
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
import { buildSchedule as computeSchedule, FREQUENCY_CONFIG } from '@/lib/debts/amortization';
import {
  buildDebtSchedule,
  createDebt,
  type CreateDebtInput,
} from '@/lib/debts/api';
import type { BuildScheduleInput } from '@/lib/debts/amortization';

const debtWizardSchema = z.object({
  title: z.string().min(2, 'Nom requis'),
  type: z.enum(['EMPRUNT', 'PRET']),
  counterparty: z.string().optional(),
  currency: z.string().length(3, 'Devise ISO (3 lettres)'),
  principalInitial: z.number().positive('Montant requis'),
  annualRate: z.number().min(0),
  rateType: z.enum(['FIXE', 'VARIABLE']),
  amortizationMode: z.enum(['ANNUITE', 'PRINCIPAL_CONSTANT', 'INTEREST_ONLY', 'BALLOON']),
  totalPeriods: z.number().int().positive(),
  frequency: z.enum(['MENSUEL', 'HEBDOMADAIRE', 'ANNUEL']),
  startDate: z.string(),
  gracePeriods: z.number().int().min(0),
  balloonPct: z.number().min(0).max(1),
  upfrontFees: z.number().min(0),
  monthlyInsurance: z.number().min(0),
  prepaymentPenaltyPct: z.number().min(0).max(1),
  variableIndexCode: z.string().optional(),
  variableMarginBps: z.number().nullable().optional(),
  recalcEachPeriod: z.boolean(),
});

type DebtWizardValues = z.infer<typeof debtWizardSchema>;

const defaultValues: DebtWizardValues = {
  title: '',
  type: 'EMPRUNT',
  counterparty: '',
  currency: 'EUR',
  principalInitial: 100000,
  annualRate: 0.05,
  rateType: 'FIXE',
  amortizationMode: 'ANNUITE',
  totalPeriods: 120,
  frequency: 'MENSUEL',
  startDate: format(new Date(), 'yyyy-MM-dd'),
  gracePeriods: 0,
  balloonPct: 0,
  upfrontFees: 0,
  monthlyInsurance: 0,
  prepaymentPenaltyPct: 0,
  variableIndexCode: '',
  variableMarginBps: null,
  recalcEachPeriod: false,
};

const formSteps = [
  'Informations générales',
  'Montants & taux',
  'Mode d’amortissement',
  'Options',
  'Aperçu',
] as const;

function DebtsNewContent() {
  const router = useRouter();
  const { toast } = useToast();
  const [step, setStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<DebtWizardValues>({
    resolver: zodResolver(debtWizardSchema),
    mode: 'onBlur',
    defaultValues,
  });

  const watchAll = form.watch();

  const preview = useMemo(() => {
    try {
      const input: BuildScheduleInput = {
        principal: watchAll.principalInitial,
        annualRate: watchAll.annualRate,
        rateType: watchAll.rateType,
        amortizationMode: watchAll.amortizationMode,
        totalPeriods: watchAll.totalPeriods,
        gracePeriods: watchAll.gracePeriods,
        balloonPct: watchAll.balloonPct,
        monthlyInsurance: watchAll.monthlyInsurance,
        upfrontFees: watchAll.upfrontFees,
        frequency: watchAll.frequency,
        startDate: new Date(watchAll.startDate),
        variableRates: undefined,
        recalcEachPeriod: watchAll.recalcEachPeriod,
      };
      const lines = computeSchedule(input);
      const totalInterest = lines.reduce((acc, line) => acc + line.interestDue, 0);
      const totalInsurance = lines.reduce((acc, line) => acc + line.insuranceDue, 0);
      return {
        lines: lines.slice(0, 6),
        totalInterest,
        totalInsurance,
        totalPaid: lines.reduce((acc, line) => acc + line.totalDue, 0),
      };
    } catch (error) {
      return null;
    }
  }, [watchAll]);

  const handleNext = async () => {
    const valid = await form.trigger();
    if (!valid) return;
    setStep((current) => Math.min(current + 1, formSteps.length - 1));
  };

  const handleBack = () => {
    setStep((current) => Math.max(current - 1, 0));
  };

  const onSubmit = async (values: DebtWizardValues) => {
    setIsSubmitting(true);
    try {
      const payload: CreateDebtInput = {
        ...values,
        startDate: values.startDate,
        counterparty: values.counterparty || null,
      };
      const created = await createDebt(payload);
      await buildDebtSchedule(created.id);
      toast({
        title: 'Dette créée',
        description: 'L’échéancier a été généré et la dette est disponible.',
      });
      router.push(`/debts/${created.id}`);
    } catch (error: any) {
      console.error(error);
      toast({
        title: 'Erreur',
        description: error?.message ?? 'Impossible de créer la dette.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentStep = formSteps[step];

  return (
    <AppLayout>
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Nouvelle dette</h1>
          <p className="text-muted-foreground">
            Complétez les étapes pour configurer un nouvel emprunt ou prêt.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{currentStep}</CardTitle>
            <CardDescription>
              Étape {step + 1} sur {formSteps.length}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form className="space-y-6" onSubmit={form.handleSubmit(onSubmit)}>
                {step === 0 && (
                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nom de la dette</FormLabel>
                          <FormControl>
                            <Input placeholder="Ex. Crédit immobilier siège social" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="counterparty"
                      render={({ field }) => (
                        <FormItem>
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
                      name="currency"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Devise</FormLabel>
                          <FormControl>
                            <Input placeholder="EUR" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}

                {step === 1 && (
                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="principalInitial"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Montant initial</FormLabel>
                          <FormControl>
                            <Input type="number" step="0.01" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="annualRate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Taux annuel (%)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.0001"
                              value={Number(field.value * 100).toFixed(3)}
                              onChange={(event) => field.onChange(Number(event.target.value) / 100)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="totalPeriods"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nombre de périodes</FormLabel>
                          <FormControl>
                            <Input type="number" min={1} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="frequency"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Fréquence</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
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
                      control={form.control}
                      name="startDate"
                      render={({ field }) => (
                        <FormItem className="md:col-span-2">
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
                      name="rateType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Taux</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="FIXE">Fixe</SelectItem>
                              <SelectItem value="VARIABLE">Variable</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    {watchAll.rateType === 'VARIABLE' && (
                      <>
                        <FormField
                          control={form.control}
                          name="variableIndexCode"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Indice de référence</FormLabel>
                              <FormControl>
                                <Input placeholder="Code de l’indice (ex. EURIBOR)" {...field} />
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
                                  placeholder="Ex. 120 bps"
                                  value={field.value ?? ''}
                                  onChange={(event) => field.onChange(Number(event.target.value))}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="recalcEachPeriod"
                          render={({ field }) => (
                            <FormItem className="flex items-center justify-between rounded-lg border px-4 py-3">
                              <div>
                                <FormLabel>Ré-amortir à chaque variation</FormLabel>
                                <p className="text-sm text-muted-foreground">
                                  Recalcule le montant des échéances après chaque changement de taux.
                                </p>
                              </div>
                              <FormControl>
                                <Switch checked={field.value} onCheckedChange={field.onChange} />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </>
                    )}
                  </div>
                )}

                {step === 2 && (
                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="amortizationMode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Mode d’amortissement</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
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
                      control={form.control}
                      name="gracePeriods"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Périodes de différé</FormLabel>
                          <FormControl>
                            <Input type="number" min={0} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
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
                              disabled={watchAll.amortizationMode !== 'BALLOON'}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}

                {step === 3 && (
                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="upfrontFees"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Frais initiaux</FormLabel>
                          <FormControl>
                            <Input type="number" step="0.01" {...field} />
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
                          <FormLabel>Assurance périodique</FormLabel>
                          <FormControl>
                            <Input type="number" step="0.01" {...field} />
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
                          <FormLabel>Pénalité de remboursement anticipé (%)</FormLabel>
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
                  </div>
                )}

                {step === 4 && (
                  <div className="space-y-4">
                    {preview ? (
                      <>
                        <div className="grid gap-3 md:grid-cols-3">
                          <Card>
                            <CardHeader className="pb-2">
                              <CardTitle className="text-sm text-muted-foreground">Echéance moyenne</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="text-2xl font-semibold">
                                {preview.lines.length
                                  ? (
                                      preview.lines.reduce((acc, line) => acc + line.totalDue, 0) /
                                      preview.lines.length
                                    ).toFixed(2)
                                  : '—'}
                              </div>
                              <p className="text-xs text-muted-foreground">
                                Sur les six premières périodes
                              </p>
                            </CardContent>
                          </Card>
                          <Card>
                            <CardHeader className="pb-2">
                              <CardTitle className="text-sm text-muted-foreground">Intérêts estimés</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="text-2xl font-semibold">{preview.totalInterest.toFixed(2)}</div>
                              <p className="text-xs text-muted-foreground">
                                Somme des intérêts prévisionnels
                              </p>
                            </CardContent>
                          </Card>
                          <Card>
                            <CardHeader className="pb-2">
                              <CardTitle className="text-sm text-muted-foreground">Total à payer</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="text-2xl font-semibold">{preview.totalPaid.toFixed(2)}</div>
                              <p className="text-xs text-muted-foreground">
                                Hors remboursements anticipés
                              </p>
                            </CardContent>
                          </Card>
                        </div>
                        <div className="overflow-hidden rounded-md border">
                          <table className="w-full text-sm">
                            <thead className="bg-muted/40">
                              <tr>
                                <th className="px-3 py-2 text-left">Période</th>
                                <th className="px-3 py-2 text-right">Principal</th>
                                <th className="px-3 py-2 text-right">Intérêts</th>
                                <th className="px-3 py-2 text-right">Assurance</th>
                                <th className="px-3 py-2 text-right">Total</th>
                              </tr>
                            </thead>
                            <tbody>
                              {preview.lines.map((line) => (
                                <tr key={line.periodIndex} className="border-t">
                                  <td className="px-3 py-2">#{line.periodIndex}</td>
                                  <td className="px-3 py-2 text-right">{line.principalDue.toFixed(2)}</td>
                                  <td className="px-3 py-2 text-right">{line.interestDue.toFixed(2)}</td>
                                  <td className="px-3 py-2 text-right">{line.insuranceDue.toFixed(2)}</td>
                                  <td className="px-3 py-2 text-right font-medium">{line.totalDue.toFixed(2)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        Les paramètres fournis ne permettent pas de générer un aperçu pour le moment.
                      </p>
                    )}
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <Button type="button" variant="outline" onClick={handleBack} disabled={step === 0 || isSubmitting}>
                    Retour
                  </Button>
                  {step < formSteps.length - 1 ? (
                    <Button type="button" onClick={handleNext} disabled={isSubmitting}>
                      Continuer
                    </Button>
                  ) : (
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? 'Création...' : 'Créer la dette'}
                    </Button>
                  )}
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}

export default function NewDebtPage() {
  return <DebtsNewContent />;
}
