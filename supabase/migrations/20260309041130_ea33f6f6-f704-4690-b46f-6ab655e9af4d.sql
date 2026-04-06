ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS auto_renew boolean NOT NULL DEFAULT true;

-- Update get_restaurant_limits to return auto_renew
DROP FUNCTION IF EXISTS public.get_restaurant_limits(uuid);
CREATE OR REPLACE FUNCTION public.get_restaurant_limits(p_restaurant_id uuid)
 RETURNS TABLE(plan_id uuid, plan_name text, plan_name_ar text, max_categories integer, max_items integer, max_branches integer, max_extras integer, features jsonb, expires_at timestamp with time zone, is_subscribed boolean, auto_renew boolean)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_sub RECORD;
  v_free_plan RECORD;
BEGIN
  -- ابحث عن اشتراك فعال (غير منتهي)
  SELECT s.*, p.*
  INTO v_sub
  FROM subscriptions s
  JOIN plans p ON p.id = s.plan_id
  WHERE s.restaurant_id = p_restaurant_id
    AND s.status = 'active'
    AND s.expires_at > now()
  LIMIT 1;

  IF FOUND THEN
    RETURN QUERY
    SELECT 
      v_sub.plan_id,
      v_sub.name,
      v_sub.name_ar,
      v_sub.max_categories,
      v_sub.max_items,
      v_sub.max_branches,
      v_sub.max_extras,
      v_sub.features,
      v_sub.expires_at,
      true::boolean,
      v_sub.auto_renew;
  ELSE
    -- لم يوجد اشتراك فعال، أرجع الباقة المجانية
    SELECT * INTO v_free_plan FROM plans WHERE price_monthly = 0 AND is_active = true LIMIT 1;
    
    IF FOUND THEN
      RETURN QUERY
      SELECT 
        v_free_plan.id,
        v_free_plan.name,
        v_free_plan.name_ar,
        v_free_plan.max_categories,
        v_free_plan.max_items,
        v_free_plan.max_branches,
        v_free_plan.max_extras,
        v_free_plan.features,
        NULL::timestamp with time zone,
        false::boolean,
        false::boolean;
    END IF;
  END IF;
END;
$function$;

-- Update subscribe_to_plan to accept p_auto_renew
DROP FUNCTION IF EXISTS public.subscribe_to_plan(uuid, uuid);
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
  v_tx_type text;
  v_sub_id uuid;
BEGIN
  -- 1. جلب بيانات الباقة
  SELECT * INTO v_plan FROM plans WHERE id = p_plan_id AND is_active = true;
  IF NOT FOUND THEN
    RETURN 'plan_not_found';
  END IF;

  -- 2. جلب owner_id للمطعم
  SELECT owner_id INTO v_owner_id FROM restaurants WHERE id = p_restaurant_id;
  IF NOT FOUND THEN
    RETURN 'restaurant_not_found';
  END IF;

  -- 3. جلب محفظة المالك (مع قفل السجل)
  SELECT * INTO v_wallet FROM wallets WHERE owner_id = v_owner_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN 'wallet_not_found';
  END IF;

  -- 4. التحقق من الرصيد الكافي
  IF v_wallet.balance < v_plan.price_monthly THEN
    RETURN 'insufficient_balance';
  END IF;

  -- 5. جلب الاشتراك الحالي إن وجد
  SELECT * INTO v_existing_sub FROM subscriptions WHERE restaurant_id = p_restaurant_id FOR UPDATE;

  -- 6. تحديد نوع المعاملة وتاريخ الانتهاء الجديد
  IF FOUND AND v_existing_sub.status = 'active' AND v_existing_sub.expires_at > now() THEN
    -- تجديد أو ترقية
    IF v_existing_sub.plan_id = p_plan_id THEN
      v_tx_type := 'renew';
      v_new_expires := v_existing_sub.expires_at + interval '30 days';
    ELSE
      v_tx_type := 'upgrade';
      v_new_expires := now() + interval '30 days';
    END IF;
  ELSE
    -- اشتراك جديد
    v_tx_type := 'subscribe';
    v_new_expires := now() + interval '30 days';
  END IF;

  -- 7. خصم المبلغ من المحفظة
  UPDATE wallets
  SET balance = balance - v_plan.price_monthly,
      updated_at = now()
  WHERE id = v_wallet.id;

  -- 8. إنشاء أو تحديث الاشتراك
  IF FOUND AND v_existing_sub.id IS NOT NULL THEN
    UPDATE subscriptions
    SET plan_id = p_plan_id,
        status = 'active',
        expires_at = v_new_expires,
        auto_renew = p_auto_renew,
        updated_at = now()
    WHERE id = v_existing_sub.id
    RETURNING id INTO v_sub_id;
  ELSE
    INSERT INTO subscriptions (restaurant_id, plan_id, expires_at, auto_renew)
    VALUES (p_restaurant_id, p_plan_id, v_new_expires, p_auto_renew)
    RETURNING id INTO v_sub_id;
  END IF;

  -- 9. تسجيل معاملة الاشتراك
  INSERT INTO subscription_transactions (subscription_id, restaurant_id, plan_id, amount, type)
  VALUES (v_sub_id, p_restaurant_id, p_plan_id, v_plan.price_monthly, v_tx_type);

  RETURN 'success';
END;
$function$;

CREATE OR REPLACE FUNCTION public.toggle_auto_renew(p_restaurant_id uuid, p_auto_renew boolean)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  UPDATE subscriptions
  SET auto_renew = p_auto_renew,
      updated_at = now()
  WHERE restaurant_id = p_restaurant_id AND status = 'active';
END;
$function$;