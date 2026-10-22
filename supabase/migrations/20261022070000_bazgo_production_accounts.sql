-- Production accounts and private profile media; no demo/user data is changed.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values ('bazgo-profiles','bazgo-profiles',false,5242880,array['image/jpeg','image/png','image/webp']) on conflict(id) do nothing;
do $$ begin
 if not exists(select 1 from pg_policies where schemaname='storage' and tablename='objects' and policyname='authenticated_insert_own_bazgo_profile') then
  create policy authenticated_insert_own_bazgo_profile on storage.objects for insert to authenticated
  with check(bucket_id='bazgo-profiles' and (storage.foldername(name))[1]=auth.uid()::text);
 end if;
 if not exists(select 1 from pg_policies where schemaname='storage' and tablename='objects' and policyname='authenticated_select_own_bazgo_profile') then
  create policy authenticated_select_own_bazgo_profile on storage.objects for select to authenticated
  using(bucket_id='bazgo-profiles' and (storage.foldername(name))[1]=auth.uid()::text);
 end if;
end $$;

create or replace function public.bazgo_setup_account(p_role text,p_name text,p_profile jsonb default '{}'::jsonb)
returns jsonb language plpgsql security definer set search_path=pg_catalog,public as $$
declare a public.bazgo_accounts; field_name text;
begin
 if auth.uid() is null then raise exception 'Authentication required'; end if;
 if p_role is null or p_role not in ('merchant','driver') or p_name is null or char_length(trim(p_name)) not between 1 and 120
  or p_profile is null or jsonb_typeof(p_profile)<>'object' or octet_length(p_profile::text)>16000 then raise exception 'Invalid account'; end if;
 select * into a from public.bazgo_accounts where user_id=auth.uid();
 if found then
  if a.role<>p_role then raise exception 'Account role is immutable'; end if;
  return to_jsonb(a);
 end if;
 if coalesce(p_profile->>'phone','') !~ '^\+9647[0-9]{9}$' or coalesce(p_profile->>'province','')='' then raise exception 'Province and Iraqi mobile number are required'; end if;
 if p_role='merchant' and (coalesce(trim(p_profile->>'companyName'),'')='' or coalesce(trim(p_profile->>'location'),'')='') then raise exception 'Company and location are required'; end if;
 if p_role='driver' then
  if coalesce(trim(p_profile->>'fatherName'),'')='' or coalesce(trim(p_profile->>'grandfatherName'),'')=''
   or coalesce(p_profile->>'vehicleType','')='' or coalesce(p_profile->>'maxCapacity','') !~ '^[0-9]+(\.[0-9]+)?$' then raise exception 'Driver and vehicle details are required'; end if;
  if (p_profile->>'maxCapacity')::numeric<=0 or (p_profile->>'maxCapacity')::numeric>1000 then raise exception 'Invalid vehicle capacity'; end if;
  foreach field_name in array array['driverPhoto','licensePhoto','vehiclePhoto'] loop
   if coalesce(p_profile->>field_name,'')<>'' and (split_part(p_profile->>field_name,'/',1)<>auth.uid()::text
    or not exists(select 1 from storage.objects where bucket_id='bazgo-profiles' and name=p_profile->>field_name)) then raise exception 'Invalid private profile attachment'; end if;
  end loop;
 end if;
 insert into public.bazgo_accounts(user_id,role,name,profile) values(auth.uid(),p_role,trim(p_name),p_profile) on conflict(user_id) do nothing;
 select * into a from public.bazgo_accounts where user_id=auth.uid();
 if a.role<>p_role then raise exception 'Account role is immutable'; end if;
 return to_jsonb(a);
end $$;
revoke all on function public.bazgo_setup_account(text,text,jsonb) from public,anon;
grant execute on function public.bazgo_setup_account(text,text,jsonb) to authenticated;
