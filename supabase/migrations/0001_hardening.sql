-- =============================================================================
-- ProLocal — Phase 4 Hardening Migration (0001)
-- Run this in the Supabase SQL editor BEFORE 0002_rls.sql.
-- Safe to re-run; everything is guarded with IF NOT EXISTS / DROP IF EXISTS.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Extensions
-- -----------------------------------------------------------------------------
create extension if not exists "pgcrypto";
create extension if not exists "postgis";

-- -----------------------------------------------------------------------------
-- profiles: add email column, default role, district_code unused, allow NULL city later
-- -----------------------------------------------------------------------------
alter table public.profiles
  add column if not exists email text;

create unique index if not exists profiles_email_key on public.profiles (email) where email is not null;

-- The original schema used profiles.city NOT NULL. We keep that, but seed the
-- trigger below to default it to 'Unknown' if metadata didn't include one.

-- -----------------------------------------------------------------------------
-- ON DELETE CASCADE on every FK chain anchored at auth.users(id)
-- -----------------------------------------------------------------------------
do $$ begin
  alter table public.profiles drop constraint if exists profiles_id_fkey;
  alter table public.profiles
    add constraint profiles_id_fkey
    foreign key (id) references auth.users(id) on delete cascade;

  alter table public.provider_details drop constraint if exists provider_details_provider_id_fkey;
  alter table public.provider_details
    add constraint provider_details_provider_id_fkey
    foreign key (provider_id) references public.profiles(id) on delete cascade;

  alter table public.service_requests drop constraint if exists service_requests_seeker_id_fkey;
  alter table public.service_requests
    add constraint service_requests_seeker_id_fkey
    foreign key (seeker_id) references public.profiles(id) on delete cascade;

  alter table public.service_requests drop constraint if exists service_requests_provider_id_fkey;
  alter table public.service_requests
    add constraint service_requests_provider_id_fkey
    foreign key (provider_id) references public.profiles(id) on delete cascade;

  alter table public.reviews drop constraint if exists reviews_provider_id_fkey;
  alter table public.reviews
    add constraint reviews_provider_id_fkey
    foreign key (provider_id) references public.profiles(id) on delete cascade;

  alter table public.reviews drop constraint if exists reviews_user_id_fkey;
  alter table public.reviews
    add constraint reviews_user_id_fkey
    foreign key (user_id) references public.profiles(id) on delete cascade;

  alter table public.transactions drop constraint if exists transactions_sender_id_fkey;
  alter table public.transactions
    add constraint transactions_sender_id_fkey
    foreign key (sender_id) references public.profiles(id) on delete cascade;

  alter table public.transactions drop constraint if exists transactions_receiver_id_fkey;
  alter table public.transactions
    add constraint transactions_receiver_id_fkey
    foreign key (receiver_id) references public.profiles(id) on delete cascade;
end $$;

-- -----------------------------------------------------------------------------
-- service_requests hardening: status CHECK + NOT NULL FKs + partial unique index
-- -----------------------------------------------------------------------------
do $$ begin
  alter table public.service_requests
    alter column seeker_id set not null,
    alter column provider_id set not null;
exception when others then null; end $$;

alter table public.service_requests drop constraint if exists service_requests_status_check;
alter table public.service_requests
  add constraint service_requests_status_check
  check (status in ('pending','accepted','declined','completed','cancelled'));

drop index if exists service_requests_active_unique;
create unique index service_requests_active_unique
  on public.service_requests (seeker_id, provider_id)
  where status in ('pending','accepted');

create index if not exists service_requests_provider_status_idx
  on public.service_requests (provider_id, status, created_at desc);

create index if not exists service_requests_seeker_status_idx
  on public.service_requests (seeker_id, status, created_at desc);

create index if not exists profiles_role_city_idx
  on public.profiles (role, city);

create index if not exists reviews_provider_idx
  on public.reviews (provider_id);

-- -----------------------------------------------------------------------------
-- transactions: idempotency + link to request
-- -----------------------------------------------------------------------------
alter table public.transactions
  add column if not exists idempotency_key text,
  add column if not exists request_id uuid references public.service_requests(id) on delete set null;

create unique index if not exists transactions_idempotency_key
  on public.transactions (idempotency_key) where idempotency_key is not null;

-- -----------------------------------------------------------------------------
-- PostGIS: sync provider_details.location from profile city + add GIST index
-- (We can't reverse-geocode every city; the column is populated when an
-- explicit lat/lng is written via the upsert_provider_location() helper below.
-- The RPC nearby_providers also accepts a raw radius from the seeker's coords.)
-- -----------------------------------------------------------------------------
alter table public.provider_details
  alter column location type geography(Point, 4326)
  using case
    when location is null then null
    else location::geography
  end;

create index if not exists provider_details_location_gix
  on public.provider_details using gist (location);

create or replace function public.upsert_provider_location(p_provider_id uuid, p_lat double precision, p_lng double precision)
returns void
language plpgsql
security invoker
as $$
begin
  update public.provider_details
     set location = st_setsrid(st_makepoint(p_lng, p_lat), 4326)::geography
   where provider_id = p_provider_id;
end $$;

create or replace function public.nearby_providers(
  p_lat double precision,
  p_lng double precision,
  p_category text default null,
  p_radius_km double precision default 50
)
returns table (
  id uuid,
  full_name text,
  phone text,
  city text,
  district text,
  category text,
  average_rating numeric,
  services_delivered integer,
  distance_meters double precision
)
language sql
stable
security invoker
as $$
  select
    p.id,
    p.full_name,
    p.phone,
    p.city,
    p.district,
    pd.category,
    pd.average_rating,
    pd.services_delivered,
    case
      when pd.location is null then null
      else st_distance(pd.location, st_setsrid(st_makepoint(p_lng, p_lat), 4326)::geography)
    end as distance_meters
  from public.profiles p
  join public.provider_details pd on pd.provider_id = p.id
  where p.role = 'provider'
    and coalesce(p.is_banned, false) = false
    and (p_category is null or pd.category = p_category)
    and (
      pd.location is null
      or st_dwithin(pd.location, st_setsrid(st_makepoint(p_lng, p_lat), 4326)::geography, p_radius_km * 1000)
    )
  order by distance_meters nulls last, pd.average_rating desc nulls last;
$$;

-- -----------------------------------------------------------------------------
-- handle_new_user trigger: atomic profile + provider_details creation
-- Reads NEW.raw_user_meta_data set by the client during supabase.auth.signUp.
-- -----------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role text;
  v_full_name text;
  v_phone text;
  v_city text;
  v_province text;
  v_district text;
  v_landmark text;
  v_category text;
begin
  v_role        := coalesce(nullif(new.raw_user_meta_data->>'role',''), 'user');
  v_full_name   := coalesce(nullif(new.raw_user_meta_data->>'full_name',''), split_part(coalesce(new.email,''),'@',1));
  v_phone       := coalesce(nullif(new.raw_user_meta_data->>'phone',''), '');
  v_city        := coalesce(nullif(new.raw_user_meta_data->>'city',''), 'Unknown');
  v_province    := nullif(new.raw_user_meta_data->>'province','');
  v_district    := nullif(new.raw_user_meta_data->>'district','');
  v_landmark    := nullif(new.raw_user_meta_data->>'nearest_landmark','');
  v_category    := nullif(new.raw_user_meta_data->>'category','');

  if v_role not in ('superadmin','user','provider') then
    v_role := 'user';
  end if;

  insert into public.profiles (
    id, email, full_name, phone, role, city, province, district, nearest_landmark
  ) values (
    new.id, new.email, v_full_name, v_phone, v_role, v_city, v_province, v_district, v_landmark
  )
  on conflict (id) do update
    set email = excluded.email;

  if v_role = 'provider' then
    insert into public.provider_details (provider_id, category)
    values (new.id, coalesce(v_category, 'General'))
    on conflict (provider_id) do nothing;
  end if;

  return new;
exception when others then
  raise warning 'handle_new_user error for %: %', new.id, sqlerrm;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Keep profiles.email in sync if a user later changes their auth email.
create or replace function public.handle_user_email_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.email is distinct from old.email then
    update public.profiles set email = new.email where id = new.id;
  end if;
  return new;
end $$;

drop trigger if exists on_auth_user_email_update on auth.users;
create trigger on_auth_user_email_update
  after update of email on auth.users
  for each row execute function public.handle_user_email_update();

-- -----------------------------------------------------------------------------
-- Reviews: keep provider_details.average_rating and services_delivered in sync.
-- services_delivered also increments when service_requests goes to 'completed'.
-- -----------------------------------------------------------------------------
create or replace function public.recompute_provider_rating(p_provider uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update public.provider_details
     set average_rating = coalesce((
       select avg(rating)::numeric(3,2)
         from public.reviews
        where provider_id = p_provider
     ), 0)
   where provider_id = p_provider;
$$;

create or replace function public.on_review_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.recompute_provider_rating(coalesce(new.provider_id, old.provider_id));
  return coalesce(new, old);
end $$;

drop trigger if exists trg_reviews_aiud on public.reviews;
create trigger trg_reviews_aiud
  after insert or update or delete on public.reviews
  for each row execute function public.on_review_change();

create or replace function public.on_service_request_completed()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = 'completed' and (old.status is distinct from 'completed') then
    update public.provider_details
       set services_delivered = coalesce(services_delivered, 0) + 1
     where provider_id = new.provider_id;
  end if;
  return new;
end $$;

drop trigger if exists trg_sr_completed on public.service_requests;
create trigger trg_sr_completed
  after update of status on public.service_requests
  for each row execute function public.on_service_request_completed();

-- -----------------------------------------------------------------------------
-- notifications table + trigger that writes one row per relevant event
-- -----------------------------------------------------------------------------
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  kind text not null,
  title text not null,
  body text,
  ref_id uuid,
  created_at timestamptz not null default now(),
  read_at timestamptz
);

create index if not exists notifications_user_unread_idx
  on public.notifications (user_id, read_at, created_at desc);

create or replace function public.notify_on_service_request()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_seeker_name text;
  v_provider_name text;
begin
  if tg_op = 'INSERT' then
    select full_name into v_seeker_name from public.profiles where id = new.seeker_id;
    insert into public.notifications (user_id, kind, title, body, ref_id)
    values (
      new.provider_id,
      'request',
      'New service request',
      coalesce(v_seeker_name, 'A customer') || ' is requesting your service.',
      new.id
    );
  elsif tg_op = 'UPDATE' and new.status is distinct from old.status then
    select full_name into v_provider_name from public.profiles where id = new.provider_id;
    if new.status = 'accepted' then
      insert into public.notifications (user_id, kind, title, body, ref_id)
      values (new.seeker_id, 'request_update', 'Request accepted',
              coalesce(v_provider_name,'The professional') || ' accepted your job.', new.id);
    elsif new.status = 'declined' then
      insert into public.notifications (user_id, kind, title, body, ref_id)
      values (new.seeker_id, 'request_update', 'Request declined',
              coalesce(v_provider_name,'The professional') || ' is unable to take this job.', new.id);
    elsif new.status = 'completed' then
      insert into public.notifications (user_id, kind, title, body, ref_id)
      values (new.seeker_id, 'request_update', 'Job completed',
              'Thank you for using ProLocal. You can leave a review now.', new.id);
    elsif new.status = 'cancelled' then
      insert into public.notifications (user_id, kind, title, body, ref_id)
      values (new.provider_id, 'request_update', 'Request cancelled',
              'A seeker cancelled their request.', new.id);
    end if;
  end if;
  return new;
end $$;

drop trigger if exists trg_sr_notify on public.service_requests;
create trigger trg_sr_notify
  after insert or update on public.service_requests
  for each row execute function public.notify_on_service_request();

-- -----------------------------------------------------------------------------
-- audit_log
-- -----------------------------------------------------------------------------
create table if not exists public.audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles(id) on delete set null,
  action text not null,
  target_type text,
  target_id uuid,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists audit_log_created_at_idx on public.audit_log (created_at desc);
create index if not exists audit_log_target_idx on public.audit_log (target_type, target_id);

-- -----------------------------------------------------------------------------
-- Realtime publication: enable change streams on the tables the app subscribes to.
-- (Skips silently if the publication doesn't exist on a self-hosted instance.)
-- -----------------------------------------------------------------------------
do $$ begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    begin
      alter publication supabase_realtime add table public.service_requests;
    exception when duplicate_object then null; end;
    begin
      alter publication supabase_realtime add table public.notifications;
    exception when duplicate_object then null; end;
  end if;
end $$;

-- -----------------------------------------------------------------------------
-- Backfill: copy email from auth.users into profiles for existing rows.
-- -----------------------------------------------------------------------------
update public.profiles p
   set email = u.email
  from auth.users u
 where u.id = p.id
   and p.email is null;
