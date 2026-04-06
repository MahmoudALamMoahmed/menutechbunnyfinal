
-- Create branch_payment_methods table
CREATE TABLE public.branch_payment_methods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id uuid NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE,
  name text NOT NULL,
  account_number text NOT NULL,
  display_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.branch_payment_methods ENABLE ROW LEVEL SECURITY;

-- Public read
CREATE POLICY "طرق الدفع مرئية للجميع"
ON public.branch_payment_methods
FOR SELECT
USING (true);

-- Owner manage
CREATE POLICY "أصحاب المطاعم يمكنهم إدارة طرق الدفع"
ON public.branch_payment_methods
FOR ALL
USING (
  EXISTS (
    SELECT 1
    FROM branches
    JOIN restaurants ON restaurants.id = branches.restaurant_id
    WHERE branches.id = branch_payment_methods.branch_id
    AND restaurants.owner_id = auth.uid()
  )
);

-- Drop old columns from branches
ALTER TABLE public.branches DROP COLUMN IF EXISTS vodafone_cash;
ALTER TABLE public.branches DROP COLUMN IF EXISTS etisalat_cash;
ALTER TABLE public.branches DROP COLUMN IF EXISTS orange_cash;
