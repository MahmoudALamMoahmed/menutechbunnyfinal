import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

/** إبطال كاش كل بيانات القائمة (admin + public). */
export function useInvalidateMenu(restaurantId: string | undefined) {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: ['admin_categories', restaurantId] });
    qc.invalidateQueries({ queryKey: ['admin_menu_items', restaurantId] });
    qc.invalidateQueries({ queryKey: ['admin_sizes', restaurantId] });
    qc.invalidateQueries({ queryKey: ['admin_extras', restaurantId] });
    qc.invalidateQueries({ queryKey: ['categories', restaurantId] });
    qc.invalidateQueries({ queryKey: ['menu_items', restaurantId] });
    qc.invalidateQueries({ queryKey: ['sizes', restaurantId] });
    qc.invalidateQueries({ queryKey: ['extras', restaurantId] });
  };
}

/** إبطال كاش الفروع ومناطق التوصيل (admin + public). */
export function useInvalidateBranches(restaurantId: string | undefined) {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: ['admin_branches', restaurantId] });
    qc.invalidateQueries({ queryKey: ['admin_delivery_areas'] });
    qc.invalidateQueries({ queryKey: ['branches', restaurantId] });
    qc.invalidateQueries({ queryKey: ['delivery_areas'] });
  };
}

/** يحدّد إذا كان الخطأ ناتج عن تجاوز حد الباقة (Trigger). */
export function isLimitError(error: any): boolean {
  const msg = error?.message ?? '';
  return msg.includes('limit reached') || msg.includes('LIMIT');
}

/**
 * Generic mutation لإعادة ترتيب صفوف جدول عبر RPC `batch_update_display_order`،
 * مع optimistic rollback وإبطال للـ admin/public caches.
 */
export function useReorderMutation(
  tableName: string,
  cacheKeys: { admin: readonly unknown[]; public: readonly unknown[] },
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (updates: { id: string; display_order: number }[]) => {
      const { error } = await supabase.rpc('batch_update_display_order', {
        p_table_name: tableName,
        p_items: updates as any,
      });
      if (error) throw error;
    },
    onMutate: async () => {
      const prev = qc.getQueryData(cacheKeys.admin as unknown[]);
      return { prev };
    },
    onError: (_, __, context) => {
      if (context?.prev) qc.setQueryData(cacheKeys.admin as unknown[], context.prev);
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: cacheKeys.admin as unknown[] });
      qc.invalidateQueries({ queryKey: cacheKeys.public as unknown[] });
    },
  });
}
