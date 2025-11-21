"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useUser, useFirestore } from "@/firebase";
import { collection, getDocs, orderBy, query, where } from "firebase/firestore";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { approveAffiliate, blockAffiliate } from "@/lib/affiliates/api";
import { CheckCircle2, Slash, Search, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface AffiliateDoc {
  id: string;
  userId: string;
  affiliateCode: string;
  status: "PENDING" | "APPROVED" | "BLOCKED" | "SUSPENDED";
  tier: "BASIC" | "PRO" | "VIP";
  totalClicks?: number;
  totalConversions?: number;
  totalEarnings?: number;
  createdAt?: any;
}

export default function AdminAffiliatesPage() {
  const { user, userProfile, isUserLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [affiliates, setAffiliates] = useState<AffiliateDoc[]>([]);
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
      const ref = collection(firestore, 'affiliates');
      let q = query(ref, orderBy('createdAt', 'desc'));
      if (statusFilter !== 'all') {
        q = query(ref, where('status', '==', statusFilter), orderBy('createdAt', 'desc'));
      }
      const snap = await getDocs(q);
      const rows = snap.docs.map(d => ({ id: d.id, ...(d.data() as any) })) as AffiliateDoc[];
      setAffiliates(rows);
    } finally {
      setLoading(false);
    }
  };

  const filtered = affiliates.filter(a => {
    if (!search) return true;
    const t = search.toLowerCase();
    return a.affiliateCode?.toLowerCase().includes(t) || a.userId?.toLowerCase().includes(t) || a.tier?.toLowerCase().includes(t);
  });

  const handleApprove = async (id: string) => {
    try {
      await approveAffiliate({ affiliateId: id });
      toast({ title: "Affilié approuvé", description: `L'affilié ${id} a été approuvé.` });
      await load();
    } catch (e) {
      console.error(e);
      toast({ title: "Échec de l'approbation", description: "Veuillez réessayer.", variant: "destructive" });
    }
  };

  const handleBlock = async (id: string) => {
    try {
      await blockAffiliate({ affiliateId: id });
      toast({ title: "Affilié bloqué", description: `L'affilié ${id} a été bloqué.` });
      await load();
    } catch (e) {
      console.error(e);
      toast({ title: "Échec du blocage", description: "Veuillez réessayer.", variant: "destructive" });
    }
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
          <h1 className="text-3xl font-bold">Affiliés</h1>
          <p className="text-muted-foreground">Gérez les comptes affiliés</p>
        </div>
        <div className="flex gap-2">
          <Input placeholder="Rechercher code / userId" value={search} onChange={(e) => setSearch(e.target.value)} />
          <select className="border rounded px-2" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="all">Tous</option>
            <option value="PENDING">En attente</option>
            <option value="APPROVED">Approuvé</option>
            <option value="BLOCKED">Bloqué</option>
            <option value="SUSPENDED">Suspendu</option>
          </select>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Liste des affiliés</CardTitle>
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
                    <TableHead>Code</TableHead>
                    <TableHead>Utilisateur</TableHead>
                    <TableHead>Tier</TableHead>
                    <TableHead>Clics</TableHead>
                    <TableHead>Conv.</TableHead>
                    <TableHead>Revenus</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((a) => (
                    <TableRow key={a.id}>
                      <TableCell className="font-mono">{a.affiliateCode}</TableCell>
                      <TableCell>
                        <span className="font-mono text-xs">{a.userId}</span>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{a.tier}</Badge>
                      </TableCell>
                      <TableCell>{a.totalClicks ?? 0}</TableCell>
                      <TableCell>{a.totalConversions ?? 0}</TableCell>
                      <TableCell>{(a.totalEarnings ?? 0).toLocaleString('fr-FR')}</TableCell>
                      <TableCell>
                        <Badge variant={a.status === 'APPROVED' ? 'default' : a.status === 'PENDING' ? 'secondary' : 'destructive'}>
                          {a.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button size="sm" variant="outline" onClick={() => router.push(`/admin/affiliates/${a.id}`)}>Détails</Button>
                        {a.status !== 'APPROVED' && (
                          <Button size="sm" onClick={() => handleApprove(a.id)}>
                            <CheckCircle2 className="h-4 w-4 mr-1" />
                            Approuver
                          </Button>
                        )}
                        {a.status !== 'BLOCKED' && (
                          <Button size="sm" variant="destructive" onClick={() => handleBlock(a.id)}>
                            <Slash className="h-4 w-4 mr-1" />
                            Bloquer
                          </Button>
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
