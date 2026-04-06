SELECT cron.schedule(
  'auto-renew-subscriptions',
  '* * * * *',
  $$
  SELECT net.http_post(
    url := 'https://lpfzrsdqyqesjzfaxqwq.supabase.co/functions/v1/auto-renew-subscriptions',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxwZnpyc2RxeXFlc2p6ZmF4cXdxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA2NTA0MzksImV4cCI6MjA4NjIyNjQzOX0.GYZpV-ZRdFGOfCS1BcIb4d4DoZBaCvgW-ndv55WRXS4"}'::jsonb,
    body := '{}'::jsonb
  ) AS request_id;
  $$
);