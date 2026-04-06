
-- 1. Add period_start and period_end columns to subscription_transactions
ALTER TABLE public.subscription_transactions
  ADD COLUMN period_start timestamptz,
  ADD COLUMN period_end timestamptz;

-- 2. Backfill existing records (approximate: period_start = created_at, period_end = created_at + 30 days)
UPDATE public.subscription_transactions
SET period_start = created_at,
    period_end = created_at + interval '30 days'
WHERE period_start IS NULL;

-- 3. Update subscribe_to_plan function to store period_start and period_end
CREATE OR REPLACE FUNCTION public.subscribe_to_plan(p_restaurant_id uuid, p_plan_id uuid, p_auto_renew boolean DEFAULT true)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_plan RECORD;
  v_wallet RECORD;
  v_owner_id uuid;
  v_existing_sub RECORD;
  v_new_expires timestamp with time zone;
  v_period_start timestamp with time zone;
  v_period_end timestamp with time zone;
  v_tx_type text;
  v_sub_id uuid;
BEGIN
  SELECT * INTO v_plan FROM plans WHERE id = p_plan_id AND is_active = true;
  IF NOT FOUND THEN RETURN 'plan_not_found'; END IF;

  SELECT owner_id INTO v_owner_id FROM restaurants WHERE id = p_restaurant_id;
  IF NOT FOUND THEN RETURN 'restaurant_not_found'; END IF;

  SELECT * INTO v_wallet FROM wallets WHERE owner_id = v_owner_id FOR UPDATE;
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
