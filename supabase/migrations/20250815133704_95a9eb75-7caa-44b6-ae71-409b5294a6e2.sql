-- إضافة عمود facebook_url إلى جدول المطاعم
ALTER TABLE public.restaurants 
ADD COLUMN facebook_url text;