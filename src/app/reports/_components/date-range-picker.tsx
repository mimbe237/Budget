
'use client';

import * as React from 'react';
import { CalendarIcon } from 'lucide-react';
import { addDays, format, startOfYear, endOfYear, startOfMonth, endOfMonth, startOfQuarter, endOfQuarter } from 'date-fns';
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

export function DateRangePicker({
  className,
}: React.HTMLAttributes<HTMLDivElement>) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const fromParam = searchParams.get('from');
  const toParam = searchParams.get('to');
  
  const [date, setDate] = React.useState<DateRange | undefined>({
    from: fromParam ? new Date(fromParam) : startOfMonth(new Date()),
    to: toParam ? new Date(toParam) : endOfMonth(new Date()),
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
  }

  React.useEffect(() => {
    updateURL(date);
  }, [date, router, pathname]);

  const handlePresetChange = (value: string) => {
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
      }
      if (newDate) {
          setDate(newDate);
      }
  }

  return (
    <div className={cn('grid gap-2', className)}>
      <div className="flex items-center gap-2">
        <Select onValueChange={handlePresetChange} defaultValue="this-month">
            <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Sélectionner une période" />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="this-month">Mois en cours</SelectItem>
                <SelectItem value="this-quarter">Ce trimestre</SelectItem>
                <SelectItem value="this-year">Cette année</SelectItem>
            </SelectContent>
        </Select>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              id="date"
              variant={'outline'}
              className={cn(
                'w-[300px] justify-start text-left font-normal',
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
                <span>Pick a date</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="end">
            <Calendar
              initialFocus
              mode="range"
              defaultMonth={date?.from}
              selected={date}
              onSelect={setDate}
              numberOfMonths={2}
            />
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}

