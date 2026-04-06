import { Card, CardContent } from '@/components/ui/card';
import { ShoppingBag, DollarSign, TrendingUp, XCircle, CheckCircle } from 'lucide-react';

interface Props {
  kpis: {
    totalOrders: number;
    totalRevenue: number;
    avgOrderValue: number;
    deliveredCount: number;
    cancelledCount: number;
    cancellationRate: number;
  };
}

export default function AnalyticsKPIs({ kpis }: Props) {
  const cards = [
    { label: 'إجمالي الطلبات', value: kpis.totalOrders.toLocaleString('ar-EG'), icon: ShoppingBag, color: 'text-primary' },
    { label: 'إجمالي الإيرادات', value: `${kpis.totalRevenue.toLocaleString('ar-EG')} ج.م`, icon: DollarSign, color: 'text-emerald-600' },
    { label: 'متوسط قيمة الطلب', value: `${kpis.avgOrderValue.toFixed(1)} ج.م`, icon: TrendingUp, color: 'text-blue-600' },
    { label: 'تم التسليم', value: kpis.deliveredCount.toLocaleString('ar-EG'), icon: CheckCircle, color: 'text-emerald-600' },
    { label: 'ملغاة', value: `${kpis.cancelledCount} (${kpis.cancellationRate.toFixed(1)}%)`, icon: XCircle, color: 'text-destructive' },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
      {cards.map((c) => (
        <Card key={c.label}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg bg-muted ${c.color}`}>
                <c.icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{c.label}</p>
                <p className="text-lg font-bold">{c.value}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
