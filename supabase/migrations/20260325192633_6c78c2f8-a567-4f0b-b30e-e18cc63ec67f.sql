-- إضافة LIMIT 1 لدوال موظفي الفروع
CREATE OR REPLACE FUNCTION public.get_staff_branch_id(_user_id uuid)
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$ SELECT branch_id FROM public.branch_staff WHERE user_id = _user_id LIMIT 1 $$;

CREATE OR REPLACE FUNCTION public.get_staff_restaurant_id(_user_id uuid)
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$ SELECT restaurant_id FROM public.branch_staff WHERE user_id = _user_id LIMIT 1 $$;