import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useAllRestaurants() {
  return useQuery({
    queryKey: ['super-admin', 'restaurants'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('restaurants')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useAllSubscriptions() {
  return useQuery({
    queryKey: ['super-admin', 'subscriptions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*, plans(name, name_ar, price_monthly), restaurants(name, username)')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

// تبسيط: wallets ليس لها علاقة مباشرة مع restaurants عبر FK
// لذلك نحتفظ بالـ join اليدوي لكن نستخدم query واحد فقط
export function useAllWallets() {
  return useQuery({
    queryKey: ['super-admin', 'wallets'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('wallets')
        .select('*, restaurants(name, username)')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []).map((w: any) => ({
        ...w,
        restaurant_name: w.restaurants?.name || null,
        restaurant_username: w.restaurants?.username || null,
      }));
    },
  });
}

export function useAllWalletTransactions() {
  return useQuery({
    queryKey: ['super-admin', 'wallet-transactions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('wallet_transactions')
        .select('*, wallets!inner(restaurant_id, restaurants(name))')
        .order('created_at', { ascending: false })
        .limit(500);
      if (error) throw error;

      return (data || []).map((t: any) => ({
        ...t,
        restaurant_name: t.wallets?.restaurants?.name || null,
      }));
    },
  });
}

export function useOrdersStats() {
  return useQuery({
    queryKey: ['super-admin', 'orders-stats'],
    queryFn: async () => {
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

      const [totalRes, todayRes, monthRes] = await Promise.all([
        supabase.from('orders').select('*', { count: 'exact', head: true }),
        supabase.from('orders').select('*', { count: 'exact', head: true }).gte('created_at', todayStart),
        supabase.from('orders').select('*', { count: 'exact', head: true }).gte('created_at', monthStart),
      ]);

      return {
        totalOrders: totalRes.count || 0,
        todayOrders: todayRes.count || 0,
        monthOrders: monthRes.count || 0,
      };
    },
  });
}

export function useRecentOrders(limit = 50, page = 1) {
  return useQuery({
    queryKey: ['super-admin', 'recent-orders', limit, page],
    queryFn: async () => {
      const from = (page - 1) * limit;
      const to = from + limit - 1;
      const { data, error, count } = await supabase
        .from('orders')
        .select('id, customer_name, customer_phone, total_price, status, created_at, order_source, restaurant_id, restaurants(name)', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(from, to);
      if (error) throw error;
      return { data: data ?? [], totalCount: count ?? 0 };
    },
  });
}

export function useAllPlans() {
  return useQuery({
    queryKey: ['super-admin', 'plans'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('plans')
        .select('*')
        .order('display_order', { ascending: true });
      if (error) throw error;
      return data;
    },
  });
}
