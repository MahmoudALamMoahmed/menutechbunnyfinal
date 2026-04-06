
-- 1. إضافة عمود expires_at لجدول wallet_transactions
ALTER TABLE public.wallet_transactions
ADD COLUMN expires_at timestamp with time zone;

-- 2. إنشاء دالة إنهاء المعاملات المعلقة المنتهية
CREATE OR REPLACE FUNCTION public.expire_pending_transactions()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_count integer;
BEGIN
  UPDATE wallet_transactions
  SET status = 'expired'
  WHERE status = 'pending'
    AND expires_at IS NOT NULL
    AND expires_at < now();
  
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;
