"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUser, useFirestore } from "@/firebase";
import { collection, query, where, getDocs, orderBy, Timestamp } from "firebase/firestore";
import { getFunctions, httpsCallable } from "firebase/functions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { AlertCircle, Copy, ExternalLink, Link2, Loader2, Plus, TrendingUp, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface AffiliateLink {
  id: string;
  affiliateId: string;
  affiliateCode: string;
  linkCode: string;
  name?: string;
  utmSource: string;
  utmMedium: string;
  utmCampaign?: string;
  landingPage: string;
  active: boolean;
  totalClicks: number;
  totalConversions: number;
  createdAt: Timestamp;
}

interface Affiliate {
  id: string;
  affiliateCode: string;
  status: string;
}

export default function AffiliateLinksPage() {
  const { user } = useUser();
  const db = useFirestore();
  const functions = getFunctions();
  const router = useRouter();
  const { toast } = useToast();
  const [affiliate, setAffiliate] = useState<Affiliate | null>(null);
  const [links, setLinks] = useState<AffiliateLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    utmSource: "",
    utmMedium: "",
    utmCampaign: "",
    landingPage: "https://budget-pro.com",
  });

  useEffect(() => {
    if (!user) {
      router.push("/login");
      return;
    }
    loadData();
  }, [user]);

  const loadData = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Charger l'affilié
      const affiliatesRef = collection(db, "affiliates");
      const affiliateQuery = query(affiliatesRef, where("userId", "==", user.uid));
      const affiliateSnap = await getDocs(affiliateQuery);

      if (affiliateSnap.empty) {
        router.push("/affiliates");
        return;
      }

      const affiliateData = {
        id: affiliateSnap.docs[0].id,
        ...affiliateSnap.docs[0].data(),
      } as Affiliate;

      setAffiliate(affiliateData);

      // Charger les liens
      const linksRef = collection(db, "affiliateLinks");
      const linksQuery = query(
        linksRef,
        where("affiliateId", "==", affiliateData.id),
        orderBy("createdAt", "desc")
      );
      const linksSnap = await getDocs(linksQuery);

      const linksData = linksSnap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as AffiliateLink[];

      setLinks(linksData);
    } catch (err) {
      console.error("Error loading data:", err);
      toast({ title: "Erreur", description: "Erreur lors du chargement des données", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateLink = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!affiliate) return;

    try {
      setCreating(true);

      const createAffiliateLink = httpsCallable(functions, "createAffiliateLink");
      const result = await createAffiliateLink({
        affiliateId: affiliate.id,
        name: formData.name || undefined,
        utmSource: formData.utmSource,
        utmMedium: formData.utmMedium,
        utmCampaign: formData.utmCampaign || undefined,
        landingPage: formData.landingPage,
      });

      toast({ title: "Lien créé avec succès !", description: "Votre lien d'affiliation est prêt à être utilisé." });
      setShowCreateDialog(false);
      setFormData({
        name: "",
        utmSource: "",
        utmMedium: "",
        utmCampaign: "",
        landingPage: "https://budget-pro.com",
      });

      // Recharger les liens
      await loadData();
    } catch (err: any) {
      console.error("Error creating link:", err);
      toast({ title: "Erreur", description: err.message || "Erreur lors de la création du lien", variant: "destructive" });
    } finally {
      setCreating(false);
    }
  };

  const generateTrackingUrl = (link: AffiliateLink) => {
    const params = new URLSearchParams({
      aff: link.affiliateCode,
      utm_source: link.utmSource,
      utm_medium: link.utmMedium,
    });

    if (link.utmCampaign) {
      params.append("utm_campaign", link.utmCampaign);
    }

    return `${link.landingPage}?${params.toString()}`;
  };

  const copyToClipboard = async (link: AffiliateLink) => {
    const url = generateTrackingUrl(link);
    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(link.id);
      toast({ title: "Lien copié !", description: "Le lien a été copié dans le presse-papiers." });
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      toast({ title: "Erreur", description: "Erreur lors de la copie", variant: "destructive" });
    }
  };

  const getConversionRate = (link: AffiliateLink) => {
    if (link.totalClicks === 0) return "0.00";
    return ((link.totalConversions / link.totalClicks) * 100).toFixed(2);
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Skeleton className="h-12 w-64" />
        <Skeleton className="h-[400px]" />
      </div>
    );
  }

  if (!affiliate) {
    return (
      <div className="container mx-auto p-6">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Compte affilié non trouvé</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* En-tête */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Mes liens d'affiliation</h1>
          <p className="text-muted-foreground">Créez et gérez vos liens de tracking personnalisés</p>
        </div>

        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Créer un lien
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <form onSubmit={handleCreateLink}>
              <DialogHeader>
                <DialogTitle>Créer un nouveau lien</DialogTitle>
                <DialogDescription>
                  Personnalisez vos paramètres UTM pour suivre vos différentes campagnes
                </DialogDescription>
              </DialogHeader>

              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nom du lien (optionnel)</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ex: Campagne Facebook Janvier"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="landingPage">Page de destination</Label>
                  <Input
                    id="landingPage"
                    value={formData.landingPage}
                    onChange={(e) => setFormData({ ...formData, landingPage: e.target.value })}
                    placeholder="https://budget-pro.com"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="utmSource">Source *</Label>
                    <Input
                      id="utmSource"
                      value={formData.utmSource}
                      onChange={(e) => setFormData({ ...formData, utmSource: e.target.value })}
                      placeholder="facebook"
                      required
                    />
                    <p className="text-xs text-muted-foreground">Ex: facebook, google, email</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="utmMedium">Medium *</Label>
                    <Input
                      id="utmMedium"
                      value={formData.utmMedium}
                      onChange={(e) => setFormData({ ...formData, utmMedium: e.target.value })}
                      placeholder="social"
                      required
                    />
                    <p className="text-xs text-muted-foreground">Ex: social, cpc, email</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="utmCampaign">Campagne (optionnel)</Label>
                  <Input
                    id="utmCampaign"
                    value={formData.utmCampaign}
                    onChange={(e) => setFormData({ ...formData, utmCampaign: e.target.value })}
                    placeholder="janvier_2025"
                  />
                </div>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setShowCreateDialog(false)}>
                  Annuler
                </Button>
                <Button type="submit" disabled={creating}>
                  {creating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Création...
                    </>
                  ) : (
                    "Créer le lien"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Statistiques globales */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de liens</CardTitle>
            <Link2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{links.length}</div>
            <p className="text-xs text-muted-foreground">
              {links.filter((l) => l.active).length} actifs
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clics totaux</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {links.reduce((acc, l) => acc + l.totalClicks, 0).toLocaleString("fr-FR")}
            </div>
            <p className="text-xs text-muted-foreground">Sur tous vos liens</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversions totales</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {links.reduce((acc, l) => acc + l.totalConversions, 0).toLocaleString("fr-FR")}
            </div>
            <p className="text-xs text-muted-foreground">Inscriptions réussies</p>
          </CardContent>
        </Card>
      </div>

      {/* Liste des liens */}
      <Card>
        <CardHeader>
          <CardTitle>Vos liens</CardTitle>
          <CardDescription>
            Cliquez sur un lien pour le copier dans votre presse-papier
          </CardDescription>
        </CardHeader>
        <CardContent>
          {links.length === 0 ? (
            <div className="text-center py-8">
              <Link2 className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <h3 className="mt-4 text-lg font-semibold">Aucun lien créé</h3>
              <p className="text-sm text-muted-foreground mt-2">
                Créez votre premier lien d'affiliation pour commencer à suivre vos performances
              </p>
              <Button onClick={() => setShowCreateDialog(true)} className="mt-4">
                <Plus className="mr-2 h-4 w-4" />
                Créer un lien
              </Button>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nom / URL</TableHead>
                    <TableHead className="text-center">Clics</TableHead>
                    <TableHead className="text-center">Conversions</TableHead>
                    <TableHead className="text-center">Taux</TableHead>
                    <TableHead className="text-center">Statut</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {links.map((link) => (
                    <TableRow key={link.id}>
                      <TableCell>
                        <div className="space-y-1">
                          {link.name && (
                            <div className="font-medium">{link.name}</div>
                          )}
                          <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono">
                            <span className="truncate max-w-[400px]">
                              {generateTrackingUrl(link)}
                            </span>
                          </div>
                          <div className="flex gap-1 text-xs">
                            <Badge variant="outline">{link.utmSource}</Badge>
                            <Badge variant="outline">{link.utmMedium}</Badge>
                            {link.utmCampaign && (
                              <Badge variant="outline">{link.utmCampaign}</Badge>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-center font-medium">
                        {link.totalClicks.toLocaleString("fr-FR")}
                      </TableCell>
                      <TableCell className="text-center font-medium">
                        {link.totalConversions.toLocaleString("fr-FR")}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="secondary">{getConversionRate(link)}%</Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        {link.active ? (
                          <Badge variant="default">Actif</Badge>
                        ) : (
                          <Badge variant="secondary">Inactif</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => copyToClipboard(link)}
                          >
                            {copiedId === link.id ? (
                              <>
                                <CheckCircle2 className="h-4 w-4 text-green-600" />
                              </>
                            ) : (
                              <>
                                <Copy className="h-4 w-4" />
                              </>
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => window.open(generateTrackingUrl(link), "_blank")}
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
