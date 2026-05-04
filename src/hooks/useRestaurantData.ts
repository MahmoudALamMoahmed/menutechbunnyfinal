import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// ─── إعدادات الكاش ─────────────────────────────────────────
const LONG_STALE = 1000 * 60 * 10;
const LONG_GC = 1000 * 60 * 30;
const MEDIUM_STALE = 1000 * 60 * 5;
const MEDIUM_GC = 1000 * 60 * 15;

// ─── React Query Hooks (للجمهور - مع فلاتر التوفر/النشاط) ──

// Hook موحّد: جلب كل بيانات صفحة المطعم العامة في استدعاء واحد (RPC)
export function usePublicRestaurantData(username: string | undefined) {
  return useQuery({
    queryKey: ['public_restaurant_data', username],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_public_restaurant_data', {
        p_username: username!,
      });
      if (error) throw error;
      return data as {
        restaurant: any;
        categories: any[];
        menu_items: any[];
        sizes: any[];
        extras: any[];
        branches: any[];
        delivery_areas: any[];
        offers: any[];
      } | null;
    },
    enabled: !!username,
    staleTime: MEDIUM_STALE,
    gcTime: MEDIUM_GC,
    refetchOnWindowFocus: false,
  });
}

export function useRestaurant(username: string | undefined) {
  return useQuery({
    queryKey: ['restaurant', username],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('public_restaurants')
        .select('*')
        .eq('username', username!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!username,
    staleTime: LONG_STALE,
    gcTime: LONG_GC,
    refetchOnWindowFocus: false,
  });
}

export function useCategories(restaurantId: string | undefined) {
  return useQuery({
    queryKey: ['categories', restaurantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('restaurant_id', restaurantId!)
        .order('display_order');
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!restaurantId,
    staleTime: LONG_STALE,
    gcTime: LONG_GC,
    refetchOnWindowFocus: false,
  });
}

export function useMenuItems(restaurantId: string | undefined) {
  return useQuery({
    queryKey: ['menu_items', restaurantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('menu_items')
        .select('*')
        .eq('restaurant_id', restaurantId!)
        .eq('is_available', true)
        .order('display_order');
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!restaurantId,
    staleTime: MEDIUM_STALE,
    gcTime: MEDIUM_GC,
    refetchOnWindowFocus: false,
  });
}

export function useSizes(restaurantId: string | undefined) {
  return useQuery({
    queryKey: ['sizes', restaurantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sizes')
        .select('*, menu_items!inner(restaurant_id)')
        .eq('menu_items.restaurant_id', restaurantId!)
        .order('display_order');
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!restaurantId,
    staleTime: MEDIUM_STALE,
    gcTime: MEDIUM_GC,
    refetchOnWindowFocus: false,
  });
}

export function useExtras(restaurantId: string | undefined) {
  return useQuery({
    queryKey: ['extras', restaurantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('extras')
        .select('*')
        .eq('restaurant_id', restaurantId!)
        .eq('is_available', true)
        .order('display_order');
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!restaurantId,
    staleTime: MEDIUM_STALE,
    gcTime: MEDIUM_GC,
    refetchOnWindowFocus: false,
  });
}
export function useDeliveryAreas(branchIds: string[] | undefined) {
  return useQuery({
    queryKey: ['delivery_areas', branchIds],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('delivery_areas')
        .select('*')
        .in('branch_id', branchIds!)
        .eq('is_active', true)
        .order('display_order');
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!branchIds && branchIds.length > 0,
    staleTime: LONG_STALE,
    gcTime: LONG_GC,
    refetchOnWindowFocus: false,
  });
}

export function useBranchPaymentMethods(branchId: string | undefined) {
  return useQuery({
    queryKey: ['branch_payment_methods', branchId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('branch_payment_methods')
        .select('*')
        .eq('branch_id', branchId!)
        .eq('is_active', true)
        .order('display_order');
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!branchId,
    staleTime: LONG_STALE,
    gcTime: LONG_GC,
    refetchOnWindowFocus: false,
  });
}
