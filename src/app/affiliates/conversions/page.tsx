"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUser, useFirestore } from "@/firebase";
import { collection, query, where, getDocs, orderBy, Timestamp } from "firebase/firestore";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertCircle, Search, ChevronLeft, ChevronRight, ExternalLink } from "lucide-react";

interface Affiliate {
  id: string;
  affiliateCode: string;
}

interface Referral {
  id: string;
  affiliateId: string;
  userId: string;
  orderId?: string;
  subscriptionId?: string;
  status: "PENDING" | "APPROVED" | "VOID" | "REJECTED";
  amount: number;
  currency: string;
  eventType: "SIGNUP" | "SUBSCRIPTION" | "PURCHASE";
  clickId?: string;
  linkCode?: string;
  createdAt: Timestamp;
  approvedAt?: Timestamp;
  voidedAt?: Timestamp;
  voidReason?: string;
}

const PAGE_SIZE = 20;

export default function AffiliateConversionsPage() {
  const { user } = useUser();
  const db = useFirestore();
  const router = useRouter();
  const [affiliate, setAffiliate] = useState<Affiliate | null>(null);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [lastDoc, setLastDoc] = useState<DocumentSnapshot | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (!user) {
      router.push("/login");
      return;
    }
    loadData();
  }, [user, statusFilter]);

  const loadData = async (loadMore = false) => {
    if (!user) return;

    try {
      setLoading(true);

      // Charger l'affilié
      if (!affiliate) {
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
      }

      const affiliateId = affiliate?.id || "";

      // Charger les referrals
      const referralsRef = collection(db, "referrals");
      let referralsQuery = query(
        referralsRef,
        where("affiliateId", "==", affiliateId),
        orderBy("createdAt", "desc"),
        limit(PAGE_SIZE + 1)
      );

      if (statusFilter !== "all") {
        referralsQuery = query(
          referralsRef,
          where("affiliateId", "==", affiliateId),
          where("status", "==", statusFilter),
          orderBy("createdAt", "desc"),
          limit(PAGE_SIZE + 1)
        );
      }

      if (loadMore && lastDoc) {
        referralsQuery = query(referralsQuery, startAfter(lastDoc));
      }

      const referralsSnap = await getDocs(referralsQuery);
      const referralsData = referralsSnap.docs.slice(0, PAGE_SIZE).map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Referral[];

      setHasMore(referralsSnap.docs.length > PAGE_SIZE);
      setLastDoc(referralsSnap.docs[PAGE_SIZE - 1] || null);

      if (loadMore) {
        setReferrals((prev) => [...prev, ...referralsData]);
        setPage((p) => p + 1);
      } else {
        setReferrals(referralsData);
        setPage(1);
      }
    } catch (err) {
      console.error("Error loading conversions:", err);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: currency,
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusBadge = (status: Referral["status"]) => {
    const badges = {
      PENDING: { variant: "secondary" as const, label: "En attente" },
      APPROVED: { variant: "default" as const, label: "Approuvé" },
      VOID: { variant: "destructive" as const, label: "Annulé" },
      REJECTED: { variant: "outline" as const, label: "Rejeté" },
    };

    const config = badges[status];
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getEventTypeLabel = (type: Referral["eventType"]) => {
    const labels = {
      SIGNUP: "Inscription",
      SUBSCRIPTION: "Abonnement",
      PURCHASE: "Achat",
    };
    return labels[type] || type;
  };

  const filteredReferrals = referrals.filter((ref) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      ref.userId.toLowerCase().includes(term) ||
      ref.orderId?.toLowerCase().includes(term) ||
      ref.subscriptionId?.toLowerCase().includes(term) ||
      ref.linkCode?.toLowerCase().includes(term)
    );
  });

  if (loading && !affiliate) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Skeleton className="h-12 w-64" />
        <Skeleton className="h-[600px]" />
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
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Conversions</h1>
          <p className="text-muted-foreground">
            Liste détaillée de toutes vos conversions
          </p>
        </div>

        {/* Filtres */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher par userId, orderId, linkCode..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les statuts</SelectItem>
              <SelectItem value="PENDING">En attente</SelectItem>
              <SelectItem value="APPROVED">Approuvé</SelectItem>
              <SelectItem value="VOID">Annulé</SelectItem>
              <SelectItem value="REJECTED">Rejeté</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Statistiques rapides */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{referrals.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Approuvées</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {referrals.filter((r) => r.status === "APPROVED").length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">En attente</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">
              {referrals.filter((r) => r.status === "PENDING").length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Annulées</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {referrals.filter((r) => r.status === "VOID" || r.status === "REJECTED").length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Historique des conversions</CardTitle>
          <CardDescription>
            {filteredReferrals.length} conversion(s) trouvée(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredReferrals.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {searchTerm || statusFilter !== "all"
                ? "Aucune conversion ne correspond à vos critères"
                : "Vous n'avez pas encore de conversions"}
            </div>
          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Montant</TableHead>
                      <TableHead>Utilisateur</TableHead>
                      <TableHead>Lien</TableHead>
                      <TableHead className="text-center">Statut</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredReferrals.map((referral) => (
                      <TableRow key={referral.id}>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="font-medium">
                              {referral.createdAt.toDate().toLocaleDateString("fr-FR")}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {referral.createdAt.toDate().toLocaleTimeString("fr-FR")}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{getEventTypeLabel(referral.eventType)}</Badge>
                        </TableCell>
                        <TableCell className="font-medium">
                          {formatCurrency(referral.amount, referral.currency)}
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="font-mono text-xs truncate max-w-[150px]" title={referral.userId}>
                              {referral.userId.substring(0, 12)}...
                            </div>
                            {referral.orderId && (
                              <div className="text-xs text-muted-foreground">
                                Order: {referral.orderId.substring(0, 8)}...
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {referral.linkCode ? (
                            <Badge variant="secondary">{referral.linkCode}</Badge>
                          ) : (
                            <span className="text-muted-foreground text-sm">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          {getStatusBadge(referral.status)}
                          {referral.status === "VOID" && referral.voidReason && (
                            <div className="text-xs text-muted-foreground mt-1">
                              {referral.voidReason}
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => router.push(`/affiliates/conversions/${referral.id}`)}
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {hasMore && (
                <div className="flex justify-center mt-4">
                  <Button
                    variant="outline"
                    onClick={() => loadData(true)}
                    disabled={loading}
                  >
                    {loading ? "Chargement..." : "Charger plus"}
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
