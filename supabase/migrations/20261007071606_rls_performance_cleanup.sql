create index platform_settings_updated_by_idx on public.platform_settings (updated_by);

drop policy if exists profiles_self_read on public.profiles;
drop policy if exists profiles_admin_read on public.profiles;
create policy profiles_authorized_read
  on public.profiles for select to authenticated
  using (
    id = (select auth.uid())
    or ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin'
  );

-- Identity verification stays backend-only until the KYC provider is connected.
drop policy if exists profiles_admin_verify on public.profiles;
revoke update (identity_status, updated_at) on public.profiles from authenticated;

drop policy if exists marketplace_listings_public_read on public.marketplace_listings;
drop policy if exists marketplace_listings_admin_read on public.marketplace_listings;
create policy marketplace_listings_authorized_read
  on public.marketplace_listings for select
  using (
    status = 'published'
    or owner_id = (select auth.uid())
    or ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin'
    or (
      organization_id is not null
      and exists (
        select 1 from public.organization_members m
        where m.organization_id = marketplace_listings.organization_id
          and m.user_id = (select auth.uid())
      )
    )
  );

drop policy if exists marketplace_listings_owner_update on public.marketplace_listings;
drop policy if exists marketplace_listings_admin_review on public.marketplace_listings;
create policy marketplace_listings_authorized_update
  on public.marketplace_listings for update to authenticated
  using (
    ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin'
    or owner_id = (select auth.uid())
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
    ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin'
    or (
      status in ('draft', 'pending_review')
      and (
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
    )
  );

drop policy if exists platform_settings_admin_insert on public.platform_settings;
create policy platform_settings_admin_insert
  on public.platform_settings for insert to authenticated
  with check (
    id = 'marketplace'
    and updated_by = (select auth.uid())
    and ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin'
  );

drop policy if exists platform_settings_admin_update on public.platform_settings;
create policy platform_settings_admin_update
  on public.platform_settings for update to authenticated
  using (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin')
  with check (
    id = 'marketplace'
    and updated_by = (select auth.uid())
    and ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin'
  );
