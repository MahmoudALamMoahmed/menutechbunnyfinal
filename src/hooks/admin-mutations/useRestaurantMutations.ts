import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { TablesUpdate } from '@/integrations/supabase/types';
import { useToast } from '@/hooks/use-toast';

/** حفظ/إنشاء بيانات المطعم (الشعار، الغلاف، الروابط الاجتماعية، إلخ). */
export function useSaveRestaurant(username: string | undefined) {
  const { toast } = useToast();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data, ownerId }: { id?: string; data: TablesUpdate<'restaurants'> & { name: string; username: string }; ownerId: string }) => {
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
