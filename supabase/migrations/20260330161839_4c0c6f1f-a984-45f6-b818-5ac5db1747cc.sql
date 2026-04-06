
-- 1. Add SELECT policy for anon on restaurants table
CREATE POLICY "public_read_restaurants"
ON public.restaurants FOR SELECT TO anon
USING (true);

-- 2. Restrict anon to non-sensitive columns only
REVOKE SELECT ON public.restaurants FROM anon;
GRANT SELECT (
  id, username, name, description, address, working_hours,
  logo_url, logo_public_id, cover_image_url, cover_image_public_id,
  facebook_url, instagram_url, created_at, updated_at
) ON public.restaurants TO anon;

-- 3. Grant authenticated full SELECT (they already have RLS policies)
GRANT SELECT ON public.restaurants TO authenticated;

-- 4. Recreate view with security_invoker = on (includes owner_id for authenticated users)
DROP VIEW IF EXISTS public.public_restaurants;
CREATE VIEW public.public_restaurants
WITH (security_invoker = on) AS
SELECT
  id, owner_id, username, name, description, address, working_hours,
  logo_url, logo_public_id, cover_image_url, cover_image_public_id,
  facebook_url, instagram_url, created_at, updated_at
FROM restaurants;
