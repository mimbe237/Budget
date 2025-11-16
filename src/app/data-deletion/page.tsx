"use client";

import Link from "next/link";
import { LegalLayout } from "@/components/legal-layout";

const steps = [
  "Identifiez les comptes à supprimer (factures, budgets, pièces jointes) depuis le tableau de bord.",
  "Téléchargez vos exports CSV/Excel si vous avez besoin d’un historique avant suppression.",
  "Envoyez votre requête via le formulaire sécurisé (lien ci-dessous) ou par email à privacy@budgetpro.net.",
];

export function DataDeletionContent() {
  return (
    <LegalLayout>
      <div className="mx-auto w-full max-w-3xl space-y-8 rounded-3xl border border-slate-200 bg-white p-10 shadow-xl">
        <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">Vie privée</p>
        <h1 className="text-3xl font-semibold text-slate-900">Suppression des données utilisateur</h1>
        <p className="text-slate-600">
          Vous pouvez demander la suppression complète de votre compte et de vos données personnelles. Nous respectons le RGPD, la loi informatique et libertés ainsi que les bonnes pratiques africaines en matière de protection des données.
        </p>

        <section className="space-y-5 rounded-2xl border border-slate-200 bg-slate-100 p-6">
          <h2 className="text-xl font-semibold text-slate-900">Ce qui sera supprimé</h2>
          <ul className="text-sm text-slate-600 leading-relaxed">
            <li>• Données budgétaires : transactions, catégories, objectifs et historiques.</li>
            <li>• Fichiers joints et documents partagés.</li>
            <li>• Notifications, alertes et intégrations connectées (Slack, email API).</li>
          </ul>
        </section>

        <section className="space-y-4 rounded-2xl border border-dashed border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900">Processus simple en 3 étapes</h2>
          <ol className="space-y-3 text-sm text-slate-600">
            {steps.map((step) => (
              <li key={step} className="flex gap-3">
                <span className="mt-1 h-3 w-3 rounded-full bg-slate-400" />
                <span>{step}</span>
              </li>
            ))}
          </ol>
          <p className="text-xs text-slate-500">
            Une fois la suppression validée, un email de confirmation vous est envoyé sous 7 jours ouvrés. Les données restent archivé sur des logs internes pendant 30 jours avant suppression définitive (conforme aux obligations légales).
          </p>
        </section>

        <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-gradient-to-r from-blue-500 to-slate-500 p-6 text-white shadow-lg">
          <p className="text-sm font-semibold">Prêt à supprimer vos données ?</p>
          <p className="text-sm">
            Vous pouvez initier la demande via notre formulaire sécurisé ou en écrivant à
            <span className="font-semibold"> privacy@budgetpro.net</span>.
          </p>
          <Link
            href="/privacy"
            className="inline-flex w-fit items-center rounded-full border border-white/50 px-4 py-2 text-sm font-semibold shadow hover:bg-white/10"
          >
            Accéder au formulaire de suppression
          </Link>
        </div>
        <section className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-6 text-xs text-slate-500">
          <p className="font-semibold text-slate-900">Détails techniques</p>
          <p>
            L’API `DELETE /api/user/me` vérifie votre token Firebase, supprime toutes les sous-collections Firestore du compte,
            efface les documents isolés (ex. `/debts`) et supprime l’utilisateur Firebase après avoir révoqué les tokens.
          </p>
          <p>
            La suppression est exécutée dans l’ordre suivant : sous-collections (avec leurs sous-dossiers), document utilisateur,
            documents associés et finally suppression du compte d’authentification afin d’éviter les incohérences.
          </p>
          <p>
            Une fois la demande envoyée, nous conservons votre compte pendant 30 jours pour vous permettre de revenir en arrière. Si vous vous connectez à nouveau ou contactez <strong>privacy@budgetpro.net</strong>, nous annulons la suppression. Passé ce délai, la suppression devient définitive.
          </p>
        </section>
      </div>
    </LegalLayout>
  );
}

export default function DataDeletionPage() {
  return <DataDeletionContent />;
}
