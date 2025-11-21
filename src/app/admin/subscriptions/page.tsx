import { Metadata } from "next";
import { requireAdmin } from "@/lib/adminAuth";
import { SubscriptionsClient } from "./SubscriptionsClient";
import { CreditCard } from "lucide-react";

export const metadata: Metadata = {
  title: "Administration - Abonnements | Budget Pro",
  description:
    "Activez ou suspendez les plans tarifaires proposés aux utilisateurs.",
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function SubscriptionsAdminPage() {
  await requireAdmin();

  return (
    <div className="min-h-screen bg-slate-50 pb-10">
      <div className="mx-auto w-full max-w-5xl px-4 pt-10 sm:px-6 lg:px-8">
        <header className="mb-8 space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
            <CreditCard className="h-4 w-4" aria-hidden="true" />
            Gestion des abonnements
          </div>
          <div>
            <h1 className="text-3xl font-headline font-bold text-slate-900">
              Plans &amp; tarification
            </h1>
            <p className="mt-2 max-w-3xl text-sm text-slate-600">
              Centralisez les plans disponibles, ajustez leurs statuts et
              assurez-vous que seuls les abonnements validés restent visibles
              depuis l’interface utilisateur.
            </p>
          </div>
        </header>

        <SubscriptionsClient />
      </div>
    </div>
  );
}
