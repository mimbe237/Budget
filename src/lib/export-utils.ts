/**
 * Utilitaires pour l'export de données en différents formats
 */

import type { FinancialReportData } from './types';
import { format } from 'date-fns';

/**
 * Convertit les données du rapport en CSV
 */
export function exportToCSV(data: FinancialReportData, formatMoney: (cents: number) => string): string {
  const lines: string[] = [];
  const debt = data.debtSummary;
  const totalSpending = data.spendingByCategory.reduce((sum, item) => sum + item.value, 0);

  // En-tête du rapport
  lines.push('RAPPORT FINANCIER');
  lines.push(`Période,${format(data.period.from, 'dd/MM/yyyy')} - ${format(data.period.to, 'dd/MM/yyyy')}`);
  lines.push('');

  // KPIs
  lines.push('INDICATEURS CLÉS');
  lines.push('Indicateur,Montant');
  lines.push(`Revenus totaux,${formatMoney(data.totalIncome)}`);
  lines.push(`Dépenses totales,${formatMoney(data.totalExpenses)}`);
  lines.push(`Solde net,${formatMoney(data.netBalance)}`);
  if (debt) {
    lines.push(`Service de la dette (période),${formatMoney(debt.serviceDebtTotal)}`);
    lines.push(`Intérêts payés,${formatMoney(debt.interestPaidTotal)}`);
    lines.push(`Encours fin de période,${formatMoney(debt.remainingPrincipalEnd)}`);
    lines.push(`Échéances en retard,${debt.lateCount}`);
    if (debt.dti !== null) {
      lines.push(`DTI,${(debt.dti * 100).toFixed(1)}%`);
    }
  }
  lines.push('');

  // Dépenses par catégorie
  lines.push('DÉPENSES PAR CATÉGORIE');
  lines.push('Catégorie,Montant,Pourcentage');
  data.spendingByCategory.forEach(item => {
    const percentage = totalSpending > 0 ? (item.value / totalSpending * 100) : 0;
    lines.push(`${item.name},${formatMoney(item.value)},${percentage.toFixed(1)}%`);
  });
  lines.push('');

  // Budget vs Réel
  lines.push('BUDGET VS RÉEL');
  lines.push('Catégorie,Budget,Réel,Écart,Pourcentage utilisé');
  data.budgetVsActual.forEach(item => {
    const percentUsed = item.budgeted > 0 ? (item.actual / item.budgeted * 100) : 0;
    lines.push(`${item.category},${formatMoney(item.budgeted)},${formatMoney(item.actual)},${formatMoney(item.variance)},${percentUsed.toFixed(1)}%`);
  });
  lines.push('');

  // Objectifs d'épargne
  if (data.goals.length > 0) {
    lines.push('OBJECTIFS D\'ÉPARGNE');
    lines.push('Objectif,Cible,Actuel,Progression');
    data.goals.forEach(goal => {
      const progress = goal.targetAmountInCents > 0 ? (goal.currentAmountInCents / goal.targetAmountInCents * 100) : 0;
      lines.push(`${goal.name},${formatMoney(goal.targetAmountInCents)},${formatMoney(goal.currentAmountInCents)},${progress.toFixed(1)}%`);
    });
    lines.push('');
  }

  // Transactions récentes
  if (data.recentTransactions.length > 0) {
    lines.push('TRANSACTIONS RÉCENTES');
    lines.push('Date,Description,Catégorie,Montant,Type');
    data.recentTransactions.forEach(tx => {
      lines.push(`${format(tx.date, 'dd/MM/yyyy')},${tx.description},${tx.category},${formatMoney(Math.abs(tx.amountInCents))},${tx.type}`);
    });
    lines.push('');
  }

  if (debt) {
    lines.push('RÉSUMÉ DETTE');
    lines.push('Indicateur,Valeur');
    lines.push(`Service de la dette (période),${formatMoney(debt.serviceDebtTotal)}`);
    lines.push(`Principal remboursé,${formatMoney(debt.principalPaidTotal)}`);
    lines.push(`Intérêts payés,${formatMoney(debt.interestPaidTotal)}`);
    lines.push(`Encours fin de période,${formatMoney(debt.remainingPrincipalEnd)}`);
    lines.push(`Échéances en retard,${debt.lateCount}`);
    if (debt.dti !== null) {
      lines.push(`DTI,${(debt.dti * 100).toFixed(1)}%`);
    }
    lines.push('');
    if (debt.next3Installments.length > 0) {
      lines.push('Prochaines échéances');
      lines.push('Date,Montant,Statut');
      debt.next3Installments.forEach(item => {
        lines.push(`${format(new Date(item.dueDate), 'dd/MM/yyyy')},${formatMoney(item.amount)},${item.status}`);
      });
      lines.push('');
    }
    lines.push('DETTE & PAIEMENTS');
    lines.push('Date,Principal,Intérêts,Total');
    debt.timeSeriesDebtService.forEach(entry => {
      lines.push(`${format(new Date(entry.date), 'dd/MM/yyyy')},${formatMoney(entry.principalPaid)},${formatMoney(entry.interestPaid)},${formatMoney(entry.totalPaid)}`);
    });
  }

  return lines.join('\n');
}

/**
 * Déclenche le téléchargement d'un fichier CSV
 */
export function downloadCSV(content: string, filename: string = 'rapport-financier.csv'): void {
  // Ajouter le BOM pour UTF-8 (important pour Excel)
  const BOM = '\uFEFF';
  const blob = new Blob([BOM + content], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Convertit les données en format compatible Excel (via xlsx library)
 */
export function prepareExcelData(data: FinancialReportData, formatMoney: (cents: number) => string) {
  const debt = data.debtSummary;
  const totalSpending = data.spendingByCategory.reduce((sum, item) => sum + item.value, 0);

  const overviewRows: (string | undefined)[][] = [
    ['RAPPORT FINANCIER'],
    ['Période', `${format(data.period.from, 'dd/MM/yyyy')} - ${format(data.period.to, 'dd/MM/yyyy')}`],
    [],
    ['INDICATEURS CLÉS'],
    ['Revenus totaux', formatMoney(data.totalIncome)],
    ['Dépenses totales', formatMoney(data.totalExpenses)],
    ['Solde net', formatMoney(data.netBalance)],
  ];

  if (debt) {
    overviewRows.push(['Service de la dette (période)', formatMoney(debt.serviceDebtTotal)]);
    overviewRows.push(['Intérêts payés', formatMoney(debt.interestPaidTotal)]);
    overviewRows.push(['Encours fin de période', formatMoney(debt.remainingPrincipalEnd)]);
    overviewRows.push(['Échéances en retard', `${debt.lateCount}`]);
    if (debt.dti !== null) {
      overviewRows.push(['DTI', `${(debt.dti * 100).toFixed(1)}%`]);
    }
  }

  return {
    // Feuille 1: Vue d'ensemble
    overview: {
      title: 'Vue d\'ensemble',
      data: overviewRows,
    },

    // Feuille 2: Dépenses par catégorie
    categories: {
      title: 'Dépenses par catégorie',
      headers: ['Catégorie', 'Montant', 'Pourcentage'],
      data: data.spendingByCategory.map(item => {
        const percentage = totalSpending > 0 ? (item.value / totalSpending * 100) : 0;
        return [item.name, formatMoney(item.value), `${percentage.toFixed(1)}%`];
      }),
    },

    // Feuille 3: Budget vs Réel
    budget: {
      title: 'Budget vs Réel',
      headers: ['Catégorie', 'Budget', 'Réel', 'Écart', '% Utilisé'],
      data: data.budgetVsActual.map(item => {
        const percentUsed = item.budgeted > 0 ? (item.actual / item.budgeted * 100) : 0;
        return [
          item.category,
          formatMoney(item.budgeted),
          formatMoney(item.actual),
          formatMoney(item.variance),
          `${percentUsed.toFixed(1)}%`,
        ];
      }),
    },

    // Feuille 4: Flux de trésorerie
    cashflow: {
      title: 'Flux de trésorerie',
      headers: ['Date', 'Revenus', 'Dépenses', 'Service dette', 'Solde cumulé'],
      data: data.financialSeries.map(item => [
        item.date,
        formatMoney(item.income),
        formatMoney(item.expenses),
        formatMoney(item.debtService),
        formatMoney(item.cumulativeBalance),
      ]),
    },

    // Feuille 5: Objectifs
    goals: {
      title: 'Objectifs d\'épargne',
      headers: ['Objectif', 'Cible', 'Actuel', 'Restant', 'Progression'],
      data: data.goals.map(goal => {
        const progress = goal.targetAmountInCents > 0 ? (goal.currentAmountInCents / goal.targetAmountInCents * 100) : 0;
        return [
          goal.name,
          formatMoney(goal.targetAmountInCents),
          formatMoney(goal.currentAmountInCents),
          formatMoney(goal.targetAmountInCents - goal.currentAmountInCents),
          `${progress.toFixed(1)}%`,
        ];
      }),
    },

    // Feuille 6: Transactions
    transactions: {
      title: 'Transactions récentes',
      headers: ['Date', 'Description', 'Catégorie', 'Montant', 'Type'],
      data: data.recentTransactions.map(tx => [
        format(tx.date, 'dd/MM/yyyy'),
        tx.description,
        tx.category,
        formatMoney(Math.abs(tx.amountInCents)),
        tx.type,
      ]),
    },

    debtSummary: debt
      ? {
          title: 'Résumé dette',
          data: [
            ['RÉSUMÉ DETTE'],
            [''],
            ['Indicateur', 'Valeur'],
            ['Service de la dette (période)', formatMoney(debt.serviceDebtTotal)],
            ['Principal remboursé', formatMoney(debt.principalPaidTotal)],
            ['Intérêts payés', formatMoney(debt.interestPaidTotal)],
            ['Encours fin de période', formatMoney(debt.remainingPrincipalEnd)],
            ['Échéances en retard', `${debt.lateCount}`],
            ...(debt.dti !== null ? [['DTI', `${(debt.dti * 100).toFixed(1)}%`]] : []),
            [],
            ['Prochaines échéances'],
            ['Date', 'Montant', 'Statut'],
            ...debt.next3Installments.map(item => [
              format(new Date(item.dueDate), 'dd/MM/yyyy'),
              formatMoney(item.amount),
              item.status,
            ]),
          ],
        }
      : undefined,

    debtService: debt
      ? {
          title: 'Dette & paiements',
          headers: ['Date', 'Principal', 'Intérêts', 'Total'],
          data: debt.timeSeriesDebtService.map(entry => [
            format(new Date(entry.date), 'dd/MM/yyyy'),
            formatMoney(entry.principalPaid),
            formatMoney(entry.interestPaid),
            formatMoney(entry.totalPaid),
          ]),
        }
      : undefined,
  };
}

/**
 * Génère un nom de fichier avec la date
 */
export function generateFilename(prefix: string, extension: string): string {
  const date = format(new Date(), 'yyyy-MM-dd_HHmm');
  return `${prefix}_${date}.${extension}`;
}
