'use client';

import { cn } from '@/lib/utils';

interface ReportSectionProps {
  title: string;
  children: React.ReactNode;
  accent?: 'orange' | 'blue' | 'green' | 'gray';
  className?: string;
}

export function ReportSection({ title, children, accent = 'orange', className }: ReportSectionProps) {
  const accentClass = {
    orange: 'border-orange-500',
    blue: 'border-blue-500',
    green: 'border-green-500',
    gray: 'border-gray-300'
  }[accent];

  return (
    <section className={cn('print-section bg-white rounded-md border shadow-sm', className)}>
      <div className={cn('px-4 py-3 border-b font-semibold text-lg', accentClass)} style={{ borderBottomWidth: 3 }}>
        {title}
      </div>
      <div className="p-4">
        {children}
      </div>
    </section>
  );
}
