
-- 1) جدول الأنواع (Variants) - مثل sizes لكن السعر اختياري
CREATE TABLE public.item_variants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  menu_item_id uuid NOT NULL REFERENCES public.menu_items(id) ON DELETE CASCADE,
  name text NOT NULL,
  price numeric NULL,
  display_order integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_item_variants_menu_item_id ON public.item_variants(menu_item_id);

GRANT SELECT ON public.item_variants TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.item_variants TO authenticated;
GRANT ALL ON public.item_variants TO service_role;

ALTER TABLE public.item_variants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "الأنواع مرئية للجميع"
  ON public.item_variants
  FOR SELECT
  USING (true);

CREATE POLICY "أصحاب المطاعم يمكنهم إدارة أنواع أصنافهم"
  ON public.item_variants
  FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.menu_items mi
    JOIN public.restaurants r ON r.id = mi.restaurant_id
    WHERE mi.id = item_variants.menu_item_id
      AND r.owner_id = auth.uid()
  ));

CREATE TRIGGER update_item_variants_updated_at
  BEFORE UPDATE ON public.item_variants
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2) تحديث batch_update_display_order للسماح بـ item_variants
CREATE OR REPLACE FUNCTION public.batch_update_display_order(p_table_name text, p_items jsonb)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_item jsonb;
  v_id uuid;
  v_order int;
BEGIN
  IF p_table_name NOT IN ('categories', 'menu_items', 'extras', 'branches', 'delivery_areas', 'sizes', 'item_variants') THEN
    RAISE EXCEPTION 'Invalid table name: %', p_table_name;
  END IF;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_id := (v_item->>'id')::uuid;
    v_order := (v_item->>'display_order')::int;
    EXECUTE format('UPDATE %I SET display_order = $1 WHERE id = $2', p_table_name)
    USING v_order, v_id;
  END LOOP;
END;
$function$;

-- 3) تحديث RPC العامة لإضافة item_variants
CREATE OR REPLACE FUNCTION public.get_public_restaurant_data(p_username text)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_restaurant record;
  v_result jsonb;
BEGIN
  SELECT * INTO v_restaurant
  FROM public_restaurants
  WHERE username = p_username
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  SELECT jsonb_build_object(
    'restaurant', to_jsonb(v_restaurant),
    'categories', COALESCE((
      SELECT jsonb_agg(to_jsonb(c) ORDER BY c.display_order)
      FROM categories c WHERE c.restaurant_id = v_restaurant.id
    ), '[]'::jsonb),
    'menu_items', COALESCE((
      SELECT jsonb_agg(to_jsonb(m) ORDER BY m.display_order)
      FROM menu_items m
      WHERE m.restaurant_id = v_restaurant.id AND m.is_available = true
    ), '[]'::jsonb),
    'sizes', COALESCE((
      SELECT jsonb_agg(to_jsonb(s) ORDER BY s.display_order)
      FROM sizes s
      JOIN menu_items mi ON mi.id = s.menu_item_id
      WHERE mi.restaurant_id = v_restaurant.id
    ), '[]'::jsonb),
    'item_variants', COALESCE((
      SELECT jsonb_agg(to_jsonb(v) ORDER BY v.display_order)
      FROM item_variants v
      JOIN menu_items mi ON mi.id = v.menu_item_id
      WHERE mi.restaurant_id = v_restaurant.id
    ), '[]'::jsonb),
    'extras', COALESCE((
      SELECT jsonb_agg(to_jsonb(e) ORDER BY e.display_order)
      FROM extras e
      WHERE e.restaurant_id = v_restaurant.id AND e.is_available = true
    ), '[]'::jsonb),
    'branches', COALESCE((
      SELECT jsonb_agg(to_jsonb(b) ORDER BY b.display_order)
      FROM branches b
      WHERE b.restaurant_id = v_restaurant.id AND b.is_active = true
    ), '[]'::jsonb),
    'delivery_areas', COALESCE((
      SELECT jsonb_agg(to_jsonb(d) ORDER BY d.display_order)
      FROM delivery_areas d
      JOIN branches b ON b.id = d.branch_id
      WHERE b.restaurant_id = v_restaurant.id
        AND b.is_active = true
        AND d.is_active = true
    ), '[]'::jsonb),
    'offers', COALESCE((
      SELECT jsonb_agg(to_jsonb(o) ORDER BY o.display_order)
      FROM offers o
      WHERE o.restaurant_id = v_restaurant.id AND o.is_active = true
    ), '[]'::jsonb)
  ) INTO v_result;

  RETURN v_result;
END;
$function$;
