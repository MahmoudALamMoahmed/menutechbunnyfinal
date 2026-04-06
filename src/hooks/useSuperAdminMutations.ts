import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// تعديل رصيد المحفظة يدوياً (عبر دالة ذرية لمنع Race Condition)
export function useAdjustWalletBalance() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ walletId, amount, type }: { walletId: string; amount: number; type: 'add' | 'subtract' }) => {
      const { data, error } = await supabase.rpc('adjust_wallet_balance', {
        p_wallet_id: walletId,
        p_amount: amount,
        p_type: type,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['super-admin', 'wallets'] });
      toast.success('تم تعديل الرصيد بنجاح');
    },
    onError: (err: Error) => {
      toast.error(err.message || 'حدث خطأ أثناء تعديل الرصيد');
    },
  });
}

// تمديد أو تغيير اشتراك مطعم
export function useExtendSubscription() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ subscriptionId, days }: { subscriptionId: string; days: number }) => {
      // جلب الاشتراك الحالي
      const { data: sub, error: fetchError } = await supabase
        .from('subscriptions')
        .select('expires_at')
        .eq('id', subscriptionId)
        .single();
      if (fetchError) throw fetchError;

      const currentExpiry = new Date(sub.expires_at);
      const base = currentExpiry > new Date() ? currentExpiry : new Date();
      const newExpiry = new Date(base.getTime() + days * 24 * 60 * 60 * 1000);

      const { error } = await supabase
        .from('subscriptions')
        .update({ expires_at: newExpiry.toISOString(), status: 'active' })
        .eq('id', subscriptionId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['super-admin', 'subscriptions'] });
      toast.success('تم تمديد الاشتراك بنجاح');
    },
    onError: () => {
      toast.error('حدث خطأ أثناء تمديد الاشتراك');
    },
  });
}
