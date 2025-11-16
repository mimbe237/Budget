"use client";

import { LegalLayout } from "@/components/legal-layout";

const securityHighlights = [
  {
    title: "Architecture sécurisée",
    body:
      "Budget Pro héberge vos données sur Google Cloud Platform (EU-WEST1). Chaque instance est isolée par projet Firebase, avec IAM strict, pare-feu et rotation régulière des clés.",
  },
  {
    title: "Chiffrement & secrets",
    body:
      "Les données sont chiffrées en AES-256 au repos et en TLS 1.3 lors des transferts. Les clés sont gérées par Google KMS et aucun secret n’est exposé hors du vault.",
  },
  {
    title: "Accès & contrôle",
    body:
      "L’authentification se fait via Firebase Auth (email, SSO possible). Les administrateurs peuvent activer l’authentification multifacteur et recevoir des alertes sur les connexions suspectes.",
  },
  {
    title: "Surveillance & reprise",
    body:
      "Nous effectuons des backups journaliers, stockés pendant 90 jours, et des audits de sécurité trimestriels. Les incidents sont traités selon un processus détaillé avec redondances de données.",
  },
];

export function SecurityPageContent() {
  return (
    <LegalLayout>
      <div className="mx-auto max-w-5xl space-y-8 rounded-[32px] border border-slate-200 bg-gradient-to-br from-blue-900/80 to-indigo-900/90 p-10 shadow-[0_25px_60px_rgba(2,6,23,0.6)] text-white">
        <header className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-cyan-300">Sécurité</p>
          <h1 className="text-4xl font-semibold text-white">Sécurité & confiance</h1>
          <p className="text-base text-slate-200">
            Budget Pro est conçu pour les équipes exigeantes : approbations multi-niveaux, chiffrage, journaux d’audit et conformité RGPD/ISO.
          </p>
        </header>

        <div className="grid gap-6 md:grid-cols-2">
          {securityHighlights.map((item) => (
            <article key={item.title} className="rounded-3xl border border-white/20 bg-white/10 p-6 shadow-lg backdrop-blur">
              <h2 className="text-xl font-semibold text-white">{item.title}</h2>
              <p className="mt-3 text-sm text-slate-200 leading-relaxed">{item.body}</p>
            </article>
          ))}
        </div>

        <section className="rounded-2xl border border-cyan-300/50 bg-cyan-950/40 p-6 text-sm text-cyan-100">
          <p className="font-semibold">Audit & conformité</p>
          <p className="mt-2 text-xs leading-relaxed">
            Nous produisons des rapports de conformité à la demande (ISO 27001, SOC 2) et pouvons fournir un DPA/accord de traitement. Écrivez à{" "}
            <a href="mailto:security@budgetpro.net" className="font-semibold underline text-cyan-200">
              security@budgetpro.net
            </a>{" "}
            pour toute revue, pentest ou transfert de logs.
          </p>
        </section>
      </div>
    </LegalLayout>
  );
}

export default function SecurityPage() {
  return <SecurityPageContent />;
}
