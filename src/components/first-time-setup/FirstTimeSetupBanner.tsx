'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useFirestore, useUser, setDocumentNonBlocking } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X, Settings, Globe2, Wallet, TrendingUp } from 'lucide-react';

const SUPPORTED_LOCALES = [
  { value: 'fr-CM', label: 'Français' },
  { value: 'en-US', label: 'English' },
];

const SUPPORTED_CURRENCIES = [
  { value: 'XAF', label: 'XAF (Franc CFA)' },
  { value: 'XOF', label: 'XOF (Franc CFA)' },
  { value: 'EUR', label: 'EUR (Euro)' },
  { value: 'USD', label: 'USD (Dollar)' },
];

export function FirstTimeSetupBanner() {
  const router = useRouter();
  const firestore = useFirestore();
  const { user, userProfile } = useUser();
  const [isDismissed, setIsDismissed] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  
  const [locale, setLocale] = useState<string>('');
  const [currency, setCurrency] = useState<string>('');
  const [monthlyBudget, setMonthlyBudget] = useState<string>('');

  const isFrench = userProfile?.locale === 'fr-CM';

  // Vérifier si l'utilisateur a besoin de la configuration initiale
  const needsSetup = user && userProfile && (
    !userProfile.locale ||
    !userProfile.displayCurrency ||
    typeof userProfile.monthlyExpenseBudget !== 'number'
  );

  // Déterminer quels champs manquent
  const missingLocale = !userProfile?.locale;
  const missingCurrency = !userProfile?.displayCurrency;
  const missingBudget = typeof userProfile?.monthlyExpenseBudget !== 'number';

  useEffect(() => {
    if (userProfile) {
      setLocale(userProfile.locale || 'fr-CM');
      setCurrency(userProfile.displayCurrency || 'XAF');
      setMonthlyBudget(
        typeof userProfile.monthlyExpenseBudget === 'number' 
          ? String(userProfile.monthlyExpenseBudget) 
          : ''
      );
    }
  }, [userProfile]);

  const handleSave = async () => {
    if (!user || !firestore) return;

    const updates: any = {
      id: user.uid,
      updatedAt: new Date().toISOString(),
    };

    if (locale) updates.locale = locale;
    if (currency) updates.displayCurrency = currency;
    const budgetValue = parseFloat(monthlyBudget);
    if (!isNaN(budgetValue) && budgetValue > 0) {
      updates.monthlyExpenseBudget = budgetValue;
    }

    const profileRef = doc(firestore, `users/${user.uid}`);
    await setDocumentNonBlocking(profileRef, updates, { merge: true });
    
    setIsExpanded(false);
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    // Sauvegarder dans localStorage pour ne plus afficher
    if (user) {
      localStorage.setItem(`setup-dismissed-${user.uid}`, 'true');
    }
  };

  // Ne pas afficher si :
  // - Pas besoin de configuration
  // - Déjà rejeté
  // - Stocké dans localStorage comme rejeté
  useEffect(() => {
    if (user) {
      const dismissed = localStorage.getItem(`setup-dismissed-${user.uid}`);
      if (dismissed === 'true') {
        setIsDismissed(true);
      }
    }
  }, [user]);

  if (!needsSetup || isDismissed) {
    return null;
  }

  return (
    <Card className="mb-6 border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
      <div className="p-4">
        {/* Header avec bouton fermer */}
        <div className="flex items-start justify-between gap-4 mb-3">
          <div className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-blue-600" />
            <h3 className="font-semibold text-slate-900">
              {isFrench ? 'Bienvenue ! Personnalisez votre expérience' : 'Welcome! Personalize your experience'}
            </h3>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDismiss}
            className="h-6 w-6 p-0 text-slate-400 hover:text-slate-600"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {!isExpanded ? (
          <div className="space-y-2">
            <p className="text-sm text-slate-600">
              {isFrench 
                ? 'Nous avons remarqué que certaines préférences ne sont pas encore configurées :'
                : 'We noticed some preferences are not yet configured:'}
            </p>
            <ul className="text-sm text-slate-600 space-y-1 ml-4">
              {missingLocale && (
                <li className="flex items-center gap-2">
                  <Globe2 className="h-3.5 w-3.5 text-blue-500" />
                  {isFrench ? 'Langue préférée' : 'Preferred language'}
                </li>
              )}
              {missingCurrency && (
                <li className="flex items-center gap-2">
                  <Wallet className="h-3.5 w-3.5 text-blue-500" />
                  {isFrench ? 'Devise par défaut' : 'Default currency'}
                </li>
              )}
              {missingBudget && (
                <li className="flex items-center gap-2">
                  <TrendingUp className="h-3.5 w-3.5 text-blue-500" />
                  {isFrench ? 'Budget mensuel' : 'Monthly budget'}
                </li>
              )}
            </ul>
            <div className="flex gap-2 pt-2">
              <Button size="sm" onClick={() => setIsExpanded(true)}>
                {isFrench ? 'Configurer maintenant' : 'Configure now'}
              </Button>
              <Button size="sm" variant="outline" onClick={() => router.push('/settings')}>
                {isFrench ? 'Plus tard (Paramètres)' : 'Later (Settings)'}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Langue */}
            {missingLocale && (
              <div className="space-y-2">
                <Label className="text-sm flex items-center gap-2">
                  <Globe2 className="h-4 w-4" />
                  {isFrench ? 'Langue' : 'Language'}
                </Label>
                <Select value={locale} onValueChange={setLocale}>
                  <SelectTrigger>
                    <SelectValue placeholder={isFrench ? 'Choisir' : 'Select'} />
                  </SelectTrigger>
                  <SelectContent>
                    {SUPPORTED_LOCALES.map(l => (
                      <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Devise */}
            {missingCurrency && (
              <div className="space-y-2">
                <Label className="text-sm flex items-center gap-2">
                  <Wallet className="h-4 w-4" />
                  {isFrench ? 'Devise' : 'Currency'}
                </Label>
                <Select value={currency} onValueChange={setCurrency}>
                  <SelectTrigger>
                    <SelectValue placeholder={isFrench ? 'Choisir' : 'Select'} />
                  </SelectTrigger>
                  <SelectContent>
                    {SUPPORTED_CURRENCIES.map(c => (
                      <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Budget */}
            {missingBudget && (
              <div className="space-y-2">
                <Label className="text-sm flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  {isFrench ? 'Budget mensuel' : 'Monthly budget'}
                </Label>
                <Input
                  type="number"
                  inputMode="decimal"
                  value={monthlyBudget}
                  onChange={e => setMonthlyBudget(e.target.value)}
                  placeholder={isFrench ? 'Ex: 200000' : 'Ex: 2000'}
                />
                <p className="text-xs text-slate-500">
                  {isFrench 
                    ? 'Vous pouvez le modifier dans Paramètres > Budget'
                    : 'You can change it in Settings > Budget'}
                </p>
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <Button onClick={handleSave} disabled={
                (missingLocale && !locale) ||
                (missingCurrency && !currency) ||
                (missingBudget && (!monthlyBudget || parseFloat(monthlyBudget) <= 0))
              }>
                {isFrench ? 'Enregistrer' : 'Save'}
              </Button>
              <Button variant="ghost" onClick={() => setIsExpanded(false)}>
                {isFrench ? 'Annuler' : 'Cancel'}
              </Button>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
