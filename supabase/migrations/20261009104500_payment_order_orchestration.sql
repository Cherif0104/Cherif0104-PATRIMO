-- Close legacy RLS paths, create payment orders atomically and expire stale holds.

drop policy if exists booking_requests_guest_cancel on public.booking_requests;
drop policy if exists booking_requests_owner_update on public.booking_requests;

alter table public.booking_requests
  drop constraint if exists booking_requests_status_check;
alter table public.booking_requests
  add constraint booking_requests_status_check
  check (status in (
    'requested', 'preapproved', 'awaiting_payment', 'confirmed',
    'declined', 'cancelled', 'completed', 'expired'
  ));

alter table public.payment_orders
  drop constraint if exists payment_orders_provider_check;
alter table public.payment_orders
  drop constraint if exists payment_orders_payment_method_check;
alter table public.payment_orders
  add constraint payment_orders_payment_method_check
  check (payment_method in (
    'hosted_checkout', 'wave', 'orange_money', 'card', 'manual'
  ));

drop policy if exists availability_blocks_expired_hold_delete
  on public.availability_blocks;
create policy availability_blocks_expired_hold_delete
  on public.availability_blocks for delete to authenticated
  using (
    source = 'reservation_hold'
    and expires_at is not null
    and expires_at <= now()
  );

create or replace function public.preapprove_booking_request(p_booking_id uuid)
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
    (select auth.uid()), now() + interval '30 minutes'
  );

  update public.booking_requests
  set status = 'preapproved', updated_at = now()
  where id = target.id
  returning * into target;

  return target;
end;
$$;

revoke all on function public.preapprove_booking_request(uuid) from public, anon;
grant execute on function public.preapprove_booking_request(uuid) to authenticated;

create or replace function public.create_payment_order(
  p_booking_id uuid,
  p_payer_id uuid,
  p_provider text,
  p_payment_method text,
  p_idempotency_key text
)
returns public.payment_orders
language plpgsql
security invoker
set search_path = ''
as $$
declare
  booking public.booking_requests;
  payment public.payment_orders;
begin
  if p_provider not in ('paydunya', 'flutterwave')
     or p_payment_method not in ('hosted_checkout', 'wave', 'orange_money', 'card') then
    raise exception 'payment_configuration_invalid' using errcode = '22023';
  end if;

  select *
  into payment
  from public.payment_orders
  where idempotency_key = p_idempotency_key;

  if payment.id is not null then
    if payment.booking_id <> p_booking_id or payment.payer_id <> p_payer_id then
      raise exception 'idempotency_key_conflict' using errcode = '23505';
    end if;
    return payment;
  end if;

  select *
  into booking
  from public.booking_requests
  where id = p_booking_id
  for update;

  if booking.id is null or booking.guest_id <> p_payer_id then
    raise exception 'booking_not_payable' using errcode = 'P0002';
  end if;
  if booking.status not in ('preapproved', 'awaiting_payment') then
    raise exception 'booking_not_payable' using errcode = 'P0001';
  end if;
  if not exists (
    select 1
    from public.availability_blocks b
    where b.booking_id = booking.id
      and b.source = 'reservation_hold'
      and b.expires_at > now()
  ) then
    raise exception 'booking_hold_expired' using errcode = 'P0001';
  end if;

  insert into public.payment_orders (
    booking_id, payer_id, provider, payment_method, status,
    amount, currency, idempotency_key, expires_at
  )
  values (
    booking.id, p_payer_id, p_provider, p_payment_method, 'created',
    booking.total, booking.currency, p_idempotency_key, now() + interval '25 minutes'
  )
  returning * into payment;

  update public.booking_requests
  set status = 'awaiting_payment', updated_at = now()
  where id = booking.id;

  return payment;
end;
$$;

revoke all on function public.create_payment_order(uuid, uuid, text, text, text)
  from public, anon, authenticated;
grant execute on function public.create_payment_order(uuid, uuid, text, text, text)
  to service_role;

create or replace function public.expire_payment_holds()
returns integer
language plpgsql
security invoker
set search_path = ''
as $$
declare
  expired_count integer;
begin
  with expired as (
    delete from public.availability_blocks
    where source = 'reservation_hold'
      and expires_at is not null
      and expires_at <= now()
    returning booking_id
  )
  update public.booking_requests b
  set status = 'expired', updated_at = now()
  where b.id in (select booking_id from expired)
    and b.status in ('preapproved', 'awaiting_payment');

  get diagnostics expired_count = row_count;

  update public.payment_orders p
  set status = 'cancelled', updated_at = now()
  where p.status in ('created', 'pending')
    and p.expires_at is not null
    and p.expires_at <= now();

  return expired_count;
end;
$$;

revoke all on function public.expire_payment_holds() from public, anon, authenticated;
grant execute on function public.expire_payment_holds() to service_role;
