-- BAZGO scheduler verification: recurring, dedicated-worker heartbeats only.
-- Adds metadata; does not modify existing user records or fabricate readiness.
alter table public.bazgo_runtime add column if not exists scheduler_details jsonb not null default '{}'::jsonb;

create or replace function public.bazgo_scheduler_status() returns jsonb
language plpgsql security definer set search_path = pg_catalog, public as $$
declare r public.bazgo_runtime; previous_tick timestamptz; verified boolean := false; age_seconds numeric;
begin
 select * into r from public.bazgo_runtime where key = 'expiry_scheduler';
 if found and r.scheduler_details->>'source' = 'pg_cron'
  and r.scheduler_details->>'job_name' = 'bazgo-expiry-' || current_database()
  and r.scheduler_details->>'worker_role' = 'bazgo_expiry_' || current_database() then
  previous_tick := (r.scheduler_details->>'previous_checked_at')::timestamptz;
  age_seconds := extract(epoch from clock_timestamp() - r.checked_at);
  verified := coalesce(r.ready and (r.scheduler_details->>'verified_ticks')::integer >= 2
   and extract(epoch from r.checked_at - previous_tick) between 5 and 90
   and age_seconds >= 0 and age_seconds < 120, false);
 end if;
 return jsonb_build_object('ready', verified, 'source', 'pg_cron',
  'jobName', 'bazgo-expiry-' || current_database(),
  'workerRole', 'bazgo_expiry_' || current_database(),
  'checkedAt', r.checked_at, 'previousCheckedAt', previous_tick,
  'verifiedTicks', coalesce((r.scheduler_details->>'verified_ticks')::integer, 0),
  'serverNow', clock_timestamp(), 'maxHeartbeatAgeSeconds', 120,
  'reason', case when verified then 'verified' when r.key is null then 'missing_heartbeat'
   when previous_tick is null then 'recurring_ticks_not_verified' else 'stale_or_invalid_heartbeat' end);
end $$;
revoke all on function public.bazgo_scheduler_status() from public, anon, authenticated;
grant execute on function public.bazgo_scheduler_status() to service_role;

create or replace function public.bazgo_expiry_tick() returns integer
language plpgsql security definer set search_path = pg_catalog, public as $$
declare r public.bazgo_runtime; tick_time timestamptz; previous_tick timestamptz;
 result integer; tick_count integer := 1; expected_worker text := 'bazgo_expiry_' || current_database();
begin
 if session_user <> expected_worker then
  raise exception 'Expiry heartbeat requires the dedicated pg_cron worker login' using errcode = '42501';
 end if;
 if not pg_try_advisory_xact_lock(hashtextextended(current_database() || ':bazgo_expiry_tick', 0)) then return 0; end if;
 result := public.bazgo_expire_negotiations();
 tick_time := clock_timestamp();
 select * into r from public.bazgo_runtime where key = 'expiry_scheduler' for update;
 if found and r.scheduler_details->>'source' = 'pg_cron'
  and r.scheduler_details->>'worker_role' = expected_worker
  and r.scheduler_details->>'job_name' = 'bazgo-expiry-' || current_database() then
  previous_tick := r.checked_at;
  if extract(epoch from tick_time - previous_tick) between 5 and 90 then tick_count := 2; end if;
 end if;
 insert into public.bazgo_runtime(key, ready, checked_at, scheduler_details)
 values ('expiry_scheduler', tick_count >= 2, tick_time,
  jsonb_build_object('source', 'pg_cron', 'job_name', 'bazgo-expiry-' || current_database(),
   'worker_role', expected_worker, 'previous_checked_at', previous_tick, 'verified_ticks', tick_count,
   'expired_count', result))
 on conflict (key) do update set ready = excluded.ready, checked_at = excluded.checked_at,
  scheduler_details = excluded.scheduler_details;
 return result;
end $$;
revoke all on function public.bazgo_expiry_tick() from public, anon, authenticated, service_role;

create or replace function public.bazgo_reserve_load(p_load_id uuid) returns jsonb
language plpgsql security definer set search_path = pg_catalog, public as $$
begin
 if not coalesce((public.bazgo_scheduler_status()->>'ready')::boolean, false) then
  raise exception 'Server expiry scheduler is not verified. Administrator setup and two recurring worker ticks are required';
 end if;
 return public.bazgo_reserve_load_locked(p_load_id);
end $$;
revoke all on function public.bazgo_reserve_load(uuid) from public, anon;
grant execute on function public.bazgo_reserve_load(uuid) to authenticated;
