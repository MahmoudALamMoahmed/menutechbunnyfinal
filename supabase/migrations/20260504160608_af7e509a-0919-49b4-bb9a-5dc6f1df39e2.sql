-- ============ Offers Table ============
CREATE TABLE public.offers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurant_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  image_public_id TEXT,
  price NUMERIC NOT NULL DEFAULT 0,
  original_price NUMERIC,
  menu_item_id UUID,
  is_active BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_offers_restaurant_id ON public.offers(restaurant_id);
CREATE INDEX idx_offers_menu_item_id ON public.offers(menu_item_id);

ALTER TABLE public.offers ENABLE ROW LEVEL SECURITY;

-- العروض مرئية للجميع
CREATE POLICY "العروض مرئية للجميع"
ON public.offers FOR SELECT
USING (true);

-- صاحب المطعم يدير عروضه
CREATE POLICY "أصحاب المطاعم يديرون عروض مطعمهم"
ON public.offers FOR ALL
USING (EXISTS (
  SELECT 1 FROM restaurants
  WHERE restaurants.id = offers.restaurant_id
    AND restaurants.owner_id = auth.uid()
))
WITH CHECK (EXISTS (
  SELECT 1 FROM restaurants
  WHERE restaurants.id = offers.restaurant_id
    AND restaurants.owner_id = auth.uid()
));

-- Trigger لتحديث updated_at
CREATE TRIGGER update_offers_updated_at
BEFORE UPDATE ON public.offers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- ============ تحديث RPC get_public_restaurant_data لتشمل العروض ============
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