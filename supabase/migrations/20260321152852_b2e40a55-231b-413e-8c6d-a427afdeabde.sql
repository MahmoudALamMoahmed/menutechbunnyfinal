-- Revoke execute on payment processing functions from all non-service roles
-- Only the service_role (used by the webhook edge function) should call these
REVOKE EXECUTE ON FUNCTION public.process_successful_payment FROM public;
REVOKE EXECUTE ON FUNCTION public.process_successful_payment FROM anon;
REVOKE EXECUTE ON FUNCTION public.process_successful_payment FROM authenticated;

REVOKE EXECUTE ON FUNCTION public.process_failed_payment FROM public;
REVOKE EXECUTE ON FUNCTION public.process_failed_payment FROM anon;
REVOKE EXECUTE ON FUNCTION public.process_failed_payment FROM authenticated;