-- Ameena production foundation: identity, ownership, listings, bookings and availability.
-- Authorization is based on auth.uid() and organization membership, never user-editable metadata.

create extension if not exists btree_gist with schema extensions;

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  avatar_url text,
  account_type text not null default 'voyageur'
    check (account_type in ('voyageur', 'proprietaire', 'agence')),
  phone text,
  country_code text not null default 'SN',
  identity_status text not null default 'non_verifie'
    check (identity_status in ('non_verifie', 'en_verification', 'verifie', 'refuse')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy profiles_public_read
  on public.profiles for select
  using (true);

create policy profiles_self_update
  on public.profiles for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

grant select on public.profiles to anon, authenticated;
grant update (full_name, avatar_url, account_type, phone, country_code) on public.profiles to authenticated;

create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name, account_type)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    case
      when new.raw_user_meta_data ->> 'account_type' in ('voyageur', 'proprietaire', 'agence')
        then new.raw_user_meta_data ->> 'account_type'
      else 'voyageur'
    end
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure private.handle_new_user();

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 120),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  legal_name text,
  owner_id uuid not null references auth.users(id) on delete restrict,
  verification_status text not null default 'non_verifie'
    check (verification_status in ('non_verifie', 'en_verification', 'verifie', 'refuse')),
  created_at timestamptz not null default now()
);

create table public.organization_members (
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('owner', 'manager', 'agent', 'viewer')),
  created_at timestamptz not null default now(),
  primary key (organization_id, user_id)
);

alter table public.organizations enable row level security;
alter table public.organization_members enable row level security;

create policy organizations_member_read
  on public.organizations for select to authenticated
  using (
    owner_id = (select auth.uid())
    or exists (
      select 1 from public.organization_members m
      where m.organization_id = organizations.id
        and m.user_id = (select auth.uid())
    )
  );

create policy organizations_owner_insert
  on public.organizations for insert to authenticated
  with check (owner_id = (select auth.uid()));

create policy organizations_owner_update
  on public.organizations for update to authenticated
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));

create policy organization_members_member_read
  on public.organization_members for select to authenticated
  using (
    user_id = (select auth.uid())
    or exists (
      select 1 from public.organizations o
      where o.id = organization_members.organization_id
        and o.owner_id = (select auth.uid())
    )
  );

create policy organization_members_owner_write
  on public.organization_members for all to authenticated
  using (
    exists (
      select 1 from public.organizations o
      where o.id = organization_members.organization_id
        and o.owner_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1 from public.organizations o
      where o.id = organization_members.organization_id
        and o.owner_id = (select auth.uid())
    )
  );

grant select, insert, update on public.organizations to authenticated;
grant select, insert, update, delete on public.organization_members to authenticated;

create table public.marketplace_listings (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  owner_id uuid not null references auth.users(id) on delete restrict,
  organization_id uuid references public.organizations(id) on delete set null,
  status text not null default 'draft'
    check (status in ('draft', 'pending_review', 'published', 'suspended', 'archived')),
  mode text not null check (mode in ('sejour', 'location')),
  title text not null check (char_length(title) between 10 and 140),
  city text not null,
  country text not null,
  neighborhood text not null,
  price numeric(14,2) not null check (price > 0),
  currency text not null check (currency in ('XOF', 'EUR')),
  lat double precision not null check (lat between -90 and 90),
  lng double precision not null check (lng between -180 and 180),
  data jsonb not null default '{}'::jsonb,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index marketplace_listings_public_search_idx
  on public.marketplace_listings (status, mode, country, city);
create index marketplace_listings_owner_idx
  on public.marketplace_listings (owner_id, status);
create index marketplace_listings_org_idx
  on public.marketplace_listings (organization_id)
  where organization_id is not null;

alter table public.marketplace_listings enable row level security;

create policy marketplace_listings_public_read
  on public.marketplace_listings for select
  using (
    status = 'published'
    or owner_id = (select auth.uid())
    or (
      organization_id is not null
      and exists (
        select 1 from public.organization_members m
        where m.organization_id = marketplace_listings.organization_id
          and m.user_id = (select auth.uid())
      )
    )
  );

create policy marketplace_listings_owner_insert
  on public.marketplace_listings for insert to authenticated
  with check (
    owner_id = (select auth.uid())
    and (
      organization_id is null
      or exists (
        select 1 from public.organization_members m
        where m.organization_id = marketplace_listings.organization_id
          and m.user_id = (select auth.uid())
          and m.role in ('owner', 'manager', 'agent')
      )
    )
  );

create policy marketplace_listings_owner_update
  on public.marketplace_listings for update to authenticated
  using (
    owner_id = (select auth.uid())
    or (
      organization_id is not null
      and exists (
        select 1 from public.organization_members m
        where m.organization_id = marketplace_listings.organization_id
          and m.user_id = (select auth.uid())
          and m.role in ('owner', 'manager', 'agent')
      )
    )
  )
  with check (
    owner_id = (select auth.uid())
    or (
      organization_id is not null
      and exists (
        select 1 from public.organization_members m
        where m.organization_id = marketplace_listings.organization_id
          and m.user_id = (select auth.uid())
          and m.role in ('owner', 'manager', 'agent')
      )
    )
  );

grant select on public.marketplace_listings to anon, authenticated;
grant insert, update on public.marketplace_listings to authenticated;

create table public.availability_blocks (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.marketplace_listings(id) on delete cascade,
  start_date date not null,
  end_date date not null,
  source text not null default 'owner'
    check (source in ('owner', 'reservation', 'maintenance', 'external')),
  note text,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  check (end_date > start_date),
  exclude using gist (
    listing_id with =,
    daterange(start_date, end_date, '[)') with &&
  )
);

create index availability_blocks_dates_idx
  on public.availability_blocks (listing_id, start_date, end_date);

alter table public.availability_blocks enable row level security;

create policy availability_blocks_public_read
  on public.availability_blocks for select
  using (
    exists (
      select 1 from public.marketplace_listings l
      where l.id = availability_blocks.listing_id
        and (
          l.status = 'published'
          or l.owner_id = (select auth.uid())
          or exists (
            select 1 from public.organization_members m
            where m.organization_id = l.organization_id
              and m.user_id = (select auth.uid())
          )
        )
    )
  );

create policy availability_blocks_owner_write
  on public.availability_blocks for all to authenticated
  using (
    exists (
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
  )
  with check (
    created_by = (select auth.uid())
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

grant select on public.availability_blocks to anon, authenticated;
grant insert, update, delete on public.availability_blocks to authenticated;

create table public.booking_requests (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid references public.marketplace_listings(id) on delete set null,
  listing_key text not null,
  listing_title text not null,
  guest_id uuid not null references auth.users(id) on delete restrict,
  guest_name text not null check (char_length(guest_name) between 2 and 120),
  guest_phone text,
  mode text not null check (mode in ('sejour', 'location')),
  start_date date not null,
  end_date date not null,
  status text not null default 'requested'
    check (status in ('requested', 'preapproved', 'awaiting_payment', 'confirmed', 'declined', 'cancelled', 'completed')),
  subtotal numeric(14,2) not null check (subtotal >= 0),
  commission numeric(14,2) not null check (commission >= 0),
  total numeric(14,2) not null check (total >= 0),
  currency text not null check (currency in ('XOF', 'EUR')),
  quote_snapshot jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (end_date > start_date)
);

create index booking_requests_guest_idx
  on public.booking_requests (guest_id, created_at desc);
create index booking_requests_listing_idx
  on public.booking_requests (listing_id, status, start_date, end_date)
  where listing_id is not null;

alter table public.booking_requests enable row level security;

create policy booking_requests_guest_read
  on public.booking_requests for select to authenticated
  using (
    guest_id = (select auth.uid())
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
            )
          )
      )
    )
  );

create policy booking_requests_guest_insert
  on public.booking_requests for insert to authenticated
  with check (guest_id = (select auth.uid()) and status = 'requested');

create policy booking_requests_guest_cancel
  on public.booking_requests for update to authenticated
  using (guest_id = (select auth.uid()) and status in ('requested', 'preapproved', 'awaiting_payment'))
  with check (guest_id = (select auth.uid()) and status = 'cancelled');

create policy booking_requests_owner_update
  on public.booking_requests for update to authenticated
  using (
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
  with check (
    listing_id is not null
    and status in ('preapproved', 'awaiting_payment', 'confirmed', 'declined', 'completed')
  );

grant select, insert, update on public.booking_requests to authenticated;

create table public.favorites (
  user_id uuid not null references auth.users(id) on delete cascade,
  listing_key text not null,
  created_at timestamptz not null default now(),
  primary key (user_id, listing_key)
);

alter table public.favorites enable row level security;

create policy favorites_self
  on public.favorites for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

grant select, insert, delete on public.favorites to authenticated;

create table public.payment_orders (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.booking_requests(id) on delete restrict,
  payer_id uuid not null references auth.users(id) on delete restrict,
  provider text not null check (provider in ('wave', 'orange_money', 'card', 'manual')),
  provider_reference text unique,
  status text not null default 'created'
    check (status in ('created', 'pending', 'paid', 'failed', 'refunded', 'cancelled')),
  amount numeric(14,2) not null check (amount > 0),
  currency text not null check (currency in ('XOF', 'EUR')),
  idempotency_key text not null unique,
  created_at timestamptz not null default now(),
  paid_at timestamptz
);

alter table public.payment_orders enable row level security;

create policy payment_orders_participant_read
  on public.payment_orders for select to authenticated
  using (
    payer_id = (select auth.uid())
    or exists (
      select 1
      from public.booking_requests b
      join public.marketplace_listings l on l.id = b.listing_id
      where b.id = payment_orders.booking_id
        and (
          l.owner_id = (select auth.uid())
          or exists (
            select 1 from public.organization_members m
            where m.organization_id = l.organization_id
              and m.user_id = (select auth.uid())
          )
        )
    )
  );

grant select on public.payment_orders to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'listing-media',
  'listing-media',
  true,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp', 'image/avif']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy listing_media_public_read
  on storage.objects for select
  using (bucket_id = 'listing-media');

create policy listing_media_owner_insert
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'listing-media'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy listing_media_owner_update
  on storage.objects for update to authenticated
  using (
    bucket_id = 'listing-media'
    and owner_id = (select auth.uid()::text)
  )
  with check (
    bucket_id = 'listing-media'
    and owner_id = (select auth.uid()::text)
  );

create policy listing_media_owner_delete
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'listing-media'
    and owner_id = (select auth.uid()::text)
  );

-- Retire the globally writable demo document from the Data API.
drop policy if exists ameena_state_select on public.ameena_state;
drop policy if exists ameena_state_insert on public.ameena_state;
drop policy if exists ameena_state_update on public.ameena_state;
revoke all on public.ameena_state from anon, authenticated;
