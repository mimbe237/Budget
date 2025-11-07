'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useFirestore, useUser, setDocumentNonBlocking } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Check, Globe2, Wallet, Sparkles } from 'lucide-react';

const SUPPORTED_LOCALES = [
  { value: 'fr-CM', label: 'Français (Cameroun)' },
  { value: 'en-US', label: 'English (US)' },
];

const SUPPORTED_CURRENCIES = [
  { value: 'XOF', label: 'Franc CFA (XOF)' },
  { value: 'XAF', label: 'Franc CFA (XAF)' },
  { value: 'EUR', label: 'Euro (EUR)' },
  { value: 'USD', label: 'US Dollar (USD)' },
];

export default function OnboardingPage() {
  const router = useRouter();
  const firestore = useFirestore();
  const { user, userProfile, isUserLoading } = useUser();
  const adminEmailSet = useMemo(() => {
    const raw = process.env.NEXT_PUBLIC_ADMIN_EMAILS ?? '';
    return new Set(
      raw
        .split(',')
        .map(email => email.trim().toLowerCase())
        .filter(Boolean)
    );
  }, []);

  const [step, setStep] = useState(1);
  const [locale, setLocale] = useState<string>(userProfile?.locale || 'fr-CM');
  const [currency, setCurrency] = useState<string>(userProfile?.displayCurrency || 'XOF');
  const [monthlyBudgetStr, setMonthlyBudgetStr] = useState<string>(
    typeof userProfile?.monthlyExpenseBudget === 'number' ? String(userProfile.monthlyExpenseBudget) : ''
  );
  const monthlyBudget = useMemo(() => {
    const parsed = parseFloat(monthlyBudgetStr.replace(',', '.'));
    return Number.isFinite(parsed) ? parsed : 0;
  }, [monthlyBudgetStr]);

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.replace('/login');
    }
  }, [user, isUserLoading, router]);

  const hasCompletedOnboarding = userProfile?.hasCompletedOnboarding === true;

  useEffect(() => {
    if (!user) return;

    const isAdminProfile = userProfile?.role === 'admin' || userProfile?.isAdmin === true;
    const isAdminEmail = user.email ? adminEmailSet.has(user.email.toLowerCase()) : false;
    const isAdmin = isAdminProfile || isAdminEmail;
    const alreadyConfigured =
      hasCompletedOnboarding ||
      (!!userProfile?.locale &&
        !!userProfile?.displayCurrency &&
        typeof userProfile?.monthlyExpenseBudget === 'number');

    if (isAdmin || userProfile?.status === 'suspended') {
      router.replace('/dashboard');
      return;
    }

    if (alreadyConfigured) {
      router.replace('/dashboard');
    }
  }, [user, userProfile, router, adminEmailSet, hasCompletedOnboarding]);

  const isStepValid = useMemo(() => {
    if (step === 1) return !!locale;
    if (step === 2) return !!currency;
    if (step === 3) return monthlyBudget > 0;
    return true;
  }, [step, locale, currency, monthlyBudget]);

  const handleSave = async () => {
    if (!user || !firestore) return;
    const profileRef = doc(firestore, `users/${user.uid}`);
    setDocumentNonBlocking(profileRef, {
      id: user.uid,
      locale,
      displayCurrency: currency,
      monthlyExpenseBudget: monthlyBudget,
      hasCompletedOnboarding: true,
      updatedAt: new Date().toISOString(),
    }, { merge: true });
    router.replace('/dashboard');
  };

  const handleSkipWithDefaults = async () => {
    if (!user || !firestore) return;
    const profileRef = doc(firestore, `users/${user.uid}`);
    await setDocumentNonBlocking(profileRef, {
      id: user.uid,
      locale: 'fr-CM',
      displayCurrency: 'XOF',
      monthlyExpenseBudget: 100000,
      hasCompletedOnboarding: true,
      updatedAt: new Date().toISOString(),
    }, { merge: true });
    router.replace('/dashboard');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-emerald-50 py-10 px-4">
      <div className="max-w-2xl mx-auto space-y-4">
        {/* Bouton Skip en haut */}
        <div className="flex justify-end">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={handleSkipWithDefaults}
            className="text-muted-foreground hover:text-foreground"
          >
            Utiliser les valeurs par défaut →
          </Button>
        </div>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="font-headline text-2xl">
              {step === 1 && 'Choisissez votre langue'}
              {step === 2 && 'Choisissez votre devise'}
              {step === 3 && 'Budget mensuel'}
              {step === 4 && 'Prêt à démarrer !'}
            </CardTitle>
            <CardDescription>
              {step < 4
                ? 'Nous avons besoin de quelques informations pour personnaliser votre expérience.'
                : 'Configuration terminée. Vous pouvez commencer à utiliser l\'application.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Progression */}
            <div>
              <Progress value={(step - 1) * (100 / 3)} />
              <div className="mt-2 text-xs text-muted-foreground">
                Étape {step} / 4
              </div>
            </div>

            {step === 1 && (
              <div className="space-y-4">
                <Label className="text-sm">Langue</Label>
                <Select value={locale} onValueChange={setLocale}>
                  <SelectTrigger className="w-full">
                    <Globe2 className="mr-2 h-4 w-4" />
                    <SelectValue placeholder="Choisissez une langue" />
                  </SelectTrigger>
                  <SelectContent>
                    {SUPPORTED_LOCALES.map(l => (
                      <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <Label className="text-sm">Devise par défaut</Label>
                <Select value={currency} onValueChange={setCurrency}>
                  <SelectTrigger className="w-full">
                    <Wallet className="mr-2 h-4 w-4" />
                    <SelectValue placeholder="Choisissez une devise" />
                  </SelectTrigger>
                  <SelectContent>
                    {SUPPORTED_CURRENCIES.map(c => (
                      <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4">
                <Label className="text-sm">Budget mensuel (dépenses)</Label>
                <Input
                  type="number"
                  inputMode="decimal"
                  value={monthlyBudgetStr}
                  onChange={e => setMonthlyBudgetStr(e.target.value)}
                  placeholder="Ex: 200000"
                />
                <p className="text-xs text-muted-foreground">
                  Vous pourrez le modifier à tout moment dans les paramètres.
                </p>
              </div>
            )}

            {step === 4 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-emerald-600">
                  <Check className="h-5 w-5" />
                  <span>Configuration enregistrée</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Voulez-vous une visite guidée rapide des principales fonctionnalités ? Vous pourrez la relancer plus tard depuis le tableau de bord.
                </p>
                <div className="flex gap-2">
                  <Button variant="secondary" onClick={() => router.replace('/dashboard')}>Plus tard</Button>
                  <Button onClick={handleSave}>
                    <Sparkles className="mr-2 h-4 w-4" /> Terminer et continuer
                  </Button>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-between pt-2">
              <Button variant="outline" disabled={step === 1} onClick={() => setStep(s => Math.max(1, s - 1))}>
                Retour
              </Button>
              {step < 4 ? (
                <Button disabled={!isStepValid} onClick={() => setStep(s => Math.min(4, s + 1))}>
                  Continuer
                </Button>
              ) : null}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
