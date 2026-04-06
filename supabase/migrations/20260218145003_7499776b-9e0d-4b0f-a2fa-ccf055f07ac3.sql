
-- إنشاء جدول branch_staff لربط مستخدمي Supabase Auth بالفروع
CREATE TABLE public.branch_staff (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  branch_id uuid NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE,
  restaurant_id uuid NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  email text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- تفعيل RLS
ALTER TABLE public.branch_staff ENABLE ROW LEVEL SECURITY;

-- دوال Security Definer لتجنب recursion في RLS
CREATE OR REPLACE FUNCTION public.get_staff_branch_id(_user_id uuid)
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public AS $$
  SELECT branch_id FROM public.branch_staff WHERE user_id = _user_id
$$;

CREATE OR REPLACE FUNCTION public.get_staff_restaurant_id(_user_id uuid)
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public AS $$
  SELECT restaurant_id FROM public.branch_staff WHERE user_id = _user_id
$$;

CREATE OR REPLACE FUNCTION public.is_branch_staff(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.branch_staff WHERE user_id = _user_id)
$$;

-- RLS Policies على branch_staff
CREATE POLICY "owners_manage_branch_staff" ON public.branch_staff
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.restaurants
    WHERE restaurants.id = branch_staff.restaurant_id
    AND restaurants.owner_id = auth.uid()
  )
);

CREATE POLICY "staff_see_own_record" ON public.branch_staff
FOR SELECT USING (user_id = auth.uid());

-- إضافة RLS Policies لموظفي الفروع على جدول orders
CREATE POLICY "branch_staff_can_view_their_branch_orders"
ON public.orders FOR SELECT
USING (
  public.is_branch_staff(auth.uid()) AND
  branch_id = public.get_staff_branch_id(auth.uid())
);

CREATE POLICY "branch_staff_can_update_their_branch_orders"
ON public.orders FOR UPDATE
USING (
  public.is_branch_staff(auth.uid()) AND
  branch_id = public.get_staff_branch_id(auth.uid())
);
