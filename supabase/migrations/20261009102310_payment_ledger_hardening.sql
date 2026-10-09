-- Payment-safe booking state machine, immutable financial ledger and PSP inbox.

drop function if exists public.confirm_booking_request(uuid);

alter table public.availability_blocks
  add column if not exists booking_id uuid unique
    references public.booking_requests(id) on delete restrict,
  add column if not exists expires_at timestamptz;

alter table public.availability_blocks
  drop constraint if exists availability_blocks_source_check;
alter table public.availability_blocks
  add constraint availability_blocks_source_check
  check (source in (
    'owner', 'reservation', 'reservation_hold',
    'reservation_confirmed', 'maintenance', 'external'
  ));
update public.availability_blocks
set source = 'reservation_confirmed'
where source = 'reservation';

drop policy if exists availability_blocks_owner_delete on public.availability_blocks;
create policy availability_blocks_owner_delete
  on public.availability_blocks for delete to authenticated
  using (
    source not in ('reservation_hold', 'reservation_confirmed')
    and exists (
      select 1 from public.marketplace_listings l
      where l.id = availability_blocks.listing_id
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
  );

revoke update on public.availability_blocks from authenticated;

drop policy if exists booking_requests_participant_update on public.booking_requests;
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
      and status in ('preapproved', 'declined')
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

alter table public.payment_orders rename column provider to payment_method;
alter table public.payment_orders
  add column provider text
    check (provider in ('paydunya', 'flutterwave', 'sandbox')),
  add column checkout_url text,
  add column expires_at timestamptz,
  add column updated_at timestamptz not null default now();
alter table public.payment_orders
  alter column provider set not null;

create table public.payment_webhook_inbox (
  id uuid primary key default gen_random_uuid(),
  provider text not null check (provider in ('paydunya', 'flutterwave', 'sandbox')),
  event_id text not null,
  event_type text not null,
  payload jsonb not null,
  payload_sha256 text not null,
  signature_valid boolean not null default false,
  processing_status text not null default 'received'
    check (processing_status in ('received', 'processed', 'ignored', 'failed')),
  attempts integer not null default 0,
  last_error text,
  received_at timestamptz not null default now(),
  processed_at timestamptz,
  unique (provider, event_id)
);
alter table public.payment_webhook_inbox enable row level security;
revoke all on public.payment_webhook_inbox from anon, authenticated;

create table public.ledger_transactions (
  id uuid primary key default gen_random_uuid(),
  reference_type text not null
    check (reference_type in ('payment', 'refund', 'payout', 'adjustment', 'dispute')),
  reference_id uuid not null,
  idempotency_key text not null unique,
  description text not null,
  currency text not null check (currency in ('XOF', 'EUR')),
  created_at timestamptz not null default now()
);
alter table public.ledger_transactions enable row level security;
revoke all on public.ledger_transactions from anon, authenticated;

create table public.ledger_entries (
  id bigint generated always as identity primary key,
  transaction_id uuid not null
    references public.ledger_transactions(id) on delete restrict,
  account_code text not null
    check (account_code in (
      'psp_receivable', 'owner_payable', 'platform_revenue',
      'psp_fees', 'customer_refund', 'chargeback_reserve'
    )),
  direction text not null check (direction in ('debit', 'credit')),
  amount_minor bigint not null check (amount_minor > 0),
  owner_id uuid references auth.users(id) on delete restrict,
  created_at timestamptz not null default now()
);
create index ledger_entries_transaction_idx
  on public.ledger_entries (transaction_id);
create index ledger_entries_owner_idx
  on public.ledger_entries (owner_id)
  where owner_id is not null;
alter table public.ledger_entries enable row level security;
revoke all on public.ledger_entries from anon, authenticated;

create or replace function private.enforce_balanced_ledger()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  target_id uuid := coalesce(new.transaction_id, old.transaction_id);
  debit_total bigint;
  credit_total bigint;
begin
  select
    coalesce(sum(amount_minor) filter (where direction = 'debit'), 0),
    coalesce(sum(amount_minor) filter (where direction = 'credit'), 0)
  into debit_total, credit_total
  from public.ledger_entries
  where transaction_id = target_id;

  if debit_total <> credit_total then
    raise exception 'unbalanced_ledger_transaction'
      using errcode = '23514';
  end if;
  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

create constraint trigger ledger_entries_must_balance
after insert or update or delete on public.ledger_entries
deferrable initially deferred
for each row execute function private.enforce_balanced_ledger();

create table public.refunds (
  id uuid primary key default gen_random_uuid(),
  payment_order_id uuid not null references public.payment_orders(id) on delete restrict,
  booking_id uuid not null references public.booking_requests(id) on delete restrict,
  status text not null default 'requested'
    check (status in ('requested', 'processing', 'succeeded', 'failed', 'cancelled')),
  amount_minor bigint not null check (amount_minor > 0),
  currency text not null check (currency in ('XOF', 'EUR')),
  reason text not null,
  provider_reference text unique,
  idempotency_key text not null unique,
  created_at timestamptz not null default now(),
  processed_at timestamptz
);
create index refunds_booking_idx on public.refunds (booking_id);
alter table public.refunds enable row level security;

create policy refunds_participant_read
  on public.refunds for select to authenticated
  using (
    exists (
      select 1
      from public.booking_requests b
      left join public.marketplace_listings l on l.id = b.listing_id
      where b.id = refunds.booking_id
        and (
          b.guest_id = (select auth.uid())
          or l.owner_id = (select auth.uid())
          or exists (
            select 1 from public.organization_members m
            where m.organization_id = l.organization_id
              and m.user_id = (select auth.uid())
          )
        )
    )
  );
grant select on public.refunds to authenticated;

create table public.payouts (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete restrict,
  booking_id uuid references public.booking_requests(id) on delete restrict,
  status text not null default 'scheduled'
    check (status in ('scheduled', 'processing', 'succeeded', 'failed', 'held', 'cancelled')),
  amount_minor bigint not null check (amount_minor > 0),
  currency text not null check (currency in ('XOF', 'EUR')),
  provider text not null check (provider in ('paydunya', 'flutterwave', 'sandbox')),
  destination_type text not null check (destination_type in ('wave', 'orange_money', 'bank')),
  destination_masked text not null,
  provider_reference text unique,
  idempotency_key text not null unique,
  available_at timestamptz not null,
  created_at timestamptz not null default now(),
  processed_at timestamptz
);
create index payouts_owner_idx on public.payouts (owner_id, created_at desc);
alter table public.payouts enable row level security;
create policy payouts_owner_read
  on public.payouts for select to authenticated
  using (owner_id = (select auth.uid()));
grant select on public.payouts to authenticated;

create or replace function private.minor_amount(p_amount numeric, p_currency text)
returns bigint
language sql
immutable
set search_path = ''
as $$
  select case
    when p_currency = 'EUR' then round(p_amount * 100)::bigint
    else round(p_amount)::bigint
  end;
$$;

create or replace function public.process_successful_payment(
  p_order_id uuid,
  p_provider_reference text,
  p_event_id text
)
returns public.booking_requests
language plpgsql
security invoker
set search_path = ''
as $$
declare
  payment public.payment_orders;
  booking public.booking_requests;
  listing public.marketplace_listings;
  ledger_id uuid;
  total_minor bigint;
  owner_minor bigint;
  platform_minor bigint;
begin
  select * into payment
  from public.payment_orders
  where id = p_order_id
  for update;

  if payment.id is null then
    raise exception 'payment_not_found' using errcode = 'P0002';
  end if;
  if payment.status = 'paid' then
    select * into booking
    from public.booking_requests
    where id = payment.booking_id;
    return booking;
  end if;
  if payment.status not in ('created', 'pending') then
    raise exception 'payment_not_processable' using errcode = 'P0001';
  end if;

  select * into booking
  from public.booking_requests
  where id = payment.booking_id
  for update;

  if booking.status not in ('preapproved', 'awaiting_payment') then
    raise exception 'booking_not_payable' using errcode = 'P0001';
  end if;
  if not exists (
    select 1 from public.availability_blocks b
    where b.booking_id = booking.id
      and b.source = 'reservation_hold'
      and (b.expires_at is null or b.expires_at > now())
  ) then
    raise exception 'booking_hold_expired' using errcode = 'P0001';
  end if;

  select * into listing
  from public.marketplace_listings
  where id = booking.listing_id;

  total_minor := private.minor_amount(booking.total, booking.currency);
  owner_minor := private.minor_amount(
    coalesce((booking.quote_snapshot ->> 'ownerReceives')::numeric, 0),
    booking.currency
  );
  platform_minor := total_minor - owner_minor;

  if payment.amount <> booking.total
     or payment.currency <> booking.currency
     or owner_minor < 0
     or platform_minor < 0 then
    raise exception 'payment_amount_mismatch' using errcode = 'P0001';
  end if;

  update public.payment_orders
  set status = 'paid',
      provider_reference = p_provider_reference,
      paid_at = now(),
      updated_at = now()
  where id = payment.id;

  insert into public.ledger_transactions (
    reference_type, reference_id, idempotency_key, description, currency
  )
  values (
    'payment', payment.id, payment.idempotency_key,
    'Paiement réservation ' || booking.id::text, booking.currency
  )
  returning id into ledger_id;

  insert into public.ledger_entries (
    transaction_id, account_code, direction, amount_minor, owner_id
  )
  values (ledger_id, 'psp_receivable', 'debit', total_minor, null);

  if owner_minor > 0 then
    insert into public.ledger_entries (
      transaction_id, account_code, direction, amount_minor, owner_id
    )
    values (ledger_id, 'owner_payable', 'credit', owner_minor, listing.owner_id);
  end if;

  if platform_minor > 0 then
    insert into public.ledger_entries (
      transaction_id, account_code, direction, amount_minor, owner_id
    )
    values (ledger_id, 'platform_revenue', 'credit', platform_minor, null);
  end if;

  update public.availability_blocks
  set source = 'reservation_confirmed', expires_at = null
  where booking_id = booking.id;

  update public.booking_requests
  set status = 'confirmed', updated_at = now()
  where id = booking.id
  returning * into booking;

  update public.payment_webhook_inbox
  set processing_status = 'processed',
      processed_at = now(),
      attempts = attempts + 1
  where provider = payment.provider
    and event_id = p_event_id;

  return booking;
end;
$$;

revoke all on function public.process_successful_payment(uuid, text, text)
  from public, anon, authenticated;
grant execute on function public.process_successful_payment(uuid, text, text)
  to service_role;
