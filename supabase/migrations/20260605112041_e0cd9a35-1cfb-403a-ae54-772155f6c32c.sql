
CREATE OR REPLACE FUNCTION public.warn_zero_amount_order()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  catalog_price numeric;
BEGIN
  IF NEW.amount_gbp IS NULL OR NEW.amount_gbp = 0 THEN
    catalog_price := public.resolve_service_price(NEW.service);
    RAISE WARNING 'ORDER_ANOMALY_ZERO_AMOUNT order_ref=% source=% service=% resolved_catalog_price=%',
      NEW.order_ref, NEW.source, NEW.service, COALESCE(catalog_price, 0);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS warn_zero_amount_order_trg ON public.client_orders;
CREATE TRIGGER warn_zero_amount_order_trg
AFTER INSERT ON public.client_orders
FOR EACH ROW EXECUTE FUNCTION public.warn_zero_amount_order();

REVOKE EXECUTE ON FUNCTION public.warn_zero_amount_order() FROM PUBLIC, anon, authenticated;
