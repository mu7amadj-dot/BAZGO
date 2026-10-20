-- Run AFTER the scheduler verification migration, connected to the APPLICATION
-- database as a provider administrator with permission to create roles.
-- Do not run this script in postgres. No user records are changed.
\set on_error_stop on

do $$
declare worker_name text := 'bazgo_expiry_' || current_database();
begin
 if current_database() <> 'vshyveaykgkhngwyvshy' then raise exception 'Connect to vshyveaykgkhngwyvshy first'; end if;
 if not exists (select 1 from pg_roles where rolname = worker_name) then
  execute format('create role %I login nosuperuser nocreatedb nocreaterole noinherit noreplication nobypassrls connection limit 2', worker_name);
 elsif exists (select 1 from pg_roles where rolname = worker_name and (rolsuper or rolcreatedb or rolcreaterole or rolreplication or rolbypassrls))
  or exists (select 1 from pg_auth_members where member = (select oid from pg_roles where rolname = worker_name)) then
  raise exception 'Existing worker role has unexpected privileges; administrator review required';
 end if;
 execute format('grant connect on database %I to %I', current_database(), worker_name);
 execute format('grant usage on schema public to %I', worker_name);
 execute format('grant execute on function public.bazgo_expiry_tick() to %I', worker_name);
end $$;

-- No table writes, service_role membership, or schema creation are granted.
-- The SECURITY DEFINER tick checks SESSION_USER, not SET ROLE/current_user.
-- If cron.use_background_workers is off, configure a worker password using
-- psql \password bazgo_expiry_vshyveaykgkhngwyvshy, and a tightly scoped
-- SCRAM pg_hba.conf rule + server-side .pgpass entry; see the runbook.
-- Do not commit the password or send it to the application/Edge Function.
select public.bazgo_scheduler_status();
