-- Option 1: Sequential processing (RECOMMENDED)
-- Schedule a combined job that runs WMS first, then AL_HOST
SELECT cron.schedule(
    'sequential-processor-every-ten-seconds',  -- unique job name
    '10 seconds',                          -- cron expression: every 10 Seconds
    'SELECT sequential_message_processor();'  -- the function to call
);

-- Schedule a daily cleanup at 2 AM UTC
SELECT cron.schedule(
    'cleanup_cron_job_log',
    '0 2 * * *',                      
    $$
    DELETE FROM cron.job_run_details
    WHERE start_time < now() - interval '1 day';
    $$
);

UPDATE

SELECT pg_reload_conf();


-- Check all scheduled jobs
SELECT * FROM cron.job;

-- Check job run history for sequential processor
SELECT * FROM cron.job_run_details 
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'sequential-processor-every-ten-seconds')
ORDER BY start_time DESC
LIMIT 10;

-- Check job run history for clean up cron job
SELECT * FROM cron.job_run_details 
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'cleanup_cron_job_log')
ORDER BY start_time DESC
LIMIT 45;



-- -- Pause the sequential job
-- SELECT cron.alter_job(
--     (SELECT jobid FROM cron.job WHERE jobname = 'sequential-processor-every-minute'),
--     enabled := false
-- );

-- -- Resume the sequential job
-- SELECT cron.alter_job(
--     (SELECT jobid FROM cron.job WHERE jobname = 'sequential-processor-every-minute'),
--     enabled := true
-- );

-- -- Delete the sequential job
-- SELECT cron.unschedule('cleanup_cron_job_log');

