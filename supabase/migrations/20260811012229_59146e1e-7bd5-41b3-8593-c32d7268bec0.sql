CREATE OR REPLACE FUNCTION public.create_order(
  p_restaurant_username text,
  p_branch_id uuid,
  p_delivery_area_id uuid,
  p_customer_name text,
  p_customer_phone text,
  p_customer_address text,
  p_payment_method text,
  p_order_source text,
  p_items jsonb,
  p_notes text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_rid uuid;
  v_name text;
  v_phone text;
  v_address text;
  v_notes text;
  v_branch record;
  v_area record;
  v_branch_name text;
  v_area_name text;
  v_delivery_fee numeric := 0;
  v_has_branches boolean;
  v_has_areas boolean;
  v_item jsonb;
  v_qty int;
  v_menu_item_id uuid;
  v_offer_id uuid;
  v_size_id uuid;
  v_variant_id uuid;
  v_extra_ids uuid[];
  v_extra_id uuid;
  v_mi record;
  v_offer record;
  v_ref_item_id uuid;
  v_line_name text;
  v_base numeric;
  v_variant_price numeric := 0;
  v_extras_total numeric := 0;
  v_size_json jsonb;
  v_variant_json jsonb;
  v_extras_json jsonb;
  v_size record;
  v_variant record;
  v_extra record;
  v_unit numeric;
  v_line numeric;
  v_subtotal numeric := 0;
  v_items_out jsonb := '[]'::jsonb;
  v_is_offer boolean;
  v_size_count int;
  v_variant_count int;
  v_recent int;
  v_order_id uuid;
  v_limits record;
  v_persist boolean := true;
BEGIN
  SELECT id INTO v_rid FROM restaurants WHERE username = p_restaurant_username;
  IF v_rid IS NULL THEN RAISE EXCEPTION 'RESTAURANT_NOT_FOUND'; END IF;

  v_name := btrim(coalesce(p_customer_name, ''));
  v_phone := btrim(coalesce(p_customer_phone, ''));
  v_address := btrim(coalesce(p_customer_address, ''));
  IF v_name = '' OR length(v_name) > 100
     OR v_address = '' OR length(v_address) > 300
     OR v_phone !~ '^[0-9+\s-]{7,20}$' THEN
    RAISE EXCEPTION 'INVALID_CUSTOMER_DATA';
  END IF;
  v_notes := nullif(btrim(coalesce(p_notes, '')), '');
  IF v_notes IS NOT NULL THEN v_notes := left(v_notes, 500); END IF;

  IF p_order_source IS NULL OR p_order_source NOT IN ('dashboard', 'whatsapp') THEN
    RAISE EXCEPTION 'INVALID_ORDER_SOURCE';
  END IF;

  SELECT EXISTS (SELECT 1 FROM branches WHERE restaurant_id = v_rid AND is_active) INTO v_has_branches;
  IF p_branch_id IS NOT NULL THEN
    SELECT * INTO v_branch FROM branches
      WHERE id = p_branch_id AND restaurant_id = v_rid AND is_active;
    IF NOT FOUND THEN RAISE EXCEPTION 'INVALID_BRANCH'; END IF;
    v_branch_name := v_branch.name;
  ELSIF v_has_branches THEN
    RAISE EXCEPTION 'BRANCH_REQUIRED';
  END IF;

  IF p_branch_id IS NOT NULL THEN
    SELECT EXISTS (SELECT 1 FROM delivery_areas WHERE branch_id = p_branch_id AND is_active) INTO v_has_areas;
  ELSE
    v_has_areas := false;
  END IF;
  IF p_delivery_area_id IS NOT NULL THEN
    SELECT * INTO v_area FROM delivery_areas
      WHERE id = p_delivery_area_id AND branch_id = p_branch_id AND is_active;
    IF NOT FOUND THEN RAISE EXCEPTION 'INVALID_DELIVERY_AREA'; END IF;
    v_delivery_fee := v_area.delivery_price;
    v_area_name := v_area.name;
  ELSIF v_has_areas THEN
    RAISE EXCEPTION 'DELIVERY_AREA_REQUIRED';
  END IF;

  IF coalesce(p_payment_method, 'cash') <> 'cash' THEN
    IF p_branch_id IS NULL OR NOT EXISTS (
      SELECT 1 FROM branch_payment_methods
      WHERE branch_id = p_branch_id AND name = p_payment_method AND coalesce(is_active, true)
    ) THEN
      RAISE EXCEPTION 'INVALID_PAYMENT_METHOD';
    END IF;
  END IF;

  IF p_items IS NULL OR jsonb_typeof(p_items) <> 'array' OR jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'EMPTY_CART';
  END IF;
  IF jsonb_array_length(p_items) > 50 THEN RAISE EXCEPTION 'TOO_MANY_ITEMS'; END IF;

  SELECT count(*) INTO v_recent FROM orders
    WHERE restaurant_id = v_rid AND customer_phone = v_phone AND created_at > now() - interval '1 minute';
  IF v_recent >= 3 THEN RAISE EXCEPTION 'RATE_LIMITED'; END IF;
  SELECT count(*) INTO v_recent FROM orders
    WHERE restaurant_id = v_rid AND customer_phone = v_phone AND created_at > now() - interval '1 hour';
  IF v_recent >= 20 THEN RAISE EXCEPTION 'RATE_LIMITED'; END IF;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_menu_item_id := nullif(v_item->>'menu_item_id', '')::uuid;
    v_offer_id := nullif(v_item->>'offer_id', '')::uuid;
    v_size_id := nullif(v_item->>'size_id', '')::uuid;
    v_variant_id := nullif(v_item->>'variant_id', '')::uuid;
    v_qty := coalesce(nullif(v_item->>'quantity', '')::int, 0);

    IF (v_menu_item_id IS NULL) = (v_offer_id IS NULL) THEN
      RAISE EXCEPTION 'INVALID_ITEM_REFERENCE';
    END IF;
    IF v_qty < 1 OR v_qty > 99 THEN RAISE EXCEPTION 'INVALID_QUANTITY'; END IF;

    v_variant_price := 0;
    v_extras_total := 0;
    v_size_json := NULL;
    v_variant_json := NULL;
    v_extras_json := NULL;

    IF v_offer_id IS NOT NULL THEN
      SELECT * INTO v_offer FROM offers
        WHERE id = v_offer_id AND restaurant_id = v_rid AND is_active;
      IF NOT FOUND THEN RAISE EXCEPTION 'INVALID_OFFER'; END IF;
      v_base := v_offer.price;
      v_line_name := v_offer.title;
      v_ref_item_id := v_offer.menu_item_id;
      v_is_offer := true;
    ELSE
      SELECT * INTO v_mi FROM menu_items
        WHERE id = v_menu_item_id AND restaurant_id = v_rid AND coalesce(is_available, true);
      IF NOT FOUND THEN RAISE EXCEPTION 'INVALID_MENU_ITEM'; END IF;
      v_base := v_mi.price;
      v_line_name := v_mi.name;
      v_ref_item_id := v_mi.id;
      v_is_offer := false;
    END IF;

    IF v_ref_item_id IS NULL THEN
      v_size_count := 0;
      v_variant_count := 0;
    ELSE
      SELECT count(*) INTO v_size_count FROM sizes WHERE menu_item_id = v_ref_item_id;
      SELECT count(*) INTO v_variant_count FROM item_variants WHERE menu_item_id = v_ref_item_id;
    END IF;

    IF v_size_id IS NOT NULL THEN
      IF v_ref_item_id IS NULL THEN RAISE EXCEPTION 'INVALID_SIZE'; END IF;
      SELECT * INTO v_size FROM sizes WHERE id = v_size_id AND menu_item_id = v_ref_item_id;
      IF NOT FOUND THEN RAISE EXCEPTION 'INVALID_SIZE'; END IF;
      IF NOT v_is_offer THEN v_base := v_size.price; END IF;
      v_size_json := jsonb_build_object('id', v_size.id, 'name', v_size.name, 'price', v_size.price);
    ELSIF v_size_count > 1 AND NOT v_is_offer THEN
      RAISE EXCEPTION 'SIZE_REQUIRED';
    END IF;

    IF v_variant_id IS NOT NULL THEN
      IF v_ref_item_id IS NULL THEN RAISE EXCEPTION 'INVALID_VARIANT'; END IF;
      SELECT * INTO v_variant FROM item_variants WHERE id = v_variant_id AND menu_item_id = v_ref_item_id;
      IF NOT FOUND THEN RAISE EXCEPTION 'INVALID_VARIANT'; END IF;
      v_variant_price := coalesce(v_variant.price, 0);
      v_variant_json := jsonb_build_object('id', v_variant.id, 'name', v_variant.name, 'price', v_variant.price);
    ELSIF v_variant_count > 0 THEN
      RAISE EXCEPTION 'VARIANT_REQUIRED';
    END IF;

    IF v_item ? 'extra_ids' AND jsonb_typeof(v_item->'extra_ids') = 'array' THEN
      IF jsonb_array_length(v_item->'extra_ids') > 20 THEN RAISE EXCEPTION 'TOO_MANY_EXTRAS'; END IF;
      SELECT array_agg(DISTINCT x::uuid) INTO v_extra_ids
        FROM jsonb_array_elements_text(v_item->'extra_ids') AS t(x);
    ELSE
      v_extra_ids := NULL;
    END IF;

    IF v_extra_ids IS NOT NULL THEN
      v_extras_json := '[]'::jsonb;
      FOREACH v_extra_id IN ARRAY v_extra_ids
      LOOP
        SELECT * INTO v_extra FROM extras
          WHERE id = v_extra_id AND restaurant_id = v_rid AND coalesce(is_available, true);
        IF NOT FOUND THEN RAISE EXCEPTION 'INVALID_EXTRA'; END IF;
        v_extras_total := v_extras_total + v_extra.price;
        v_extras_json := v_extras_json || jsonb_build_object('id', v_extra.id, 'name', v_extra.name, 'price', v_extra.price);
      END LOOP;
    END IF;

    v_unit := round(v_base + v_variant_price + v_extras_total, 2);
    IF v_unit <= 0 THEN RAISE EXCEPTION 'INVALID_PRICE'; END IF;
    v_line := round(v_unit * v_qty, 2);
    v_subtotal := v_subtotal + v_line;

    v_items_out := v_items_out || jsonb_strip_nulls(jsonb_build_object(
      'id', coalesce(v_ref_item_id::text, 'offer:' || v_offer_id::text),
      'name', v_line_name,
      'price', v_unit,
      'quantity', v_qty,
      'total', v_line,
      'size', v_size_json,
      'variant', v_variant_json,
      'extras', v_extras_json,
      'is_offer', CASE WHEN v_is_offer THEN true ELSE NULL END,
      'offer_id', v_offer_id
    ));
  END LOOP;

  IF v_subtotal <= 0 THEN RAISE EXCEPTION 'INVALID_PRICE'; END IF;

  IF p_order_source = 'whatsapp' THEN
    SELECT * INTO v_limits FROM get_restaurant_limits(v_rid) LIMIT 1;
    IF coalesce((v_limits.features->>'dashboard_orders')::boolean, false) = false THEN
      v_persist := false;
    END IF;
  END IF;

  IF v_persist THEN
    INSERT INTO orders (
      restaurant_id, branch_id, delivery_area_id,
      customer_name, customer_phone, customer_address,
      payment_method, items, total_price, notes, status, order_source
    ) VALUES (
      v_rid, p_branch_id, p_delivery_area_id,
      v_name, v_phone, v_address,
      coalesce(p_payment_method, 'cash'), v_items_out, v_subtotal + v_delivery_fee,
      nullif(concat_ws(' - ',
        CASE WHEN v_area_name IS NOT NULL THEN 'المنطقة: ' || v_area_name END,
        CASE WHEN v_branch_name IS NOT NULL THEN 'الفرع: ' || v_branch_name END,
        v_notes
      ), ''),
      'pending', p_order_source
    ) RETURNING id INTO v_order_id;
  END IF;

  RETURN jsonb_build_object(
    'order_id', v_order_id,
    'persisted', v_persist,
    'subtotal', v_subtotal,
    'delivery_fee', v_delivery_fee,
    'total_price', v_subtotal + v_delivery_fee,
    'branch_name', v_branch_name,
    'area_name', v_area_name,
    'items', v_items_out
  );
END;
$function$;

REVOKE ALL ON FUNCTION public.create_order(text, uuid, uuid, text, text, text, text, text, jsonb, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_order(text, uuid, uuid, text, text, text, text, text, jsonb, text) TO anon, authenticated, service_role;