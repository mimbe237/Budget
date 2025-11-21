'use client';

import { useMemo, useState, useTransition } from 'react';
import Link from 'next/link';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import {
  ArrowUpRight,
  ClipboardCopy,
  FileSpreadsheet,
  Link2,
  Loader2,
  Plus,
  Rocket,
  Download,
} from 'lucide-react';
import { formatDistanceToNowStrict } from 'date-fns';
import { fr as frLocale } from 'date-fns/locale';
import { downloadCSV, generateFilename } from '@/lib/export-utils';
import type { AffiliateLink, AffiliateLinksOverview } from '@/types/affiliate';
import { createAffiliateLink } from '../_actions/get-affiliate-links';

type AffiliateLinksClientProps = {
  overview: AffiliateLinksOverview;
};

type CreateLinkFormState = {
  name: string;
  url: string;
  utmSource: string;
  utmMedium: string;
  utmCampaign: string;
  utmContent: string;
};

const INITIAL_FORM: CreateLinkFormState = {
  name: '',
  url: 'https://budget-pro.com',
  utmSource: '',
  utmMedium: '',
  utmCampaign: '',
  utmContent: '',
};

export function AffiliateLinksClient({ overview }: AffiliateLinksClientProps) {
  const [links, setLinks] = useState<AffiliateLink[]>(overview.links);
  const [isDialogOpen, setDialogOpen] = useState(false);
  const [formState, setFormState] = useState<CreateLinkFormState>(INITIAL_FORM);
  const [isPending, startTransition] = useTransition();
  const [copiedLinkId, setCopiedLinkId] = useState<string | null>(null);
  const { toast } = useToast();

  const locale = overview.affiliateCode.endsWith('-92') ? 'fr-CM' : 'fr-FR';
  const isFrench = locale.startsWith('fr');

  const numberFormatter = useMemo(
    () =>
      new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: 'XAF',
        maximumFractionDigits: 0,
      }),
    [locale],
  );

  const aggregated = useMemo(() => {
    const totals = links.reduce(
      (acc, link) => {
        acc.clicks += link.stats.clicks;
        acc.conversions += link.stats.conversions;
        acc.revenue += link.stats.revenue;
        if (link.active) acc.active += 1;
        return acc;
      },
      { clicks: 0, conversions: 0, revenue: 0, active: 0 },
    );
    const conversionRate = totals.clicks > 0 ? (totals.conversions / totals.clicks) * 100 : 0;
    return { ...totals, conversionRate };
  }, [links]);

  const handleChange = <K extends keyof CreateLinkFormState>(key: K, value: CreateLinkFormState[K]) => {
    setFormState((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!formState.utmSource || !formState.utmMedium) {
      toast({
        title: isFrench ? 'Champs obligatoires' : 'Required fields',
        description: isFrench
          ? 'Renseignez au minimum la source et le medium UTM.'
          : 'Please provide at least the UTM source and medium.',
        variant: 'destructive',
      });
      return;
    }

    startTransition(async () => {
      try {
        const newLink = await createAffiliateLink({
          name: formState.name,
          url: formState.url,
          utmSource: formState.utmSource,
          utmMedium: formState.utmMedium,
          utmCampaign: formState.utmCampaign || undefined,
          utmContent: formState.utmContent || undefined,
          affiliateCode: overview.affiliateCode,
        });
        setLinks((prev) => [newLink, ...prev]);
        setFormState(INITIAL_FORM);
        setDialogOpen(false);
        toast({
          title: isFrench ? 'Lien créé' : 'Link created',
          description: isFrench
            ? 'Votre lien de tracking est prêt à être partagé.'
            : 'Your tracking link is ready to share.',
        });
      } catch (error: any) {
        toast({
          title: isFrench ? 'Erreur' : 'Error',
          description: error?.message ?? (isFrench ? "Impossible de créer le lien" : 'Unable to create link'),
          variant: 'destructive',
        });
      }
    });
  };

  const trackingUrl = (link: AffiliateLink) => {
    const base = link.url.includes('?') ? `${link.url}&` : `${link.url}?`;
    const params = new URLSearchParams({
      aff: overview.affiliateCode,
      utm_source: link.utm.source,
      utm_medium: link.utm.medium,
    });
    if (link.utm.campaign) params.set('utm_campaign', link.utm.campaign);
    if (link.utm.content) params.set('utm_content', link.utm.content);
    return `${base}${params.toString()}`;
  };

  const handleCopy = async (link: AffiliateLink) => {
    try {
      await navigator.clipboard.writeText(trackingUrl(link));
      setCopiedLinkId(link.id);
      toast({
        title: isFrench ? 'Lien copié' : 'Link copied',
        description: isFrench
          ? 'L’URL de tracking est dans votre presse-papiers.'
          : 'Tracking link copied to clipboard.',
      });
      setTimeout(() => setCopiedLinkId(null), 2000);
    } catch (error) {
      toast({
        title: isFrench ? 'Erreur de copie' : 'Copy error',
        description: isFrench
          ? 'Impossible de copier le lien. Essayez manuellement.'
          : 'Unable to copy the link. Try manually.',
        variant: 'destructive',
      });
    }
  };

  const handleExportCSV = () => {
    const rows: string[] = [];
    rows.push('Name,URL,Clicks,Conversions,Conversion Rate %,Revenue,Active');
    links.forEach((link) => {
      rows.push(
        `${link.name.replace(/,/g, ' ')},${trackingUrl(link)},${link.stats.clicks},${link.stats.conversions},${link.stats.conversionRate.toFixed(2)},${link.stats.revenue},${link.active ? 'yes' : 'no'}`,
      );
    });
    downloadCSV(rows.join('\n'), generateFilename('affiliate-links', 'csv'));
  };

  const handleExportExcel = async () => {
    const xlsx = await import('xlsx');
    const wb = xlsx.utils.book_new();
    const ws = xlsx.utils.json_to_sheet(
      links.map((link) => ({
        Name: link.name,
        Slug: link.slug,
        URL: trackingUrl(link),
        Clicks: link.stats.clicks,
        Conversions: link.stats.conversions,
        'Conversion rate (%)': link.stats.conversionRate.toFixed(2),
        Revenue: link.stats.revenue,
        Active: link.active ? 'Yes' : 'No',
        'Last click at': link.stats.lastClickAt
          ? new Date(link.stats.lastClickAt).toLocaleString(locale)
          : '-',
      })),
    );
    xlsx.utils.book_append_sheet(wb, ws, 'Affiliate links');
    xlsx.writeFile(wb, generateFilename('affiliate-links', 'xlsx'));
  };

  const conversionRateBadge = (value: number) => {
    if (value >= 12) return 'bg-emerald-100 text-emerald-700';
    if (value >= 8) return 'bg-blue-100 text-blue-700';
    if (value >= 4) return 'bg-amber-100 text-amber-700';
    return 'bg-rose-100 text-rose-700';
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {isFrench ? 'Liens d’affiliation' : 'Affiliate links'}
          </h1>
          <p className="text-sm text-muted-foreground">
            {isFrench
              ? 'Générez des URLs trackées, mesurez vos performances et partagez vos meilleures campagnes.'
              : 'Generate tracked URLs, measure performance and share your best campaigns.'}
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
            <Badge variant="outline">{overview.affiliateCode}</Badge>
            <Badge variant="secondary">Cookie {overview.cookieDays} jours</Badge>
            <Badge variant="outline">{links.filter((l) => l.active).length} actifs</Badge>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" onClick={handleExportCSV}>
            <Download className="mr-2 h-4 w-4" />
            CSV
          </Button>
          <Button variant="outline" onClick={handleExportExcel}>
            <FileSpreadsheet className="mr-2 h-4 w-4" />
            Excel
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                {isFrench ? 'Nouveau lien' : 'New link'}
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>{isFrench ? 'Créer un lien tracké' : 'Create tracking link'}</DialogTitle>
                <DialogDescription>
                  {isFrench
                    ? 'Préparez une URL unique avec vos paramètres UTM. Vous pourrez la partager immédiatement.'
                    : 'Prepare a unique URL with your UTM parameters ready to share instantly.'}
                </DialogDescription>
              </DialogHeader>
              <form className="grid gap-4" onSubmit={handleSubmit}>
                <div className="grid gap-2">
                  <Label htmlFor="link-name">{isFrench ? 'Nom de la campagne' : 'Campaign name'} (optional)</Label>
                  <Input
                    id="link-name"
                    value={formState.name}
                    onChange={(event) => handleChange('name', event.target.value)}
                    placeholder={isFrench ? 'Ex. LinkedIn PME Décembre' : 'e.g. LinkedIn SMB December'}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="link-url">URL destination</Label>
                  <Input
                    id="link-url"
                    value={formState.url}
                    onChange={(event) => handleChange('url', event.target.value)}
                    type="url"
                    required
                  />
                </div>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="grid gap-2">
                    <Label htmlFor="utm-source">UTM source</Label>
                    <Input
                      id="utm-source"
                      value={formState.utmSource}
                      onChange={(event) => handleChange('utmSource', event.target.value)}
                      placeholder="linkedin"
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="utm-medium">UTM medium</Label>
                    <Input
                      id="utm-medium"
                      value={formState.utmMedium}
                      onChange={(event) => handleChange('utmMedium', event.target.value)}
                      placeholder="cpc"
                      required
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="grid gap-2">
                    <Label htmlFor="utm-campaign">UTM campaign</Label>
                    <Input
                      id="utm-campaign"
                      value={formState.utmCampaign}
                      onChange={(event) => handleChange('utmCampaign', event.target.value)}
                      placeholder="q4-linkedin"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="utm-content">UTM content</Label>
                    <Input
                      id="utm-content"
                      value={formState.utmContent}
                      onChange={(event) => handleChange('utmContent', event.target.value)}
                      placeholder="visuel-01"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    {isFrench ? 'Annuler' : 'Cancel'}
                  </Button>
                  <Button type="submit" disabled={isPending}>
                    {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    {isFrench ? 'Créer' : 'Create'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {isFrench ? 'Trafic total' : 'Total traffic'}
            </CardTitle>
            <Link2 className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{aggregated.clicks}</div>
            <p className="text-xs text-muted-foreground">
              {isFrench ? 'Clicks cumulés sur la période' : 'All clicks over the active period'}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {isFrench ? 'Conversions' : 'Conversions'}
            </CardTitle>
            <Rocket className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{aggregated.conversions}</div>
            <Badge className={`mt-3 ${conversionRateBadge(aggregated.conversionRate)}`}>
              {aggregated.conversionRate.toFixed(1)}%
            </Badge>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {isFrench ? 'Commissions générées' : 'Generated commissions'}
            </CardTitle>
            <ArrowUpRight className="h-4 w-4 text-violet-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{numberFormatter.format(aggregated.revenue)}</div>
            <p className="text-xs text-muted-foreground">
              {isFrench ? 'Brut estimé sur 12 mois' : 'Gross estimate over 12 months'}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {isFrench ? 'Liens actifs' : 'Active links'}
            </CardTitle>
            <Rocket className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{aggregated.active}</div>
            <p className="text-xs text-muted-foreground">
              {links.length}{' '}
              {isFrench ? 'liens au total' : 'links in total'}
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="list" className="space-y-4">
        <TabsList>
          <TabsTrigger value="list">{isFrench ? 'Liste' : 'List'}</TabsTrigger>
          <TabsTrigger value="guides">{isFrench ? 'Bonnes pratiques' : 'Playbook'}</TabsTrigger>
        </TabsList>
        <TabsContent value="list" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{isFrench ? 'Vos liens trackés' : 'Tracked links'}</CardTitle>
              <CardDescription>
                {isFrench
                  ? 'Copiez l’URL, prévisualisez la page ou exportez les statistiques vers vos rapports.'
                  : 'Copy the URL, preview the landing page or export statistics to your own reports.'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[420px] rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{isFrench ? 'Nom' : 'Name'}</TableHead>
                      <TableHead>{isFrench ? 'Destination' : 'Destination'}</TableHead>
                      <TableHead className="text-right">{isFrench ? 'Clicks' : 'Clicks'}</TableHead>
                      <TableHead className="text-right">{isFrench ? 'Conv.' : 'Conv.'}</TableHead>
                      <TableHead className="text-right">%</TableHead>
                      <TableHead className="text-right">{isFrench ? 'Revenu' : 'Revenue'}</TableHead>
                      <TableHead>{isFrench ? 'Dernier clic' : 'Last click'}</TableHead>
                      <TableHead>{isFrench ? 'Actions' : 'Actions'}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {links.map((link) => (
                      <TableRow key={link.id}>
                        <TableCell>
                          <div className="font-medium">{link.name}</div>
                          <div className="text-xs text-muted-foreground">slug: {link.slug}</div>
                          <div className="mt-1 text-xs">
                            <Badge variant={link.active ? 'secondary' : 'outline'}>
                              {link.active ? (isFrench ? 'Actif' : 'Active') : isFrench ? 'Inactif' : 'Inactive'}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          <div className="flex flex-col gap-1">
                            <span className="break-all">{trackingUrl(link)}</span>
                            <Button asChild variant="link" className="h-auto p-0 text-xs">
                              <Link href={link.url} target="_blank" rel="noreferrer">
                                {isFrench ? 'Prévisualiser' : 'Preview'}
                              </Link>
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-semibold">{link.stats.clicks}</TableCell>
                        <TableCell className="text-right font-semibold">{link.stats.conversions}</TableCell>
                        <TableCell className="text-right">
                          <Badge className={conversionRateBadge(link.stats.conversionRate)}>
                            {link.stats.conversionRate.toFixed(1)}%
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">{numberFormatter.format(link.stats.revenue)}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {link.stats.lastClickAt
                            ? formatDistanceToNowStrict(new Date(link.stats.lastClickAt), {
                                addSuffix: true,
                                locale: isFrench ? frLocale : undefined,
                              })
                            : '—'}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-2">
                            <Button size="sm" variant="outline" onClick={() => handleCopy(link)}>
                              {copiedLinkId === link.id ? (
                                <Rocket className="mr-2 h-4 w-4 text-emerald-500" />
                              ) : (
                                <ClipboardCopy className="mr-2 h-4 w-4" />
                              )}
                              {copiedLinkId === link.id
                                ? isFrench ? 'Copié' : 'Copied'
                                : isFrench ? 'Copier' : 'Copy'}
                            </Button>
                            <Button asChild size="sm" variant="outline">
                              <Link href={trackingUrl(link)} target="_blank" rel="noreferrer">
                                <ArrowUpRight className="mr-1 h-4 w-4" />
                                {isFrench ? 'Ouvrir' : 'Open'}
                              </Link>
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {links.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={8} className="py-10 text-center text-sm text-muted-foreground">
                          {isFrench
                            ? 'Aucun lien pour le moment. Créez votre première campagne ci-dessus.'
                            : 'No links yet. Create your first campaign above.'}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="guides">
          <Card>
            <CardHeader>
              <CardTitle>{isFrench ? 'Boîte à idées' : 'Playbook ideas'}</CardTitle>
              <CardDescription>
                {isFrench
                  ? 'Des inspirations rapides pour booster vos performances.'
                  : 'Quick inspiration to boost performance.'}
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-2">
              <Card className="border-dashed">
                <CardContent className="space-y-2 p-4">
                  <h3 className="font-semibold">{isFrench ? 'Challenge 7 jours' : '7-day challenge'}</h3>
                  <p className="text-sm text-muted-foreground">
                    {isFrench
                      ? 'Planifiez 7 posts LinkedIn autour des bénéfices Budget Pro avec call-to-action unique.'
                      : 'Schedule 7 LinkedIn posts focusing on Budget Pro benefits with a unique CTA.'}
                  </p>
                </CardContent>
              </Card>
              <Card className="border-dashed">
                <CardContent className="space-y-2 p-4">
                  <h3 className="font-semibold">{isFrench ? 'Nurturing email' : 'Nurturing email'}</h3>
                  <p className="text-sm text-muted-foreground">
                    {isFrench
                      ? 'Segmenter vos contacts froids et proposer une démo exclusive Budget Pro.'
                      : 'Segment colder leads and pitch an exclusive Budget Pro demo.'}
                  </p>
                </CardContent>
              </Card>
              <Card className="border-dashed">
                <CardContent className="space-y-2 p-4">
                  <h3 className="font-semibold">{isFrench ? 'Bundle contenu' : 'Content bundle'}</h3>
                  <p className="text-sm text-muted-foreground">
                    {isFrench
                      ? 'Créez un guide PDF et capturez des emails avec votre lien personnalisé.'
                      : 'Publish a PDF playbook and capture leads with your custom link.'}
                  </p>
                </CardContent>
              </Card>
              <Card className="border-dashed">
                <CardContent className="space-y-2 p-4">
                  <h3 className="font-semibold">{isFrench ? 'Webinaire Budget Pro' : 'Budget Pro webinar'}</h3>
                  <p className="text-sm text-muted-foreground">
                    {isFrench
                      ? 'Organisez une session live “Mieux piloter sa trésorerie” et partagez votre lien.'
                      : 'Host a live session “How to manage cashflow” and share your affiliate link.'}
                  </p>
                </CardContent>
              </Card>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
