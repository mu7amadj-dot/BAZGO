-- Phone OTP: service-only throttling/provisioning and user-owned verified phone access.
-- No existing marketplace or email user records are migrated or modified.
create table if not exists public.bazgo_otp_limits (
 bucket text primary key, window_started_at timestamptz not null default clock_timestamp(),
 last_attempt_at timestamptz not null default 'epoch', attempts integer not null default 0
);
alter table public.bazgo_otp_limits enable row level security;
revoke all on public.bazgo_otp_limits from public,anon,authenticated;
grant select,insert,update on public.bazgo_otp_limits to service_role;
create table if not exists public.bazgo_phone_bootstrap (
 phone_hash text primary key,
 auth_email text not null unique default (gen_random_uuid()::text || '@phone.bazgo.invalid'),
 lease_id uuid, lease_until timestamptz,
 created_at timestamptz not null default clock_timestamp()
);
alter table public.bazgo_phone_bootstrap enable row level security;
revoke all on public.bazgo_phone_bootstrap from public,anon,authenticated;
grant select,insert,update on public.bazgo_phone_bootstrap to service_role;
create table if not exists public.bazgo_phone_identities (
 phone text primary key check (phone ~ '^\+9647[0-9]{9}$'),
 user_id uuid not null unique references public.user_profiles(id) on delete cascade,
 verified_at timestamptz not null default clock_timestamp()
);
alter table public.bazgo_phone_identities enable row level security;
revoke all on public.bazgo_phone_identities from public,anon,authenticated;
grant select,insert on public.bazgo_phone_identities to service_role;

create or replace function public.bazgo_take_otp_limit(p_bucket text,p_window_seconds integer,p_max_attempts integer,p_min_interval integer)
returns integer language plpgsql security definer set search_path=pg_catalog,public as $$
declare r public.bazgo_otp_limits; t timestamptz:=clock_timestamp(); wait_seconds integer;
begin
 if char_length(p_bucket)>160 or p_window_seconds<1 or p_max_attempts<1 or p_min_interval<0 then raise exception 'Invalid rate limit'; end if;
 insert into public.bazgo_otp_limits(bucket) values(p_bucket) on conflict(bucket) do nothing;
 select * into r from public.bazgo_otp_limits where bucket=p_bucket for update;
 if r.window_started_at + make_interval(secs=>p_window_seconds)<=t then
  r.window_started_at:=t; r.attempts:=0;
 end if;
 wait_seconds:=greatest(0,ceil(extract(epoch from r.last_attempt_at + make_interval(secs=>p_min_interval)-t))::integer);
 if r.attempts>=p_max_attempts then
  wait_seconds:=greatest(wait_seconds,ceil(extract(epoch from r.window_started_at + make_interval(secs=>p_window_seconds)-t))::integer);
 end if;
 if wait_seconds>0 then return wait_seconds; end if;
 update public.bazgo_otp_limits set attempts=r.attempts+1,window_started_at=r.window_started_at,last_attempt_at=t where bucket=p_bucket;
 return 0;
end $$;
revoke all on function public.bazgo_take_otp_limit(text,integer,integer,integer) from public,anon,authenticated;
grant execute on function public.bazgo_take_otp_limit(text,integer,integer,integer) to service_role;

create or replace function public.bazgo_claim_phone_session(p_phone_hash text,p_lease uuid)
returns jsonb language plpgsql security definer set search_path=pg_catalog,public as $$
declare r public.bazgo_phone_bootstrap;
begin
 if p_phone_hash !~ '^[a-f0-9]{64}$' or p_lease is null then raise exception 'Invalid session claim'; end if;
 insert into public.bazgo_phone_bootstrap(phone_hash) values(p_phone_hash) on conflict(phone_hash) do nothing;
 select * into r from public.bazgo_phone_bootstrap where phone_hash=p_phone_hash for update;
 if r.lease_until>clock_timestamp() then return jsonb_build_object('busy',true); end if;
 update public.bazgo_phone_bootstrap set lease_id=p_lease,lease_until=clock_timestamp()+interval '90 seconds' where phone_hash=p_phone_hash;
 return jsonb_build_object('busy',false,'email',r.auth_email);
end $$;
create or replace function public.bazgo_release_phone_session(p_phone_hash text,p_lease uuid)
returns void language plpgsql security definer set search_path=pg_catalog,public as $$
begin
 update public.bazgo_phone_bootstrap set lease_id=null,lease_until=null where phone_hash=p_phone_hash and lease_id=p_lease;
end $$;
revoke all on function public.bazgo_claim_phone_session(text,uuid) from public,anon,authenticated;
revoke all on function public.bazgo_release_phone_session(text,uuid) from public,anon,authenticated;
grant execute on function public.bazgo_claim_phone_session(text,uuid) to service_role;
grant execute on function public.bazgo_release_phone_session(text,uuid) to service_role;

-- Only the requesting user can obtain their own verified authentication number.
create or replace function public.bazgo_verified_phone()
returns text language sql stable security definer set search_path=pg_catalog,public as $$
 select phone from public.bazgo_phone_identities where user_id=auth.uid();
$$;
revoke all on function public.bazgo_verified_phone() from public,anon;
grant execute on function public.bazgo_verified_phone() to authenticated;

-- Profile writes cannot silently change a verified login number.
create or replace function public.bazgo_protect_verified_phone()
returns trigger language plpgsql security definer set search_path=pg_catalog,public as $$
declare verified_phone text;
begin
 select phone into verified_phone from public.bazgo_phone_identities where user_id=new.user_id;
 if verified_phone is not null and (new.profile->>'phone') is distinct from verified_phone then
  raise exception 'Verified phone cannot be changed without OTP verification';
 end if;
 return new;
end $$;
revoke all on function public.bazgo_protect_verified_phone() from public,anon,authenticated;
do $$ begin
 if not exists(select 1 from pg_trigger where tgname='bazgo_verified_phone_guard' and tgrelid='public.bazgo_accounts'::regclass) then
  create trigger bazgo_verified_phone_guard before insert or update on public.bazgo_accounts for each row execute function public.bazgo_protect_verified_phone();
 end if;
end $$;
