import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Search } from 'lucide-react';

interface OrderFiltersProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  timeFilter: number | null;
  onTimeFilterChange: (hours: number | null) => void;
  statusFilter: string | null;
  onStatusFilterChange: (status: string | null) => void;
  totalCount: number;
  filteredCount: number;
}

const TIME_OPTIONS: { label: string; value: number | null }[] = [
  { label: 'الكل', value: null },
  { label: 'ساعة', value: 1 },
  { label: 'ساعتين', value: 2 },
  { label: '3 ساعات', value: 3 },
  { label: '4 ساعات', value: 4 },
  { label: '5 ساعات', value: 5 },
  { label: '6 ساعات', value: 6 },
  { label: '7 ساعات', value: 7 },
  { label: '8 ساعات', value: 8 },
];

const STATUS_OPTIONS: { label: string; value: string | null; color: string; activeColor: string }[] = [
  { label: 'الكل', value: null, color: '', activeColor: 'bg-primary text-primary-foreground' },
  { label: 'في الانتظار', value: 'pending', color: 'border-yellow-200 text-yellow-800', activeColor: 'bg-yellow-500 text-white border-yellow-500' },
  { label: 'مؤكد', value: 'confirmed', color: 'border-blue-200 text-blue-800', activeColor: 'bg-blue-500 text-white border-blue-500' },
  { label: 'قيد التحضير', value: 'preparing', color: 'border-purple-200 text-purple-800', activeColor: 'bg-purple-500 text-white border-purple-500' },
  { label: 'جاهز', value: 'ready', color: 'border-green-200 text-green-800', activeColor: 'bg-green-500 text-white border-green-500' },
  { label: 'تم التسليم', value: 'delivered', color: 'border-gray-200 text-gray-800', activeColor: 'bg-gray-500 text-white border-gray-500' },
  { label: 'ملغي', value: 'cancelled', color: 'border-red-200 text-red-800', activeColor: 'bg-red-500 text-white border-red-500' },
];

export default function OrderFilters({
  searchQuery, onSearchChange,
  timeFilter, onTimeFilterChange,
  statusFilter, onStatusFilterChange,
  totalCount, filteredCount,
}: OrderFiltersProps) {
  return (
    <Card className="mb-6">
      <CardContent className="p-4 space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="بحث بكود الطلب أو اسم العميل أو رقم الهاتف..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pr-10"
          />
        </div>

        {/* Time Filter */}
        <div className="space-y-2">
          <span className="text-sm font-medium text-muted-foreground">الوقت:</span>
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {TIME_OPTIONS.map((opt) => (
              <Button
                key={opt.label}
                size="sm"
                variant={timeFilter === opt.value ? 'default' : 'outline'}
                onClick={() => onTimeFilterChange(opt.value)}
                className="shrink-0 text-xs"
              >
                {opt.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Status Filter */}
        <div className="space-y-2">
          <span className="text-sm font-medium text-muted-foreground">الحالة:</span>
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {STATUS_OPTIONS.map((opt) => {
              const isActive = statusFilter === opt.value;
              return (
                <button
                  key={opt.label}
                  onClick={() => onStatusFilterChange(opt.value)}
                  className={`shrink-0 inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold transition-colors cursor-pointer ${
                    isActive ? opt.activeColor : `bg-background ${opt.color || 'border-border text-foreground'} hover:opacity-80`
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Results Count */}
        <div className="text-sm text-muted-foreground">
          عرض {filteredCount} من {totalCount} طلب
        </div>
      </CardContent>
    </Card>
  );
}
