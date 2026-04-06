-- إصلاح سياسة إدراج الطلبات للزبائن غير المسجلين
DROP POLICY IF EXISTS "يمكن للجميع إنشاء طلبات" ON orders;

-- إنشاء سياسة جديدة للإدراج تسمح للجميع بإنشاء الطلبات
CREATE POLICY "allow_insert_orders_for_everyone" 
ON orders 
FOR INSERT 
WITH CHECK (true);

-- التأكد من تفعيل RLS على جدول الطلبات
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;