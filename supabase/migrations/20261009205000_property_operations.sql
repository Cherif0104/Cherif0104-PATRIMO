create or replace function public.can_manage_listing(p_listing_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.marketplace_listings listing
    where listing.id = p_listing_id
      and (
        listing.owner_id = (select auth.uid())
        or ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin'
        or (
          listing.organization_id is not null
          and exists (
            select 1
            from public.organization_members member
            where member.organization_id = listing.organization_id
              and member.user_id = (select auth.uid())
              and member.role in ('owner', 'manager', 'agent')
          )
        )
      )
  );
$$;

revoke all on function public.can_manage_listing(uuid) from public, anon;
grant execute on function public.can_manage_listing(uuid) to authenticated;

create table public.property_incidents (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.marketplace_listings(id) on delete cascade,
  title text not null check (char_length(title) between 3 and 160),
  category text not null check (category in ('panne', 'sinistre', 'probleme', 'autre')),
  description text not null default '' check (char_length(description) <= 4000),
  reporter text not null check (char_length(reporter) between 2 and 120),
  status text not null default 'nouveau'
    check (status in ('nouveau', 'pris-en-charge', 'resolu')),
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  resolved_at timestamptz
);

create index property_incidents_listing_status_idx
  on public.property_incidents (listing_id, status, created_at desc);

create table public.property_inspections (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.marketplace_listings(id) on delete cascade,
  kind text not null check (kind in ('entree', 'sortie')),
  inspection_date date not null,
  author text not null check (char_length(author) between 2 and 120),
  rooms jsonb not null default '[]'::jsonb check (jsonb_typeof(rooms) = 'array'),
  meters jsonb not null default '[]'::jsonb check (jsonb_typeof(meters) = 'array'),
  keys_count integer not null default 0 check (keys_count between 0 and 100),
  comments text not null default '' check (char_length(comments) <= 4000),
  tenant_signature text,
  owner_signature text,
  signed_at timestamptz,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  check (
    signed_at is null
    or (
      char_length(coalesce(tenant_signature, '')) >= 2
      and char_length(coalesce(owner_signature, '')) >= 2
    )
  )
);

create index property_inspections_listing_date_idx
  on public.property_inspections (listing_id, inspection_date desc);

create table public.property_expenses (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.marketplace_listings(id) on delete cascade,
  label text not null check (char_length(label) between 2 and 160),
  category text not null check (category in ('reparation', 'taxe', 'syndic', 'menage', 'autre')),
  amount numeric(14,2) not null check (amount > 0),
  currency text not null check (currency in ('XOF', 'EUR')),
  expense_date date not null,
  charge_to_tenant boolean not null default false,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now()
);

create index property_expenses_listing_date_idx
  on public.property_expenses (listing_id, expense_date desc);

create table public.property_media (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.marketplace_listings(id) on delete cascade,
  entity_type text not null check (entity_type in ('incident', 'inspection')),
  entity_id uuid not null,
  media_kind text not null check (media_kind in ('photo', 'room', 'water_meter', 'power_meter')),
  storage_path text not null unique,
  sort_order integer not null default 0,
  uploaded_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now()
);

create index property_media_entity_idx
  on public.property_media (entity_type, entity_id, sort_order);

alter table public.property_incidents enable row level security;
alter table public.property_inspections enable row level security;
alter table public.property_expenses enable row level security;
alter table public.property_media enable row level security;

create policy property_incidents_read
  on public.property_incidents for select to authenticated
  using (public.can_manage_listing(listing_id));
create policy property_incidents_insert
  on public.property_incidents for insert to authenticated
  with check (
    public.can_manage_listing(listing_id)
    and created_by = (select auth.uid())
  );
create policy property_incidents_update
  on public.property_incidents for update to authenticated
  using (public.can_manage_listing(listing_id))
  with check (public.can_manage_listing(listing_id));
create policy property_incidents_delete
  on public.property_incidents for delete to authenticated
  using (public.can_manage_listing(listing_id));

create policy property_inspections_read
  on public.property_inspections for select to authenticated
  using (public.can_manage_listing(listing_id));
create policy property_inspections_insert
  on public.property_inspections for insert to authenticated
  with check (
    public.can_manage_listing(listing_id)
    and created_by = (select auth.uid())
  );
create policy property_inspections_update
  on public.property_inspections for update to authenticated
  using (public.can_manage_listing(listing_id))
  with check (public.can_manage_listing(listing_id));
create policy property_inspections_delete
  on public.property_inspections for delete to authenticated
  using (public.can_manage_listing(listing_id));

create policy property_expenses_read
  on public.property_expenses for select to authenticated
  using (public.can_manage_listing(listing_id));
create policy property_expenses_insert
  on public.property_expenses for insert to authenticated
  with check (
    public.can_manage_listing(listing_id)
    and created_by = (select auth.uid())
  );
create policy property_expenses_update
  on public.property_expenses for update to authenticated
  using (public.can_manage_listing(listing_id))
  with check (public.can_manage_listing(listing_id));
create policy property_expenses_delete
  on public.property_expenses for delete to authenticated
  using (public.can_manage_listing(listing_id));

create policy property_media_read
  on public.property_media for select to authenticated
  using (public.can_manage_listing(listing_id))
;
create policy property_media_insert
  on public.property_media for insert to authenticated
  with check (
    public.can_manage_listing(listing_id)
    and uploaded_by = (select auth.uid())
  );
create policy property_media_delete
  on public.property_media for delete to authenticated
  using (public.can_manage_listing(listing_id));

grant select, insert, update, delete on public.property_incidents to authenticated;
grant select, insert, update, delete on public.property_inspections to authenticated;
grant select, insert, update, delete on public.property_expenses to authenticated;
grant select, insert, delete on public.property_media to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'property-media',
  'property-media',
  false,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy property_media_storage_insert
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'property-media'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy property_media_storage_select
  on storage.objects for select to authenticated
  using (
    bucket_id = 'property-media'
    and exists (
      select 1
      from public.property_media media
      where media.storage_path = name
        and public.can_manage_listing(media.listing_id)
    )
  );

create policy property_media_storage_delete
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'property-media'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
