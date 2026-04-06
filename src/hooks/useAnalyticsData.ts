import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { startOfDay, subDays, subMonths } from 'date-fns';

export type DatePreset = 'today' | '7days' | '30days' | '3months' | 'all';

export interface AnalyticsFilters {
  preset: DatePreset;
  customFrom?: Date;
  customTo?: Date;
  branchId?: string | null;
  orderSource?: string;
}

function getDateRange(filters: AnalyticsFilters): { from: Date | null; to: Date } {
  const now = new Date();
  const to = filters.customTo || now;
  if (filters.customFrom && filters.customTo) return { from: startOfDay(filters.customFrom), to };
  switch (filters.preset) {
    case 'today': return { from: startOfDay(now), to };
    case '7days': return { from: startOfDay(subDays(now, 7)), to };
    case '30days': return { from: startOfDay(subDays(now, 30)), to };
    case '3months': return { from: startOfDay(subMonths(now, 3)), to };
    case 'all': return { from: null, to };
  }
}

interface AnalyticsSummary {
  kpis: {
    totalOrders: number;
    totalRevenue: number;
    avgOrderValue: number;
    deliveredCount: number;
    cancelledCount: number;
    cancellationRate: number;
  };
  timeSeriesData: { date: string; revenue: number; orders: number }[];
  statusDistribution: { name: string; value: number }[];
  paymentMethods: { name: string; value: number }[];
  allItems: { name: string; quantity: number; revenue: number }[];
  peakHours: { hour: string; count: number }[];
  branchPerformance: { branchId: string; orders: number; revenue: number }[];
  useWeekly: boolean;
}

export function useAnalyticsData(restaurantId: string | undefined, filters: AnalyticsFilters) {
  const { from, to } = useMemo(() => getDateRange(filters), [
    filters.preset,
    filters.customFrom?.getTime(),
    filters.customTo?.getTime(),
  ]);

  const enabled = !!restaurantId;

  const { data, isLoading: queryLoading } = useQuery({
    queryKey: ['analytics_summary', restaurantId, from?.toISOString(), to.toISOString(), filters.branchId, filters.orderSource],
    queryFn: async (): Promise<AnalyticsSummary> => {
      const { data, error } = await supabase.rpc('get_analytics_summary', {
        p_restaurant_id: restaurantId!,
        p_from: from?.toISOString() ?? null,
        p_to: to.toISOString(),
        p_branch_id: filters.branchId ?? null,
        p_order_source: filters.orderSource ?? null,
      });
      if (error) throw error;
      const result = data as any;
      return {
        kpis: {
          totalOrders: Number(result.kpis.totalOrders || 0),
          totalRevenue: Number(result.kpis.totalRevenue || 0),
          avgOrderValue: Number(result.kpis.avgOrderValue || 0),
          deliveredCount: Number(result.kpis.deliveredCount || 0),
          cancelledCount: Number(result.kpis.cancelledCount || 0),
          cancellationRate: Number(result.kpis.cancellationRate || 0),
        },
        timeSeriesData: (result.timeSeriesData || []).map((t: any) => ({
          date: t.date,
          revenue: Number(t.revenue || 0),
          orders: Number(t.orders || 0),
        })),
        statusDistribution: (result.statusDistribution || []).map((s: any) => ({
          name: s.name,
          value: Number(s.value || 0),
        })),
        paymentMethods: (result.paymentMethods || []).map((p: any) => ({
          name: p.name,
          value: Number(p.value || 0),
        })),
        allItems: (result.allItems || []).map((i: any) => ({
          name: i.name,
          quantity: Number(i.quantity || 0),
          revenue: Number(i.revenue || 0),
        })),
        peakHours: (result.peakHours || []).map((h: any) => ({
          hour: h.hour,
          count: Number(h.count || 0),
        })),
        branchPerformance: (result.branchPerformance || []).map((b: any) => ({
          branchId: b.branchId,
          orders: Number(b.orders || 0),
          revenue: Number(b.revenue || 0),
        })),
        useWeekly: Boolean(result.useWeekly),
      };
    },
    enabled,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 15,
    refetchOnWindowFocus: false,
  });

  const defaults: AnalyticsSummary = {
    kpis: { totalOrders: 0, totalRevenue: 0, avgOrderValue: 0, deliveredCount: 0, cancelledCount: 0, cancellationRate: 0 },
    timeSeriesData: [],
    statusDistribution: [],
    paymentMethods: [],
    allItems: [],
    peakHours: [],
    branchPerformance: [],
    useWeekly: false,
  };

  const result = data || defaults;

  const topItems = useMemo(() => result.allItems.slice(0, 10), [result.allItems]);

  return {
    orders: [],
    isLoading: enabled && queryLoading,
    kpis: result.kpis,
    timeSeriesData: result.timeSeriesData,
    statusDistribution: result.statusDistribution,
    paymentMethods: result.paymentMethods,
    topItems,
    allItems: result.allItems,
    peakHours: result.peakHours,
    branchPerformance: result.branchPerformance,
    useWeekly: result.useWeekly,
  };
}
