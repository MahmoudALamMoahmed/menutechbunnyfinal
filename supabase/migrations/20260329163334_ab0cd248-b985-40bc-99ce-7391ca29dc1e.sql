CREATE OR REPLACE VIEW public.public_restaurants
WITH (security_invoker = off)
AS
SELECT id, username, name, description, address, working_hours,
       logo_url, logo_public_id, cover_image_url, cover_image_public_id,
       facebook_url, instagram_url, owner_id, created_at, updated_at
FROM restaurants;