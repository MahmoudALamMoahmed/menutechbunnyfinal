import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { deleteFromBunny } from '@/lib/bunny';
import { useReorderMutation } from './_shared';

// ─── Interfaces ─────────────────────────────────────────────

export interface SaveOfferData {
  id?: string;
  restaurant_id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  image_public_id: string | null;
  price: number;
  original_price: number | null;
  menu_item_id: string | null;
  is_active: boolean;
  display_order: number;
}

// إبطال كاش العروض (admin + public)
function useInvalidateOffers(restaurantId: string | undefined) {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: ['admin_offers', restaurantId] });
    qc.invalidateQueries({ queryKey: ['public_restaurant_data'] });
  };
}

/** حفظ/تحديث عرض. */
export function useSaveOffer(restaurantId: string | undefined) {
  const { toast } = useToast();
  const invalidate = useInvalidateOffers(restaurantId);

  return useMutation({
    mutationFn: async (data: SaveOfferData) => {
      const { id, ...offerData } = data;
      if (id) {
        const { error } = await supabase.from('offers').update(offerData).eq('id', id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('offers').insert([offerData]);
        if (error) throw error;
      }
    },
    onSuccess: (_, vars) => {
      toast({ title: vars.id ? 'تم التحديث' : 'تم الحفظ', description: vars.id ? 'تم تحديث العرض بنجاح' : 'تم إضافة العرض بنجاح' });
      invalidate();
    },
    onError: () => {
      toast({ title: 'خطأ', description: 'حدث خطأ أثناء حفظ العرض', variant: 'destructive' });
    },
  });
}

/** حذف عرض (مع حذف صورته من Bunny CDN لو موجودة). */
export function useDeleteOffer(restaurantId: string | undefined) {
  const { toast } = useToast();
  const invalidate = useInvalidateOffers(restaurantId);

  return useMutation({
    mutationFn: async ({ offerId, imagePublicId }: { offerId: string; imagePublicId?: string | null }) => {
      if (imagePublicId) {
        try { await deleteFromBunny(imagePublicId); } catch (e) { console.error('Error deleting offer image from Bunny:', e); }
      }
      const { error } = await supabase.from('offers').delete().eq('id', offerId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: 'تم الحذف', description: 'تم حذف العرض بنجاح' });
      invalidate();
    },
    onError: () => {
      toast({ title: 'خطأ', description: 'حدث خطأ أثناء حذف العرض', variant: 'destructive' });
    },
  });
}

/** إعادة ترتيب العروض (batch). */
export function useReorderOffers(restaurantId: string | undefined) {
  return useReorderMutation('offers', {
    admin: ['admin_offers', restaurantId!],
    public: ['public_restaurant_data'],
  });
}
