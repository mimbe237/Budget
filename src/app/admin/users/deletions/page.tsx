"use client";

import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

type PendingDeletion = {
  id: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  deletionRequestedAt?: string;
  deletionExpiresAt?: string;
};

export default function PendingDeletionAdminPage() {
  const [items, setItems] = useState<PendingDeletion[]>([]);
  const [loading, setLoading] = useState(true);
  const [restoringId, setRestoringId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/admin/users/deletions", { cache: "no-store" });
      if (!response.ok) {
        throw new Error("Impossible de récupérer les suppressions programmées.");
      }
      const payload = await response.json();
      setItems(payload.items || []);
    } catch (fetchError: any) {
      setError(fetchError.message || "Erreur réseau.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleRestore = async (userId: string) => {
    setRestoringId(userId);
    try {
      const response = await fetch(`/api/admin/users/${userId}/restore-deletion`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.message || "Impossible de restaurer ce compte.");
      }
      toast({
        title: "Restoration effectuée",
        description: "Le compte a été réactivé.",
      });
      await load();
    } catch (restoreError: any) {
      toast({
        title: "Erreur",
        variant: "destructive",
        description: restoreError?.message || "Erreur inconnue.",
      });
    } finally {
      setRestoringId(null);
    }
  };

  return (
    <Card className="mx-auto max-w-5xl">
      <CardHeader>
        <CardTitle>Suppressions programmées</CardTitle>
        <CardDescription>
          Liste des comptes marqués `pending_deletion` avec leur date d'expiration. Restaurer avant la date limite pour conserver les données.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {loading ? (
          <Skeleton className="h-64 w-full" />
        ) : error ? (
          <p className="text-sm text-destructive">{error}</p>
        ) : items.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aucune suppression programmée pour le moment.</p>
        ) : (
          <div className="flex flex-col gap-4">
            {items.map((item) => (
              <div
                key={item.id}
                className="flex flex-col gap-3 rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="space-y-1 text-sm">
                  <p className="font-semibold text-slate-900">
                    {item.email ?? item.id}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {item.firstName || "—"} {item.lastName || ""}
                  </p>
                  <p className="text-xs">
                    Suppression prévue le{" "}
                    <span className="font-medium">
                      {item.deletionExpiresAt
                        ? new Date(item.deletionExpiresAt).toLocaleString()
                        : "Date inconnue"}
                    </span>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Demandée le{" "}
                    {item.deletionRequestedAt
                      ? new Date(item.deletionRequestedAt).toLocaleString()
                      : "—"}
                  </p>
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={restoringId === item.id}
                  onClick={() => handleRestore(item.id)}
                >
                  {restoringId === item.id ? "Restoration..." : "Restaurer"}
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
