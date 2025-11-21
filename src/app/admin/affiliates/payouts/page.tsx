"use client";

import { useEffect, useState } from "react";
import { useUser, useFirestore } from "@/firebase";
import { collection, getDocs, orderBy, query, where } from "firebase/firestore";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { markPayoutPaid } from "@/lib/affiliates/api";
import { AlertCircle } from "lucide-react";

interface PayoutDoc {
  id: string;
  affiliateId: string;
  amount: number;
  currency: string;
  status: "DUE" | "PAID" | "PROCESSING" | "FAILED";
  periodFrom: any;
  periodTo: any;
  commissionCount: number;
  txRef?: string;
  invoiceUrl?: string;
  createdAt: any;
}

export default function AdminPayoutsPage() {
  const { user, userProfile, isUserLoading } = useUser();
  const firestore = useFirestore();

  const [loading, setLoading] = useState(true);
  const [payouts, setPayouts] = useState<PayoutDoc[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const isAdmin = !!(userProfile?.isAdmin || userProfile?.admin === true || userProfile?.role === 'admin');

  useEffect(() => {
    if (isUserLoading) return;
    if (!user || !isAdmin) return;
    load();
  }, [isUserLoading, user, isAdmin, statusFilter]);

  const load = async () => {
    try {
      setLoading(true);
      const ref = collection(firestore, 'payouts');
      let q = query(ref, orderBy('createdAt', 'desc'));
      if (statusFilter !== 'all') {
        q = query(ref, where('status', '==', statusFilter), orderBy('createdAt', 'desc'));
      }
      const snap = await getDocs(q);
      setPayouts(snap.docs.map(d => ({ id: d.id, ...(d.data() as any) })));
    } finally {
      setLoading(false);
    }
  };

  const filtered = payouts.filter(p => {
    if (!search) return true;
    const t = search.toLowerCase();
    return p.id.toLowerCase().includes(t) || p.txRef?.toLowerCase().includes(t) || String(p.amount).includes(t);
  });

  const handleMarkPaid = async (payoutId: string) => {
    await markPayoutPaid({ payoutId });
    await load();
  };

  if (isUserLoading) {
    return (
      <div className="container mx-auto p-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-[600px] mt-4" />
      </div>
    );
  }

  if (!user || !isAdmin) {
    return (
      <div className="container mx-auto p-6">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Accès réservé aux administrateurs</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Payouts</h1>
          <p className="text-muted-foreground">Gestion des paiements aux affiliés</p>
        </div>
        <div className="flex gap-2">
          <Input placeholder="Rechercher par ID / txRef" value={search} onChange={(e) => setSearch(e.target.value)} />
          <select className="border rounded px-2" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="all">Tous</option>
            <option value="DUE">À payer</option>
            <option value="PROCESSING">En traitement</option>
            <option value="PAID">Payé</option>
            <option value="FAILED">Échec</option>
          </select>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Historique des payouts</CardTitle>
          <CardDescription>{filtered.length} résultat(s)</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-[500px]" />
          ) : (
            <div className="rounded border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Créé le</TableHead>
                    <TableHead>Période</TableHead>
                    <TableHead>Montant</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Réf. transaction</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell>{p.createdAt?.toDate?.().toLocaleString?.('fr-FR') ?? '—'}</TableCell>
                      <TableCell>
                        {p.periodFrom?.toDate?.().toLocaleDateString?.('fr-FR') ?? '—'} → {p.periodTo?.toDate?.().toLocaleDateString?.('fr-FR') ?? '—'}
                      </TableCell>
                      <TableCell className="font-bold">{p.amount} {p.currency}</TableCell>
                      <TableCell>{p.status}</TableCell>
                      <TableCell className="font-mono text-xs">{p.txRef ?? '—'}</TableCell>
                      <TableCell className="text-right space-x-2">
                        {p.status !== 'PAID' && (
                          <Button size="sm" onClick={() => handleMarkPaid(p.id)}>Marquer payé</Button>
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
