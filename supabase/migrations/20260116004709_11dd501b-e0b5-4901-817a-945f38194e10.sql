-- إضافة أعمدة أرقام الدفع الإلكتروني لجدول الفروع
ALTER TABLE public.branches
ADD COLUMN vodafone_cash text,
ADD COLUMN etisalat_cash text,
ADD COLUMN orange_cash text;