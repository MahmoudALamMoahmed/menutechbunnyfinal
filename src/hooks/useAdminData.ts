import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// ─── إعدادات الكاش ─────────────────────────────────────────
const ADMIN_STALE = 1000 * 60 * 2;
const ADMIN_GC = 1000 * 60 * 10;

// React Query - جلب بيانات المطعم للأدمن
export function useAdminRestaurant(username: string | undefined) {
  return useQuery({
    queryKey: ['admin_restaurant', username],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('restaurants')
        .select('*')
        .eq('username', username!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!username,
    staleTime: ADMIN_STALE,
    gcTime: ADMIN_GC,
  });
}

// ─── React Query Hooks (للأدمن - بدون فلاتر، جميع البيانات) ──

export function useAdminCategories(restaurantId: string | undefined) {
  return useQuery({
    queryKey: ['admin_categories', restaurantId],
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
    staleTime: ADMIN_STALE,
    gcTime: ADMIN_GC,
    refetchOnWindowFocus: false,
  });
}

export function useAdminMenuItems(restaurantId: string | undefined) {
  return useQuery({
    queryKey: ['admin_menu_items', restaurantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('menu_items')
        .select('*')
        .eq('restaurant_id', restaurantId!)
        .order('display_order');
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!restaurantId,
    staleTime: ADMIN_STALE,
    gcTime: ADMIN_GC,
    refetchOnWindowFocus: false,
  });
}

export function useAdminSizes(restaurantId: string | undefined) {
  return useQuery({
    queryKey: ['admin_sizes', restaurantId],
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
    staleTime: ADMIN_STALE,
    gcTime: ADMIN_GC,
    refetchOnWindowFocus: false,
  });
}

export function useAdminExtras(restaurantId: string | undefined) {
  return useQuery({
    queryKey: ['admin_extras', restaurantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('extras')
        .select('*')
        .eq('restaurant_id', restaurantId!)
        .order('display_order');
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!restaurantId,
    staleTime: ADMIN_STALE,
    gcTime: ADMIN_GC,
    refetchOnWindowFocus: false,
  });
}

export function useAdminOffers(restaurantId: string | undefined) {
  return useQuery({
    queryKey: ['admin_offers', restaurantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('offers')
        .select('*')
        .eq('restaurant_id', restaurantId!)
        .order('display_order');
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!restaurantId,
    staleTime: ADMIN_STALE,
    gcTime: ADMIN_GC,
    refetchOnWindowFocus: false,
  });
}

export function useAdminBranches(restaurantId: string | undefined) {
  return useQuery({
    queryKey: ['admin_branches', restaurantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('branches')
        .select('*')
        .eq('restaurant_id', restaurantId!)
        .order('display_order');
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!restaurantId,
    staleTime: ADMIN_STALE,
    gcTime: ADMIN_GC,
    refetchOnWindowFocus: false,
  });
}

export function useAdminDeliveryAreas(branchIds: string[] | undefined) {
  return useQuery({
    queryKey: ['admin_delivery_areas', branchIds],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('delivery_areas')
        .select('*')
        .in('branch_id', branchIds!)
        .order('display_order');
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!branchIds && branchIds.length > 0,
    staleTime: ADMIN_STALE,
    gcTime: ADMIN_GC,
    refetchOnWindowFocus: false,
  });
}

// ─── Server-side Paginated Orders ───────────────────────────

interface ServerPaginatedResult {
  data: any[];
  totalCount: number;
}

export function useAdminOrders(
  restaurantId: string | undefined,
  orderSource?: string,
  page = 1,
  pageSize = 10
) {
  return useQuery<ServerPaginatedResult>({
    queryKey: ['admin_orders', restaurantId, orderSource, page, pageSize],
    queryFn: async () => {
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      let query = supabase
        .from('orders')
        .select('*', { count: 'exact' })
        .eq('restaurant_id', restaurantId!);
      if (orderSource) query = query.eq('order_source', orderSource);
      const { data, error, count } = await query
        .order('created_at', { ascending: false })
        .range(from, to);
      if (error) throw error;
      return { data: data ?? [], totalCount: count ?? 0 };
    },
    enabled: !!restaurantId,
    staleTime: 1000 * 60,
    gcTime: ADMIN_GC,
    refetchOnWindowFocus: false,
  });
}

export function useBranchOrders(
  branchId: string | undefined,
  orderSource?: string,
  page = 1,
  pageSize = 10
) {
  return useQuery<ServerPaginatedResult>({
    queryKey: ['branch_orders', branchId, orderSource, page, pageSize],
    queryFn: async () => {
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      let query = supabase
        .from('orders')
        .select('*', { count: 'exact' })
        .eq('branch_id', branchId!);
      if (orderSource) query = query.eq('order_source', orderSource);
      const { data, error, count } = await query
        .order('created_at', { ascending: false })
        .range(from, to);
      if (error) throw error;
      return { data: data ?? [], totalCount: count ?? 0 };
    },
    enabled: !!branchId,
    staleTime: 1000 * 60,
    gcTime: ADMIN_GC,
    refetchOnWindowFocus: false,
  });
}

// React Query - جلب عدد الطلبات المعلقة (للـ badge والصوت)
export function usePendingOrdersCount(
  filterColumn: 'restaurant_id' | 'branch_id',
  filterValue: string | undefined,
  orderSource?: string
) {
  return useQuery({
    queryKey: ['pending_orders_count', filterColumn, filterValue, orderSource],
    queryFn: async () => {
      let query = supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq(filterColumn, filterValue!)
        .eq('status', 'pending');
      if (orderSource) query = query.eq('order_source', orderSource);
      const { count, error } = await query;
      if (error) throw error;
      return count ?? 0;
    },
    enabled: !!filterValue,
    staleTime: 1000 * 30,
    gcTime: ADMIN_GC,
    refetchOnWindowFocus: false,
  });
}

export function useBranchStaffList(restaurantId: string | undefined) {
  return useQuery({
    queryKey: ['branch_staff_list', restaurantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('branch_staff')
        .select('*')
        .eq('restaurant_id', restaurantId!);
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!restaurantId,
    staleTime: ADMIN_STALE,
    gcTime: ADMIN_GC,
    refetchOnWindowFocus: false,
  });
}
