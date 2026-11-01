-- New driver registrations require a verified phone, Auth password and three owned private images.
-- Insert-only guard: existing accounts and their profile-update behavior are not modified.
create or replace function public.bazgo_require_driver_registration()
returns trigger language plpgsql security definer set search_path=pg_catalog,public as $$
declare field_name text;
begin
 if new.role='driver' then
  if not exists(select 1 from auth.users u where u.id=new.user_id and u.raw_app_meta_data->>'bazgo_password_enabled'='true') then
   raise exception 'Driver account password must be set before registration';
  end if;
  if not exists(select 1 from public.bazgo_phone_identities i where i.user_id=new.user_id and i.phone=new.profile->>'phone') then
   raise exception 'Verified driver phone is required';
  end if;
  foreach field_name in array array['driverPhoto','licensePhoto','vehiclePhoto'] loop
   if coalesce(new.profile->>field_name,'')='' or split_part(new.profile->>field_name,'/',1)<>new.user_id::text
    or not exists(select 1 from storage.objects o where o.bucket_id='bazgo-profiles' and o.name=new.profile->>field_name) then
    raise exception 'All three private driver registration images are required';
   end if;
  end loop;
 end if;
 return new;
end $$;
revoke all on function public.bazgo_require_driver_registration() from public,anon,authenticated;
do $$ begin
 if not exists(select 1 from pg_trigger where tgname='bazgo_complete_driver_registration_guard' and tgrelid='public.bazgo_accounts'::regclass) then
  create trigger bazgo_complete_driver_registration_guard before insert on public.bazgo_accounts
   for each row execute function public.bazgo_require_driver_registration();
 end if;
end $$;
