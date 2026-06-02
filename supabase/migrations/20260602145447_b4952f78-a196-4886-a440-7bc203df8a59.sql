SELECT cron.alter_job(
  job_id := (SELECT jobid FROM cron.job WHERE jobname = 'send-scheduled-reminders-daily' LIMIT 1),
  command := $$
  SELECT net.http_post(
    url := 'https://ltxopeehtajwxpbwbqfr.supabase.co/functions/v1/send-scheduled-reminders',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (
        SELECT decrypted_secret FROM vault.decrypted_secrets
        WHERE name = 'email_queue_service_role_key'
      )
    ),
    body := jsonb_build_object('triggered_at', now())
  ) AS request_id;
  $$
);