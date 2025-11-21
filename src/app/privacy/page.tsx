"use client";

import { LegalLayout } from "@/components/legal-layout";

const privacySections = [
  {
    title: "Données collectées",
    body:
      "Nous récoltons vos transactions, objectifs, alertes et informations de connexion (nom, email, appareil). Les données financières sont chiffrées au repos avec AES-256 et en transit avec TLS 1.3.",
  },
  {
    title: "Finalités",
    body:
      "Les informations servent à créer vos rapports, alimenter l’IA de catégorisation, prévenir les dépassements de budget et vous proposer des scénarios de trésorerie. Nous ne faisons jamais d’analyse pour le compte de tiers sans votre accord explicite.",
  },
  {
    title: "Partage & intégrations",
    body:
      "Vos données restent confinées à Budget Pro. Nous partageons uniquement les exports que vous générez (CSV, PDF) ou des alertes que vous avez configurées. Les intégrations bancaires nécessitent votre consentement et ne transfèrent jamais vos identifiants tiers.",
  },
  {
    title: "Durée de conservation & droits",
    body:
      "Les données de base sont conservées tant que votre compte est actif. Vous pouvez demander la rectification, la portabilité ou la suppression via le formulaire ou privacy@budgetpro.net. Les logs d’audit sont conservés 30 jours supplémentaires pour conformité.",
  },
];

export function PrivacyPageContent() {
  return (
    <LegalLayout>
      <div className="mx-auto max-w-5xl space-y-10 rounded-[32px] border border-slate-100 bg-white p-10 shadow-[0_30px_70px_rgba(15,23,42,0.1)]">
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-500">Vie privée</p>
          <h1 className="text-4xl font-semibold text-slate-900">Confidentialité & traitement des données</h1>
          <p className="text-lg text-slate-600 leading-relaxed">
            Budget Pro agit comme responsable de traitement pour vos données financières et personnelles. La protection des informations est un pilier de notre mission.
          </p>
        </div>

        <div className="space-y-8">
          {privacySections.map((section) => (
            <article key={section.title} className="space-y-3 rounded-3xl border border-slate-200 bg-slate-50 p-6 shadow-sm">
              <h2 className="text-2xl font-semibold text-slate-800">{section.title}</h2>
              <p className="text-slate-600 leading-relaxed">{section.body}</p>
            </article>
          ))}
        </div>

        <section className="rounded-3xl border border-dashed border-blue-200 bg-gradient-to-r from-blue-50 via-white to-emerald-50 p-6 text-sm text-blue-900 shadow-lg">
          <p className="font-semibold">Questions liées à la confidentialité ?</p>
          <p className="mt-2 text-slate-700">
            Envoyez un message à{' '}
            <a href="mailto:privacy@budgetpro.net" className="font-semibold text-blue-700 underline">
              privacy@budgetpro.net
            </a>{' '}
            ou ouvrez le formulaire de contact accessible depuis le bouton en bas de page.
          </p>
          <p className="text-xs text-blue-700/80">
            Vous avez le droit de retirer votre consentement à tout moment sans remettre en cause la licéité du traitement fondé sur le consentement antérieur.
          </p>
        </section>
      </div>
    </LegalLayout>
  );
}

export default function PrivacyPage() {
  return <PrivacyPageContent />;
}
