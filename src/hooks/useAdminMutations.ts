import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { deleteFromBunny } from '@/lib/bunny';

// ─── Helpers (مساعدات لإبطال الكاش) ────────────────────────

function useInvalidateMenu(restaurantId: string | undefined) {
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

function useInvalidateBranches(restaurantId: string | undefined) {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: ['admin_branches', restaurantId] });
    qc.invalidateQueries({ queryKey: ['admin_delivery_areas'] });
    qc.invalidateQueries({ queryKey: ['branches', restaurantId] });
    qc.invalidateQueries({ queryKey: ['delivery_areas'] });
  };
}

// ─── Helper: معالجة أخطاء الـ Trigger ───────────────────────
function isLimitError(error: any): boolean {
  const msg = error?.message ?? '';
  return msg.includes('limit reached') || msg.includes('LIMIT');
}

// ─── Category Mutations ─────────────────────────────────────

export function useSaveCategory(restaurantId: string | undefined) {
  const { toast } = useToast();
  const invalidate = useInvalidateMenu(restaurantId);

  return useMutation({
    mutationFn: async ({ id, name, display_order }: { id?: string; name: string; display_order: number }) => {
      if (id) {
        const { error } = await supabase.from('categories').update({ name, display_order }).eq('id', id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('categories').insert([{ name, display_order, restaurant_id: restaurantId! }]);
        if (error) throw error;
      }
    },
    onSuccess: (_, vars) => {
      toast({ title: vars.id ? 'تم التحديث' : 'تم الحفظ', description: vars.id ? 'تم تحديث القسم بنجاح' : 'تم إضافة القسم بنجاح' });
      invalidate();
    },
    onError: (error: any) => {
      if (isLimitError(error)) {
        toast({ title: 'وصلت للحد الأقصى', description: 'قم بترقية باقتك لإضافة المزيد من الفئات', variant: 'destructive' });
      } else {
        toast({ title: 'خطأ', description: 'حدث خطأ أثناء حفظ القسم', variant: 'destructive' });
      }
    },
  });
}

export function useDeleteCategory(restaurantId: string | undefined) {
  const { toast } = useToast();
  const invalidate = useInvalidateMenu(restaurantId);

  return useMutation({
    mutationFn: async (categoryId: string) => {
      const { error } = await supabase.from('categories').delete().eq('id', categoryId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: 'تم الحذف', description: 'تم حذف القسم بنجاح' });
      invalidate();
    },
    onError: () => {
      toast({ title: 'خطأ', description: 'حدث خطأ أثناء حذف القسم', variant: 'destructive' });
    },
  });
}

// ─── Menu Item Mutations ────────────────────────────────────

interface SaveItemData {
  id?: string;
  name: string;
  description: string | null;
  price: number;
  category_id: string | null;
  image_url: string | null;
  image_public_id: string | null;
  is_available: boolean;
  display_order: number;
  restaurant_id: string;
}

export function useSaveMenuItem(restaurantId: string | undefined) {
  const { toast } = useToast();
  const invalidate = useInvalidateMenu(restaurantId);

  return useMutation({
    mutationFn: async (data: SaveItemData) => {
      const { id, ...itemData } = data;
      if (id) {
        const { error } = await supabase.from('menu_items').update(itemData).eq('id', id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('menu_items').insert([itemData]);
        if (error) throw error;
      }
    },
    onSuccess: (_, vars) => {
      toast({ title: vars.id ? 'تم التحديث' : 'تم الحفظ', description: vars.id ? 'تم تحديث الصنف بنجاح' : 'تم إضافة الصنف بنجاح' });
      invalidate();
    },
    onError: (error: any) => {
      if (isLimitError(error)) {
        toast({ title: 'وصلت للحد الأقصى', description: 'قم بترقية باقتك لإضافة المزيد من الأصناف', variant: 'destructive' });
      } else {
        toast({ title: 'خطأ', description: 'حدث خطأ أثناء حفظ الصنف', variant: 'destructive' });
      }
    },
  });
}

export function useDeleteMenuItem(restaurantId: string | undefined) {
  const { toast } = useToast();
  const invalidate = useInvalidateMenu(restaurantId);

  return useMutation({
    mutationFn: async ({ itemId, imagePublicId }: { itemId: string; imagePublicId?: string | null }) => {
      if (imagePublicId) {
        try { await deleteFromBunny(imagePublicId); } catch (e) { console.error('Error deleting image from Bunny:', e); }
      }
      const { error } = await supabase.from('menu_items').delete().eq('id', itemId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: 'تم الحذف', description: 'تم حذف الصنف بنجاح' });
      invalidate();
    },
    onError: () => {
      toast({ title: 'خطأ', description: 'حدث خطأ أثناء حذف الصنف', variant: 'destructive' });
    },
  });
}

// ─── Size Mutations ─────────────────────────────────────────

export function useSaveSize(restaurantId: string | undefined) {
  const { toast } = useToast();
  const invalidate = useInvalidateMenu(restaurantId);

  return useMutation({
    mutationFn: async ({ id, menu_item_id, name, price, display_order }: { id?: string; menu_item_id: string; name: string; price: number; display_order: number }) => {
      const sizeData = { menu_item_id, name, price, display_order };
      if (id) {
        const { error } = await supabase.from('sizes').update(sizeData).eq('id', id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('sizes').insert([sizeData]);
        if (error) throw error;
      }
    },
    onSuccess: (_, vars) => {
      toast({ title: vars.id ? 'تم التحديث' : 'تم الحفظ', description: vars.id ? 'تم تحديث الحجم بنجاح' : 'تم إضافة الحجم بنجاح' });
      invalidate();
    },
    onError: () => {
      toast({ title: 'خطأ', description: 'حدث خطأ أثناء حفظ الحجم', variant: 'destructive' });
    },
  });
}

export function useDeleteSize(restaurantId: string | undefined) {
  const { toast } = useToast();
  const invalidate = useInvalidateMenu(restaurantId);

  return useMutation({
    mutationFn: async (sizeId: string) => {
      const { error } = await supabase.from('sizes').delete().eq('id', sizeId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: 'تم الحذف', description: 'تم حذف الحجم بنجاح' });
      invalidate();
    },
    onError: () => {
      toast({ title: 'خطأ', description: 'حدث خطأ أثناء حذف الحجم', variant: 'destructive' });
    },
  });
}

// ─── Extra Mutations ────────────────────────────────────────

export function useSaveExtra(restaurantId: string | undefined) {
  const { toast } = useToast();
  const invalidate = useInvalidateMenu(restaurantId);

  return useMutation({
    mutationFn: async ({ id, restaurant_id, name, price, display_order, is_available }: { id?: string; restaurant_id: string; name: string; price: number; display_order: number; is_available: boolean }) => {
      const extraData = { restaurant_id, name, price, display_order, is_available };
      if (id) {
        const { error } = await supabase.from('extras').update(extraData).eq('id', id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('extras').insert([extraData]);
        if (error) throw error;
      }
    },
    onSuccess: (_, vars) => {
      toast({ title: vars.id ? 'تم التحديث' : 'تم الحفظ', description: vars.id ? 'تم تحديث الإضافة بنجاح' : 'تم إضافة الإضافة بنجاح' });
      invalidate();
    },
    onError: (error: any) => {
      if (isLimitError(error)) {
        toast({ title: 'وصلت للحد الأقصى', description: 'قم بترقية باقتك لإضافة المزيد من الإضافات', variant: 'destructive' });
      } else {
        toast({ title: 'خطأ', description: 'حدث خطأ أثناء حفظ الإضافة', variant: 'destructive' });
      }
    },
  });
}

export function useDeleteExtra(restaurantId: string | undefined) {
  const { toast } = useToast();
  const invalidate = useInvalidateMenu(restaurantId);

  return useMutation({
    mutationFn: async (extraId: string) => {
      const { error } = await supabase.from('extras').delete().eq('id', extraId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: 'تم الحذف', description: 'تم حذف الإضافة بنجاح' });
      invalidate();
    },
    onError: () => {
      toast({ title: 'خطأ', description: 'حدث خطأ أثناء حذف الإضافة', variant: 'destructive' });
    },
  });
}

// ─── Branch Mutations ───────────────────────────────────────

interface SaveBranchData {
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

// ─── Delivery Area Mutations ────────────────────────────────

interface SaveAreaData {
  id?: string;
  branch_id: string;
  name: string;
  delivery_price: number;
  display_order?: number;
}

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

// ─── Restaurant Mutations ───────────────────────────────────

export function useSaveRestaurant(username: string | undefined) {
  const { toast } = useToast();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data, ownerId }: { id?: string; data: { name: string; username: string; [key: string]: any }; ownerId: string }) => {
      if (id) {
        const { error } = await supabase.from('restaurants').update(data).eq('id', id);
        if (error) throw error;
      } else {
        const { data: result, error } = await supabase.from('restaurants').insert([{ ...data, owner_id: ownerId }]).select().single();
        if (error) {
          if (error.code === '23505') throw new Error('USERNAME_TAKEN');
          throw error;
        }
        return result;
      }
    },
    onSuccess: (_, vars) => {
      toast({ title: vars.id ? 'تم الحفظ بنجاح' : 'تم إنشاء المطعم بنجاح', description: vars.id ? 'تم تحديث بيانات المطعم' : 'يمكنك الآن إضافة عناصر القائمة' });
      qc.invalidateQueries({ queryKey: ['restaurant', username] });
    },
    onError: (error) => {
      if (error.message === 'USERNAME_TAKEN') {
        toast({ title: 'خطأ', description: 'اسم المطعم في الرابط مُستخدم بالفعل', variant: 'destructive' });
      } else {
        toast({ title: 'خطأ', description: 'حدث خطأ أثناء حفظ البيانات', variant: 'destructive' });
      }
    },
  });
}

// ─── Order Mutations ────────────────────────────────────────

export function useUpdateOrderStatus(restaurantOrBranchId: string | undefined, isBranch = false) {
  const { toast } = useToast();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ orderId, status, isConfirmed }: { orderId: string; status: string; isConfirmed?: boolean }) => {
      const updateData: Record<string, any> = { status, updated_at: new Date().toISOString() };
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

// ─── Reorder Mutations (batch RPC) ──────────────────────────

function useReorderMutation(tableName: string, cacheKeys: { admin: string[]; public: string[] }) {
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
      const prev = qc.getQueryData(cacheKeys.admin);
      return { prev };
    },
    onError: (_, __, context) => {
      if (context?.prev) qc.setQueryData(cacheKeys.admin, context.prev);
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: cacheKeys.admin });
      qc.invalidateQueries({ queryKey: cacheKeys.public });
    },
  });
}

export function useReorderCategories(restaurantId: string | undefined) {
  return useReorderMutation('categories', {
    admin: ['admin_categories', restaurantId!],
    public: ['categories', restaurantId!],
  });
}

export function useReorderMenuItems(restaurantId: string | undefined) {
  return useReorderMutation('menu_items', {
    admin: ['admin_menu_items', restaurantId!],
    public: ['menu_items', restaurantId!],
  });
}

export function useReorderExtras(restaurantId: string | undefined) {
  return useReorderMutation('extras', {
    admin: ['admin_extras', restaurantId!],
    public: ['extras', restaurantId!],
  });
}

export function useReorderBranches(restaurantId: string | undefined) {
  return useReorderMutation('branches', {
    admin: ['admin_branches', restaurantId!],
    public: ['branches', restaurantId!],
  });
}

export function useReorderDeliveryAreas(restaurantId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (updates: { id: string; display_order: number }[]) => {
      const { error } = await supabase.rpc('batch_update_display_order', {
        p_table_name: 'delivery_areas',
        p_items: updates as any,
      });
      if (error) throw error;
    },
    onMutate: async () => {
      const prev = qc.getQueryData(['admin_delivery_areas']);
      return { prev };
    },
    onError: (_, __, context) => {
      if (context?.prev) qc.setQueryData(['admin_delivery_areas'], context.prev);
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['admin_delivery_areas'] });
      qc.invalidateQueries({ queryKey: ['delivery_areas'] });
    },
  });
}
