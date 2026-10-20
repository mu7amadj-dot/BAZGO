-- Run connected to the POSTGRES administration database, not the application
-- database, as a provider-authorized administrator/superuser. Apply the
-- application migration and worker grants FIRST. No user records are changed.
\set on_error_stop on

do $$ begin
 if current_database() <> 'postgres' then raise exception 'Connect to postgres first'; end if;
end $$;
create extension if not exists pg_cron;

-- Registration is idempotent and scoped by application database AND worker.
-- Clients do not receive access to cron or permission to supply SQL/roles.
do $$
declare job_id bigint; legacy record; cadence text := '10 seconds';
begin
 if not exists (select 1 from pg_roles where rolname = 'bazgo_expiry_vshyveaykgkhngwyvshy') then
  raise exception 'Apply bazgo-expiry-application.sql first';
 end if;
 begin
  select cron.schedule_in_database('bazgo-expiry-vshyveaykgkhngwyvshy', cadence,
   'select public.bazgo_expiry_tick()', 'vshyveaykgkhngwyvshy',
   'bazgo_expiry_vshyveaykgkhngwyvshy', true) into job_id;
 exception when others then
  -- Only fall back for an unsupported seconds schedule, NEVER for permission,
  -- missing-extension, authentication or connectivity failures.
  if position('invalid schedule' in lower(sqlerrm)) = 0 then raise; end if;
  cadence := '* * * * *';
  select cron.schedule_in_database('bazgo-expiry-vshyveaykgkhngwyvshy', cadence,
   'select public.bazgo_expiry_tick()', 'vshyveaykgkhngwyvshy',
   'bazgo_expiry_vshyveaykgkhngwyvshy', true) into job_id;
 end;
 if not exists (select 1 from cron.job where jobid = job_id and active
  and database = 'vshyveaykgkhngwyvshy' and username = 'bazgo_expiry_vshyveaykgkhngwyvshy'
  and command = 'select public.bazgo_expiry_tick()') then
  raise exception 'Job registration did not produce the expected active job';
 end if;
 -- Disable only the legacy BAZGO job belonging to THIS application. Do not
 -- remove jobs or affect another application's scheduler on the shared cluster.
 for legacy in select jobid from cron.job where jobname = 'bazgo-expire-negotiations'
  and database = 'vshyveaykgkhngwyvshy' and command = 'select public.bazgo_expiry_tick()' and active loop
  perform cron.alter_job(legacy.jobid, active := false);
 end loop;
 raise notice 'Registered job %, cadence %. Readiness requires two actual worker ticks.', job_id, cadence;
end $$;

select jobid, jobname, schedule, database, username, active from cron.job
 where jobname = 'bazgo-expiry-vshyveaykgkhngwyvshy';
select r.jobid, r.status, r.return_message, r.start_time, r.end_time
 from cron.job_run_details r join cron.job j using (jobid)
 where j.jobname = 'bazgo-expiry-vshyveaykgkhngwyvshy'
 order by r.start_time desc limit 10;
