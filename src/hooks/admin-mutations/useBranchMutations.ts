import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useInvalidateBranches, isLimitError, useReorderMutation } from './_shared';

// ─── Interfaces ─────────────────────────────────────────────

export interface SaveBranchData {
  id?: string;
  name: string;
  address?: string;
  phone?: string;
  whatsapp_phone?: string;
  delivery_phone?: string;
  working_hours?: string;
  is_active?: boolean;
  order_mode?: string;
  restaurant_id: string;
  display_order?: number;
}

export interface SaveAreaData {
  id?: string;
  branch_id: string;
  name: string;
  delivery_price: number;
  display_order?: number;
}

// ─── Branch Mutations ───────────────────────────────────────

/** حفظ/تحديث فرع. */
export function useSaveBranch(restaurantId: string | undefined) {
  const { toast } = useToast();
  const invalidate = useInvalidateBranches(restaurantId);

  return useMutation({
    mutationFn: async (data: SaveBranchData) => {
      const { id, ...branchData } = data;
      if (id) {
        const { error } = await supabase.from('branches').update(branchData).eq('id', id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('branches').insert([branchData]);
        if (error) throw error;
      }
    },
    onSuccess: (_, vars) => {
      toast({ title: vars.id ? 'تم التحديث' : 'تم الإضافة', description: vars.id ? 'تم تحديث بيانات الفرع بنجاح' : 'تم إضافة الفرع بنجاح' });
      invalidate();
    },
    onError: (error: any) => {
      if (isLimitError(error)) {
        toast({ title: 'وصلت للحد الأقصى', description: 'قم بترقية باقتك لإضافة المزيد من الفروع', variant: 'destructive' });
      } else {
        toast({ title: 'خطأ', description: 'حدث خطأ أثناء حفظ البيانات', variant: 'destructive' });
      }
    },
  });
}

/** حذف فرع. */
export function useDeleteBranch(restaurantId: string | undefined) {
  const { toast } = useToast();
  const invalidate = useInvalidateBranches(restaurantId);

  return useMutation({
    mutationFn: async (branchId: string) => {
      const { error } = await supabase.from('branches').delete().eq('id', branchId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: 'تم الحذف', description: 'تم حذف الفرع بنجاح' });
      invalidate();
    },
    onError: () => {
      toast({ title: 'خطأ', description: 'حدث خطأ أثناء حذف الفرع', variant: 'destructive' });
    },
  });
}

/** تفعيل/إيقاف فرع. */
export function useToggleBranchActive(restaurantId: string | undefined) {
  const invalidate = useInvalidateBranches(restaurantId);

  return useMutation({
    mutationFn: async ({ branchId, isActive }: { branchId: string; isActive: boolean }) => {
      const { error } = await supabase.from('branches').update({ is_active: isActive }).eq('id', branchId);
      if (error) throw error;
    },
    onSuccess: () => { invalidate(); },
    onError: (error) => { console.error('Error toggling branch status:', error); },
  });
}

/** إعادة ترتيب الفروع (batch). */
export function useReorderBranches(restaurantId: string | undefined) {
  return useReorderMutation('branches', {
    admin: ['admin_branches', restaurantId!],
    public: ['branches', restaurantId!],
  });
}

// ─── Delivery Area Mutations ────────────────────────────────

/** حفظ/تحديث منطقة توصيل. */
export function useSaveDeliveryArea(restaurantId: string | undefined) {
  const { toast } = useToast();
  const invalidate = useInvalidateBranches(restaurantId);

  return useMutation({
    mutationFn: async (data: SaveAreaData) => {
      const { id, ...areaData } = data;
      if (id) {
        const { error } = await supabase.from('delivery_areas').update({ name: areaData.name, delivery_price: areaData.delivery_price }).eq('id', id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('delivery_areas').insert([areaData]);
        if (error) throw error;
      }
    },
    onSuccess: (_, vars) => {
      toast({ title: vars.id ? 'تم التحديث' : 'تم الإضافة', description: vars.id ? 'تم تحديث بيانات المنطقة بنجاح' : 'تم إضافة المنطقة بنجاح' });
      invalidate();
    },
    onError: () => {
      toast({ title: 'خطأ', description: 'حدث خطأ أثناء حفظ البيانات', variant: 'destructive' });
    },
  });
}

/** حذف منطقة توصيل. */
export function useDeleteDeliveryArea(restaurantId: string | undefined) {
  const { toast } = useToast();
  const invalidate = useInvalidateBranches(restaurantId);

  return useMutation({
    mutationFn: async (areaId: string) => {
      const { error } = await supabase.from('delivery_areas').delete().eq('id', areaId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: 'تم الحذف', description: 'تم حذف المنطقة بنجاح' });
      invalidate();
    },
    onError: () => {
      toast({ title: 'خطأ', description: 'حدث خطأ أثناء حذف المنطقة', variant: 'destructive' });
    },
  });
}

/** إعادة ترتيب مناطق التوصيل (batch). */
export function useReorderDeliveryAreas(_restaurantId?: string | undefined) {
  return useReorderMutation('delivery_areas', {
    admin: ['admin_delivery_areas'],
    public: ['delivery_areas'],
  });
}
