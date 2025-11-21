"use client";

import Link from "next/link";
import { LegalLayout } from "@/components/legal-layout";

const SECTION = "terms";

const sectionData = [
  {
    title: "Cadre de la prestation",
    body: `Budget Pro fournit un cockpit financier en ligne (web + mobile) incluant la gestion des budgets, des dettes, des objectifs et des notifications automatiques. L’accès, l’hébergement et l’évolution de ces services sont assurés par Budget Pro SAS, immatriculée au registre du commerce.`,
  },
  {
    title: "Obligations de l’utilisateur",
    body: `Vous vous engagez à utiliser un identifiant unique, à maintenir la sécurité de vos identifiants et à fournir des informations véridiques. Les contrevenants (fraude, partage public d’identifiants, usage commercial non autorisé) peuvent voir leur compte suspendu.`,
  },
  {
    title: "Paiement et facturation",
    body: `Les offres sont facturées mensuellement ou annuellement selon votre plan. Les paiements sont sécurisés via des prestataires tiers (Stripe, PayPal). Toute annulation est prise en compte à la fin de la période en cours ; aucun remboursement pro rata n’est proposé.`,
  },
  {
    title: "Engagement de service",
    body: `Nous visons 99,9 % de disponibilité pour les modules critiques. Les interruptions planifiées sont annoncées 72 h à l’avance. En cas d’incident majeur, nous alertons les clients via email et centre de statut.`,
  },
  {
    title: "Propriété intellectuelle",
    body: `Budget Pro conserve tous les droits sur le logiciel, les logos, les textes et les rapports. Vous recevez une licence d’usage non exclusive pour vos collaborateurs pendant la durée de votre abonnement.`,
  },
  {
    title: "Modification des conditions",
    body: `Nous pouvons adapter ces conditions. Les mises à jour sont publiées sur cette page avec la date de version. Vous êtes notifié par email et vous disposez de 30 jours pour résilier si vous n’êtes pas d’accord.`,
  },
];

export function TermsPageContent() {
  return (
    <LegalLayout>
      <div className="mx-auto w-full max-w-4xl rounded-3xl border border-slate-200 bg-white p-10 shadow-lg">
        <h1 className="text-3xl font-semibold text-slate-900">Conditions de service</h1>
        <p className="mt-3 text-lg text-slate-600">
          Ces conditions décrivent les engagements entre Budget Pro et ses clients pour l’utilisation de la plateforme cloud.
        </p>
        <div className="mt-8 space-y-8">
          {sectionData.map((section) => (
            <section key={section.title} className="space-y-3">
              <h2 className="text-2xl font-semibold text-slate-800">{section.title}</h2>
              <p className="text-slate-600 leading-relaxed">{section.body}</p>
            </section>
          ))}
        </div>
        <div className="mt-10 flex flex-col gap-3 rounded-2xl bg-blue-50 p-6 text-sm text-blue-900">
          <p>
            Pour toute demande spécifique (contrats personnalisés, SLA renforcé, conformité), contactez notre équipe commerciale :
            <Link href="mailto:enterprise@budgetpro.net" className="ml-1 font-semibold underline text-blue-700">
              enterprise@budgetpro.net
            </Link>
            .
          </p>
          <p>
            Vous pouvez également consulter{" "}
            <Link href="/terms-box" className="font-semibold underline text-blue-700">
              les conditions dédiées aux boîtes
            </Link>{" "}
            pour les organisations ayant besoin d’un encadrement contractuel plus poussé.
          </p>
        </div>
      </div>
    </LegalLayout>
  );
}

export default function TermsPage() {
  return <TermsPageContent />;
}
