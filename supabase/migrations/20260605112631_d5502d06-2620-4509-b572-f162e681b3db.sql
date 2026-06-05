
DELETE FROM public.invoices
 WHERE bill_to_email ILIKE 'ukverinsights@163.com'
   AND status = 'Unpaid'
   AND order_id NOT IN (SELECT id FROM public.client_orders);
