
-- 1. فهارس الأداء على أعمدة الفلترة الأساسية
CREATE INDEX IF NOT EXISTS idx_orders_restaurant_id ON public.orders(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_orders_branch_id ON public.orders(branch_id);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_menu_items_restaurant_id ON public.menu_items(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_categories_restaurant_id ON public.categories(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_branches_restaurant_id ON public.branches(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_extras_restaurant_id ON public.extras(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_sizes_menu_item_id ON public.sizes(menu_item_id);
CREATE INDEX IF NOT EXISTS idx_delivery_areas_branch_id ON public.delivery_areas(branch_id);
CREATE INDEX IF NOT EXISTS idx_contact_leads_status ON public.contact_leads(status);
CREATE INDEX IF NOT EXISTS idx_contact_leads_created_at ON public.contact_leads(created_at DESC);

-- 2. دالة ذرية لتعديل رصيد المحفظة (بديل عن Read-Then-Write)
CREATE OR REPLACE FUNCTION public.adjust_wallet_balance(
  p_wallet_id uuid,
  p_amount numeric,
  p_type text -- 'add' أو 'subtract'
)
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_new_balance numeric;
BEGIN
  IF p_type = 'add' THEN
    UPDATE wallets
    SET balance = balance + p_amount, updated_at = now()
    WHERE id = p_wallet_id
    RETURNING balance INTO v_new_balance;
  ELSIF p_type = 'subtract' THEN
    UPDATE wallets
    SET balance = balance - p_amount, updated_at = now()
    WHERE id = p_wallet_id AND balance >= p_amount
    RETURNING balance INTO v_new_balance;
  ELSE
    RAISE EXCEPTION 'Invalid type: must be add or subtract';
  END IF;

  IF v_new_balance IS NULL THEN
    RAISE EXCEPTION 'Insufficient balance or wallet not found';
  END IF;

  RETURN v_new_balance;
END;
$$;

-- تقييد الوصول للدالة على super_admin فقط
REVOKE EXECUTE ON FUNCTION public.adjust_wallet_balance FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.adjust_wallet_balance TO authenticated;
