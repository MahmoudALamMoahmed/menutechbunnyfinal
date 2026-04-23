import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { deleteFromBunny } from '@/lib/bunny';
import { useInvalidateMenu, isLimitError, useReorderMutation } from './_shared';

// ─── Interfaces ─────────────────────────────────────────────

export interface SaveItemData {
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

// ─── Category Mutations ─────────────────────────────────────

/** حفظ/تحديث فئة من القائمة. */
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

/** حذف فئة. */
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

/** إعادة ترتيب الفئات (batch). */
export function useReorderCategories(restaurantId: string | undefined) {
  return useReorderMutation('categories', {
    admin: ['admin_categories', restaurantId!],
    public: ['categories', restaurantId!],
  });
}

// ─── Menu Item Mutations ────────────────────────────────────

/** حفظ/تحديث صنف. */
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

/** حذف صنف (مع حذف صورته من Bunny CDN لو موجودة). */
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

/** إعادة ترتيب الأصناف (batch). */
export function useReorderMenuItems(restaurantId: string | undefined) {
  return useReorderMutation('menu_items', {
    admin: ['admin_menu_items', restaurantId!],
    public: ['menu_items', restaurantId!],
  });
}

// ─── Size Mutations ─────────────────────────────────────────

/** حفظ/تحديث حجم لصنف. */
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

/** حذف حجم. */
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

/** حفظ/تحديث إضافة. */
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

/** حذف إضافة. */
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

/** إعادة ترتيب الإضافات (batch). */
export function useReorderExtras(restaurantId: string | undefined) {
  return useReorderMutation('extras', {
    admin: ['admin_extras', restaurantId!],
    public: ['extras', restaurantId!],
  });
}
