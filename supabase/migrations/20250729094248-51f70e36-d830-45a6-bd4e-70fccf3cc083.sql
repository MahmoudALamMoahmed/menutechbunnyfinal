-- إعادة تفعيل RLS على جدول الطلبات
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- حذف السياسات الموجودة
DROP POLICY IF EXISTS "allow_insert_orders_for_everyone" ON public.orders;
DROP POLICY IF EXISTS "أصحاب المطاعم يمكنهم تحديث طلبات م" ON public.orders;
DROP POLICY IF EXISTS "أصحاب المطاعم يمكنهم رؤية طلبات مط" ON public.orders;

-- سياسة للسماح للجميع بإدخال الطلبات (العملاء)
CREATE POLICY "allow_insert_orders_for_everyone" 
ON public.orders 
FOR INSERT 
WITH CHECK (true);

-- سياسة للسماح لأصحاب المطاعم برؤية طلبات مطاعمهم فقط
CREATE POLICY "restaurant_owners_can_view_their_orders" 
ON public.orders 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.restaurants 
    WHERE restaurants.id = orders.restaurant_id 
    AND restaurants.owner_id = auth.uid()
  )
);

-- سياسة للسماح لأصحاب المطاعم بتحديث طلبات مطاعمهم فقط
CREATE POLICY "restaurant_owners_can_update_their_orders" 
ON public.orders 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.restaurants 
    WHERE restaurants.id = orders.restaurant_id 
    AND restaurants.owner_id = auth.uid()
  )
);