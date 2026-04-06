CREATE OR REPLACE FUNCTION enforce_pending_on_insert()
RETURNS trigger AS $$
BEGIN
  NEW.status := 'pending';
  IF NEW.amount <= 0 THEN
    RAISE EXCEPTION 'amount must be greater than 0';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;