create table public.property_stakeholders (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.marketplace_listings(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('proprietaire', 'investisseur', 'locataire', 'observateur')),
  share_percent numeric(5,2) check (share_percent is null or share_percent between 0 and 100),
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  unique (listing_id, user_id, role)
);

create index property_stakeholders_user_idx
  on public.property_stakeholders (user_id, role, listing_id);
create index property_stakeholders_listing_idx
  on public.property_stakeholders (listing_id, role);

alter table public.property_stakeholders enable row level security;

create policy property_stakeholders_read
  on public.property_stakeholders for select to authenticated
  using (
    user_id = (select auth.uid())
    or public.can_manage_listing(listing_id)
  );
create policy property_stakeholders_insert
  on public.property_stakeholders for insert to authenticated
  with check (
    public.can_manage_listing(listing_id)
    and created_by = (select auth.uid())
  );
create policy property_stakeholders_update
  on public.property_stakeholders for update to authenticated
  using (public.can_manage_listing(listing_id))
  with check (public.can_manage_listing(listing_id));
create policy property_stakeholders_delete
  on public.property_stakeholders for delete to authenticated
  using (public.can_manage_listing(listing_id));

grant select, insert, update, delete on public.property_stakeholders to authenticated;

create or replace function public.is_listing_stakeholder(p_listing_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.property_stakeholders stakeholder
    where stakeholder.listing_id = p_listing_id
      and stakeholder.user_id = (select auth.uid())
  );
$$;

revoke all on function public.is_listing_stakeholder(uuid) from public, anon;
grant execute on function public.is_listing_stakeholder(uuid) to authenticated;

create policy marketplace_listings_stakeholder_read
  on public.marketplace_listings for select to authenticated
  using (public.is_listing_stakeholder(id));

create or replace function public.add_property_stakeholder_by_email(
  p_listing_id uuid,
  p_email text,
  p_role text,
  p_share_percent numeric default null
)
returns public.property_stakeholders
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_user_id uuid;
  stakeholder public.property_stakeholders;
begin
  if not public.can_manage_listing(p_listing_id) then
    raise exception 'not_authorized';
  end if;
  if p_role not in ('proprietaire', 'investisseur', 'locataire', 'observateur') then
    raise exception 'invalid_role';
  end if;
  select id into target_user_id
  from auth.users
  where lower(email) = lower(trim(p_email))
  limit 1;
  if target_user_id is null then
    raise exception 'account_not_found';
  end if;
  insert into public.property_stakeholders (
    listing_id, user_id, role, share_percent, created_by
  ) values (
    p_listing_id, target_user_id, p_role, p_share_percent, (select auth.uid())
  )
  on conflict (listing_id, user_id, role) do update
    set share_percent = excluded.share_percent
  returning * into stakeholder;
  return stakeholder;
end;
$$;

revoke all on function public.add_property_stakeholder_by_email(uuid, text, text, numeric) from public, anon;
grant execute on function public.add_property_stakeholder_by_email(uuid, text, text, numeric) to authenticated;

create table public.property_contracts (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.marketplace_listings(id) on delete cascade,
  booking_id uuid references public.booking_requests(id) on delete set null,
  tenant_id uuid references auth.users(id) on delete set null,
  owner_id uuid references auth.users(id) on delete set null,
  organization_id uuid references public.organizations(id) on delete set null,
  title text not null check (char_length(title) between 3 and 180),
  contract_kind text not null
    check (contract_kind in ('bail_habitation', 'location_meublee', 'mandat_gestion', 'reservation', 'vente')),
  status text not null default 'draft'
    check (status in ('draft', 'sent', 'signed', 'active', 'ended', 'cancelled')),
  start_date date,
  end_date date,
  monthly_amount numeric(14,2) check (monthly_amount is null or monthly_amount > 0),
  currency text not null default 'XOF' check (currency in ('XOF', 'EUR')),
  storage_path text,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (end_date is null or start_date is null or end_date >= start_date)
);

create index property_contracts_listing_status_idx
  on public.property_contracts (listing_id, status, created_at desc);
create index property_contracts_tenant_idx
  on public.property_contracts (tenant_id, status)
  where tenant_id is not null;
create index property_contracts_owner_idx
  on public.property_contracts (owner_id, status)
  where owner_id is not null;
create index property_contracts_booking_idx
  on public.property_contracts (booking_id)
  where booking_id is not null;
create index property_contracts_organization_idx
  on public.property_contracts (organization_id, status)
  where organization_id is not null;

alter table public.property_contracts enable row level security;

create policy property_contracts_read
  on public.property_contracts for select to authenticated
  using (
    public.can_manage_listing(listing_id)
    or tenant_id = (select auth.uid())
    or owner_id = (select auth.uid())
    or public.is_listing_stakeholder(listing_id)
  );
create policy property_contracts_insert
  on public.property_contracts for insert to authenticated
  with check (
    public.can_manage_listing(listing_id)
    and created_by = (select auth.uid())
  );
create policy property_contracts_update
  on public.property_contracts for update to authenticated
  using (public.can_manage_listing(listing_id))
  with check (public.can_manage_listing(listing_id));
create policy property_contracts_delete
  on public.property_contracts for delete to authenticated
  using (public.can_manage_listing(listing_id));

grant select, insert, update, delete on public.property_contracts to authenticated;

create or replace function public.notify_property_contract()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.tenant_id is not null and (tg_op = 'INSERT' or old.status is distinct from new.status) then
    insert into public.user_notifications (user_id, title, body, href, listing_id)
    values (
      new.tenant_id,
      'Mise à jour de votre contrat',
      new.title || ' · ' || new.status,
      '/voyages',
      new.listing_id
    );
  end if;
  return new;
end;
$$;

create trigger property_contracts_notify
  after insert or update of status on public.property_contracts
  for each row execute function public.notify_property_contract();

create or replace function private.block_self_service_agency_request()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.requested_account_type = 'agence'
    and old.requested_account_type is distinct from 'agence'
    and coalesce((select auth.jwt()) -> 'app_metadata' ->> 'role', '') <> 'admin'
    and coalesce((select auth.role()), '') <> 'service_role'
  then
    raise exception 'agency_onboarding_requires_admin';
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_block_self_service_agency_request on public.profiles;
create trigger profiles_block_self_service_agency_request
  before update of requested_account_type on public.profiles
  for each row execute function private.block_self_service_agency_request();

create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (
    id,
    full_name,
    account_type,
    requested_account_type
  )
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    'voyageur',
    case
      when new.raw_user_meta_data ->> 'requested_account_type' = 'proprietaire'
        then 'proprietaire'
      else 'voyageur'
    end
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create or replace function private.start_agency_onboarding(
  p_email text,
  p_business_name text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_user_id uuid;
begin
  if coalesce((select auth.jwt()) -> 'app_metadata' ->> 'role', '') <> 'admin' then
    raise exception 'admin_required';
  end if;
  select id into target_user_id
  from auth.users
  where lower(email) = lower(trim(p_email))
  limit 1;
  if target_user_id is null then
    raise exception 'account_not_found';
  end if;
  update public.profiles
  set requested_account_type = 'agence',
      identity_status = 'non_verifie',
      updated_at = now()
  where id = target_user_id;
  insert into public.host_public_profiles (owner_id, display_name, business_name, certified)
  values (target_user_id, coalesce(nullif(trim(p_business_name), ''), 'Agence immobilière'), nullif(trim(p_business_name), ''), false)
  on conflict (owner_id) do update
    set business_name = excluded.business_name,
        certified = false,
        updated_at = now();
  return target_user_id;
end;
$$;

revoke all on function private.start_agency_onboarding(text, text) from public, anon;
grant execute on function private.start_agency_onboarding(text, text) to authenticated;
