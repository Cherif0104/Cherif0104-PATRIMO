-- Public host cards contain only data that a publisher explicitly makes public.
create table public.host_public_profiles (
  owner_id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null check (char_length(display_name) between 2 and 120),
  business_name text check (business_name is null or char_length(business_name) between 2 and 120),
  bio text check (bio is null or char_length(bio) <= 600),
  whatsapp_e164 text,
  whatsapp_enabled boolean not null default false,
  certified boolean not null default false,
  updated_at timestamptz not null default now(),
  check (
    (not whatsapp_enabled and whatsapp_e164 is null)
    or (
      whatsapp_enabled
      and whatsapp_e164 ~ '^\+[1-9][0-9]{7,14}$'
    )
  )
);

alter table public.host_public_profiles enable row level security;

create policy host_public_profiles_read
  on public.host_public_profiles for select
  using (true);

create policy host_public_profiles_owner_insert
  on public.host_public_profiles for insert to authenticated
  with check (owner_id = (select auth.uid()) and certified = false);

create policy host_public_profiles_owner_update
  on public.host_public_profiles for update to authenticated
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));

grant select on public.host_public_profiles to anon, authenticated;
grant insert (
  owner_id,
  display_name,
  business_name,
  bio,
  whatsapp_e164,
  whatsapp_enabled,
  updated_at
) on public.host_public_profiles to authenticated;
grant update (
  display_name,
  business_name,
  bio,
  whatsapp_e164,
  whatsapp_enabled,
  updated_at
) on public.host_public_profiles to authenticated;

create or replace function private.sync_host_public_profile()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.account_type in ('proprietaire', 'agence') then
    insert into public.host_public_profiles (owner_id, display_name)
    values (new.id, coalesce(nullif(btrim(new.full_name), ''), 'Hôte'))
    on conflict (owner_id) do update
      set display_name = excluded.display_name,
          updated_at = now();
  end if;
  return new;
end;
$$;

create trigger profiles_sync_host_public_profile
  after insert or update of full_name, account_type on public.profiles
  for each row execute procedure private.sync_host_public_profile();

create table public.verification_requests (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references auth.users(id) on delete cascade,
  account_type text not null check (account_type in ('proprietaire', 'agence')),
  business_name text,
  note text check (note is null or char_length(note) <= 1000),
  status text not null default 'pending'
    check (status in ('pending', 'reviewing', 'approved', 'rejected')),
  created_at timestamptz not null default now(),
  reviewed_at timestamptz
);

create unique index verification_requests_one_active_idx
  on public.verification_requests (requester_id)
  where status in ('pending', 'reviewing');

alter table public.verification_requests enable row level security;

create policy verification_requests_self_read
  on public.verification_requests for select to authenticated
  using (
    requester_id = (select auth.uid())
    or ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin'
  );

create policy verification_requests_self_insert
  on public.verification_requests for insert to authenticated
  with check (
    requester_id = (select auth.uid())
    and status = 'pending'
    and exists (
      select 1 from public.profiles profile
      where profile.id = (select auth.uid())
        and profile.account_type in ('proprietaire', 'agence')
    )
  );

grant select on public.verification_requests to authenticated;
grant insert (requester_id, account_type, business_name, note)
  on public.verification_requests to authenticated;

create table public.offer_requests (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references auth.users(id) on delete cascade,
  offer_kind text not null check (offer_kind in ('experience', 'service')),
  offer_key text not null,
  offer_title text not null,
  customer_name text not null check (char_length(customer_name) between 2 and 120),
  customer_phone text,
  preferred_date date not null,
  people integer not null default 1 check (people between 1 and 50),
  status text not null default 'requested'
    check (status in ('requested', 'contacted', 'confirmed', 'declined', 'cancelled', 'completed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index offer_requests_customer_created_idx
  on public.offer_requests (customer_id, created_at desc);
create index offer_requests_status_created_idx
  on public.offer_requests (status, created_at desc);

alter table public.offer_requests enable row level security;

create policy offer_requests_customer_read
  on public.offer_requests for select to authenticated
  using (
    customer_id = (select auth.uid())
    or ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin'
  );

create policy offer_requests_customer_insert
  on public.offer_requests for insert to authenticated
  with check (customer_id = (select auth.uid()) and status = 'requested');

create policy offer_requests_customer_cancel
  on public.offer_requests for update to authenticated
  using (customer_id = (select auth.uid()) and status = 'requested')
  with check (customer_id = (select auth.uid()) and status = 'cancelled');

grant select, insert, update (status, updated_at)
  on public.offer_requests to authenticated;
