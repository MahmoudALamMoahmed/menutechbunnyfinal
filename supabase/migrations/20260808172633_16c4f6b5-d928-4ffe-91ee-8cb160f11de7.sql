REVOKE ALL PRIVILEGES ON TABLE public.public_restaurants FROM anon;
REVOKE ALL PRIVILEGES ON TABLE public.public_restaurants FROM authenticated;

GRANT SELECT ON TABLE public.public_restaurants TO anon;
GRANT SELECT ON TABLE public.public_restaurants TO authenticated;