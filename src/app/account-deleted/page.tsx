"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function AccountDeletedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4">
      <Card className="w-full max-w-lg space-y-4 border border-red-200 bg-white">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-semibold text-rose-600">
            Compte supprimé
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-slate-600">
          <p>
            Ce compte a été définitivement supprimé. Toutes les données associées ont été effacées et vous ne pourrez plus vous reconnecter avec cette adresse.
          </p>
          <p>
            Pour créer un nouveau compte, utilisez une adresse email différente ou contactez{" "}
            <a href="mailto:privacy@budgetpro.net" className="font-semibold text-blue-600 underline">
              privacy@budgetpro.net
            </a>{" "}
            pour demander une réactivation dans les 30 jours suivant la demande initiale.
          </p>
          <div className="flex flex-col gap-2">
            <Link href="/" className="text-center text-sm text-slate-500 hover:text-slate-700 underline">
              Retour à la page d’accueil
            </Link>
            <Button variant="outline" asChild>
              <Link href="/signup">
                Créer un nouveau compte
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
