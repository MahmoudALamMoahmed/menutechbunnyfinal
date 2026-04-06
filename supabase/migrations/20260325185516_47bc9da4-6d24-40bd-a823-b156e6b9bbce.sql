-- حذف سياسة SELECT العامة القديمة
DROP POLICY IF EXISTS "المطاعم مرئية للجميع" ON public.restaurants;

-- إنشاء سياسة SELECT جديدة: المالك فقط يقرأ بياناته
CREATE POLICY "المالك يقرأ مطعمه فقط"
ON public.restaurants
FOR SELECT
TO authenticated
USING (auth.uid() = owner_id);

-- السماح لموظفي الفروع بقراءة مطعمهم
CREATE POLICY "موظف الفرع يقرأ مطعمه"
ON public.restaurants
FOR SELECT
TO authenticated
USING (public.get_staff_restaurant_id(auth.uid()) = id);