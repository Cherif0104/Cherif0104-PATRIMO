create table public.email_outbox (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in (
    'booking_guest_created',
    'booking_owner_created',
    'organization_invitation',
    'verification_decision',
    'contract_update'
  )),
  recipient text not null check (position('@' in recipient) > 1),
  subject text not null check (char_length(subject) between 3 and 180),
  payload jsonb not null default '{}'::jsonb,
  dedupe_key text not null unique,
  status text not null default 'queued'
    check (status in ('queued', 'processing', 'sent', 'failed')),
  attempts integer not null default 0 check (attempts between 0 and 10),
  available_at timestamptz not null default now(),
  claimed_at timestamptz,
  sent_at timestamptz,
  provider_id text,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index email_outbox_delivery_idx
  on public.email_outbox (status, available_at, created_at)
  where status in ('queued', 'processing');

alter table public.email_outbox enable row level security;
revoke all on public.email_outbox from public, anon, authenticated;
grant select, update on public.email_outbox to service_role;

create or replace function private.enqueue_email(
  p_kind text,
  p_recipient text,
  p_subject text,
  p_payload jsonb,
  p_dedupe_key text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if coalesce(trim(p_recipient), '') = '' then
    return;
  end if;

  insert into public.email_outbox (
    kind,
    recipient,
    subject,
    payload,
    dedupe_key
  )
  values (
    p_kind,
    lower(trim(p_recipient)),
    p_subject,
    coalesce(p_payload, '{}'::jsonb),
    p_dedupe_key
  )
  on conflict (dedupe_key) do nothing;
end;
$$;

create or replace function private.queue_booking_emails()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  guest_email text;
  owner_email text;
begin
  select email into guest_email
  from auth.users
  where id = new.guest_id;

  select owner.email into owner_email
  from public.marketplace_listings listing
  join auth.users owner on owner.id = listing.owner_id
  where listing.id = new.listing_id;

  perform private.enqueue_email(
    'booking_guest_created',
    guest_email,
    'Votre demande a bien été transmise',
    jsonb_build_object(
      'booking_id', new.id,
      'listing_title', new.listing_title,
      'start_date', new.start_date,
      'end_date', new.end_date,
      'total', new.total,
      'currency', new.currency
    ),
    'booking:guest:' || new.id::text
  );

  perform private.enqueue_email(
    'booking_owner_created',
    owner_email,
    'Nouvelle demande pour votre bien',
    jsonb_build_object(
      'booking_id', new.id,
      'listing_title', new.listing_title,
      'guest_name', new.guest_name,
      'start_date', new.start_date,
      'end_date', new.end_date
    ),
    'booking:owner:' || new.id::text
  );
  return new;
end;
$$;

create trigger booking_requests_queue_emails
  after insert on public.booking_requests
  for each row execute function private.queue_booking_emails();

create or replace function private.queue_organization_invitation_email()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  organization_name text;
begin
  select name into organization_name
  from public.organizations
  where id = new.organization_id;

  perform private.enqueue_email(
    'organization_invitation',
    new.email,
    'Invitation à rejoindre ' || coalesce(organization_name, 'une organisation'),
    jsonb_build_object(
      'organization_name', organization_name,
      'token', new.token,
      'expires_at', new.expires_at
    ),
    'organization-invitation:' || new.id::text
  );
  return new;
end;
$$;

create trigger organization_invitations_queue_email
  after insert on public.organization_invitations
  for each row execute function private.queue_organization_invitation_email();

create or replace function private.queue_verification_decision_email()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  requester_email text;
begin
  if old.status is not distinct from new.status
    or new.status not in ('approved', 'rejected') then
    return new;
  end if;

  select email into requester_email
  from auth.users
  where id = new.requester_id;

  perform private.enqueue_email(
    'verification_decision',
    requester_email,
    case when new.status = 'approved'
      then 'Votre profil propriétaire est vérifié'
      else 'Mise à jour de votre demande de vérification'
    end,
    jsonb_build_object(
      'request_id', new.id,
      'status', new.status,
      'account_type', new.account_type
    ),
    'verification:' || new.id::text || ':' || new.status
  );
  return new;
end;
$$;

create trigger verification_requests_queue_email
  after update of status on public.verification_requests
  for each row execute function private.queue_verification_decision_email();

create or replace function private.queue_contract_email()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  tenant_email text;
begin
  if new.tenant_id is null
    or (tg_op = 'UPDATE' and old.status is not distinct from new.status) then
    return new;
  end if;

  select email into tenant_email
  from auth.users
  where id = new.tenant_id;

  perform private.enqueue_email(
    'contract_update',
    tenant_email,
    'Mise à jour de votre contrat',
    jsonb_build_object(
      'contract_id', new.id,
      'title', new.title,
      'status', new.status,
      'listing_id', new.listing_id
    ),
    'contract:' || new.id::text || ':' || new.status
  );
  return new;
end;
$$;

create trigger property_contracts_queue_email
  after insert or update of status on public.property_contracts
  for each row execute function private.queue_contract_email();

create or replace function public.claim_email_outbox(p_limit integer default 20)
returns setof public.email_outbox
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (select auth.role()) <> 'service_role' then
    raise exception 'service_role_required';
  end if;

  return query
  with candidates as (
    select outbox.id
    from public.email_outbox outbox
    where (
      outbox.status = 'queued'
      or (
        outbox.status = 'processing'
        and outbox.claimed_at < now() - interval '15 minutes'
      )
    )
      and outbox.available_at <= now()
      and outbox.attempts < 5
    order by outbox.created_at
    for update skip locked
    limit least(greatest(p_limit, 1), 100)
  )
  update public.email_outbox outbox
  set status = 'processing',
      attempts = outbox.attempts + 1,
      claimed_at = now(),
      updated_at = now()
  from candidates
  where outbox.id = candidates.id
  returning outbox.*;
end;
$$;

revoke all on function public.claim_email_outbox(integer)
  from public, anon, authenticated;
grant execute on function public.claim_email_outbox(integer)
  to service_role;
