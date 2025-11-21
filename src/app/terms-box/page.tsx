"use client";

export default function TermsBoxPage() {
  const servicePoints = [
    "Accès multi-utilisateurs avec rôles personnalisés (finance, admin, lecture seule).",
    "Chiffrement des données à repos et en transit, avec sauvegardes journalières pendant 90 jours.",
    "Audit trail détaillé pour suivre les modifications budgétaires et les accès sensibles.",
    "Support prioritaire avec SLA 2 h en journée ouvrée et revue trimestrielle de la santé financière.",
  ];

  return (
    <main className="min-h-screen bg-slate-100 py-16 px-4">
      <div className="mx-auto w-full max-w-5xl space-y-10 rounded-3xl border border-slate-200 bg-white p-10 shadow-2xl">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-blue-500">Professionnel</p>
          <h1 className="text-3xl font-semibold text-slate-900 mt-2">Conditions de service (Boîte)</h1>
          <p className="mt-3 text-slate-600">
            Cette version contractuelle s’applique aux sociétés qui souhaitent déployer Budget Pro pour leurs équipes financières, filiales ou cabinets partenaires.
          </p>
        </div>

        <section className="rounded-2xl bg-gradient-to-r from-blue-50 via-white to-slate-50 p-6 shadow-lg ring-1 ring-blue-100">
          <h2 className="text-xl font-semibold text-slate-900">Engagements spécifiques</h2>
          <ul className="mt-4 space-y-3 text-sm text-slate-700">
            {servicePoints.map(point => (
              <li key={point} className="flex items-start gap-2">
                <span className="mt-1 h-2 w-2 rounded-full bg-blue-500" />
                {point}
              </li>
            ))}
          </ul>
        </section>

        <section className="grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
            <h3 className="text-lg font-semibold text-slate-900">Data & conformité</h3>
            <p className="mt-3 text-sm text-slate-600">
              Les données sont hébergées sur Google Cloud en Europe (Francfort). Les sauvegardes sont isolées et chaque cluster est couvert par des certifications ISO 27001 et SOC 2 Type II.
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
            <h3 className="text-lg font-semibold text-slate-900">Déploiement & onboarding</h3>
            <p className="mt-3 text-sm text-slate-600">
              Nous proposons un accompagnement « onboarding rapide » (2 semaines) puis un référent dédié pour les 6 premiers mois. Des ateliers de formation et un support Slack/Email sont inclus.
            </p>
          </div>
        </section>

        <section className="space-y-3 rounded-2xl border border-dashed border-slate-200 p-6 text-sm text-slate-700">
          <p className="text-slate-900 font-semibold">Requête contractuelle ?</p>
          <p>
            Pour signer une convention de service, un accord de traitement des données (DPA) ou activer la personnalisation de reporting (widgets, exports pdf), contactez :
            <span className="font-semibold text-blue-700">enterprise@budgetpro.net</span>
          </p>
        </section>
      </div>
    </main>
  );
}
