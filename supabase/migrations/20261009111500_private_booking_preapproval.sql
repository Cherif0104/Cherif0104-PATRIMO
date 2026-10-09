-- Preapproval must always create its calendar hold; direct status updates are forbidden.

drop policy if exists booking_requests_participant_update
  on public.booking_requests;
create policy booking_requests_participant_update
  on public.booking_requests for update to authenticated
  using (
    (guest_id = (select auth.uid())
      and status in ('requested', 'preapproved', 'awaiting_payment'))
    or (
      listing_id is not null
      and exists (
        select 1 from public.marketplace_listings l
        where l.id = booking_requests.listing_id
          and (
            l.owner_id = (select auth.uid())
            or exists (
              select 1 from public.organization_members m
              where m.organization_id = l.organization_id
                and m.user_id = (select auth.uid())
                and m.role in ('owner', 'manager', 'agent')
            )
          )
      )
    )
  )
  with check (
    (guest_id = (select auth.uid()) and status = 'cancelled')
    or (
      listing_id is not null
      and status = 'declined'
      and exists (
        select 1 from public.marketplace_listings l
        where l.id = booking_requests.listing_id
          and (
            l.owner_id = (select auth.uid())
            or exists (
              select 1 from public.organization_members m
              where m.organization_id = l.organization_id
                and m.user_id = (select auth.uid())
                and m.role in ('owner', 'manager', 'agent')
            )
          )
      )
    )
  );

create or replace function private.preapprove_booking_request(p_booking_id uuid)
returns public.booking_requests
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := (select auth.uid());
  target public.booking_requests;
begin
  if actor_id is null then
    raise exception 'authentication_required' using errcode = '42501';
  end if;

  select b.*
  into target
  from public.booking_requests b
  join public.marketplace_listings l on l.id = b.listing_id
  where b.id = p_booking_id
    and (
      l.owner_id = actor_id
      or exists (
        select 1 from public.organization_members m
        where m.organization_id = l.organization_id
          and m.user_id = actor_id
          and m.role in ('owner', 'manager', 'agent')
      )
    )
  for update of b;

  if target.id is null or target.listing_id is null then
    raise exception 'booking_not_operational' using errcode = 'P0002';
  end if;
  if target.status <> 'requested' then
    raise exception 'booking_not_preapprovable' using errcode = 'P0001';
  end if;

  delete from public.availability_blocks
  where listing_id = target.listing_id
    and source = 'reservation_hold'
    and expires_at is not null
    and expires_at <= now();

  insert into public.availability_blocks (
    listing_id, booking_id, start_date, end_date, source,
    note, created_by, expires_at
  )
  values (
    target.listing_id, target.id, target.start_date, target.end_date,
    'reservation_hold', 'Préapprobation ' || target.id::text,
    actor_id, now() + interval '30 minutes'
  );

  update public.booking_requests
  set status = 'preapproved', updated_at = now()
  where id = target.id
  returning * into target;

  return target;
end;
$$;

revoke all on function private.preapprove_booking_request(uuid)
  from public, anon;
grant execute on function private.preapprove_booking_request(uuid)
  to authenticated;

create or replace function public.preapprove_booking_request(p_booking_id uuid)
returns public.booking_requests
language sql
security invoker
set search_path = ''
as $$
  select private.preapprove_booking_request(p_booking_id);
$$;

revoke all on function public.preapprove_booking_request(uuid) from public, anon;
grant execute on function public.preapprove_booking_request(uuid) to authenticated;
