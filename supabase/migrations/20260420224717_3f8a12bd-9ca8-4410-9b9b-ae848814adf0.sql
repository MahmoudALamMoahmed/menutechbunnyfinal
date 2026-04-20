CREATE OR REPLACE FUNCTION public.get_public_restaurant_data(p_username text)
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
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
    ), '[]'::jsonb)
  ) INTO v_result;

  RETURN v_result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_public_restaurant_data(text) TO anon, authenticated;