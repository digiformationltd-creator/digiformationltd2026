
UPDATE public.client_orders co
   SET customer_email    = p.email,
       customer_name     = p.full_name,
       customer_whatsapp = COALESCE(co.customer_whatsapp, p.phone)
  FROM public.profiles p
 WHERE co.user_id = p.user_id
   AND co.id IN (
     'aecf9add-0d3f-4ce6-bc3b-c67e8515cb69',
     '71172708-3bcd-442b-9dab-547c74451ff8',
     '5cfc6297-420c-416f-bbe2-1783366e873f'
   );
