-- إضافة الحقول الجديدة لبيانات الفوتر
ALTER TABLE public.restaurants 
ADD COLUMN delivery_phone text,
ADD COLUMN complaints_phone text,
ADD COLUMN email text,
ADD COLUMN instagram_url text,
ADD COLUMN working_hours text DEFAULT 'يومياً من 9 صباحاً إلى 11 مساءً';