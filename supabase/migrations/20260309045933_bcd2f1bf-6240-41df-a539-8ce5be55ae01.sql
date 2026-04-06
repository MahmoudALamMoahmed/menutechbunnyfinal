CREATE OR REPLACE FUNCTION public.toggle_auto_renew(p_restaurant_id uuid, p_auto_renew boolean)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  UPDATE subscriptions
  SET auto_renew = p_auto_renew,
      updated_at = now()
  WHERE restaurant_id = p_restaurant_id
    AND status IN ('active', 'expired');
END;
$function$;