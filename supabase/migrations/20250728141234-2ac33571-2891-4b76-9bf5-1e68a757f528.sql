-- إضافة حقل isConfirmed لجدول orders
ALTER TABLE public.orders 
ADD COLUMN is_confirmed boolean DEFAULT false;