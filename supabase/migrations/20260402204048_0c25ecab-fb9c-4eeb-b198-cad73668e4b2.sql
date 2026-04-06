
CREATE OR REPLACE FUNCTION public.batch_update_display_order(
  p_table_name text,
  p_items jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_item jsonb;
  v_id uuid;
  v_order int;
BEGIN
  -- Validate table name to prevent SQL injection
  IF p_table_name NOT IN ('categories', 'menu_items', 'extras', 'branches', 'delivery_areas') THEN
    RAISE EXCEPTION 'Invalid table name: %', p_table_name;
  END IF;

  -- Loop through items and update display_order
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_id := (v_item->>'id')::uuid;
    v_order := (v_item->>'display_order')::int;
    
    EXECUTE format('UPDATE %I SET display_order = $1 WHERE id = $2', p_table_name)
    USING v_order, v_id;
  END LOOP;
END;
$$;
