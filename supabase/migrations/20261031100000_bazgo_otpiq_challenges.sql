-- OTPIQ: store keyed OTP digests only; create service-only, atomic challenge lifecycle RPCs.
-- Existing accounts, verified identities, freight and bookings are untouched.
create table if not exists public.bazgo_otp_challenges (
 phone_hash text primary key check (phone_hash ~ '^[a-f0-9]{64}$'),
 challenge_id uuid not null unique,
 code_hash text not null check (code_hash ~ '^[a-f0-9]{64}$'),
 state text not null default 'pending' check (state in ('pending','active','failed','consumed','locked')),
 attempts integer not null default 0 check (attempts between 0 and 5),
 expires_at timestamptz not null,
 created_at timestamptz not null default clock_timestamp(),
 consumed_at timestamptz
);
alter table public.bazgo_otp_challenges enable row level security;
revoke all on public.bazgo_otp_challenges from public,anon,authenticated;
grant select on public.bazgo_otp_challenges to service_role;

create or replace function public.bazgo_begin_otp_challenge(p_phone_hash text,p_challenge uuid,p_code_hash text)
returns void language plpgsql security definer set search_path=pg_catalog,public as $$
begin
 if p_phone_hash is null or p_phone_hash !~ '^[a-f0-9]{64}$' or p_challenge is null or p_code_hash is null or p_code_hash !~ '^[a-f0-9]{64}$' then raise exception 'Invalid OTP challenge'; end if;
 insert into public.bazgo_otp_challenges(phone_hash,challenge_id,code_hash,state,attempts,expires_at)
 values(p_phone_hash,p_challenge,p_code_hash,'pending',0,clock_timestamp()+interval '5 minutes')
 on conflict(phone_hash) do update set challenge_id=excluded.challenge_id,code_hash=excluded.code_hash,state='pending',attempts=0,expires_at=excluded.expires_at,created_at=clock_timestamp(),consumed_at=null;
end $$;

create or replace function public.bazgo_finish_otp_send(p_phone_hash text,p_challenge uuid,p_accepted boolean)
returns boolean language plpgsql security definer set search_path=pg_catalog,public as $$
declare matched integer;
begin
 if p_accepted is null then raise exception 'Invalid OTP send state'; end if;
 update public.bazgo_otp_challenges set state=case when p_accepted then 'active' else 'failed' end,
 expires_at=case when p_accepted then clock_timestamp()+interval '5 minutes' else expires_at end
 where phone_hash=p_phone_hash and challenge_id=p_challenge and state='pending' and expires_at>clock_timestamp();
 get diagnostics matched=row_count;
 return matched=1;
end $$;

create or replace function public.bazgo_consume_otp_challenge(p_phone_hash text,p_challenge uuid,p_code_hash text)
returns text language plpgsql security definer set search_path=pg_catalog,public as $$
declare r public.bazgo_otp_challenges;
begin
 if p_phone_hash is null or p_phone_hash !~ '^[a-f0-9]{64}$' or p_challenge is null or p_code_hash is null or p_code_hash !~ '^[a-f0-9]{64}$' then raise exception 'Invalid OTP check'; end if;
 select * into r from public.bazgo_otp_challenges where phone_hash=p_phone_hash for update;
 if not found or r.challenge_id<>p_challenge then return 'expired'; end if;
 if r.state='locked' then return 'locked'; end if;
 if r.state<>'active' or r.expires_at<=clock_timestamp() then return 'expired'; end if;
 if r.attempts>=5 then return 'locked'; end if;
 if r.code_hash<>p_code_hash then
  update public.bazgo_otp_challenges set attempts=attempts+1,state=case when attempts+1>=5 then 'locked' else state end where phone_hash=p_phone_hash;
  if r.attempts+1>=5 then return 'locked'; end if;
  return 'incorrect';
 end if;
 update public.bazgo_otp_challenges set state='consumed',consumed_at=clock_timestamp() where phone_hash=p_phone_hash;
 return 'approved';
end $$;
revoke all on function public.bazgo_begin_otp_challenge(text,uuid,text) from public,anon,authenticated;
revoke all on function public.bazgo_finish_otp_send(text,uuid,boolean) from public,anon,authenticated;
revoke all on function public.bazgo_consume_otp_challenge(text,uuid,text) from public,anon,authenticated;
grant execute on function public.bazgo_begin_otp_challenge(text,uuid,text) to service_role;
grant execute on function public.bazgo_finish_otp_send(text,uuid,boolean) to service_role;
grant execute on function public.bazgo_consume_otp_challenge(text,uuid,text) to service_role;
