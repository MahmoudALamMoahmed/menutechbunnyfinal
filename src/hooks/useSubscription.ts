import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

// ─── Types ──────────────────────────────────────────────────

export interface RestaurantLimits {
  plan_id: string;
  plan_name: string;
  plan_name_ar: string;
  max_categories: number | null;
  max_items: number | null;
  max_branches: number | null;
  max_extras: number | null;
  features: {
    analytics?: boolean;
    branch_staff?: boolean;
    dashboard_orders?: boolean;
    whatsapp_orders?: boolean;
  };
  expires_at: string | null;
  is_subscribed: boolean;
  auto_renew?: boolean;
}

// ─── Hooks ──────────────────────────────────────────────────

// Hook - جلب حدود الباقة الحالية للمطعم
export function useRestaurantLimits(restaurantId: string | undefined) {
  return useQuery({
    queryKey: ['restaurant_limits', restaurantId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_restaurant_limits', { 
        p_restaurant_id: restaurantId! 
      });
      if (error) throw error;
      return (data?.[0] as RestaurantLimits) ?? null;
    },
    enabled: !!restaurantId,
    staleTime: 1000 * 60 * 5, // 5 دقائق
    gcTime: 1000 * 60 * 30,
    refetchOnWindowFocus: false,
  });
}

// Hook - جلب جميع الباقات المتاحة
export function usePlans() {
  return useQuery({
    queryKey: ['plans'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('plans')
        .select('*')
        .eq('is_active', true)
        .order('display_order');
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 1000 * 60 * 60, // ساعة
    gcTime: 1000 * 60 * 60 * 24,
    refetchOnWindowFocus: false,
  });
}

// Hook - جلب رصيد المحفظة
export function useWalletBalance(restaurantId: string | undefined) {
  return useQuery({
    queryKey: ['wallet_balance', restaurantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('wallets')
        .select('balance')
        .eq('restaurant_id', restaurantId!)
        .single();
      if (error && error.code !== 'PGRST116') throw error;
      return data?.balance ?? 0;
    },
    enabled: !!restaurantId,
    staleTime: 1000 * 60,
    refetchOnWindowFocus: true,
  });
}

// Hook - جلب سجل معاملات الاشتراك
export function useSubscriptionHistory(restaurantId: string | undefined) {
  return useQuery({
    queryKey: ['subscription_history', restaurantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('subscription_transactions')
        .select('*, plans!inner(name_ar)')
        .eq('restaurant_id', restaurantId!)
        .order('created_at', { ascending: false })
        .limit(10);
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!restaurantId,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  });
}

// Mutation - الاشتراك في باقة
export function useSubscribeToPlan(restaurantId: string | undefined) {
  const { toast } = useToast();
  const qc = useQueryClient();
  
  return useMutation({
    mutationFn: async (planId: string) => {
      const { data, error } = await supabase.rpc('subscribe_to_plan', { 
        p_restaurant_id: restaurantId!, 
        p_plan_id: planId 
      });
      if (error) throw error;
      return data as string;
    },
    onSuccess: (result) => {
      if (result === 'success') {
        toast({ title: 'تم الاشتراك بنجاح', description: 'تم تفعيل الباقة الجديدة' });
        qc.invalidateQueries({ queryKey: ['restaurant_limits', restaurantId] });
        qc.invalidateQueries({ queryKey: ['wallet_balance'] });
        qc.invalidateQueries({ queryKey: ['subscription_history', restaurantId] });
      } else if (result === 'insufficient_balance') {
        toast({ title: 'رصيد غير كافي', description: 'يرجى شحن المحفظة أولاً', variant: 'destructive' });
      } else if (result === 'plan_not_found') {
        toast({ title: 'خطأ', description: 'الباقة غير متاحة', variant: 'destructive' });
      } else if (result === 'plan_change_not_allowed') {
        toast({ title: 'غير مسموح', description: 'لا يمكن تغيير الباقة أثناء وجود اشتراك فعال. انتظر انتهاء اشتراكك الحالي.', variant: 'destructive' });
      } else {
        toast({ title: 'خطأ', description: 'حدث خطأ أثناء الاشتراك', variant: 'destructive' });
      }
    },
    onError: () => {
      toast({ title: 'خطأ', description: 'حدث خطأ أثناء الاشتراك', variant: 'destructive' });
    },
  });
}

// Mutation - تفعيل/إلغاء التجديد التلقائي
export function useToggleAutoRenew(restaurantId: string | undefined) {
  const { toast } = useToast();
  const qc = useQueryClient();
  
  return useMutation({
    mutationFn: async (autoRenew: boolean) => {
      const { error } = await supabase.rpc('toggle_auto_renew', { 
        p_restaurant_id: restaurantId!, 
        p_auto_renew: autoRenew 
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['restaurant_limits', restaurantId] });
      toast({ title: 'تم التحديث', description: 'تم تحديث إعدادات التجديد التلقائي' });
    },
    onError: () => {
      toast({ title: 'خطأ', description: 'حدث خطأ أثناء التحديث', variant: 'destructive' });
    },
  });
}
