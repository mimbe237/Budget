'use client';

import { FileText, FileSpreadsheet, Download } from 'lucide-react';

interface ExportButtonsProps {
  translations: {
    exportPDF: string;
    exportExcel: string;
    exportCSV: string;
  };
}

export function ExportButtons({ translations }: ExportButtonsProps) {
  const handlePrint = () => {
    window.print();
  };

  const handleExportExcel = () => {
    // Placeholder for Excel export functionality
    console.log('Export Excel functionality to be implemented');
  };

  const handleExportCSV = () => {
    // Placeholder for CSV export functionality
    console.log('Export CSV functionality to be implemented');
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