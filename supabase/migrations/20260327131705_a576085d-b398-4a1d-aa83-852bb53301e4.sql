
-- 1. إنشاء نوع الأدوار
CREATE TYPE public.app_role AS ENUM ('super_admin');

-- 2. جدول الأدوار
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 3. دالة التحقق من الدور (SECURITY DEFINER)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- 4. سياسة قراءة الأدوار للـ super_admin فقط
CREATE POLICY "super_admin_read_roles"
ON public.user_roles FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'));

-- 5. سياسات RLS للـ super_admin على الجداول الرئيسية

-- restaurants: super_admin يقرأ جميع المطاعم
CREATE POLICY "super_admin_read_all_restaurants"
ON public.restaurants FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'));

-- wallets: super_admin يقرأ جميع المحافظ
CREATE POLICY "super_admin_read_all_wallets"
ON public.wallets FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'));

-- wallet_transactions: super_admin يقرأ جميع المعاملات
CREATE POLICY "super_admin_read_all_wallet_transactions"
ON public.wallet_transactions FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'));

-- subscriptions: super_admin يقرأ جميع الاشتراكات
CREATE POLICY "super_admin_read_all_subscriptions"
ON public.subscriptions FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'));

-- subscription_transactions: super_admin يقرأ جميع معاملات الاشتراكات
CREATE POLICY "super_admin_read_all_subscription_transactions"
ON public.subscription_transactions FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'));

-- orders: super_admin يقرأ جميع الطلبات
CREATE POLICY "super_admin_read_all_orders"
ON public.orders FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'));

-- plans: super_admin يمكنه إدارة الباقات
CREATE POLICY "super_admin_manage_plans"
ON public.plans FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'))
WITH CHECK (public.has_role(auth.uid(), 'super_admin'));
