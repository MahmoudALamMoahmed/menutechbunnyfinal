-- إضافة أعمدة public_id لجدول restaurants
ALTER TABLE public.restaurants
ADD COLUMN IF NOT EXISTS cover_image_public_id TEXT,
ADD COLUMN IF NOT EXISTS logo_public_id TEXT;

-- إضافة عمود public_id لجدول menu_items
ALTER TABLE public.menu_items
ADD COLUMN IF NOT EXISTS image_public_id TEXT;