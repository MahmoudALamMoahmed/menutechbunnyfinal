import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { useOrdersStats, useRecentOrders } from '@/hooks/useSuperAdminData';
import PaginationControls from './PaginationControls';

const orderStatusLabel: Record<string, string> = {
  pending: 'قيد الانتظار',
  preparing: 'قيد التحضير',
  ready: 'جاهز',
  delivered: 'تم التوصيل',
  cancelled: 'ملغي',
};

const orderStatusVariant = (s: string) => {
  if (s === 'delivered') return 'default' as const;
  if (s === 'cancelled') return 'destructive' as const;
  if (s === 'pending') return 'secondary' as const;
  return 'outline' as const;
};

export default function OrdersTab() {
  const { data: ordersStats, isLoading: statsLoading } = useOrdersStats();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const { data: ordersResult, isLoading: ordersLoading } = useRecentOrders(pageSize, page);

  const recentOrders = ordersResult?.data ?? [];
  const totalCount = ordersResult?.totalCount ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setPage(1);
  };

  const statCards = [
    { label: 'إجمالي الطلبات', value: ordersStats?.totalOrders || 0 },
    { label: 'طلبات اليوم', value: ordersStats?.todayOrders || 0 },
    { label: 'طلبات الشهر', value: ordersStats?.monthOrders || 0 },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {statCards.map((c) => (
          <Card key={c.label}>
            <CardContent className="p-4 text-center">
              <p className="text-sm text-muted-foreground">{c.label}</p>
              <p className="text-3xl font-bold mt-1 text-primary">
                {statsLoading ? '...' : c.value.toLocaleString('ar-EG')}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="text-right">
          <CardTitle>آخر الطلبات</CardTitle>
        </CardHeader>
        <CardContent>
          {ordersLoading ? (
            <p className="text-center text-muted-foreground py-8">جارٍ التحميل...</p>
          ) : (
            <>
              <div className="overflow-auto" dir="rtl">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>المطعم</TableHead>
                      <TableHead>العميل</TableHead>
                      <TableHead>المبلغ</TableHead>
                      <TableHead>الحالة</TableHead>
                      <TableHead>المصدر</TableHead>
                      <TableHead>التاريخ</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentOrders.map((o) => {
                      const restaurant = o.restaurants as { name: string } | null;
                      return (
                        <TableRow key={o.id}>
                          <TableCell className="font-medium">{restaurant?.name || '—'}</TableCell>
                          <TableCell>{o.customer_name}</TableCell>
                          <TableCell className="font-bold">{Number(o.total_price).toLocaleString('ar-EG')} ج.م</TableCell>
                          <TableCell>
                            <Badge variant={orderStatusVariant(o.status || 'pending')}>
                              {orderStatusLabel[o.status || 'pending'] || o.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {o.order_source === 'whatsapp' ? 'واتساب' : 'لوحة التحكم'}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {new Date(o.created_at).toLocaleDateString('ar-EG')}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
              <PaginationControls
                currentPage={page}
                totalPages={totalPages}
                totalItems={totalCount}
                pageSize={pageSize}
                onPageChange={setPage}
                onPageSizeChange={handlePageSizeChange}
              />
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
