"use client";

import { useMemo } from "react";
import { useState } from "react";
import { CalendarClock, CreditCard, Download } from "lucide-react";
import { collection, doc, updateDoc } from "firebase/firestore";
import {
  useCollection,
  useFirestore,
  useMemoFirebase,
} from "@/firebase";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

type BillingCycle = "monthly" | "yearly" | "quarterly" | "lifetime";

type AdminSubscription = {
  name?: string;
  description?: string;
  priceInCents?: number;
  currency?: string;
  billingCycle?: BillingCycle | string;
  exportEnabled?: boolean;
  active?: boolean;
};

const DEFAULT_CURRENCY = "XAF";

export function SubscriptionsClient() {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const subscriptionsRef = useMemoFirebase(
    () => collection(firestore, "adminSubscriptions"),
    [firestore]
  );

  const {
    data: subscriptions,
    isLoading,
    error,
  } = useCollection<AdminSubscription>(subscriptionsRef);

  async function toggleSubscription(id: string, active = false) {
    try {
      setUpdatingId(id);
      await updateDoc(doc(firestore, "adminSubscriptions", id), {
        active: !active,
      });
      toast({
        title: "Abonnement mis à jour",
        description: active
          ? "Le plan est maintenant désactivé."
          : "Le plan est maintenant disponible.",
      });
    } catch (err) {
      console.error("Unable to toggle subscription", err);
      toast({
        title: "Erreur",
        description:
          "Impossible de modifier cet abonnement pour le moment. Réessayez plus tard.",
        variant: "destructive",
      });
    } finally {
      setUpdatingId(null);
    }
  }

  const formatter = useMemo(
    () =>
      new Intl.NumberFormat("fr-FR", {
        style: "currency",
        currency: DEFAULT_CURRENCY,
        maximumFractionDigits: 0,
      }),
    []
  );

  const formatPrice = (price?: number, currency?: string | null) => {
    if (typeof price !== "number") {
      return null;
    }
    try {
      return new Intl.NumberFormat("fr-FR", {
        style: "currency",
        currency: currency || DEFAULT_CURRENCY,
        maximumFractionDigits: 0,
      }).format(Math.round(price / 100));
    } catch {
      return formatter.format(Math.round(price / 100));
    }
  };

  const formatCycle = (cycle?: string | null) => {
    switch ((cycle || "").toLowerCase()) {
      case "monthly":
      case "month":
      case "mois":
        return "Facturation mensuelle";
      case "yearly":
      case "annual":
      case "year":
      case "an":
        return "Facturation annuelle";
      case "quarterly":
        return "Facturation trimestrielle";
      case "lifetime":
        return "Paiement unique";
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <Card className="border border-slate-200 shadow-sm">
        <CardHeader>
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-52" />
              <Skeleton className="h-3 w-72" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          {Array.from({ length: 2 }).map((_, index) => (
            <div
              key={index}
              className="rounded-xl border bg-white/60 p-4 space-y-3"
            >
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-9 w-full" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border border-red-200 bg-red-50/60">
        <CardHeader>
          <CardTitle className="text-red-700">
            Impossible de charger les abonnements
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-red-700">
          Vérifiez vos autorisations ou réessayez plus tard.
        </CardContent>
      </Card>
    );
  }

  if (!subscriptions || subscriptions.length === 0) {
    return (
      <Card className="border border-dashed">
        <CardContent className="py-10 text-center text-sm text-slate-500">
          Aucun abonnement n’a encore été configuré.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      {subscriptions.map((subscription) => {
        const {
          id,
          name,
          description,
          priceInCents,
          currency,
          billingCycle,
          exportEnabled,
          active,
        } = subscription;

        const displayPrice = formatPrice(priceInCents, currency);
        const displayCycle = formatCycle(billingCycle);

        return (
          <Card
            key={id}
            className="border border-slate-200 shadow-sm transition hover:border-primary/40"
          >
            <CardHeader className="flex flex-col gap-3">
              <div className="flex items-center justify-between gap-3">
                <CardTitle className="flex items-center gap-2 text-lg font-semibold text-slate-900">
                  <CreditCard
                    className="h-5 w-5 text-primary"
                    aria-hidden="true"
                  />
                  {name || "Plan sans nom"}
                </CardTitle>
                <Badge
                  variant={active ? "outline" : "destructive"}
                  className={
                    active
                      ? "border-emerald-500 text-emerald-600"
                      : "border-red-500 text-red-600"
                  }
                >
                  {active ? "Disponible" : "Désactivé"}
                </Badge>
              </div>
              <p className="text-sm text-slate-600">
                {description ||
                  "Aucune description enregistrée pour cet abonnement."}
              </p>
            </CardHeader>
            <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-2 text-sm text-slate-600">
                {displayPrice && (
                  <div className="flex items-center gap-2 font-semibold text-slate-900">
                    {displayPrice}
                    {displayCycle && (
                      <span className="text-xs font-normal text-slate-500">
                        ({displayCycle})
                      </span>
                    )}
                  </div>
                )}
                {displayCycle && !displayPrice && (
                  <div className="flex items-center gap-2">
                    <CalendarClock
                      className="h-4 w-4 text-slate-400"
                      aria-hidden
                    />
                    <span>{displayCycle}</span>
                  </div>
                )}
                {exportEnabled && (
                  <div className="flex items-center gap-2">
                    <Download className="h-4 w-4 text-slate-400" aria-hidden />
                    <span>Export comptable inclus</span>
                  </div>
                )}
              </div>
              <Button
                variant={active ? "destructive" : "default"}
                onClick={() => toggleSubscription(id, Boolean(active))}
                disabled={updatingId === id}
              >
                {updatingId === id
                  ? "Mise à jour..."
                  : active
                  ? "Désactiver"
                  : "Activer"}
              </Button>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
