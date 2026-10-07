create table public.platform_settings (
  id text primary key check (id = 'marketplace'),
  payload jsonb not null,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id) on delete set null
);

alter table public.platform_settings enable row level security;

create policy platform_settings_public_read
  on public.platform_settings for select
  using (id = 'marketplace');

create policy platform_settings_admin_insert
  on public.platform_settings for insert to authenticated
  with check (
    id = 'marketplace'
    and updated_by = (select auth.uid())
    and (select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

create policy platform_settings_admin_update
  on public.platform_settings for update to authenticated
  using ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  with check (
    id = 'marketplace'
    and updated_by = (select auth.uid())
    and (select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

grant select on public.platform_settings to anon, authenticated;
grant insert, update on public.platform_settings to authenticated;
