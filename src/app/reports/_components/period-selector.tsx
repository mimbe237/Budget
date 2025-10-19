'use client';

import { Button } from '@/components/ui/button';
import { Calendar, CalendarDays, Clock } from 'lucide-react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { format, startOfYear, endOfYear, startOfMonth, endOfMonth, startOfQuarter, endOfQuarter } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useState, useEffect } from 'react';
import { DateRange } from 'react-day-picker';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';

interface PeriodSelectorProps {
  userProfile: any;
}

export function PeriodSelector({ userProfile }: PeriodSelectorProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isFrench = userProfile?.locale === 'fr-CM';
  const locale = isFrench ? fr : undefined;

  const fromParam = searchParams.get('from');
  const toParam = searchParams.get('to');
  
  const [date, setDate] = useState<DateRange | undefined>(() => {
    const from = fromParam ? new Date(fromParam) : startOfMonth(new Date());
    const to = toParam ? new Date(toParam) : endOfMonth(new Date());
    from.setHours(0, 0, 0, 0);
    to.setHours(23, 59, 59, 999);
    return { from, to };
  });

  const [activePreset, setActivePreset] = useState<string>(() => {
    const now = new Date();
    const from = date?.from;
    const to = date?.to;

    if (!from || !to) return 'custom';

    if (from.getTime() === startOfMonth(now).getTime() && to.getTime() === endOfMonth(now).getTime()) return 'month';
    if (from.getTime() === startOfQuarter(now).getTime() && to.getTime() === endOfQuarter(now).getTime()) return 'quarter';
    if (from.getTime() === startOfYear(now).getTime() && to.getTime() === endOfYear(now).getTime()) return 'year';
    return 'custom';
  });

  const updateURL = (newDate: DateRange | undefined) => {
    const params = new URLSearchParams(searchParams);
    if (newDate?.from) {
      params.set('from', format(newDate.from, 'yyyy-MM-dd'));
    } else {
      params.delete('from');
    }
    if (newDate?.to) {
      params.set('to', format(newDate.to, 'yyyy-MM-dd'));
    } else {
      params.delete('to');
    }
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  useEffect(() => {
    updateURL(date);
  }, [date]);

  const handlePresetClick = (preset: string) => {
    setActivePreset(preset);
    const now = new Date();
    let newDate: DateRange | undefined;
    
    switch(preset) {
      case 'month':
        newDate = { from: startOfMonth(now), to: endOfMonth(now) };
        break;
      case 'quarter':
        newDate = { from: startOfQuarter(now), to: endOfQuarter(now) };
        break;
      case 'year':
        newDate = { from: startOfYear(now), to: endOfYear(now) };
        break;
      case 'custom':
        return;
    }
    
    if (newDate?.from) newDate.from.setHours(0,0,0,0);
    if (newDate?.to) newDate.to.setHours(23,59,59,999);
    setDate(newDate);
  };

  const handleDateChange = (newDate: DateRange | undefined) => {
    if (newDate?.from) newDate.from.setHours(0,0,0,0);
    if (newDate?.to) newDate.to.setHours(23,59,59,999);
    setDate(newDate);
    setActivePreset('custom');
  };

  const translations = {
    month: isFrench ? 'Mois' : 'Month',
    quarter: isFrench ? 'Trimestre' : 'Quarter', 
    year: isFrench ? 'Année' : 'Year',
    custom: isFrench ? 'Personnalisée' : 'Custom',
  };

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-6 print:hidden">
      {/* Period Pills */}
      <div className="flex gap-2">
        {Object.entries(translations).map(([key, label]) => (
          <Button
            key={key}
            variant={activePreset === key ? 'default' : 'outline'}
            size="sm"
            onClick={() => handlePresetClick(key)}
            className="text-sm"
          >
            {label}
          </Button>
        ))}
      </div>

      {/* Date Range Display */}
      <div className="flex items-center gap-4">
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              {date?.from && date?.to ? (
                <>
                  {format(date.from, 'd MMM yyyy', { locale })} 
                  {' → '}
                  {format(date.to, 'd MMM yyyy', { locale })}
                </>
              ) : (
                <span>{isFrench ? 'Sélectionner les dates' : 'Select dates'}</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <CalendarComponent
              initialFocus
              mode="range"
              defaultMonth={date?.from}
              selected={date}
              onSelect={handleDateChange}
              numberOfMonths={2}
            />
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}