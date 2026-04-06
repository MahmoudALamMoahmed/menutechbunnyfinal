-- إعادة إنشاء الـ view بدون owner_id لحل مشكلة صلاحيات anon
DROP VIEW IF EXISTS public.public_restaurants;
CREATE VIEW public.public_restaurants
WITH (security_invoker = on) AS
SELECT
  id, username, name, description, address, working_hours,
  logo_url, logo_public_id, cover_image_url, cover_image_public_id,
  facebook_url, instagram_url, created_at, updated_at
FROM restaurants;

GRANT SELECT ON public.public_restaurants TO anon;
GRANT SELECT ON public.public_restaurants TO authenticated;