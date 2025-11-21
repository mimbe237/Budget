"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUser, useFirestore } from "@/firebase";
import { doc, getDoc, collection, query, where, getDocs, Timestamp } from "firebase/firestore";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Link2, TrendingUp, Users, Wallet, BarChart3, FileText, Settings, AlertCircle } from "lucide-react";
import Link from "next/link";

type AffiliateStatus = "PENDING" | "APPROVED" | "BLOCKED" | "SUSPENDED";
type ProgramTier = "BASIC" | "PRO" | "VIP";

interface Affiliate {
  id: string;
  userId: string;
  affiliateCode: string;
  status: AffiliateStatus;
  tier: ProgramTier;
  totalClicks: number;
  totalConversions: number;
  totalEarnings: number;
  pendingEarnings: number;
  approvedEarnings: number;
  paidEarnings: number;
  createdAt: Timestamp;
}

interface KPICard {
  title: string;
  value: string | number;
  description: string;
  icon: React.ReactNode;
  href: string;
}

export default function AffiliatesDashboard() {
  const { user, isUserLoading } = useUser();
  const db = useFirestore();
  const router = useRouter();
  const [affiliate, setAffiliate] = useState<Affiliate | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isUserLoading) return;
    if (!user) {
      router.push("/login");
      return;
    }

    loadAffiliateData();
  }, [user, isUserLoading]);

  const loadAffiliateData = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      // Rechercher l'affilié par userId
      const affiliatesRef = collection(db, "affiliates");
      const q = query(affiliatesRef, where("userId", "==", user.uid));
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        // Pas encore affilié, proposer de créer un compte
        setAffiliate(null);
      } else {
        const affiliateDoc = snapshot.docs[0];
        setAffiliate({
          id: affiliateDoc.id,
          ...affiliateDoc.data(),
        } as Affiliate);
      }
    } catch (err) {
      console.error("Error loading affiliate data:", err);
      setError("Impossible de charger vos données d'affilié. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "XAF",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusBadge = (status: AffiliateStatus) => {
    const badges = {
      PENDING: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
      APPROVED: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
      BLOCKED: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
      SUSPENDED: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
    };

    const labels = {
      PENDING: "En attente",
      APPROVED: "Approuvé",
      BLOCKED: "Bloqué",
      SUSPENDED: "Suspendu",
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${badges[status]}`}>
        {labels[status]}
      </span>
    );
  };

  const getTierBadge = (tier: ProgramTier) => {
    const badges = {
      BASIC: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
      PRO: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
      VIP: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${badges[tier]}`}>
        {tier}
      </span>
    );
  };

  if (isUserLoading || loading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Skeleton className="h-12 w-64" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  // Compte affilié non créé
  if (!affiliate) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle>Programme d'affiliation Budget Pro</CardTitle>
            <CardDescription>
              Gagnez des commissions en recommandant Budget Pro à vos contacts
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Vous n'avez pas encore de compte affilié. Créez-en un pour commencer à gagner des commissions !
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <h3 className="font-semibold">Avantages :</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>Commissions récurrentes jusqu'à 12 mois</li>
                <li>Taux de commission de 15% à 25%</li>
                <li>Bonus à l'inscription</li>
                <li>Paiements mensuels automatiques</li>
                <li>Tableau de bord en temps réel</li>
              </ul>
            </div>

            <Button onClick={() => router.push("/affiliates/register")} className="w-full">
              Devenir affilié
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Compte en attente d'approbation
  if (affiliate.status === "PENDING") {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle>Demande en cours d'examen</CardTitle>
            <CardDescription>Votre demande d'affiliation est en cours de traitement</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Votre compte affilié (code: <strong>{affiliate.affiliateCode}</strong>) est en attente d'approbation par notre équipe. 
                Vous recevrez un email dès que votre compte sera approuvé.
              </AlertDescription>
            </Alert>
            <p className="text-sm text-muted-foreground">
              Cela prend généralement 24 à 48 heures. Nous vérifions toutes les demandes pour garantir la qualité de notre programme.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Compte bloqué ou suspendu
  if (affiliate.status === "BLOCKED" || affiliate.status === "SUSPENDED") {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle>Compte {affiliate.status === "BLOCKED" ? "bloqué" : "suspendu"}</CardTitle>
            <CardDescription>Votre compte affilié n'est pas actif</CardDescription>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Votre compte affilié a été {affiliate.status === "BLOCKED" ? "bloqué" : "suspendu"}. 
                Veuillez contacter notre support pour plus d'informations.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Dashboard principal pour affilié approuvé
  const kpiCards: KPICard[] = [
    {
      title: "Clics totaux",
      value: affiliate.totalClicks.toLocaleString("fr-FR"),
      description: "Visiteurs via vos liens",
      icon: <TrendingUp className="h-4 w-4" />,
      href: "/affiliates/stats",
    },
    {
      title: "Conversions",
      value: affiliate.totalConversions.toLocaleString("fr-FR"),
      description: "Inscriptions réussies",
      icon: <Users className="h-4 w-4" />,
      href: "/affiliates/conversions",
    },
    {
      title: "Revenus totaux",
      value: formatCurrency(affiliate.totalEarnings),
      description: "Toutes commissions confondues",
      icon: <Wallet className="h-4 w-4" />,
      href: "/affiliates/commissions",
    },
    {
      title: "À recevoir",
      value: formatCurrency(affiliate.pendingEarnings + affiliate.approvedEarnings),
      description: "Commissions en attente de paiement",
      icon: <Wallet className="h-4 w-4 text-amber-500" />,
      href: "/affiliates/payouts",
    },
  ];

  const quickLinks = [
    { href: "/affiliates/links", icon: <Link2 />, label: "Mes liens", description: "Gérer mes liens d'affiliation" },
    { href: "/affiliates/stats", icon: <BarChart3 />, label: "Statistiques", description: "Performances détaillées" },
    { href: "/affiliates/commissions", icon: <FileText />, label: "Commissions", description: "Historique des gains" },
    { href: "/affiliates/payouts", icon: <Wallet />, label: "Paiements", description: "Historique des versements" },
    { href: "/affiliates/profile", icon: <Settings />, label: "Paramètres", description: "Infos bancaires & profil" },
  ];

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* En-tête */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tableau de bord affilié</h1>
          <p className="text-muted-foreground">
            Code affilié : <span className="font-mono font-semibold">{affiliate.affiliateCode}</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          {getTierBadge(affiliate.tier)}
          {getStatusBadge(affiliate.status)}
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {kpiCards.map((kpi, index) => (
          <Link key={index} href={kpi.href}>
            <Card className="hover:bg-accent transition-colors cursor-pointer">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{kpi.title}</CardTitle>
                {kpi.icon}
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{kpi.value}</div>
                <p className="text-xs text-muted-foreground">{kpi.description}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Taux de conversion */}
      {affiliate.totalClicks > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Taux de conversion</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {((affiliate.totalConversions / affiliate.totalClicks) * 100).toFixed(2)}%
            </div>
            <p className="text-sm text-muted-foreground">
              {affiliate.totalConversions} conversions sur {affiliate.totalClicks} clics
            </p>
          </CardContent>
        </Card>
      )}

      {/* Liens rapides */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Accès rapide</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {quickLinks.map((link, index) => (
            <Link key={index} href={link.href}>
              <Card className="hover:bg-accent transition-colors cursor-pointer h-full">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">{link.icon}</div>
                    <div>
                      <CardTitle className="text-base">{link.label}</CardTitle>
                      <CardDescription className="text-xs">{link.description}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
