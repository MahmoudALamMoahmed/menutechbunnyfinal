import { Card, CardContent } from '@/components/ui/card';
import {
  useAllRestaurants, useAllSubscriptions, useAllWallets, useOrdersStats,
} from '@/hooks/useSuperAdminData';

// تبويب نظرة عامة — إحصائيات سريعة للمنصة
export default function OverviewTab() {
  const { data: restaurants } = useAllRestaurants();
  const { data: subscriptions } = useAllSubscriptions();
  const { data: wallets } = useAllWallets();
  const { data: ordersStats } = useOrdersStats();

  // حساب الاشتراكات النشطة والمنتهية
  const activeSubscriptions = subscriptions?.filter(
    (s) => s.status === 'active' && new Date(s.expires_at) > new Date()
  ).length || 0;
  const expiredSubscriptions = (subscriptions?.length || 0) - activeSubscriptions;

  // إجمالي أرصدة المحافظ
  const totalWalletBalance = wallets?.reduce((sum, w) => sum + Number(w.balance), 0) || 0;

  const cards = [
    { label: 'إجمالي المطاعم', value: restaurants?.length || 0, color: 'text-primary' },
    { label: 'طلبات اليوم', value: ordersStats?.todayOrders || 0, color: 'text-blue-600' },
    { label: 'طلبات الشهر', value: ordersStats?.monthOrders || 0, color: 'text-emerald-600' },
    { label: 'اشتراكات نشطة', value: activeSubscriptions, color: 'text-emerald-600' },
    { label: 'اشتراكات منتهية', value: expiredSubscriptions, color: 'text-destructive' },
    { label: 'إجمالي أرصدة المحافظ', value: `${totalWalletBalance.toLocaleString('ar-EG')} ج.م`, color: 'text-primary' },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      {cards.map((c) => (
        <Card key={c.label}>
          <CardContent className="p-4 text-right">
            <p className="text-sm text-muted-foreground">{c.label}</p>
            <p className={`text-2xl font-bold mt-1 ${c.color}`}>{c.value}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
