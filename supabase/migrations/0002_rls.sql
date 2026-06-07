-- =============================================================================
-- ProLocal — Phase 4 Row Level Security (0002)
-- Run AFTER 0001_hardening.sql.
-- =============================================================================

-- Helper: is the current auth user a superadmin?
create or replace function public.is_superadmin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
     where id = auth.uid()
       and role = 'superadmin'
  );
$$;

-- =============================================================================
-- profiles
-- =============================================================================
alter table public.profiles enable row level security;

drop policy if exists profiles_select_authed on public.profiles;
create policy profiles_select_authed
  on public.profiles for select
  to authenticated
  using (true);

drop policy if exists profiles_insert_self on public.profiles;
create policy profiles_insert_self
  on public.profiles for insert
  to authenticated
  with check (id = auth.uid());

drop policy if exists profiles_update_self_or_admin on public.profiles;
create policy profiles_update_self_or_admin
  on public.profiles for update
  to authenticated
  using (id = auth.uid() or public.is_superadmin())
  with check (id = auth.uid() or public.is_superadmin());

drop policy if exists profiles_delete_admin on public.profiles;
create policy profiles_delete_admin
  on public.profiles for delete
  to authenticated
  using (public.is_superadmin());

-- =============================================================================
-- provider_details
-- =============================================================================
alter table public.provider_details enable row level security;

drop policy if exists pd_select_authed on public.provider_details;
create policy pd_select_authed
  on public.provider_details for select
  to authenticated
  using (true);

drop policy if exists pd_insert_self on public.provider_details;
create policy pd_insert_self
  on public.provider_details for insert
  to authenticated
  with check (provider_id = auth.uid());

drop policy if exists pd_update_self_or_admin on public.provider_details;
create policy pd_update_self_or_admin
  on public.provider_details for update
  to authenticated
  using (provider_id = auth.uid() or public.is_superadmin())
  with check (provider_id = auth.uid() or public.is_superadmin());

drop policy if exists pd_delete_self_or_admin on public.provider_details;
create policy pd_delete_self_or_admin
  on public.provider_details for delete
  to authenticated
  using (provider_id = auth.uid() or public.is_superadmin());

-- =============================================================================
-- service_requests
-- =============================================================================
alter table public.service_requests enable row level security;

drop policy if exists sr_select_participant on public.service_requests;
create policy sr_select_participant
  on public.service_requests for select
  to authenticated
  using (seeker_id = auth.uid() or provider_id = auth.uid() or public.is_superadmin());

drop policy if exists sr_insert_seeker on public.service_requests;
create policy sr_insert_seeker
  on public.service_requests for insert
  to authenticated
  with check (service_requests.seeker_id = auth.uid());

drop policy if exists sr_update_participant on public.service_requests;
create policy sr_update_participant
  on public.service_requests for update
  to authenticated
  using (
    service_requests.seeker_id   = auth.uid()
    or service_requests.provider_id = auth.uid()
    or public.is_superadmin()
  )
  with check (
    service_requests.seeker_id   = auth.uid()
    or service_requests.provider_id = auth.uid()
    or public.is_superadmin()
  );

drop policy if exists sr_delete_admin on public.service_requests;
create policy sr_delete_admin
  on public.service_requests for delete
  to authenticated
  using (public.is_superadmin());

-- =============================================================================
-- reviews
-- =============================================================================
alter table public.reviews enable row level security;

drop policy if exists reviews_select_all on public.reviews;
create policy reviews_select_all
  on public.reviews for select
  to authenticated
  using (true);

drop policy if exists reviews_insert_seeker on public.reviews;
create policy reviews_insert_seeker
  on public.reviews for insert
  to authenticated
  with check (
    reviews.user_id = auth.uid()
    and exists (
      select 1
        from public.service_requests sr
       where sr.id          = reviews.request_id
         and sr.seeker_id   = auth.uid()
         and sr.provider_id = reviews.provider_id
         and sr.status      = 'completed'
    )
  );

drop policy if exists reviews_update_author on public.reviews;
create policy reviews_update_author
  on public.reviews for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists reviews_delete_author_or_admin on public.reviews;
create policy reviews_delete_author_or_admin
  on public.reviews for delete
  to authenticated
  using (user_id = auth.uid() or public.is_superadmin());

-- =============================================================================
-- transactions (read-only for participants; writes via service role / server)
-- =============================================================================
alter table public.transactions enable row level security;

drop policy if exists tx_select_participant on public.transactions;
create policy tx_select_participant
  on public.transactions for select
  to authenticated
  using (sender_id = auth.uid() or receiver_id = auth.uid() or public.is_superadmin());

-- No insert/update/delete policies => only service_role bypasses RLS for writes.

-- =============================================================================
-- notifications (recipient-only)
-- =============================================================================
alter table public.notifications enable row level security;

drop policy if exists notif_select_self on public.notifications;
create policy notif_select_self
  on public.notifications for select
  to authenticated
  using (user_id = auth.uid());

drop policy if exists notif_update_self on public.notifications;
create policy notif_update_self
  on public.notifications for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists notif_delete_self on public.notifications;
create policy notif_delete_self
  on public.notifications for delete
  to authenticated
  using (user_id = auth.uid() or public.is_superadmin());

-- Inserts only via triggers (security definer) or service role; no client policy.

-- =============================================================================
-- audit_log (admin read; inserts via server action / triggers)
-- =============================================================================
alter table public.audit_log enable row level security;

drop policy if exists audit_select_admin on public.audit_log;
create policy audit_select_admin
  on public.audit_log for select
  to authenticated
  using (public.is_superadmin());

drop policy if exists audit_insert_authed on public.audit_log;
create policy audit_insert_authed
  on public.audit_log for insert
  to authenticated
  with check (actor_id = auth.uid());

-- =============================================================================
-- system_settings (admin only)
-- =============================================================================
alter table public.system_settings enable row level security;

drop policy if exists settings_select_all on public.system_settings;
create policy settings_select_all
  on public.system_settings for select
  to authenticated
  using (true);

drop policy if exists settings_write_admin on public.system_settings;
create policy settings_write_admin
  on public.system_settings for all
  to authenticated
  using (public.is_superadmin())
  with check (public.is_superadmin());
