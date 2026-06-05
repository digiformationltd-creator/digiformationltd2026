
CREATE TEMP TABLE _inq_emails ON COMMIT DROP AS
SELECT DISTINCT lower(customer_email) AS email
FROM public.client_orders
WHERE source = 'inquiry' AND customer_email IS NOT NULL;

CREATE TEMP TABLE _inq_phones ON COMMIT DROP AS
SELECT DISTINCT customer_whatsapp AS phone
FROM public.client_orders
WHERE source = 'inquiry' AND customer_whatsapp IS NOT NULL AND length(trim(customer_whatsapp)) > 0;

CREATE TEMP TABLE _inq_lead_ids ON COMMIT DROP AS
SELECT id FROM public.leads WHERE lower(email) IN (SELECT email FROM _inq_emails);

DELETE FROM public.whatsapp_message_log
 WHERE recipient_phone IN (SELECT phone FROM _inq_phones)
    OR related_entity_id::text IN (SELECT id::text FROM _inq_lead_ids);

DELETE FROM public.whatsapp_threads
 WHERE phone IN (SELECT phone FROM _inq_phones)
    OR related_lead_id IN (SELECT id FROM _inq_lead_ids);

DELETE FROM public.lead_activities WHERE lead_id IN (SELECT id FROM _inq_lead_ids);
DELETE FROM public.leads WHERE id IN (SELECT id FROM _inq_lead_ids);

DELETE FROM public.client_orders WHERE source = 'inquiry';
