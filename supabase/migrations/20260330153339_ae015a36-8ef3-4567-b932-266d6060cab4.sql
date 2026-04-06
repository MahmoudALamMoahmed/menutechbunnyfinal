-- 1. إزالة سياسة INSERT للمالك من wallet_transactions
DROP POLICY "المالك ينشئ معاملات لمحفظته فقط" ON wallet_transactions;

-- 2. إضافة Trigger احترازي لفرض status = 'pending' وamount > 0
CREATE OR REPLACE FUNCTION enforce_pending_on_insert()
RETURNS trigger AS $$
BEGIN
  NEW.status := 'pending';
  IF NEW.amount <= 0 THEN
    RAISE EXCEPTION 'amount must be greater than 0';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_enforce_pending
BEFORE INSERT ON wallet_transactions
FOR EACH ROW EXECUTE FUNCTION enforce_pending_on_insert();