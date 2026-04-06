-- إزالة أعمدة الهاتف والواتساب والعنوان من جدول المطاعم
-- لأن هذه البيانات الآن موجودة في جدول الفروع

ALTER TABLE public.restaurants DROP COLUMN IF EXISTS phone;
ALTER TABLE public.restaurants DROP COLUMN IF EXISTS whatsapp_phone;
ALTER TABLE public.restaurants DROP COLUMN IF EXISTS address;