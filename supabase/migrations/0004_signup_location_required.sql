-- =============================================================================
-- ProLocal — Phase 4 follow-up: require location on signup at the DB layer.
-- Replaces handle_new_user() so it RAISES if any required location field is
-- missing in raw_user_meta_data for non-superadmin signups. Because the
-- trigger runs in the same transaction as the auth.users insert, raising
-- here will fail the whole signup atomically — no orphan auth user.
-- Idempotent. Run AFTER 0001_hardening.sql.
-- =============================================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role     text;
  v_full_name text;
  v_phone    text;
  v_city     text;
  v_province text;
  v_district text;
  v_landmark text;
  v_category text;
begin
  v_role     := coalesce(nullif(new.raw_user_meta_data->>'role',''), 'user');
  v_full_name := coalesce(nullif(new.raw_user_meta_data->>'full_name',''), split_part(coalesce(new.email,''),'@',1));
  v_phone    := nullif(new.raw_user_meta_data->>'phone','');
  v_city     := nullif(new.raw_user_meta_data->>'city','');
  v_province := nullif(new.raw_user_meta_data->>'province','');
  v_district := nullif(new.raw_user_meta_data->>'district','');
  v_landmark := nullif(new.raw_user_meta_data->>'nearest_landmark','');
  v_category := nullif(new.raw_user_meta_data->>'category','');

  if v_role not in ('superadmin','user','provider') then
    v_role := 'user';
  end if;

  -- Superadmins are bootstrapped by SQL, not by self-signup, so skip the guard.
  if v_role <> 'superadmin' then
    if v_phone is null then
      raise exception 'Phone number is required to create an account.'
        using errcode = '23514';
    end if;
    if v_city is null or v_province is null or v_district is null or v_landmark is null then
      raise exception 'Location is required. Please provide province, city, district, and a nearest landmark before creating your account.'
        using errcode = '23514';
    end if;
    if v_role = 'provider' and v_category is null then
      raise exception 'Service category is required for provider accounts.'
        using errcode = '23514';
    end if;
  end if;

  insert into public.profiles (
    id, email, full_name, phone, role, city, province, district, nearest_landmark
  ) values (
    new.id,
    new.email,
    v_full_name,
    coalesce(v_phone, ''),
    v_role,
    coalesce(v_city, 'Unknown'),
    v_province,
    v_district,
    v_landmark
  )
  on conflict (id) do update
    set email = excluded.email;

  if v_role = 'provider' then
    insert into public.provider_details (provider_id, category)
    values (new.id, coalesce(v_category, 'General'))
    on conflict (provider_id) do nothing;
  end if;

  return new;
end $$;

-- Re-attach the trigger in case it was dropped.
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
