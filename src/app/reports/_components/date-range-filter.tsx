'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Filter } from 'lucide-react';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  subMonths,
  subYears,
} from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Switch } from '@/components/ui/switch';

export function DateRangeFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [dateFrom, setDateFrom] = useState<Date | undefined>(() => {
    const f = searchParams ? searchParams.get('from') : null;
    return f ? new Date(f) : undefined;
  });
  const [dateTo, setDateTo] = useState<Date | undefined>(() => {
    const t = searchParams ? searchParams.get('to') : null;
    return t ? new Date(t) : undefined;
  });
  const [includeDebt, setIncludeDebt] = useState<boolean>(() => {
    const raw = searchParams ? searchParams.get('includeDebt') : null;
    if (raw === null) return true;
    return raw === '1';
  });

  const buildParams = (overrides?: Record<string, string | null>) => {
    const params = new URLSearchParams();
    if (dateFrom) {
      params.set('from', format(dateFrom, 'yyyy-MM-dd'));
    }
    if (dateTo) {
      params.set('to', format(dateTo, 'yyyy-MM-dd'));
    }
    params.set('includeDebt', includeDebt ? '1' : '0');

    if (overrides) {
      Object.entries(overrides).forEach(([key, value]) => {
        if (value === null) {
          params.delete(key);
        } else {
          params.set(key, value);
        }
      });
    }
    return params;
  };

  const handleApplyFilter = () => {
    router.push(`/reports?${buildParams().toString()}`);
  };

  const handleReset = () => {
    setDateFrom(undefined);
    setDateTo(undefined);
    router.push(
      `/reports?${buildParams({
        from: null,
        to: null,
      }).toString()}`,
    );
  };

  const handleQuickFilter = (type: string) => {
    const now = new Date();
    let from: Date;
    let to: Date = now;

    switch (type) {
      case 'thisMonth':
        from = startOfMonth(now);
        to = endOfMonth(now);
        break;
      case 'lastMonth':
        from = startOfMonth(subMonths(now, 1));
        to = endOfMonth(subMonths(now, 1));
        break;
      case 'last3Months':
        from = startOfMonth(subMonths(now, 2));
        to = endOfMonth(now);
        break;
      case 'last6Months':
        from = startOfMonth(subMonths(now, 5));
        to = endOfMonth(now);
        break;
      case 'thisYear':
        from = startOfYear(now);
        to = endOfYear(now);
        break;
      case 'lastYear':
        from = startOfYear(subYears(now, 1));
        to = endOfYear(subYears(now, 1));
        break;
      default:
        return;
    }

    setDateFrom(from);
    setDateTo(to);
    router.push(
      `/reports?${buildParams({
        from: format(from, 'yyyy-MM-dd'),
        to: format(to, 'yyyy-MM-dd'),
      }).toString()}`,
    );
  };

  const handleIncludeDebtToggle = (checked: boolean) => {
    setIncludeDebt(checked);
    router.push(
      `/reports?${buildParams({
        includeDebt: checked ? '1' : '0',
      }).toString()}`,
    );
  };

  return (
    <div className="space-y-4 print:hidden">
      {/* Raccourcis de période */}
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" onClick={() => handleQuickFilter('thisMonth')}>
          Ce mois
        </Button>
        <Button variant="outline" size="sm" onClick={() => handleQuickFilter('lastMonth')}>
          Mois dernier
        </Button>
        <Button variant="outline" size="sm" onClick={() => handleQuickFilter('last3Months')}>
          3 derniers mois
        </Button>
        <Button variant="outline" size="sm" onClick={() => handleQuickFilter('last6Months')}>
          6 derniers mois
        </Button>
        <Button variant="outline" size="sm" onClick={() => handleQuickFilter('thisYear')}>
          Cette année
        </Button>
        <Button variant="outline" size="sm" onClick={() => handleQuickFilter('lastYear')}>
          Année dernière
        </Button>
      </div>

      {/* Sélecteur de dates personnalisées */}
      <div className="flex flex-wrap items-center gap-4 p-4 bg-card rounded-lg border">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Période personnalisée:</span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Date de début */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  'w-[200px] justify-start text-left font-normal',
                  !dateFrom && 'text-muted-foreground',
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateFrom ? format(dateFrom, 'PPP', { locale: fr }) : 'Date de début'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar mode="single" selected={dateFrom} onSelect={setDateFrom} initialFocus locale={fr} />
            </PopoverContent>
          </Popover>

          <span className="text-sm text-muted-foreground">à</span>

          {/* Date de fin */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  'w-[200px] justify-start text-left font-normal',
                  !dateTo && 'text-muted-foreground',
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateTo ? format(dateTo, 'PPP', { locale: fr }) : 'Date de fin'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={dateTo}
                onSelect={setDateTo}
                initialFocus
                locale={fr}
                disabled={(date) => (dateFrom ? date < dateFrom : false)}
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Boutons d'action */}
        <div className="flex gap-2 ml-auto">
          <Button variant="outline" onClick={handleReset} disabled={!dateFrom && !dateTo}>
            Réinitialiser
          </Button>
          <Button onClick={handleApplyFilter}>Appliquer</Button>
        </div>
      </div>

      <div className="flex items-center gap-3 rounded-lg border px-4 py-3 bg-card">
        <Switch id="include-debt-toggle" checked={includeDebt} onCheckedChange={handleIncludeDebtToggle} />
        <div className="flex flex-col">
          <label htmlFor="include-debt-toggle" className="text-sm font-medium leading-none">
            Inclure dette
          </label>
          <span className="text-xs text-muted-foreground">
            {includeDebt
              ? 'Les KPI et exports intègrent vos emprunts et intérêts.'
              : 'Comparez vos flux sans les remboursements de dettes.'}
          </span>
        </div>
      </div>
    </div>
  );
}
