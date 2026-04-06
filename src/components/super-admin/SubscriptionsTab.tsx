import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { useAllSubscriptions } from '@/hooks/useSuperAdminData';
import { useExtendSubscription } from '@/hooks/useSuperAdminMutations';
import { usePagination } from '@/hooks/usePagination';
import PaginationControls from './PaginationControls';
import { CalendarPlus } from 'lucide-react';
import type { Tables } from '@/integrations/supabase/types';

type SubscriptionWithJoins = Tables<'subscriptions'> & {
  plans: { name: string; name_ar: string; price_monthly: number } | null;
  restaurants: { name: string; username: string } | null;
};

export default function SubscriptionsTab() {
  const { data: rawSubscriptions, isLoading } = useAllSubscriptions();
  const subscriptions = rawSubscriptions as SubscriptionWithJoins[] | undefined;
  const extendSub = useExtendSubscription();

  const { paginatedData, currentPage, totalPages, totalItems, pageSize, setPage, setPageSize } = usePagination(subscriptions || []);

  const [extendDialog, setExtendDialog] = useState<{
    open: boolean;
    subscriptionId: string;
    restaurantName: string;
  }>({ open: false, subscriptionId: '', restaurantName: '' });
  const [extendDays, setExtendDays] = useState('30');

  const handleExtend = () => {
    const days = parseInt(extendDays);
    if (!days || days <= 0) return;
    extendSub.mutate(
      { subscriptionId: extendDialog.subscriptionId, days },
      { onSuccess: () => { setExtendDialog((d) => ({ ...d, open: false })); setExtendDays('30'); } }
    );
  };

  return (
    <>
      <Card>
        <CardHeader className="text-right">
          <CardTitle>إدارة الاشتراكات ({subscriptions?.length || 0})</CardTitle>
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
                      <TableHead>المطعم</TableHead>
                      <TableHead>الباقة</TableHead>
                      <TableHead>السعر</TableHead>
                      <TableHead>الحالة</TableHead>
                      <TableHead>تاريخ الانتهاء</TableHead>
                      <TableHead>تجديد تلقائي</TableHead>
                      <TableHead>إجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedData.map((s) => {
                      const isActive = s.status === 'active' && new Date(s.expires_at) > new Date();
                      return (
                        <TableRow key={s.id}>
                          <TableCell className="font-medium">{s.restaurants?.name || '—'}</TableCell>
                          <TableCell>{s.plans?.name_ar || '—'}</TableCell>
                          <TableCell>{s.plans?.price_monthly || 0} ج.م</TableCell>
                          <TableCell>
                            <Badge variant={isActive ? 'default' : 'destructive'}>
                              {isActive ? 'نشط' : 'منتهي'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {new Date(s.expires_at).toLocaleDateString('ar-EG')}
                          </TableCell>
                          <TableCell>
                            <Badge variant={s.auto_renew ? 'default' : 'secondary'}>
                              {s.auto_renew ? 'نعم' : 'لا'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setExtendDialog({
                                open: true,
                                subscriptionId: s.id,
                                restaurantName: s.restaurants?.name || '',
                              })}
                            >
                              <CalendarPlus className="w-3 h-3 me-1" />
                              تمديد
                            </Button>
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

      <Dialog open={extendDialog.open} onOpenChange={(open) => setExtendDialog((d) => ({ ...d, open }))}>
        <DialogContent dir="rtl">
          <DialogHeader>
            <DialogTitle>تمديد اشتراك — {extendDialog.restaurantName}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Input
              type="number"
              placeholder="عدد الأيام"
              value={extendDays}
              onChange={(e) => setExtendDays(e.target.value)}
              className="text-right"
              min="1"
            />
            <p className="text-sm text-muted-foreground">سيتم إضافة الأيام لتاريخ الانتهاء الحالي</p>
          </div>
          <DialogFooter>
            <Button onClick={handleExtend} disabled={extendSub.isPending || !extendDays}>
              {extendSub.isPending ? 'جارٍ التنفيذ...' : 'تمديد'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
