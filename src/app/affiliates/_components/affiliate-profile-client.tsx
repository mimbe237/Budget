'use client';

import { useMemo, useState, useTransition } from 'react';
import Link from 'next/link';
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/alert';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { fr as frLocale } from 'date-fns/locale';
import { CheckCircle2, Download, FileText, Loader2 } from 'lucide-react';
import type { AffiliateProfileSummary } from '@/types/affiliate';
import {
  updateAffiliateProfile,
} from '../_actions/get-affiliate-profile';

type AffiliateProfileClientProps = {
  profile: AffiliateProfileSummary;
};

type FormState = {
  payoutMethod: AffiliateProfileSummary['payoutMethod'];
  bankName: string;
  iban: string;
  swift: string;
  paypalEmail: string;
  mobileOperator: string;
  mobileNumber: string;
  promotionChannels: string;
  notificationEmail: string;
  newsletter: boolean;
};

const METHOD_LABELS: Record<AffiliateProfileSummary['payoutMethod'], string> = {
  SEPA: 'Virement SEPA',
  PAYPAL: 'PayPal',
  MOBILE_MONEY: 'Mobile Money',
};

export function AffiliateProfileClient({ profile }: AffiliateProfileClientProps) {
  const [profileState, setProfileState] = useState<AffiliateProfileSummary>(profile);
  const [formState, setFormState] = useState<FormState>({
    payoutMethod: profile.payoutMethod,
    bankName: profile.payoutDetails.bankName ?? '',
    iban: profile.payoutDetails.iban ?? '',
    swift: profile.payoutDetails.swift ?? '',
    paypalEmail: profile.payoutDetails.paypalEmail ?? '',
    mobileOperator: profile.payoutDetails.mobileOperator ?? '',
    mobileNumber: profile.payoutDetails.mobileNumber ?? '',
    promotionChannels: profile.preferences.promotionChannels.join('\n'),
    notificationEmail: profile.preferences.notificationEmail,
    newsletter: profile.preferences.newsletter,
  });
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const isFrench = profileState.country === 'FR' || profileState.currency === 'EUR' || profileState.currency === 'XAF';

  const formatDate = useMemo(
    () =>
      new Intl.DateTimeFormat(isFrench ? 'fr-FR' : 'en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
    [isFrench],
  );

  const methodHelper = useMemo(() => {
    switch (formState.payoutMethod) {
      case 'SEPA':
        return isFrench
          ? 'Indiquez votre banque et vos informations IBAN/SWIFT. Elles resteront confidentielles.'
          : 'Provide your bank account details (IBAN/SWIFT). We keep the information confidential.';
      case 'PAYPAL':
        return isFrench
          ? 'Nous utiliserons votre adresse PayPal pour les versements.'
          : 'We will use your PayPal email for payouts.';
      case 'MOBILE_MONEY':
        return isFrench
          ? 'Renseignez l’opérateur et le numéro Mobile Money à créditer.'
          : 'Enter the Mobile Money operator and phone number to credit.';
      default:
        return '';
    }
  }, [formState.payoutMethod, isFrench]);

  const handleChange = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setFormState((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (formState.payoutMethod === 'SEPA' && (!formState.bankName || !formState.iban)) {
      setError(
        isFrench
          ? 'Veuillez renseigner votre banque et votre IBAN.'
          : 'Please provide your bank name and IBAN.',
      );
      return;
    }

    if (formState.payoutMethod === 'PAYPAL' && !formState.paypalEmail) {
      setError(
        isFrench
          ? 'Votre email PayPal est requis pour les paiements.'
          : 'A PayPal email is required.',
      );
      return;
    }

    if (
      formState.payoutMethod === 'MOBILE_MONEY' &&
      (!formState.mobileOperator || !formState.mobileNumber)
    ) {
      setError(
        isFrench
          ? 'Merci d’indiquer l’opérateur et le numéro Mobile Money.'
          : 'Please provide the Mobile Money operator and number.',
      );
      return;
    }

    startTransition(async () => {
      try {
        const updated = await updateAffiliateProfile({
          payoutMethod: formState.payoutMethod,
          payoutDetails: {
            bankName: sanitize(formState.bankName),
            iban: sanitize(formState.iban),
            swift: sanitize(formState.swift),
            paypalEmail: sanitize(formState.paypalEmail),
            mobileOperator: sanitize(formState.mobileOperator),
            mobileNumber: sanitize(formState.mobileNumber),
          },
          promotionChannels: splitChannels(formState.promotionChannels),
          notificationEmail: formState.notificationEmail,
          newsletter: formState.newsletter,
        });
        setProfileState(updated);
        setFormState({
          payoutMethod: updated.payoutMethod,
          bankName: updated.payoutDetails.bankName ?? '',
          iban: updated.payoutDetails.iban ?? '',
          swift: updated.payoutDetails.swift ?? '',
          paypalEmail: updated.payoutDetails.paypalEmail ?? '',
          mobileOperator: updated.payoutDetails.mobileOperator ?? '',
          mobileNumber: updated.payoutDetails.mobileNumber ?? '',
          promotionChannels: updated.preferences.promotionChannels.join('\n'),
          notificationEmail: updated.preferences.notificationEmail,
          newsletter: updated.preferences.newsletter,
        });
        toast({
          title: isFrench ? 'Profil mis à jour' : 'Profile updated',
          description: isFrench
            ? 'Vos informations de paiement ont été enregistrées.'
            : 'Your payout settings have been saved.',
        });
      } catch (err: any) {
        setError(
          err?.message ||
            (isFrench
              ? 'Impossible de mettre à jour votre profil.'
              : 'Unable to update your profile.'),
        );
      }
    });
  };

  const joinedDate = formatDate.format(new Date(profileState.joinedAt));

  const profileDocuments = useMemo(() => profileState.documents ?? [], [profileState.documents]);

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <Card className="border-primary/30 shadow-sm">
        <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle className="text-xl">
              {isFrench ? 'Profil affilié' : 'Affiliate profile'}
            </CardTitle>
            <CardDescription>
              {isFrench
                ? 'Vos informations de statut et de versement.'
                : 'Your affiliate status and payout preferences.'}
            </CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary" className="uppercase">
              {profileState.tier}
            </Badge>
            <Badge variant={profileState.status === 'APPROVED' ? 'default' : 'outline'}>
              {isFrench ? statutLabelFR(profileState.status) : profileState.status}
            </Badge>
            <Badge variant="outline">{profileState.affiliateCode}</Badge>
          </div>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">
              {isFrench ? 'Email principal' : 'Primary email'}
            </p>
            <p className="font-medium">{profileState.email}</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">
              {isFrench ? 'Pays / Devise' : 'Country / Currency'}
            </p>
            <p className="font-medium">
              {profileState.country} · {profileState.currency}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">{isFrench ? 'Inscrit depuis' : 'Joined'}</p>
            <p className="font-medium">{joinedDate}</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">
              {isFrench ? 'Méthode de paiement actuelle' : 'Current payout method'}
            </p>
            <p className="font-medium">{METHOD_LABELS[profileState.payoutMethod]}</p>
          </div>
        </CardContent>
      </Card>

      <form onSubmit={handleSubmit} className="grid gap-6 md:grid-cols-[3fr_2fr]">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>{isFrench ? 'Préférences de versement' : 'Payout preferences'}</CardTitle>
            <CardDescription>{methodHelper}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {error && (
              <Alert variant="destructive">
                <AlertTitle>{isFrench ? 'Erreur' : 'Error'}</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="payout-method">
                {isFrench ? 'Méthode de paiement' : 'Payout method'}
              </Label>
              <Select
                value={formState.payoutMethod}
                onValueChange={(value: AffiliateProfileSummary['payoutMethod']) =>
                  handleChange('payoutMethod', value)
                }
              >
                <SelectTrigger id="payout-method">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SEPA">Virement SEPA</SelectItem>
                  <SelectItem value="PAYPAL">PayPal</SelectItem>
                  <SelectItem value="MOBILE_MONEY">Mobile Money</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formState.payoutMethod === 'SEPA' && (
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="bankName">{isFrench ? 'Banque' : 'Bank'}</Label>
                  <Input
                    id="bankName"
                    value={formState.bankName}
                    onChange={(event) => handleChange('bankName', event.target.value)}
                    placeholder={isFrench ? 'Ex : Société Générale' : 'e.g. Société Générale'}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="iban">IBAN</Label>
                  <Input
                    id="iban"
                    value={formState.iban}
                    onChange={(event) => handleChange('iban', event.target.value)}
                    placeholder="CM21 3000 0200 ..."
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="swift">SWIFT / BIC</Label>
                  <Input
                    id="swift"
                    value={formState.swift}
                    onChange={(event) => handleChange('swift', event.target.value)}
                    placeholder="SGCMCMCX"
                  />
                </div>
              </div>
            )}

            {formState.payoutMethod === 'PAYPAL' && (
              <div className="space-y-2">
                <Label htmlFor="paypalEmail">PayPal</Label>
                <Input
                  id="paypalEmail"
                  type="email"
                  value={formState.paypalEmail}
                  onChange={(event) => handleChange('paypalEmail', event.target.value)}
                  placeholder="you@example.com"
                />
              </div>
            )}

            {formState.payoutMethod === 'MOBILE_MONEY' && (
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="mobileOperator">
                    {isFrench ? 'Opérateur' : 'Operator'}
                  </Label>
                  <Select
                    value={formState.mobileOperator}
                    onValueChange={(value) => handleChange('mobileOperator', value)}
                  >
                    <SelectTrigger id="mobileOperator">
                      <SelectValue placeholder={isFrench ? 'Sélectionner' : 'Select'} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MTN">MTN Mobile Money</SelectItem>
                      <SelectItem value="ORANGE">Orange Money</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="mobileNumber">
                    {isFrench ? 'Numéro Mobile Money' : 'Mobile Money number'}
                  </Label>
                  <Input
                    id="mobileNumber"
                    value={formState.mobileNumber}
                    onChange={(event) => handleChange('mobileNumber', event.target.value)}
                    placeholder="+237 6XX XXX XXX"
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="promotionChannels">
                {isFrench ? 'Vos canaux de promotion' : 'Promotion channels'}
              </Label>
              <Textarea
                id="promotionChannels"
                rows={4}
                value={formState.promotionChannels}
                onChange={(event) => handleChange('promotionChannels', event.target.value)}
                placeholder={
                  isFrench
                    ? 'Ex: LinkedIn\nNewsletter\nWebinars IA'
                    : 'e.g. LinkedIn\nNewsletter\nAI webinars'
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notificationEmail">
                {isFrench ? 'Email de notification' : 'Notification email'}
              </Label>
              <Input
                id="notificationEmail"
                type="email"
                value={formState.notificationEmail}
                onChange={(event) => handleChange('notificationEmail', event.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                {isFrench
                  ? 'Nous envoyons les alertes de commissions à cette adresse.'
                  : 'Commission alerts will be sent to this email address.'}
              </p>
            </div>

            <div className="flex items-center justify-between rounded-md border p-3">
              <div className="space-y-0.5">
                <p className="text-sm font-medium">
                  {isFrench ? 'Newsletter programme' : 'Program newsletter'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {isFrench
                    ? 'Recevez les campagnes, assets marketing et bonus à venir.'
                    : 'Receive upcoming campaigns, marketing assets, and bonuses.'}
                </p>
              </div>
              <Switch
                checked={formState.newsletter}
                onCheckedChange={(checked) => handleChange('newsletter', checked)}
                aria-label={isFrench ? 'Activer la newsletter' : 'Enable newsletter'}
              />
            </div>

            <div className="flex justify-end">
              <Button type="submit" disabled={isPending} className="min-w-[180px]">
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {isFrench ? 'Enregistrement...' : 'Saving...'}
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    {isFrench ? 'Enregistrer' : 'Save changes'}
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>{isFrench ? 'Documents & ressources' : 'Documents & resources'}</CardTitle>
            <CardDescription>
              {isFrench
                ? 'Téléchargez vos contrats, factures et guides marketing.'
                : 'Download your contracts, invoices, and marketing guides.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-md border bg-muted/40 p-4 text-sm">
              <p className="font-medium">
                {isFrench ? 'Vos préférences d’alertes' : 'Alert preferences'}
              </p>
              <ul className="mt-2 space-y-1 text-muted-foreground">
                <li>
                  {isFrench ? 'Email de notification :' : 'Notification email:'}{' '}
                  <span className="font-medium text-foreground">
                    {profileState.preferences.notificationEmail}
                  </span>
                </li>
                <li>
                  {isFrench ? 'Newsletter :' : 'Newsletter:'}{' '}
                  <Badge variant="outline" className="uppercase">
                    {profileState.preferences.newsletter
                      ? isFrench
                        ? 'Actif'
                        : 'On'
                      : isFrench
                        ? 'Inactif'
                        : 'Off'}
                  </Badge>
                </li>
                <li>
                  {isFrench ? 'Canaux :' : 'Channels:'}{' '}
                  {profileState.preferences.promotionChannels.join(' · ')}
                </li>
              </ul>
            </div>

            <Separator />

            <div>
              <p className="text-sm font-medium">
                {isFrench ? 'Historique documents' : 'Document history'}
              </p>
              <Table className="mt-3 text-sm">
                <TableHeader>
                  <TableRow>
                    <TableHead>{isFrench ? 'Document' : 'Document'}</TableHead>
                    <TableHead>{isFrench ? 'Type' : 'Type'}</TableHead>
                    <TableHead>{isFrench ? 'Ajouté le' : 'Uploaded'}</TableHead>
                    <TableHead className="text-right">{isFrench ? 'Action' : 'Action'}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {profileDocuments.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground">
                        {isFrench ? 'Aucun document pour le moment.' : 'No documents yet.'}
                      </TableCell>
                    </TableRow>
                  ) : (
                    profileDocuments.map((doc) => (
                      <TableRow key={`${doc.type}-${doc.title}`}>
                        <TableCell className="font-medium">{doc.title}</TableCell>
                        <TableCell className="uppercase">{doc.type}</TableCell>
                        <TableCell>
                          {format(new Date(doc.uploadedAt), 'd MMMM yyyy', {
                            locale: isFrench ? frLocale : undefined,
                          })}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="outline" size="sm" asChild>
                            <Link href={doc.url} download>
                              <Download className="mr-2 h-4 w-4" />
                              {isFrench ? 'Télécharger' : 'Download'}
                            </Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            <div className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-2 font-medium text-foreground">
                <FileText className="h-4 w-4" />
                {isFrench
                  ? 'Besoin d’un document spécifique ?'
                  : 'Need a specific document?'}
              </div>
              <p className="mt-2">
                {isFrench
                  ? 'Contactez support@budget-pro.com pour vos demandes de contrats ou attestations.'
                  : 'Contact support@budget-pro.com for contract or statement requests.'}
              </p>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}

function sanitize(value: string): string | null {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function splitChannels(value: string): string[] {
  return value
    .split(/\n|,/)
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function statutLabelFR(status: AffiliateProfileSummary['status']): string {
  switch (status) {
    case 'APPROVED':
      return 'Approuvé';
    case 'PENDING':
      return 'En attente';
    case 'BLOCKED':
      return 'Bloqué';
    case 'SUSPENDED':
      return 'Suspendu';
    default:
      return status;
  }
}
