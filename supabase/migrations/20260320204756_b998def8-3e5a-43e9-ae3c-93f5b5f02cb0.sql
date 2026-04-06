
-- Function to enforce limits on categories
CREATE OR REPLACE FUNCTION public.enforce_category_limit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_limits RECORD;
  v_count int;
BEGIN
  SELECT * INTO v_limits FROM get_restaurant_limits(NEW.restaurant_id) LIMIT 1;
  IF v_limits.max_categories IS NOT NULL THEN
    SELECT COUNT(*) INTO v_count FROM categories WHERE restaurant_id = NEW.restaurant_id;
    IF v_count >= v_limits.max_categories THEN
      RAISE EXCEPTION 'Category limit reached for current plan';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

-- Function to enforce limits on menu_items
CREATE OR REPLACE FUNCTION public.enforce_menu_item_limit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_limits RECORD;
  v_count int;
BEGIN
  SELECT * INTO v_limits FROM get_restaurant_limits(NEW.restaurant_id) LIMIT 1;
  IF v_limits.max_items IS NOT NULL THEN
    SELECT COUNT(*) INTO v_count FROM menu_items WHERE restaurant_id = NEW.restaurant_id;
    IF v_count >= v_limits.max_items THEN
      RAISE EXCEPTION 'Menu item limit reached for current plan';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

-- Function to enforce limits on extras
CREATE OR REPLACE FUNCTION public.enforce_extras_limit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_limits RECORD;
  v_count int;
BEGIN
  SELECT * INTO v_limits FROM get_restaurant_limits(NEW.restaurant_id) LIMIT 1;
  IF v_limits.max_extras IS NOT NULL THEN
    SELECT COUNT(*) INTO v_count FROM extras WHERE restaurant_id = NEW.restaurant_id;
    IF v_count >= v_limits.max_extras THEN
      RAISE EXCEPTION 'Extras limit reached for current plan';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

-- Function to enforce limits on branches
CREATE OR REPLACE FUNCTION public.enforce_branch_limit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_limits RECORD;
  v_count int;
BEGIN
  SELECT * INTO v_limits FROM get_restaurant_limits(NEW.restaurant_id) LIMIT 1;
  IF v_limits.max_branches IS NOT NULL THEN
    SELECT COUNT(*) INTO v_count FROM branches WHERE restaurant_id = NEW.restaurant_id;
    IF v_count >= v_limits.max_branches THEN
      RAISE EXCEPTION 'Branch limit reached for current plan';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

-- Create triggers
CREATE TRIGGER trg_enforce_category_limit
  BEFORE INSERT ON categories
  FOR EACH ROW EXECUTE FUNCTION enforce_category_limit();

CREATE TRIGGER trg_enforce_menu_item_limit
  BEFORE INSERT ON menu_items
  FOR EACH ROW EXECUTE FUNCTION enforce_menu_item_limit();

CREATE TRIGGER trg_enforce_extras_limit
  BEFORE INSERT ON extras
  FOR EACH ROW EXECUTE FUNCTION enforce_extras_limit();

CREATE TRIGGER trg_enforce_branch_limit
  BEFORE INSERT ON branches
  FOR EACH ROW EXECUTE FUNCTION enforce_branch_limit();
