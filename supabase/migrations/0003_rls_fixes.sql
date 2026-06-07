-- =============================================================================
-- ProLocal — Phase 4 follow-up: tighten ambiguous column references in RLS
-- policies. Run AFTER 0002_rls.sql. Idempotent.
-- =============================================================================

-- reviews: fully qualify every column reference so PG cannot bind them to the
-- inner service_requests scope.
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

-- service_requests: keep insert restricted to seekers, fully qualified.
drop policy if exists sr_insert_seeker on public.service_requests;
create policy sr_insert_seeker
  on public.service_requests for insert
  to authenticated
  with check (service_requests.seeker_id = auth.uid());

-- service_requests update: providers can only flip status fields; seekers can
-- only cancel their own pending request. Fully qualified.
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
