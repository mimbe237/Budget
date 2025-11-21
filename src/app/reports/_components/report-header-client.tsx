'use client';

import { Button } from '@/components/ui/button';
import { FileText, Download, FileSpreadsheet } from 'lucide-react';
import { exportToExcel } from '@/lib/excel-export';
import { exportToCSV, downloadCSV, generateFilename } from '@/lib/export-utils';
import type { FinancialReportData, UserProfile } from '@/lib/types';

interface ReportHeaderProps {
  title: string;
  subtitle: string;
  currency: string;
  reportData: FinancialReportData;
  userProfile: UserProfile | null;
}

export function ReportHeader({ title, subtitle, currency, reportData, userProfile }: ReportHeaderProps) {
  // Helper pour formater l'argent
  const formatMoney = (amountInCents: number) => {
    const curr = userProfile?.displayCurrency || 'USD';
    const locale = userProfile?.locale || 'en-US';
    return new Intl.NumberFormat(locale, { style: 'currency', currency: curr }).format((amountInCents || 0) / 100);
  };
  
  const handleExportPDF = () => {
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
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 print:hidden">
      <div>
        <h1 className="text-3xl font-bold font-headline text-gray-900">
          {title}
        </h1>
        <p className="text-lg text-gray-600 mt-1">
          {subtitle} • {currency}
        </p>
      </div>
      
      <div className="flex flex-wrap gap-2">
        <Button
          onClick={handleExportPDF}
          variant="outline"
          size="sm"
          className="flex items-center gap-2"
          title="Exporter en PDF"
        >
          <FileText className="h-4 w-4" />
          PDF
        </Button>
        <Button
          onClick={handleExportExcel}
          variant="outline"
          size="sm"
          className="flex items-center gap-2"
          title="Exporter en Excel"
        >
          <FileSpreadsheet className="h-4 w-4" />
          Excel
        </Button>
        <Button
          onClick={handleExportCSV}
          variant="outline"
          size="sm"
          className="flex items-center gap-2"
          title="Exporter en CSV"
        >
          <Download className="h-4 w-4" />
          CSV
        </Button>
      </div>
    </div>
  );
}