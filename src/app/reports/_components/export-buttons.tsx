'use client';

import { FileText, FileSpreadsheet, Download } from 'lucide-react';
import { exportToExcel } from '@/lib/excel-export';
import { exportToCSV, downloadCSV, generateFilename } from '@/lib/export-utils';
import type { FinancialReportData, UserProfile } from '@/lib/types';

interface ExportButtonsProps {
  translations: {
    exportPDF: string;
    exportExcel: string;
    exportCSV: string;
  };
  reportData: FinancialReportData;
  userProfile: UserProfile | null;
}

export function ExportButtons({ translations, reportData, userProfile }: ExportButtonsProps) {
  // Helper pour formater l'argent
  const formatMoney = (amountInCents: number) => {
    const currency = userProfile?.displayCurrency || 'USD';
    const locale = userProfile?.locale || 'en-US';
    return new Intl.NumberFormat(locale, { style: 'currency', currency }).format((amountInCents || 0) / 100);
  };
  
  const handlePrint = () => {
    window.print();
  };

  const handleExportExcel = () => {
    try {
      const filename = generateFilename('rapport-financier', 'xlsx');
      exportToExcel(reportData, formatMoney, filename);
    } catch (error) {
      console.error('Erreur lors de l\'export Excel:', error);
      alert('Une erreur est survenue lors de l\'export Excel');
    }
  };

  const handleExportCSV = () => {
    try {
      const csvContent = exportToCSV(reportData, formatMoney);
      const filename = generateFilename('rapport-financier', 'csv');
      downloadCSV(csvContent, filename);
    } catch (error) {
      console.error('Erreur lors de l\'export CSV:', error);
      alert('Une erreur est survenue lors de l\'export CSV');
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
      <button 
        onClick={handlePrint}
        className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-md text-sm hover:bg-gray-50 transition-colors"
      >
        <FileText className="h-4 w-4" />
        {translations.exportPDF}
      </button>
      <button 
        onClick={handleExportExcel}
        className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-md text-sm hover:bg-gray-50 transition-colors"
      >
        <FileSpreadsheet className="h-4 w-4" />
        {translations.exportExcel}
      </button>
      <button 
        onClick={handleExportCSV}
        className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-md text-sm hover:bg-gray-50 transition-colors"
      >
        <Download className="h-4 w-4" />
        {translations.exportCSV}
      </button>
    </div>
  );
}