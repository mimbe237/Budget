"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useUser, useFirestore } from "@/firebase";
import { doc, getDoc, collection, getDocs, query, where, orderBy, limit } from "firebase/firestore";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { approveAffiliate, blockAffiliate } from "@/lib/affiliates/api";
import { AlertCircle, ArrowLeft, CheckCircle2, Slash } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function AdminAffiliateDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const { user, userProfile, isUserLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [affiliate, setAffiliate] = useState<any | null>(null);
  const [recentReferrals, setRecentReferrals] = useState<any[]>([]);
  const [recentClicks, setRecentClicks] = useState<any[]>([]);

  const isAdmin = !!(userProfile?.isAdmin || userProfile?.admin === true || userProfile?.role === 'admin');

  useEffect(() => {
    if (isUserLoading) return;
    if (!user || !isAdmin) return;
    load();
  }, [isUserLoading, user, isAdmin, id]);

  const load = async () => {
    try {
      setLoading(true);
      const aRef = doc(firestore, 'affiliates', id);
      const aSnap = await getDoc(aRef);
      setAffiliate(aSnap.exists() ? { id: aSnap.id, ...aSnap.data() } : null);

      const refQ = query(
        collection(firestore, 'referrals'),
        where('affiliateId', '==', id),
        orderBy('createdAt', 'desc'),
        limit(10)
      );
      const refSnap = await getDocs(refQ);
      setRecentReferrals(refSnap.docs.map(d => ({ id: d.id, ...d.data() })));

      const clicksQ = query(
        collection(firestore, 'clicks'),
        where('affiliateId', '==', id),
        orderBy('createdAt', 'desc'),
        limit(10)
      );
      const clicksSnap = await getDocs(clicksQ);
      setRecentClicks(clicksSnap.docs.map(d => ({ id: d.id, ...d.data() })));
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    try {
      await approveAffiliate({ affiliateId: id });
      toast({ title: "Affilié approuvé", description: `L'affilié ${id} a été approuvé.` });
      await load();
    } catch (e) {
      console.error(e);
      toast({ title: "Échec de l'approbation", description: "Veuillez réessayer.", variant: "destructive" });
    }
  };
  const handleBlock = async () => {
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

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-[600px] mt-4" />
      </div>
    );
  }

  if (!affiliate) {
    return (
      <div className="container mx-auto p-6">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Affilié introuvable</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-2">
        <Button variant="outline" onClick={() => router.push('/admin/affiliates')}>
          <ArrowLeft className="h-4 w-4 mr-2" />Retour
        </Button>
        <h1 className="text-2xl font-bold">Affilié {affiliate.affiliateCode}</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Détails</CardTitle>
          <CardDescription>Informations principales</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4 text-sm">
            <div>
              <div className="text-muted-foreground">Utilisateur</div>
              <div className="font-mono">{affiliate.userId}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Tier</div>
              <Badge variant="secondary">{affiliate.tier}</Badge>
            </div>
            <div>
              <div className="text-muted-foreground">Statut</div>
              <Badge variant={affiliate.status === 'APPROVED' ? 'default' : affiliate.status === 'PENDING' ? 'secondary' : 'destructive'}>
                {affiliate.status}
              </Badge>
            </div>
          </div>

          <div className="mt-4 space-x-2">
            {affiliate.status !== 'APPROVED' && (
              <Button onClick={handleApprove}>
                <CheckCircle2 className="h-4 w-4 mr-1" />
                Approuver
              </Button>
            )}
            {affiliate.status !== 'BLOCKED' && (
              <Button variant="destructive" onClick={handleBlock}>
                <Slash className="h-4 w-4 mr-1" />
                Bloquer
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Conversions récentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Montant</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentReferrals.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell>{r.createdAt?.toDate?.().toLocaleString?.('fr-FR') ?? '—'}</TableCell>
                      <TableCell>{r.status}</TableCell>
                      <TableCell>{r.amount} {r.currency}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Clics récents</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Link</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentClicks.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell>{c.createdAt?.toDate?.().toLocaleString?.('fr-FR') ?? '—'}</TableCell>
                      <TableCell className="font-mono text-xs">{c.linkCode ?? '—'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
