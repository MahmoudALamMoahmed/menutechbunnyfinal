-- تعيين REPLICA IDENTITY FULL لتفعيل RLS على Realtime
-- هذا يضمن إرسال الصف الكامل حتى يتمكن Supabase من تقييم سياسات SELECT
ALTER TABLE orders REPLICA IDENTITY FULL;