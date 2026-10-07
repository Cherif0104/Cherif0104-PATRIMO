-- Confirming a stay and blocking its dates must be one atomic transaction.

create or replace function public.confirm_booking_request(p_booking_id uuid)
returns public.booking_requests
language plpgsql
security invoker
set search_path = ''
as $$
declare
  target public.booking_requests;
begin
  select *
  into target
  from public.booking_requests
  where id = p_booking_id
  for update;

  if target.id is null then
    raise exception 'booking_not_found' using errcode = 'P0002';
  end if;
  if target.listing_id is null then
    raise exception 'listing_not_operational' using errcode = 'P0001';
  end if;
  if target.status not in ('requested', 'preapproved', 'awaiting_payment') then
    raise exception 'booking_not_confirmable' using errcode = 'P0001';
  end if;

  insert into public.availability_blocks (
    listing_id, start_date, end_date, source, note, created_by
  )
  values (
    target.listing_id,
    target.start_date,
    target.end_date,
    'reservation',
    'Réservation ' || target.id::text,
    (select auth.uid())
  );

  update public.booking_requests
  set status = 'confirmed', updated_at = now()
  where id = target.id
  returning * into target;

  return target;
end;
$$;

revoke all on function public.confirm_booking_request(uuid) from public, anon;
grant execute on function public.confirm_booking_request(uuid) to authenticated;
