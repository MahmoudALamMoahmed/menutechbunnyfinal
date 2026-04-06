import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Search } from 'lucide-react';
import { useAllRestaurants, useAllSubscriptions } from '@/hooks/useSuperAdminData';
import { usePagination } from '@/hooks/usePagination';
import PaginationControls from './PaginationControls';
import type { Tables } from '@/integrations/supabase/types';

type SubscriptionWithJoins = Tables<'subscriptions'> & {
  plans: { name: string; name_ar: string; price_monthly: number } | null;
  restaurants: { name: string; username: string } | null;
};

export default function RestaurantsTab() {
  const { data: restaurants, isLoading } = useAllRestaurants();
  const { data: subscriptions } = useAllSubscriptions();
  const [search, setSearch] = useState('');

  const subMap = new Map(
    (subscriptions as SubscriptionWithJoins[] || []).map((s) => [s.restaurant_id, s])
  );

  const filtered = (restaurants || []).filter(
    (r) =>
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.username.toLowerCase().includes(search.toLowerCase())
  );

  const { paginatedData, currentPage, totalPages, totalItems, pageSize, setPage, setPageSize, reset } = usePagination(filtered);

  // Reset to page 1 when search changes
  useEffect(() => { reset(); }, [search, reset]);

  return (
    <Card>
      <CardHeader className="text-right">
        <CardTitle>إدارة المطاعم ({restaurants?.length || 0})</CardTitle>
        <div className="relative mt-2">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="بحث بالاسم أو اسم المستخدم..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="ps-10 text-right"
          />
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-center text-muted-foreground py-8">جارٍ التحميل...</p>
        ) : (
          <>
            <div className="overflow-auto" dir="rtl">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>الاسم</TableHead>
                    <TableHead>اسم المستخدم</TableHead>
                    <TableHead>الباقة</TableHead>
                    <TableHead>حالة الاشتراك</TableHead>
                    <TableHead>تاريخ التسجيل</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedData.map((r) => {
                    const sub = subMap.get(r.id) as SubscriptionWithJoins | undefined;
                    const isActive = sub && sub.status === 'active' && new Date(sub.expires_at) > new Date();
                    return (
                      <TableRow key={r.id}>
                        <TableCell className="font-medium">{r.name}</TableCell>
                        <TableCell className="text-muted-foreground">@{r.username}</TableCell>
                        <TableCell>{sub?.plans?.name_ar || 'مجانية'}</TableCell>
                        <TableCell>
                          <Badge variant={isActive ? 'default' : 'secondary'}>
                            {isActive ? 'نشط' : sub ? 'منتهي' : 'مجاني'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {new Date(r.created_at).toLocaleDateString('ar-EG')}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
            <PaginationControls
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={totalItems}
              pageSize={pageSize}
              onPageChange={setPage}
              onPageSizeChange={setPageSize}
            />
          </>
        )}
      </CardContent>
    </Card>
  );
}
