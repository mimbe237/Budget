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
import { AlertCircle, Download, ExternalLink, FileText, Search, Wallet } from "lucide-react";

interface Affiliate {
  id: string;
  affiliateCode: string;
}

interface Payout {
  id: string;
  affiliateId: string;
  amount: number;
  currency: string;
  status: "DUE" | "PAID" | "PROCESSING" | "FAILED";
  periodFrom: Timestamp;
  periodTo: Timestamp;
  commissionCount: number;
  txRef?: string;
  invoiceUrl?: string;
  createdAt: Timestamp;
  paidAt?: Timestamp;
}

export default function AffiliatePayoutsPage() {
  const { user } = useUser();
  const db = useFirestore();
  const router = useRouter();
  const [affiliate, setAffiliate] = useState<Affiliate | null>(null);
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (!user) {
      router.push("/login");
      return;
    }
    loadData();
  }, [user, statusFilter]);

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

      // Charger les payouts
      const payoutsRef = collection(db, "payouts");
      let payoutsQuery = query(
        payoutsRef,
        where("affiliateId", "==", affiliateData.id),
        orderBy("createdAt", "desc")
      );

      if (statusFilter !== "all") {
        payoutsQuery = query(
          payoutsRef,
          where("affiliateId", "==", affiliateData.id),
          where("status", "==", statusFilter),
          orderBy("createdAt", "desc")
        );
      }

      const payoutsSnap = await getDocs(payoutsQuery);
      const payoutsData = payoutsSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as Payout[];
      setPayouts(payoutsData);
    } catch (err) {
      console.error("Error loading payouts:", err);
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

  const getStatusBadge = (status: Payout["status"]) => {
    const map: Record<Payout["status"], { variant: any; label: string }> = {
      DUE: { variant: "secondary", label: "À payer" },
      PROCESSING: { variant: "outline", label: "En traitement" },
      PAID: { variant: "default", label: "Payé" },
      FAILED: { variant: "destructive", label: "Échec" },
    } as const;
    const cfg = map[status];
    return <Badge variant={cfg.variant}>{cfg.label}</Badge>;
  };

  const totals = useMemo(() => {
    const currency = payouts[0]?.currency || "XAF";
    return {
      currency,
      due: payouts.filter((p) => p.status === "DUE").reduce((s, p) => s + p.amount, 0),
      paid: payouts.filter((p) => p.status === "PAID").reduce((s, p) => s + p.amount, 0),
      processing: payouts
        .filter((p) => p.status === "PROCESSING")
        .reduce((s, p) => s + p.amount, 0),
    };
  }, [payouts]);

  const filtered = payouts.filter((p) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      p.txRef?.toLowerCase().includes(term) ||
      p.invoiceUrl?.toLowerCase().includes(term) ||
      p.id.toLowerCase().includes(term)
    );
  });

  if (loading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Skeleton className="h-12 w-64" />
        <div className="grid gap-4 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
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

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* En-tête */}
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Paiements</h1>
          <p className="text-muted-foreground">
            Historique de vos versements et périodes couvertes
          </p>
        </div>

        {/* Filtres */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher par ID, référence de transaction..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Statut" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les statuts</SelectItem>
              <SelectItem value="DUE">À payer</SelectItem>
              <SelectItem value="PROCESSING">En traitement</SelectItem>
              <SelectItem value="PAID">Payé</SelectItem>
              <SelectItem value="FAILED">Échec</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Totaux */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Wallet className="h-4 w-4" />
              À recevoir
            </CardTitle>
            <CardDescription>Somme des paiements en attente</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">
              {formatCurrency(totals.due + totals.processing, totals.currency)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Payés</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(totals.paid, totals.currency)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Nombre de paiements</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{payouts.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Tableau */}
      <Card>
        <CardHeader>
          <CardTitle>Historique des paiements</CardTitle>
          <CardDescription>
            {filtered.length} paiement(s) trouvé(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filtered.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Aucun paiement à afficher
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Période</TableHead>
                    <TableHead>Montant</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Réf. transaction</TableHead>
                    <TableHead>Facture</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell>
                        <div className="text-sm">
                          {p.periodFrom.toDate().toLocaleDateString("fr-FR")} → {p.periodTo
                            .toDate()
                            .toLocaleDateString("fr-FR")}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Créé le {p.createdAt.toDate().toLocaleDateString("fr-FR")}
                        </div>
                      </TableCell>
                      <TableCell className="font-bold">
                        {formatCurrency(p.amount, p.currency)}
                        <div className="text-xs text-muted-foreground">
                          {p.commissionCount} commissions
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(p.status)}</TableCell>
                      <TableCell>
                        {p.txRef ? (
                          <span className="font-mono text-xs">{p.txRef}</span>
                        ) : (
                          <span className="text-muted-foreground text-sm">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {p.invoiceUrl ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => window.open(p.invoiceUrl!, "_blank")}
                          >
                            <FileText className="mr-2 h-4 w-4" /> Télécharger
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
