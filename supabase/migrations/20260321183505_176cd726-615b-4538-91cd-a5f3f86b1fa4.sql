
-- Fix SECURITY DEFINER on the view by setting security_invoker
ALTER VIEW public.public_restaurants SET (security_invoker = on);

-- Add order validation trigger to prevent price manipulation
CREATE OR REPLACE FUNCTION public.validate_order_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Validate total_price is positive
  IF NEW.total_price <= 0 THEN
    RAISE EXCEPTION 'total_price must be greater than 0';
  END IF;

  -- Validate restaurant_id exists
  IF NOT EXISTS (SELECT 1 FROM restaurants WHERE id = NEW.restaurant_id) THEN
    RAISE EXCEPTION 'Invalid restaurant_id';
  END IF;

  -- Validate branch_id belongs to restaurant (if provided)
  IF NEW.branch_id IS NOT NULL THEN
    IF NOT EXISTS (SELECT 1 FROM branches WHERE id = NEW.branch_id AND restaurant_id = NEW.restaurant_id) THEN
      RAISE EXCEPTION 'Invalid branch_id for this restaurant';
    END IF;
  END IF;

  -- Validate customer_name and customer_phone are not empty
  IF trim(NEW.customer_name) = '' THEN
    RAISE EXCEPTION 'customer_name cannot be empty';
  END IF;

  IF trim(NEW.customer_phone) = '' THEN
    RAISE EXCEPTION 'customer_phone cannot be empty';
  END IF;

  -- Validate order_source
  IF NEW.order_source NOT IN ('dashboard', 'whatsapp') THEN
    RAISE EXCEPTION 'Invalid order_source';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER validate_order_before_insert
  BEFORE INSERT ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_order_insert();
