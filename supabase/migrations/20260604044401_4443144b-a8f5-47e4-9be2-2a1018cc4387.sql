SELECT pgmq.purge_queue('transactional_emails_dlq');
DELETE FROM public.email_send_log WHERE status = 'dlq';