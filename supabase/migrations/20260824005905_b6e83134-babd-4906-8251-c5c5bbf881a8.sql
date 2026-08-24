REVOKE INSERT ON TABLE public.orders FROM anon;
REVOKE INSERT ON TABLE public.orders FROM authenticated;

DROP POLICY IF EXISTS anyone_can_insert_orders ON public.orders;

GRANT EXECUTE ON FUNCTION public.create_order(text, uuid, uuid, text, text, text, text, text, jsonb, text) TO anon, authenticated;
GRANT ALL ON TABLE public.orders TO service_role;