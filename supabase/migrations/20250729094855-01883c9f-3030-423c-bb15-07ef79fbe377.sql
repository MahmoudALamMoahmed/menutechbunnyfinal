-- إزالة كل السياسات الموجودة على جدول الطلبات
DROP POLICY IF EXISTS "allow_insert_orders_for_everyone" ON public.orders;
DROP POLICY IF EXISTS "restaurant_owners_can_view_their_orders" ON public.orders;
DROP POLICY IF EXISTS "restaurant_owners_can_update_their_orders" ON public.orders;

-- سياسة للسماح للجميع (حتى بدون تسجيل دخول) بإدراج الطلبات
CREATE POLICY "anyone_can_insert_orders" 
ON public.orders 
FOR INSERT 
WITH CHECK (true);

-- سياسة للسماح لأصحاب المطاعم برؤية طلبات مطاعمهم فقط
CREATE POLICY "restaurant_owners_can_view_their_orders" 
ON public.orders 
FOR SELECT 
USING (
  auth.uid() IS NOT NULL AND
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
  auth.uid() IS NOT NULL AND
  EXISTS (
    SELECT 1 FROM public.restaurants 
    WHERE restaurants.id = orders.restaurant_id 
    AND restaurants.owner_id = auth.uid()
  )
);