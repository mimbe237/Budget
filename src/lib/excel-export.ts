/**
 * Utilitaires pour l'export Excel avec xlsx
 */

import * as XLSX from 'xlsx';
import type { FinancialReportData } from './types';
import { format } from 'date-fns';

/**
 * Exporte les données du rapport financier en fichier Excel
 */
export function exportToExcel(data: FinancialReportData, formatMoney: (cents: number) => string, filename?: string): void {
  // Créer un nouveau workbook
  const wb = XLSX.utils.book_new();
  
  // === Feuille 1: Vue d'ensemble ===
  const overviewData = [
    ['RAPPORT FINANCIER'],
    [''],
    ['Période', `${format(data.period.from, 'dd/MM/yyyy')} - ${format(data.period.to, 'dd/MM/yyyy')}`],
    ['Généré le', format(new Date(), 'dd/MM/yyyy à HH:mm')],
    [''],
    ['INDICATEURS CLÉS'],
    ['Revenus totaux', formatMoney(data.totalIncome)],
    ['Dépenses totales', formatMoney(data.totalExpenses)],
    ['Solde net', formatMoney(data.netBalance)],
  ];
  
  const wsOverview = XLSX.utils.aoa_to_sheet(overviewData);
  
  // Style pour la feuille overview
  wsOverview['!cols'] = [{ wch: 20 }, { wch: 20 }];
  
  XLSX.utils.book_append_sheet(wb, wsOverview, 'Vue d\'ensemble');
  
  // === Feuille 2: Dépenses par catégorie ===
  const totalSpending = data.spendingByCategory.reduce((sum, item) => sum + item.value, 0);
  const categoriesData = [
    ['DÉPENSES PAR CATÉGORIE'],
    [''],
    ['Catégorie', 'Montant', 'Pourcentage'],
    ...data.spendingByCategory.map(item => {
      const percentage = totalSpending > 0 ? (item.value / totalSpending * 100) : 0;
      return [
        item.name,
        formatMoney(item.value),
        `${percentage.toFixed(1)}%`
      ];
    })
  ];
  
  const wsCategories = XLSX.utils.aoa_to_sheet(categoriesData);
  wsCategories['!cols'] = [{ wch: 25 }, { wch: 15 }, { wch: 12 }];
  
  XLSX.utils.book_append_sheet(wb, wsCategories, 'Catégories');
  
  // === Feuille 3: Budget vs Réel ===
  const budgetData = [
    ['BUDGET VS RÉEL'],
    [''],
    ['Catégorie', 'Budgété', 'Réel', 'Écart', '% Utilisé'],
    ...data.budgetVsActual.map(item => {
      const percentUsed = item.budgeted > 0 ? (item.actual / item.budgeted * 100) : 0;
      return [
        item.category,
        formatMoney(item.budgeted),
        formatMoney(item.actual),
        formatMoney(item.variance),
        `${percentUsed.toFixed(1)}%`
      ];
    })
  ];
  
  const wsBudget = XLSX.utils.aoa_to_sheet(budgetData);
  wsBudget['!cols'] = [{ wch: 20 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 12 }];
  
  XLSX.utils.book_append_sheet(wb, wsBudget, 'Budget');
  
  // === Feuille 4: Flux de trésorerie ===
  const cashflowData = [
    ['FLUX DE TRÉSORERIE'],
    [''],
    ['Date', 'Revenus', 'Dépenses', 'Net'],
    ...data.cashflow.map(item => [
      item.date,
      formatMoney(item.income * 100),
      formatMoney(item.expenses * 100),
      formatMoney((item.income - item.expenses) * 100)
    ])
  ];
  
  const wsCashflow = XLSX.utils.aoa_to_sheet(cashflowData);
  wsCashflow['!cols'] = [{ wch: 12 }, { wch: 15 }, { wch: 15 }, { wch: 15 }];
  
  XLSX.utils.book_append_sheet(wb, wsCashflow, 'Flux de trésorerie');
  
  // === Feuille 5: Objectifs d'épargne ===
  if (data.goals.length > 0) {
    const goalsData = [
      ['OBJECTIFS D\'ÉPARGNE'],
      [''],
      ['Objectif', 'Cible', 'Actuel', 'Restant', 'Progression'],
      ...data.goals.map(goal => {
        const progress = goal.targetAmountInCents > 0 ? (goal.currentAmountInCents / goal.targetAmountInCents * 100) : 0;
        return [
          goal.name,
          formatMoney(goal.targetAmountInCents),
          formatMoney(goal.currentAmountInCents),
          formatMoney(goal.targetAmountInCents - goal.currentAmountInCents),
          `${progress.toFixed(1)}%`
        ];
      })
    ];
    
    const wsGoals = XLSX.utils.aoa_to_sheet(goalsData);
    wsGoals['!cols'] = [{ wch: 25 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 12 }];
    
    XLSX.utils.book_append_sheet(wb, wsGoals, 'Objectifs');
  }
  
  // === Feuille 6: Transactions récentes ===
  if (data.recentTransactions.length > 0) {
    const transactionsData = [
      ['TRANSACTIONS RÉCENTES'],
      [''],
      ['Date', 'Description', 'Catégorie', 'Montant', 'Type'],
      ...data.recentTransactions.slice(0, 100).map(tx => [
        format(tx.date, 'dd/MM/yyyy'),
        tx.description,
        tx.category,
        formatMoney(Math.abs(tx.amountInCents)),
        tx.type === 'income' ? 'Revenu' : 'Dépense'
      ])
    ];
    
    const wsTransactions = XLSX.utils.aoa_to_sheet(transactionsData);
    wsTransactions['!cols'] = [{ wch: 12 }, { wch: 30 }, { wch: 15 }, { wch: 15 }, { wch: 10 }];
    
    XLSX.utils.book_append_sheet(wb, wsTransactions, 'Transactions');
  }
  
  // Générer le nom de fichier si non fourni
  const finalFilename = filename || `rapport-financier_${format(new Date(), 'yyyy-MM-dd_HHmm')}.xlsx`;
  
  // Écrire et télécharger le fichier
  XLSX.writeFile(wb, finalFilename);
}

/**
 * Exporte uniquement les transactions en Excel
 */
export function exportTransactionsToExcel(
  transactions: Array<{
    date: Date;
    description: string;
    category: string;
    amountInCents: number;
    type: 'income' | 'expense';
  }>,
  formatMoney: (cents: number) => string,
  filename?: string
): void {
  const wb = XLSX.utils.book_new();
  
  const data = [
    ['TRANSACTIONS'],
    ['Exporté le', format(new Date(), 'dd/MM/yyyy à HH:mm')],
    [''],
    ['Date', 'Description', 'Catégorie', 'Montant', 'Type'],
    ...transactions.map(tx => [
      format(tx.date, 'dd/MM/yyyy'),
      tx.description,
      tx.category,
      formatMoney(Math.abs(tx.amountInCents)),
      tx.type === 'income' ? 'Revenu' : 'Dépense'
    ])
  ];
  
  const ws = XLSX.utils.aoa_to_sheet(data);
  ws['!cols'] = [{ wch: 12 }, { wch: 35 }, { wch: 18 }, { wch: 15 }, { wch: 10 }];
  
  XLSX.utils.book_append_sheet(wb, ws, 'Transactions');
  
  const finalFilename = filename || `transactions_${format(new Date(), 'yyyy-MM-dd_HHmm')}.xlsx`;
  XLSX.writeFile(wb, finalFilename);
}
