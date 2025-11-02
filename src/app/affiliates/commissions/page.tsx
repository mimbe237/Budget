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
import { AlertCircle, Search, DollarSign, Calendar, TrendingUp } from "lucide-react";

interface Affiliate {
  id: string;
  affiliateCode: string;
}

interface Commission {
  id: string;
  affiliateId: string;
  referralId: string;
  status: "PENDING" | "APPROVED" | "PAID" | "VOID";
  schema: "FIXED" | "PERCENT" | "RECURRING" | "TIERED" | "BONUS";
  amount: number;
  currency: string;
  monthKey?: string;
  recurringMonth?: number;
  totalRecurringMonths?: number;
  payoutId?: string;
  voidReason?: string;
  createdAt: Timestamp;
  approvedAt?: Timestamp;
  paidAt?: Timestamp;
  voidedAt?: Timestamp;
}

export default function AffiliateCommissionsPage() {
  const { user } = useUser();
  const db = useFirestore();
  const router = useRouter();
  const [affiliate, setAffiliate] = useState<Affiliate | null>(null);
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [schemaFilter, setSchemaFilter] = useState<string>("all");

  useEffect(() => {
    if (!user) {
      router.push("/login");
      return;
    }
    loadData();
  }, [user, statusFilter, schemaFilter]);

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

      // Charger les commissions
      const commissionsRef = collection(db, "commissions");
      let commissionsQuery = query(
        commissionsRef,
        where("affiliateId", "==", affiliateData.id),
        orderBy("createdAt", "desc")
      );

      if (statusFilter !== "all") {
        commissionsQuery = query(
          commissionsRef,
          where("affiliateId", "==", affiliateData.id),
          where("status", "==", statusFilter),
          orderBy("createdAt", "desc")
        );
      }

      const commissionsSnap = await getDocs(commissionsQuery);
      let commissionsData = commissionsSnap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Commission[];

      // Filtrer par schéma côté client (car on ne peut pas avoir 2 where sur des champs différents)
      if (schemaFilter !== "all") {
        commissionsData = commissionsData.filter((c) => c.schema === schemaFilter);
      }

      setCommissions(commissionsData);
    } catch (err) {
      console.error("Error loading commissions:", err);
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

  const getStatusBadge = (status: Commission["status"]) => {
    const badges = {
      PENDING: { variant: "secondary" as const, label: "En attente", color: "text-amber-600" },
      APPROVED: { variant: "default" as const, label: "Approuvé", color: "text-green-600" },
      PAID: { variant: "default" as const, label: "Payé", color: "text-blue-600" },
      VOID: { variant: "destructive" as const, label: "Annulé", color: "text-red-600" },
    };

    const config = badges[status];
    return (
      <Badge variant={config.variant} className={config.color}>
        {config.label}
      </Badge>
    );
  };

  const getSchemaLabel = (schema: Commission["schema"]) => {
    const labels = {
      FIXED: "Fixe",
      PERCENT: "Pourcentage",
      RECURRING: "Récurrent",
      TIERED: "Paliers",
      BONUS: "Bonus",
    };
    return labels[schema] || schema;
  };

  const calculateTotals = () => {
    return {
      total: commissions.reduce((sum, c) => sum + c.amount, 0),
      pending: commissions
        .filter((c) => c.status === "PENDING")
        .reduce((sum, c) => sum + c.amount, 0),
      approved: commissions
        .filter((c) => c.status === "APPROVED")
        .reduce((sum, c) => sum + c.amount, 0),
      paid: commissions
        .filter((c) => c.status === "PAID")
        .reduce((sum, c) => sum + c.amount, 0),
      void: commissions
        .filter((c) => c.status === "VOID")
        .reduce((sum, c) => sum + c.amount, 0),
    };
  };

  const filteredCommissions = commissions.filter((comm) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      comm.referralId.toLowerCase().includes(term) ||
      comm.monthKey?.toLowerCase().includes(term) ||
      comm.payoutId?.toLowerCase().includes(term)
    );
  });

  if (loading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Skeleton className="h-12 w-64" />
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
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

  const totals = calculateTotals();
  const currency = commissions[0]?.currency || "XAF";

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* En-tête */}
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Commissions</h1>
          <p className="text-muted-foreground">
            Historique détaillé de toutes vos commissions
          </p>
        </div>

        {/* Filtres */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher par referralId, monthKey, payoutId..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Statut" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les statuts</SelectItem>
              <SelectItem value="PENDING">En attente</SelectItem>
              <SelectItem value="APPROVED">Approuvé</SelectItem>
              <SelectItem value="PAID">Payé</SelectItem>
              <SelectItem value="VOID">Annulé</SelectItem>
            </SelectContent>
          </Select>

          <Select value={schemaFilter} onValueChange={setSchemaFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les types</SelectItem>
              <SelectItem value="FIXED">Fixe</SelectItem>
              <SelectItem value="PERCENT">Pourcentage</SelectItem>
              <SelectItem value="RECURRING">Récurrent</SelectItem>
              <SelectItem value="TIERED">Paliers</SelectItem>
              <SelectItem value="BONUS">Bonus</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Statistiques */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(totals.total, currency)}
            </div>
            <p className="text-xs text-muted-foreground">{commissions.length} commissions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-amber-600">En attente</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">
              {formatCurrency(totals.pending, currency)}
            </div>
            <p className="text-xs text-muted-foreground">
              {commissions.filter((c) => c.status === "PENDING").length} commissions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-green-600">Approuvé</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(totals.approved, currency)}
            </div>
            <p className="text-xs text-muted-foreground">
              {commissions.filter((c) => c.status === "APPROVED").length} commissions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-blue-600">Payé</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {formatCurrency(totals.paid, currency)}
            </div>
            <p className="text-xs text-muted-foreground">
              {commissions.filter((c) => c.status === "PAID").length} commissions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-red-600">Annulé</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(totals.void, currency)}
            </div>
            <p className="text-xs text-muted-foreground">
              {commissions.filter((c) => c.status === "VOID").length} commissions
            </p>
          </CardContent>
        </Card>
      </div>

      {/* À recevoir */}
      <Card className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            À recevoir
          </CardTitle>
          <CardDescription>Commissions prêtes à être versées</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-4xl font-bold text-green-600">
            {formatCurrency(totals.pending + totals.approved, currency)}
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            Ces montants seront inclus dans votre prochain paiement (sous réserve du seuil minimum)
          </p>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Historique des commissions</CardTitle>
          <CardDescription>
            {filteredCommissions.length} commission(s) trouvée(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredCommissions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {searchTerm || statusFilter !== "all" || schemaFilter !== "all"
                ? "Aucune commission ne correspond à vos critères"
                : "Vous n'avez pas encore de commissions"}
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Montant</TableHead>
                    <TableHead>Référence</TableHead>
                    <TableHead>Récurrence</TableHead>
                    <TableHead className="text-center">Statut</TableHead>
                    <TableHead>Paiement</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCommissions.map((commission) => (
                    <TableRow key={commission.id}>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium">
                            {commission.createdAt.toDate().toLocaleDateString("fr-FR")}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {commission.createdAt.toDate().toLocaleTimeString("fr-FR")}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{getSchemaLabel(commission.schema)}</Badge>
                      </TableCell>
                      <TableCell className="font-bold">
                        {formatCurrency(commission.amount, commission.currency)}
                      </TableCell>
                      <TableCell>
                        <div className="font-mono text-xs truncate max-w-[120px]" title={commission.referralId}>
                          {commission.referralId.substring(0, 12)}...
                        </div>
                      </TableCell>
                      <TableCell>
                        {commission.schema === "RECURRING" && commission.recurringMonth && commission.totalRecurringMonths ? (
                          <div className="text-sm">
                            Mois {commission.recurringMonth}/{commission.totalRecurringMonths}
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {getStatusBadge(commission.status)}
                        {commission.status === "VOID" && commission.voidReason && (
                          <div className="text-xs text-muted-foreground mt-1">
                            {commission.voidReason}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        {commission.payoutId ? (
                          <Button
                            size="sm"
                            variant="link"
                            onClick={() => router.push(`/affiliates/payouts/${commission.payoutId}`)}
                            className="p-0 h-auto"
                          >
                            {commission.payoutId.substring(0, 8)}...
                          </Button>
                        ) : (
                          <span className="text-muted-foreground text-sm">—</span>
                        )}
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
