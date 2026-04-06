
-- Revoke direct SELECT on email column from anon and authenticated
-- Then grant it back only through RLS owner policy
REVOKE SELECT (email) ON public.restaurants FROM anon;

-- Create a secure view for public restaurant data (without email)
CREATE OR REPLACE VIEW public.public_restaurants AS
SELECT 
  id, username, name, description, address, working_hours,
  logo_url, logo_public_id, cover_image_url, cover_image_public_id,
  facebook_url, instagram_url, owner_id, created_at, updated_at
FROM public.restaurants;

-- Grant SELECT on the view to anon and authenticated
GRANT SELECT ON public.public_restaurants TO anon;
GRANT SELECT ON public.public_restaurants TO authenticated;
