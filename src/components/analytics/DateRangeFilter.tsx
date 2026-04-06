import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { DatePreset, AnalyticsFilters } from '@/hooks/useAnalyticsData';

interface Props {
  filters: AnalyticsFilters;
  onFiltersChange: (f: AnalyticsFilters) => void;
  branches?: { id: string; name: string }[];
}

const presets: { value: DatePreset; label: string }[] = [
  { value: 'today', label: 'اليوم' },
  { value: '7days', label: 'آخر 7 أيام' },
  { value: '30days', label: 'آخر 30 يوم' },
  { value: '3months', label: 'آخر 3 شهور' },
  { value: 'all', label: 'كل الوقت' },
];

export default function DateRangeFilter({ filters, onFiltersChange, branches }: Props) {
  const isCustom = !!(filters.customFrom && filters.customTo);

  return (
    <div className="flex flex-wrap items-center gap-2">
      {presets.map(p => (
        <Button
          key={p.value}
          variant={!isCustom && filters.preset === p.value ? 'default' : 'outline'}
          size="sm"
          onClick={() => onFiltersChange({ ...filters, preset: p.value, customFrom: undefined, customTo: undefined })}
        >
          {p.label}
        </Button>
      ))}

      {/* Custom date range */}
      <Popover>
        <PopoverTrigger asChild>
          <Button variant={isCustom ? 'default' : 'outline'} size="sm" className="gap-1">
            <CalendarIcon className="w-4 h-4" />
            {isCustom
              ? `${format(filters.customFrom!, 'dd/MM', { locale: ar })} - ${format(filters.customTo!, 'dd/MM', { locale: ar })}`
              : 'فترة مخصصة'}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="range"
            selected={filters.customFrom && filters.customTo ? { from: filters.customFrom, to: filters.customTo } : undefined}
            onSelect={(range) => {
              if (range?.from && range?.to) {
                onFiltersChange({ ...filters, customFrom: range.from, customTo: range.to });
              }
            }}
            numberOfMonths={2}
            className={cn("p-3 pointer-events-auto")}
          />
        </PopoverContent>
      </Popover>

      {/* Branch filter */}
      {branches && branches.length > 1 && (
        <Select
          value={filters.branchId || 'all'}
          onValueChange={(v) => onFiltersChange({ ...filters, branchId: v === 'all' ? null : v })}
        >
          <SelectTrigger className="w-[160px] h-9">
            <SelectValue placeholder="كل الفروع" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">كل الفروع</SelectItem>
            {branches.map(b => (
              <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </div>
  );
}
