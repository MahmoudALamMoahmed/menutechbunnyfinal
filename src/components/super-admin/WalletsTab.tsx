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
import { useAllWallets, useAllWalletTransactions } from '@/hooks/useSuperAdminData';
import { useAdjustWalletBalance } from '@/hooks/useSuperAdminMutations';
import { usePagination } from '@/hooks/usePagination';
import PaginationControls from './PaginationControls';
import { Plus, Minus } from 'lucide-react';

const statusLabel: Record<string, string> = {
  success: 'ناجحة',
  pending: 'قيد الانتظار',
  failed: 'فاشلة',
  expired: 'منتهية',
};

const statusVariant = (s: string) => {
  if (s === 'success') return 'default' as const;
  if (s === 'pending') return 'secondary' as const;
  return 'destructive' as const;
};

export default function WalletsTab() {
  const { data: wallets, isLoading } = useAllWallets();
  const { data: transactions } = useAllWalletTransactions();
  const adjustBalance = useAdjustWalletBalance();

  const walletsPagination = usePagination(wallets || []);
  const transactionsPagination = usePagination(transactions || []);

  const [adjustDialog, setAdjustDialog] = useState<{
    open: boolean;
    walletId: string;
    restaurantName: string;
    type: 'add' | 'subtract';
  }>({ open: false, walletId: '', restaurantName: '', type: 'add' });
  const [adjustAmount, setAdjustAmount] = useState('');

  const handleAdjust = () => {
    const amount = parseFloat(adjustAmount);
    if (!amount || amount <= 0) return;
    adjustBalance.mutate(
      { walletId: adjustDialog.walletId, amount, type: adjustDialog.type },
      { onSuccess: () => { setAdjustDialog((d) => ({ ...d, open: false })); setAdjustAmount(''); } }
    );
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="text-right">
          <CardTitle>أرصدة المحافظ ({wallets?.length || 0})</CardTitle>
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
                      <TableHead>الرصيد</TableHead>
                      <TableHead>آخر تحديث</TableHead>
                      <TableHead>إجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {walletsPagination.paginatedData.map((w) => (
                      <TableRow key={w.id}>
                        <TableCell className="font-medium">
                          {w.restaurant_name || 'غير مرتبط'}
                        </TableCell>
                        <TableCell className="font-bold">{Number(w.balance).toLocaleString('ar-EG')} ج.م</TableCell>
                        <TableCell className="text-muted-foreground">
                          {new Date(w.updated_at).toLocaleDateString('ar-EG')}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setAdjustDialog({ open: true, walletId: w.id, restaurantName: w.restaurant_name || '', type: 'add' })}
                            >
                              <Plus className="w-3 h-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setAdjustDialog({ open: true, walletId: w.id, restaurantName: w.restaurant_name || '', type: 'subtract' })}
                            >
                              <Minus className="w-3 h-3" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <PaginationControls
                currentPage={walletsPagination.currentPage}
                totalPages={walletsPagination.totalPages}
                totalItems={walletsPagination.totalItems}
                pageSize={walletsPagination.pageSize}
                onPageChange={walletsPagination.setPage}
                onPageSizeChange={walletsPagination.setPageSize}
              />
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="text-right">
          <CardTitle>آخر المعاملات</CardTitle>
        </CardHeader>
        <CardContent>
          <>
            <div className="overflow-auto" dir="rtl">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>المطعم</TableHead>
                    <TableHead>المبلغ</TableHead>
                    <TableHead>الحالة</TableHead>
                    <TableHead>طريقة الدفع</TableHead>
                    <TableHead>التاريخ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactionsPagination.paginatedData.map((t: any) => (
                    <TableRow key={t.id}>
                      <TableCell className="font-medium">{t.restaurant_name || '—'}</TableCell>
                      <TableCell className="font-bold">{Number(t.amount).toLocaleString('ar-EG')} ج.م</TableCell>
                      <TableCell>
                        <Badge variant={statusVariant(t.status)}>
                          {statusLabel[t.status] || t.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{t.payment_method || '—'}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(t.created_at).toLocaleDateString('ar-EG')}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <PaginationControls
              currentPage={transactionsPagination.currentPage}
              totalPages={transactionsPagination.totalPages}
              totalItems={transactionsPagination.totalItems}
              pageSize={transactionsPagination.pageSize}
              onPageChange={transactionsPagination.setPage}
              onPageSizeChange={transactionsPagination.setPageSize}
            />
          </>
        </CardContent>
      </Card>

      <Dialog open={adjustDialog.open} onOpenChange={(open) => setAdjustDialog((d) => ({ ...d, open }))}>
        <DialogContent dir="rtl">
          <DialogHeader>
            <DialogTitle>
              {adjustDialog.type === 'add' ? 'إضافة رصيد' : 'خصم رصيد'} — {adjustDialog.restaurantName}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Input
              type="number"
              placeholder="المبلغ بالجنيه"
              value={adjustAmount}
              onChange={(e) => setAdjustAmount(e.target.value)}
              className="text-right"
              min="0"
            />
          </div>
          <DialogFooter>
            <Button onClick={handleAdjust} disabled={adjustBalance.isPending || !adjustAmount}>
              {adjustBalance.isPending ? 'جارٍ التنفيذ...' : 'تأكيد'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
