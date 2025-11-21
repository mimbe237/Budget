/**
 * 🎯 EXEMPLES DE COMPOSANTS RESPONSIVE
 * 
 * Ce fichier contient des exemples de patterns responsive
 * réutilisables pour toutes les pages de l'application.
 * 
 * Utilisez ces patterns comme référence pour maintenir
 * la cohérence du design responsive à travers tout le projet.
 */

import React from 'react';

/* ============================================
   📱 PATTERN 1: HEADER DE PAGE RESPONSIVE
   ============================================ */

export function ResponsivePageHeader() {
  return (
    <div className="flex flex-col gap-3 sm:gap-4 lg:flex-row lg:items-center lg:justify-between mb-4 sm:mb-6">
      {/* Titre et description */}
      <div className="space-y-1 sm:space-y-1.5">
        <h1 className="text-xl sm:text-2xl lg:text-3xl laptop:text-4xl font-semibold tracking-tight text-slate-900">
          Titre de la Page
        </h1>
        <p className="text-xs sm:text-sm lg:text-base text-muted-foreground max-w-2xl">
          Description de la page avec contexte utile pour l'utilisateur.
        </p>
      </div>

      {/* Actions - wrapping automatique */}
      <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
        <button className="h-9 px-3 text-sm">Action 1</button>
        <button className="h-9 px-3 text-sm">Action 2</button>
      </div>
    </div>
  );
}

/* ============================================
   📊 PATTERN 2: GRILLE DE KPI CARDS
   Mobile: 1 col → Tablet: 2 cols → Desktop: 3 cols
   ============================================ */

export function ResponsiveKPIGrid() {
  const kpis = [
    { title: 'Métrique 1', value: '1,234', icon: '📊' },
    { title: 'Métrique 2', value: '5,678', icon: '💰' },
    { title: 'Métrique 3', value: '9,012', icon: '📈' },
  ];

  return (
    <div className="grid gap-3 sm:gap-4 grid-cols-1 xs:grid-cols-2 lg:grid-cols-3 laptop:gap-5">
      {kpis.map((kpi, index) => (
        <div
          key={index}
          className="bg-white rounded-xl lg:rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow"
        >
          {/* Header avec icon */}
          <div className="flex items-start justify-between p-4 lg:p-6 pb-2 lg:pb-3">
            <h3 className="text-sm sm:text-base lg:text-lg font-medium text-slate-700 truncate">
              {kpi.title}
            </h3>
            <span className="text-xl lg:text-2xl shrink-0 ml-2">{kpi.icon}</span>
          </div>

          {/* Value */}
          <div className="px-4 lg:px-6 pb-4 lg:pb-6">
            <p className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900 truncate">
              {kpi.value}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ============================================
   📋 PATTERN 3: FORMULAIRE AVEC FILTRES
   Mobile: 1 col → Tablet: 2 cols → Desktop: 4 cols
   ============================================ */

export function ResponsiveFilterForm() {
  return (
    <div className="bg-white rounded-xl lg:rounded-2xl border border-slate-200 p-4 sm:p-6">
      <h2 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">
        Filtres
      </h2>

      {/* Grille de filtres responsive */}
      <div className="grid gap-2 sm:gap-3 grid-cols-1 md:grid-cols-2 xl:grid-cols-4">
        <input
          type="text"
          placeholder="Rechercher..."
          className="h-9 sm:h-10 px-3 text-sm border border-slate-300 rounded-lg"
        />
        <select className="h-9 sm:h-10 px-3 text-sm border border-slate-300 rounded-lg">
          <option>Type</option>
        </select>
        <select className="h-9 sm:h-10 px-3 text-sm border border-slate-300 rounded-lg">
          <option>Catégorie</option>
        </select>
        <select className="h-9 sm:h-10 px-3 text-sm border border-slate-300 rounded-lg">
          <option>Période</option>
        </select>
      </div>
    </div>
  );
}

/* ============================================
   📊 PATTERN 4: LAYOUT CHART + SIDEBAR
   Mobile: Stack → Desktop: 2 cols (2fr + 1fr)
   ============================================ */

export function ResponsiveChartLayout() {
  return (
    <div className="grid gap-3 sm:gap-4 lg:gap-5 xl:grid-cols-[2fr_1fr]">
      {/* Chart principal - scrollable horizontalement sur mobile */}
      <div className="bg-white rounded-xl lg:rounded-2xl border border-slate-200 p-4 sm:p-6 overflow-hidden">
        <h2 className="text-base sm:text-lg font-semibold mb-4">
          Graphique Principal
        </h2>
        <div className="h-64 sm:h-80 lg:h-96 bg-slate-100 rounded-lg flex items-center justify-center">
          [Chart Component Here]
        </div>
      </div>

      {/* Sidebar avec informations complémentaires */}
      <div className="space-y-3 sm:space-y-4">
        <div className="bg-white rounded-xl lg:rounded-2xl border border-slate-200 p-4 sm:p-6">
          <h3 className="text-sm sm:text-base font-semibold mb-3">Insights</h3>
          <ul className="space-y-2 text-xs sm:text-sm text-slate-600">
            <li>• Insight 1</li>
            <li>• Insight 2</li>
            <li>• Insight 3</li>
          </ul>
        </div>
        <div className="bg-white rounded-xl lg:rounded-2xl border border-slate-200 p-4 sm:p-6">
          <h3 className="text-sm sm:text-base font-semibold mb-3">Alertes</h3>
          <p className="text-xs sm:text-sm text-slate-600">
            Aucune alerte pour le moment.
          </p>
        </div>
      </div>
    </div>
  );
}

/* ============================================
   📋 PATTERN 5: TABLE RESPONSIVE
   Scroll horizontal sur mobile avec colonnes sticky
   ============================================ */

export function ResponsiveTable() {
  const data = [
    { id: 1, date: '2024-01-15', description: 'Transaction 1', amount: '150.00' },
    { id: 2, date: '2024-01-14', description: 'Transaction 2', amount: '75.50' },
    { id: 3, date: '2024-01-13', description: 'Transaction 3', amount: '200.00' },
  ];

  return (
    <div className="bg-white rounded-xl lg:rounded-2xl border border-slate-200 overflow-hidden">
      <div className="p-4 sm:p-6 border-b border-slate-200">
        <h2 className="text-base sm:text-lg font-semibold">
          Liste des Transactions
        </h2>
        <p className="text-xs sm:text-sm text-slate-600 mt-1">
          {data.length} transactions trouvées
        </p>
      </div>

      {/* Scroll horizontal sur mobile */}
      <div className="overflow-x-auto -mx-px">
        <table className="w-full min-w-[600px] text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              {/* Checkbox sticky sur mobile */}
              <th className="sticky left-0 bg-slate-50 z-10 w-12 px-4 py-3 text-left">
                <input type="checkbox" />
              </th>
              <th className="px-4 py-3 text-left font-medium">Date</th>
              <th className="px-4 py-3 text-left font-medium">Description</th>
              <th className="px-4 py-3 text-right font-medium">Montant</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {data.map((row) => (
              <tr key={row.id} className="hover:bg-slate-50">
                <td className="sticky left-0 bg-white hover:bg-slate-50 z-10 px-4 py-3">
                  <input type="checkbox" />
                </td>
                <td className="px-4 py-3 text-slate-600">{row.date}</td>
                <td className="px-4 py-3 font-medium">{row.description}</td>
                <td className="px-4 py-3 text-right font-semibold">
                  {row.amount} €
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="p-4 sm:p-6 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
        <p className="text-xs sm:text-sm text-slate-600">
          Page 1 sur 5
        </p>
        <div className="flex gap-2">
          <button className="px-3 py-1.5 text-xs sm:text-sm border border-slate-300 rounded-lg hover:bg-slate-50">
            Précédent
          </button>
          <button className="px-3 py-1.5 text-xs sm:text-sm border border-slate-300 rounded-lg hover:bg-slate-50">
            Suivant
          </button>
        </div>
      </div>
    </div>
  );
}

/* ============================================
   🎯 PATTERN 6: GRILLE DENSE (4-6 colonnes)
   Mobile: 1 col → Tablet: 2 cols → Desktop: 4 cols → Ultra-wide: 6 cols
   ============================================ */

export function ResponsiveDenseGrid() {
  const items = Array.from({ length: 12 }, (_, i) => ({
    id: i + 1,
    title: `Item ${i + 1}`,
  }));

  return (
    <div className="grid gap-2 sm:gap-3 grid-cols-1 xs:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 3xl:grid-cols-6">
      {items.map((item) => (
        <div
          key={item.id}
          className="bg-white rounded-lg border border-slate-200 p-3 sm:p-4 hover:shadow-md transition-shadow"
        >
          <h3 className="text-sm font-medium">{item.title}</h3>
        </div>
      ))}
    </div>
  );
}

/* ============================================
   📱 PATTERN 7: MODAL/DIALOG RESPONSIVE
   ============================================ */

export function ResponsiveDialog({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50">
      {/* Dialog - width adaptive */}
      <div className="bg-white rounded-xl lg:rounded-2xl shadow-xl w-full max-w-md sm:max-w-lg lg:max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-slate-200 flex items-center justify-between">
          <h2 className="text-lg sm:text-xl font-semibold">Titre du Dialog</h2>
          <button
            onClick={onClose}
            className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-slate-100"
          >
            ✕
          </button>
        </div>

        {/* Content - scrollable */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          <p className="text-sm sm:text-base text-slate-600">
            Contenu du dialog avec scroll automatique si le contenu est trop long.
          </p>
        </div>

        {/* Footer avec actions */}
        <div className="p-4 sm:p-6 border-t border-slate-200 flex flex-col-reverse sm:flex-row gap-2 sm:gap-3">
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2 text-sm border border-slate-300 rounded-lg hover:bg-slate-50"
          >
            Annuler
          </button>
          <button className="w-full sm:w-auto px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            Confirmer
          </button>
        </div>
      </div>
    </div>
  );
}

/* ============================================
   🎨 PATTERN 8: SECTION AVEC MAX-WIDTH CENTRÉ
   Pour éviter le vide sur grands écrans
   ============================================ */

export function ResponsiveCenteredSection() {
  return (
    <section className="w-full py-8 sm:py-12 lg:py-16">
      {/* Container avec max-width adaptatif */}
      <div className="mx-auto w-full max-w-full lg:max-w-6xl laptop:max-w-7xl 3xl:max-w-[1800px] px-3 sm:px-4 md:px-6 lg:px-8">
        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-center mb-6 sm:mb-8 lg:mb-12">
          Section Centrée
        </h2>
        <p className="text-base sm:text-lg text-slate-600 text-center max-w-3xl mx-auto">
          Le contenu est centré avec une largeur maximale pour éviter les lignes
          de texte trop longues sur les très grands écrans (meilleure lisibilité).
        </p>
      </div>
    </section>
  );
}

/* ============================================
   📋 CLASSES UTILITAIRES RECOMMANDÉES
   ============================================ */

export const RESPONSIVE_CLASSES = {
  // Spacing progressif
  padding: {
    mobile: 'px-3 py-3',
    tablet: 'sm:px-4 sm:py-4 md:px-6 md:py-4',
    desktop: 'lg:px-8 lg:py-6 laptop:px-10',
  },

  // Gap entre éléments
  gap: {
    mobile: 'gap-3',
    tablet: 'sm:gap-4',
    desktop: 'lg:gap-5 laptop:gap-6',
  },

  // Typography
  heading: {
    h1: 'text-xl sm:text-2xl lg:text-3xl laptop:text-4xl',
    h2: 'text-lg sm:text-xl lg:text-2xl laptop:text-3xl',
    h3: 'text-base sm:text-lg lg:text-xl laptop:text-2xl',
  },

  text: {
    body: 'text-sm sm:text-base lg:text-lg',
    small: 'text-xs sm:text-sm',
  },

  // Grilles standards
  grid: {
    '1-2': 'grid grid-cols-1 md:grid-cols-2',
    '1-3': 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    '1-4': 'grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
  },

  // Borders radius
  rounded: {
    card: 'rounded-xl lg:rounded-2xl',
    button: 'rounded-lg',
  },
};

/* ============================================
   💡 EXEMPLES D'UTILISATION
   ============================================ */

/*
// Dans votre page Categories:
export default function CategoriesPage() {
  return (
    <AppLayout>
      <ResponsivePageHeader />
      <ResponsiveKPIGrid />
      <ResponsiveFilterForm />
      <ResponsiveTable />
    </AppLayout>
  );
}

// Dans votre page Goals:
export default function GoalsPage() {
  return (
    <AppLayout>
      <ResponsivePageHeader />
      <ResponsiveChartLayout />
      <ResponsiveDenseGrid />
    </AppLayout>
  );
}

// Dans votre page Debts:
export default function DebtsPage() {
  return (
    <AppLayout>
      <ResponsivePageHeader />
      <ResponsiveKPIGrid />
      <ResponsiveTable />
    </AppLayout>
  );
}
*/
