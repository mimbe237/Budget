'use client';

import * as React from 'react';
import { CalendarIcon } from 'lucide-react';
import { format, startOfYear, endOfYear, startOfMonth, endOfMonth, startOfQuarter, endOfQuarter } from 'date-fns';
import { DateRange } from 'react-day-picker';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { useUser } from '@/firebase';

export function DateRangePicker({
  className,
}: React.HTMLAttributes<HTMLDivElement>) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { userProfile } = useUser();
  const isFrench = userProfile?.locale === 'fr-CM';

  const fromParam = searchParams?.get('from') ?? null;
  const toParam = searchParams?.get('to') ?? null;
  
  const [date, setDate] = React.useState<DateRange | undefined>(() => {
    const from = fromParam ? new Date(fromParam) : startOfMonth(new Date());
    const to = toParam ? new Date(toParam) : endOfMonth(new Date());
    from.setHours(0, 0, 0, 0);
    to.setHours(23, 59, 59, 999);
    return { from, to };
  });
  
  const [preset, setPreset] = React.useState<string>(() => {
    const now = new Date();
    const from = date?.from;
    const to = date?.to;

    if (!from || !to) return 'custom';

    if (from.getTime() === startOfMonth(now).getTime() && to.getTime() === endOfMonth(now).getTime()) return 'this-month';
    if (from.getTime() === startOfQuarter(now).getTime() && to.getTime() === endOfQuarter(now).getTime()) return 'this-quarter';
    if (from.getTime() === startOfYear(now).getTime() && to.getTime() === endOfYear(now).getTime()) return 'this-year';
    return 'custom';
  });


  const updateURL = React.useCallback((newDate: DateRange | undefined) => {
    const params = new URLSearchParams(searchParams ?? undefined);
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
  }, [searchParams, router, pathname]);

  React.useEffect(() => {
    updateURL(date);
  }, [date, updateURL]);

  const handlePresetChange = (value: string) => {
      setPreset(value);
      const now = new Date();
      let newDate: DateRange | undefined;
      switch(value) {
          case 'this-month':
              newDate = { from: startOfMonth(now), to: endOfMonth(now) };
              break;
          case 'this-quarter':
              newDate = { from: startOfQuarter(now), to: endOfQuarter(now) };
              break;
          case 'this-year':
              newDate = { from: startOfYear(now), to: endOfYear(now) };
              break;
          case 'custom':
              // Do nothing, user will pick dates
              return;
          default:
            return;
      }
      if (newDate?.from) {
        newDate.from.setHours(0,0,0,0);
      }
      if (newDate?.to) {
        newDate.to.setHours(23,59,59,999);
      }
      setDate(newDate);
  }

  const handleDateChange = (newDate: DateRange | undefined) => {
    if (newDate?.from) newDate.from.setHours(0,0,0,0);
    if (newDate?.to) newDate.to.setHours(23,59,59,999);
    setDate(newDate);
    setPreset('custom');
  }

  const translations = {
    selectPeriod: isFrench ? 'Sélectionner une période' : 'Select a period',
    thisMonth: isFrench ? 'Ce mois-ci' : 'This month',
    thisQuarter: isFrench ? 'Ce trimestre' : 'This quarter',
    thisYear: isFrench ? 'Cette année' : 'This year',
    custom: isFrench ? 'Personnalisé' : 'Custom',
    pickDate: isFrench ? 'Choisir une date' : 'Pick a date',
  }

  return (
    <div className={cn('grid gap-2', className)}>
      <div className="flex items-center gap-2 flex-wrap">
        <Select onValueChange={handlePresetChange} value={preset}>
            <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder={translations.selectPeriod} />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="this-month">{translations.thisMonth}</SelectItem>
                <SelectItem value="this-quarter">{translations.thisQuarter}</SelectItem>
                <SelectItem value="this-year">{translations.thisYear}</SelectItem>
                <SelectItem value="custom">{translations.custom}</SelectItem>
            </SelectContent>
        </Select>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              id="date"
              variant={'outline'}
              className={cn(
                'w-full sm:w-[300px] justify-start text-left font-normal',
                !date && 'text-muted-foreground'
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {date?.from ? (
                date.to ? (
                  <>
                    {format(date.from, 'LLL dd, y')} -{' '}
                    {format(date.to, 'LLL dd, y')}
                  </>
                ) : (
                  format(date.from, 'LLL dd, y')
                )
              ) : (
                <span>{translations.pickDate}</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="end">
            <Calendar
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
