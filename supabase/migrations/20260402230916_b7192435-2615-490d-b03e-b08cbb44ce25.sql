
-- 1. حذف السياسات المعتمدة على owner_id أولاً
DROP POLICY IF EXISTS "المالك يقرأ محفظته فقط" ON wallets;
DROP POLICY IF EXISTS "المالك ينشئ محفظته فقط" ON wallets;
DROP POLICY IF EXISTS "المالك يقرأ معاملاته فقط" ON wallet_transactions;

-- 2. إضافة العمود الجديد
ALTER TABLE wallets ADD COLUMN restaurant_id uuid;

-- 3. نقل البيانات
UPDATE wallets w
SET restaurant_id = r.id
FROM restaurants r
WHERE r.owner_id = w.owner_id;

-- 4. NOT NULL + FK + UNIQUE
ALTER TABLE wallets
  ALTER COLUMN restaurant_id SET NOT NULL,
  ADD CONSTRAINT wallets_restaurant_id_fkey
    FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE CASCADE,
  ADD CONSTRAINT wallets_restaurant_id_key UNIQUE (restaurant_id);

-- 5. حذف العمود القديم
ALTER TABLE wallets DROP COLUMN owner_id;

-- 6. إنشاء سياسات RLS الجديدة على wallets
CREATE POLICY "المالك يقرأ محفظته فقط" ON wallets
  FOR SELECT TO public
  USING (EXISTS (
    SELECT 1 FROM restaurants WHERE id = wallets.restaurant_id AND owner_id = auth.uid()
  ));

CREATE POLICY "المالك ينشئ محفظته فقط" ON wallets
  FOR INSERT TO public
  WITH CHECK (EXISTS (
    SELECT 1 FROM restaurants WHERE id = wallets.restaurant_id AND owner_id = auth.uid()
  ));

-- 7. سياسة RLS الجديدة على wallet_transactions
CREATE POLICY "المالك يقرأ معاملاته فقط" ON wallet_transactions
  FOR SELECT TO public
  USING (EXISTS (
    SELECT 1 FROM wallets w
    JOIN restaurants r ON r.id = w.restaurant_id
    WHERE w.id = wallet_transactions.wallet_id AND r.owner_id = auth.uid()
  ));

-- 8. تحديث دالة subscribe_to_plan
CREATE OR REPLACE FUNCTION public.subscribe_to_plan(p_restaurant_id uuid, p_plan_id uuid, p_auto_renew boolean DEFAULT true)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_plan RECORD;
  v_wallet RECORD;
  v_existing_sub RECORD;
  v_new_expires timestamp with time zone;
  v_period_start timestamp with time zone;
  v_period_end timestamp with time zone;
  v_tx_type text;
  v_sub_id uuid;
BEGIN
  SELECT * INTO v_plan FROM plans WHERE id = p_plan_id AND is_active = true;
  IF NOT FOUND THEN RETURN 'plan_not_found'; END IF;

  SELECT * INTO v_wallet FROM wallets WHERE restaurant_id = p_restaurant_id FOR UPDATE;
  IF NOT FOUND THEN RETURN 'wallet_not_found'; END IF;

  IF v_wallet.balance < v_plan.price_monthly THEN RETURN 'insufficient_balance'; END IF;

  SELECT * INTO v_existing_sub FROM subscriptions WHERE restaurant_id = p_restaurant_id FOR UPDATE;

  IF FOUND AND v_existing_sub.status = 'active' AND v_existing_sub.expires_at > now() THEN
    IF v_existing_sub.plan_id = p_plan_id THEN
      v_tx_type := 'renew';
      v_period_start := v_existing_sub.expires_at;
      v_period_end := v_existing_sub.expires_at + interval '30 days';
      v_new_expires := v_period_end;
    ELSE
      RETURN 'plan_change_not_allowed';
    END IF;
  ELSIF FOUND AND v_existing_sub.plan_id IS NOT NULL THEN
    v_tx_type := 'renew';
    v_period_start := now();
    v_period_end := now() + interval '30 days';
    v_new_expires := v_period_end;
  ELSE
    v_tx_type := 'subscribe';
    v_period_start := now();
    v_period_end := now() + interval '30 days';
    v_new_expires := v_period_end;
  END IF;

  UPDATE wallets SET balance = balance - v_plan.price_monthly, updated_at = now() WHERE id = v_wallet.id;

  IF FOUND AND v_existing_sub.id IS NOT NULL THEN
    UPDATE subscriptions
    SET plan_id = p_plan_id, status = 'active', expires_at = v_new_expires, auto_renew = p_auto_renew, updated_at = now()
    WHERE id = v_existing_sub.id
    RETURNING id INTO v_sub_id;
  ELSE
    INSERT INTO subscriptions (restaurant_id, plan_id, expires_at, auto_renew)
    VALUES (p_restaurant_id, p_plan_id, v_new_expires, p_auto_renew)
    RETURNING id INTO v_sub_id;
  END IF;

  INSERT INTO subscription_transactions (subscription_id, restaurant_id, plan_id, amount, type, period_start, period_end)
  VALUES (v_sub_id, p_restaurant_id, p_plan_id, v_plan.price_monthly, v_tx_type, v_period_start, v_period_end);

  RETURN 'success';
END;
$function$;
