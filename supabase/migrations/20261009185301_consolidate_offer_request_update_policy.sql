drop policy if exists offer_requests_customer_cancel on public.offer_requests;
drop policy if exists offer_requests_admin_update on public.offer_requests;

create policy offer_requests_participant_update
  on public.offer_requests for update to authenticated
  using (
    (
      customer_id = (select auth.uid())
      and status = 'requested'
    )
    or ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin'
  )
  with check (
    (
      customer_id = (select auth.uid())
      and status = 'cancelled'
    )
    or ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin'
  );
