
-- جدول المحافظ
CREATE TABLE public.wallets (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id uuid NOT NULL UNIQUE,
  balance numeric(12,2) NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- تفعيل RLS
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;

-- سياسات الأمان
CREATE POLICY "المالك يقرأ محفظته فقط"
  ON public.wallets FOR SELECT
  USING (owner_id = auth.uid());

CREATE POLICY "المالك ينشئ محفظته فقط"
  ON public.wallets FOR INSERT
  WITH CHECK (owner_id = auth.uid());

-- trigger لتحديث updated_at
CREATE TRIGGER update_wallets_updated_at
  BEFORE UPDATE ON public.wallets
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- جدول معاملات المحفظة
CREATE TABLE public.wallet_transactions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  wallet_id uuid NOT NULL REFERENCES public.wallets(id) ON DELETE CASCADE,
  amount numeric(12,2) NOT NULL,
  type text NOT NULL DEFAULT 'topup',
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'success', 'failed')),
  kashier_order_id text UNIQUE,
  kashier_session_id text,
  payment_method text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Index للأداء
CREATE INDEX idx_wallet_transactions_wallet_id ON public.wallet_transactions(wallet_id);

-- تفعيل RLS
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;

-- سياسات الأمان - المالك يقرأ معاملاته فقط
CREATE POLICY "المالك يقرأ معاملاته فقط"
  ON public.wallet_transactions FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.wallets
    WHERE wallets.id = wallet_transactions.wallet_id
      AND wallets.owner_id = auth.uid()
  ));

CREATE POLICY "المالك ينشئ معاملات لمحفظته فقط"
  ON public.wallet_transactions FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.wallets
    WHERE wallets.id = wallet_transactions.wallet_id
      AND wallets.owner_id = auth.uid()
  ));

-- دالة معالجة الدفع الناجح (Atomic + Idempotent + Amount Validation)
CREATE OR REPLACE FUNCTION public.process_successful_payment(
  p_kashier_order_id text,
  p_amount numeric,
  p_payment_method text DEFAULT NULL
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_tx RECORD;
BEGIN
  -- 1. قفل السجل لمنع التكرار
  SELECT wt.*, w.id as w_id
  INTO v_tx
  FROM wallet_transactions wt
  JOIN wallets w ON w.id = wt.wallet_id
  WHERE wt.kashier_order_id = p_kashier_order_id
  FOR UPDATE OF wt;

  -- لم يتم العثور على المعاملة
  IF NOT FOUND THEN
    RETURN 'not_found';
  END IF;

  -- 2. إذا تمت المعالجة بالفعل
  IF v_tx.status = 'success' THEN
    RETURN 'already_processed';
  END IF;

  -- 3. التحقق من تطابق المبلغ
  IF v_tx.amount != p_amount THEN
    RETURN 'amount_mismatch';
  END IF;

  -- 4. تحديث حالة المعاملة
  UPDATE wallet_transactions
  SET status = 'success',
      payment_method = COALESCE(p_payment_method, payment_method)
  WHERE id = v_tx.id;

  -- 5. زيادة رصيد المحفظة بالمبلغ الأصلي
  UPDATE wallets
  SET balance = balance + v_tx.amount,
      updated_at = now()
  WHERE id = v_tx.w_id;

  RETURN 'success';
END;
$$;

-- دالة تحديث حالة المعاملة للفشل
CREATE OR REPLACE FUNCTION public.process_failed_payment(
  p_kashier_order_id text
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_tx RECORD;
BEGIN
  SELECT * INTO v_tx
  FROM wallet_transactions
  WHERE kashier_order_id = p_kashier_order_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN 'not_found';
  END IF;

  IF v_tx.status = 'success' THEN
    RETURN 'already_processed';
  END IF;

  UPDATE wallet_transactions
  SET status = 'failed'
  WHERE id = v_tx.id;

  RETURN 'failed';
END;
$$;
