import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { TablesUpdate } from '@/integrations/supabase/types';
import { useToast } from '@/hooks/use-toast';

/**
 * تحديث حالة طلب. لو `isBranch` صحيح، الـ id الممرّر هو branchId
 * ويُبطل cache طلبات الفرع، وإلا فهو restaurantId ويُبطل cache المطعم.
 */
export function useUpdateOrderStatus(restaurantOrBranchId: string | undefined, isBranch = false) {
  const { toast } = useToast();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ orderId, status, isConfirmed }: { orderId: string; status: string; isConfirmed?: boolean }) => {
      const updateData: TablesUpdate<'orders'> = { status, updated_at: new Date().toISOString() };
      if (isConfirmed !== undefined) updateData.is_confirmed = isConfirmed;
      const { error } = await supabase.from('orders').update(updateData).eq('id', orderId);
      if (error) throw error;
      return updateData;
    },
    onSuccess: () => {
      toast({ title: 'تم التحديث', description: 'تم تحديث حالة الطلب بنجاح' });
      if (isBranch) {
        qc.invalidateQueries({ queryKey: ['branch_orders', restaurantOrBranchId] });
        qc.invalidateQueries({ queryKey: ['pending_orders_count', 'branch_id', restaurantOrBranchId] });
      } else {
        qc.invalidateQueries({ queryKey: ['admin_orders', restaurantOrBranchId] });
        qc.invalidateQueries({ queryKey: ['pending_orders_count', 'restaurant_id', restaurantOrBranchId] });
      }
    },
    onError: () => {
      toast({ title: 'خطأ', description: 'حدث خطأ في تحديث الطلب', variant: 'destructive' });
    },
  });
}
