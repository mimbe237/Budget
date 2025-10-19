'use client';

import { Button } from '@/components/ui/button';
import { FileText, Download, FileSpreadsheet } from 'lucide-react';
import { useSearchParams } from 'next/navigation';

interface ReportHeaderProps {
  title: string;
  subtitle: string;
  currency: string;
}

export function ReportHeader({ title, subtitle, currency }: ReportHeaderProps) {
  const searchParams = useSearchParams();
  
  const handleExportPDF = () => {
    window.print();
  };

  const handleExportExcel = () => {
    const params = new URLSearchParams(searchParams);
    params.set('export', 'excel');
    window.location.href = `/api/reports/export?${params.toString()}`;
  };

  const handleExportCSV = () => {
    const params = new URLSearchParams(searchParams);
    params.set('export', 'csv');
    window.location.href = `/api/reports/export?${params.toString()}`;
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