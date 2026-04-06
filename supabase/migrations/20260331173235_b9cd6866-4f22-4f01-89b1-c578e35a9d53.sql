
CREATE OR REPLACE FUNCTION public.get_analytics_summary(
  p_restaurant_id uuid,
  p_from timestamptz DEFAULT NULL,
  p_to timestamptz DEFAULT now(),
  p_branch_id uuid DEFAULT NULL,
  p_order_source text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_result jsonb;
  v_kpis jsonb;
  v_time_series jsonb;
  v_status_dist jsonb;
  v_payment_methods jsonb;
  v_all_items jsonb;
  v_peak_hours jsonb;
  v_branch_perf jsonb;
  v_diff_days int;
  v_use_weekly boolean;
BEGIN
  -- Calculate if we should use weekly grouping
  IF p_from IS NULL THEN
    v_use_weekly := true;
  ELSE
    v_diff_days := EXTRACT(DAY FROM (p_to - p_from));
    v_use_weekly := v_diff_days > 60;
  END IF;

  -- KPIs
  SELECT jsonb_build_object(
    'totalOrders', COUNT(*),
    'totalRevenue', COALESCE(SUM(total_price), 0),
    'avgOrderValue', CASE WHEN COUNT(*) > 0 THEN ROUND(COALESCE(SUM(total_price), 0) / COUNT(*), 2) ELSE 0 END,
    'deliveredCount', COUNT(*) FILTER (WHERE status = 'delivered'),
    'cancelledCount', COUNT(*) FILTER (WHERE status = 'cancelled'),
    'cancellationRate', CASE WHEN COUNT(*) > 0 THEN ROUND((COUNT(*) FILTER (WHERE status = 'cancelled'))::numeric / COUNT(*) * 100, 2) ELSE 0 END
  ) INTO v_kpis
  FROM orders
  WHERE restaurant_id = p_restaurant_id
    AND (p_from IS NULL OR created_at >= p_from)
    AND created_at <= p_to
    AND (p_branch_id IS NULL OR branch_id = p_branch_id)
    AND (p_order_source IS NULL OR order_source = p_order_source);

  -- Time series (daily or weekly)
  IF v_use_weekly THEN
    SELECT COALESCE(jsonb_agg(row_to_json(t)::jsonb ORDER BY t.date), '[]'::jsonb) INTO v_time_series
    FROM (
      SELECT 
        to_char(date_trunc('week', created_at), 'YYYY-MM-DD') as date,
        COALESCE(SUM(total_price), 0) as revenue,
        COUNT(*) as orders
      FROM orders
      WHERE restaurant_id = p_restaurant_id
        AND (p_from IS NULL OR created_at >= p_from)
        AND created_at <= p_to
        AND (p_branch_id IS NULL OR branch_id = p_branch_id)
        AND (p_order_source IS NULL OR order_source = p_order_source)
      GROUP BY date_trunc('week', created_at)
      ORDER BY date_trunc('week', created_at)
    ) t;
  ELSE
    SELECT COALESCE(jsonb_agg(row_to_json(t)::jsonb ORDER BY t.date), '[]'::jsonb) INTO v_time_series
    FROM (
      SELECT 
        to_char(created_at::date, 'YYYY-MM-DD') as date,
        COALESCE(SUM(total_price), 0) as revenue,
        COUNT(*) as orders
      FROM orders
      WHERE restaurant_id = p_restaurant_id
        AND (p_from IS NULL OR created_at >= p_from)
        AND created_at <= p_to
        AND (p_branch_id IS NULL OR branch_id = p_branch_id)
        AND (p_order_source IS NULL OR order_source = p_order_source)
      GROUP BY created_at::date
      ORDER BY created_at::date
    ) t;
  END IF;

  -- Status distribution
  SELECT COALESCE(jsonb_agg(jsonb_build_object('name', COALESCE(status, 'pending'), 'value', cnt)), '[]'::jsonb) INTO v_status_dist
  FROM (
    SELECT status, COUNT(*) as cnt
    FROM orders
    WHERE restaurant_id = p_restaurant_id
      AND (p_from IS NULL OR created_at >= p_from)
      AND created_at <= p_to
      AND (p_branch_id IS NULL OR branch_id = p_branch_id)
      AND (p_order_source IS NULL OR order_source = p_order_source)
    GROUP BY status
  ) t;

  -- Payment methods
  SELECT COALESCE(jsonb_agg(jsonb_build_object('name', COALESCE(pm, 'cash'), 'value', cnt)), '[]'::jsonb) INTO v_payment_methods
  FROM (
    SELECT payment_method as pm, COUNT(*) as cnt
    FROM orders
    WHERE restaurant_id = p_restaurant_id
      AND (p_from IS NULL OR created_at >= p_from)
      AND created_at <= p_to
      AND (p_branch_id IS NULL OR branch_id = p_branch_id)
      AND (p_order_source IS NULL OR order_source = p_order_source)
    GROUP BY payment_method
  ) t;

  -- All items (from JSONB)
  SELECT COALESCE(jsonb_agg(jsonb_build_object('name', item_name, 'quantity', total_qty, 'revenue', total_rev) ORDER BY total_qty DESC), '[]'::jsonb) INTO v_all_items
  FROM (
    SELECT 
      item->>'name' as item_name,
      SUM(COALESCE((item->>'quantity')::int, 1)) as total_qty,
      SUM(COALESCE((item->>'total')::numeric, (item->>'price')::numeric, 0)) as total_rev
    FROM orders,
    jsonb_array_elements(items) as item
    WHERE restaurant_id = p_restaurant_id
      AND (p_from IS NULL OR created_at >= p_from)
      AND created_at <= p_to
      AND (p_branch_id IS NULL OR branch_id = p_branch_id)
      AND (p_order_source IS NULL OR order_source = p_order_source)
    GROUP BY item->>'name'
  ) t;

  -- Peak hours
  SELECT COALESCE(jsonb_agg(jsonb_build_object('hour', h || ':00', 'count', cnt) ORDER BY h), '[]'::jsonb) INTO v_peak_hours
  FROM (
    SELECT EXTRACT(HOUR FROM created_at)::int as h, COUNT(*) as cnt
    FROM orders
    WHERE restaurant_id = p_restaurant_id
      AND (p_from IS NULL OR created_at >= p_from)
      AND created_at <= p_to
      AND (p_branch_id IS NULL OR branch_id = p_branch_id)
      AND (p_order_source IS NULL OR order_source = p_order_source)
    GROUP BY EXTRACT(HOUR FROM created_at)
  ) t;

  -- Branch performance
  SELECT COALESCE(jsonb_agg(jsonb_build_object('branchId', COALESCE(bid, 'no_branch'), 'orders', cnt, 'revenue', rev)), '[]'::jsonb) INTO v_branch_perf
  FROM (
    SELECT branch_id::text as bid, COUNT(*) as cnt, COALESCE(SUM(total_price), 0) as rev
    FROM orders
    WHERE restaurant_id = p_restaurant_id
      AND (p_from IS NULL OR created_at >= p_from)
      AND created_at <= p_to
      AND (p_branch_id IS NULL OR branch_id = p_branch_id)
      AND (p_order_source IS NULL OR order_source = p_order_source)
    GROUP BY branch_id
  ) t;

  -- Build final result
  v_result := jsonb_build_object(
    'kpis', v_kpis,
    'timeSeriesData', v_time_series,
    'statusDistribution', v_status_dist,
    'paymentMethods', v_payment_methods,
    'allItems', v_all_items,
    'peakHours', v_peak_hours,
    'branchPerformance', v_branch_perf,
    'useWeekly', v_use_weekly
  );

  RETURN v_result;
END;
$$;
