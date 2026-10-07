-- Admin authorization is assigned in auth.users.raw_app_meta_data, not editable user metadata.

create policy marketplace_listings_admin_read
  on public.marketplace_listings for select to authenticated
  using ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

create policy marketplace_listings_admin_review
  on public.marketplace_listings for update to authenticated
  using ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  with check ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

grant update (status, published_at, updated_at) on public.marketplace_listings to authenticated;

create policy profiles_admin_read
  on public.profiles for select to authenticated
  using ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

create policy profiles_admin_verify
  on public.profiles for update to authenticated
  using ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  with check ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

grant update (identity_status, updated_at) on public.profiles to authenticated;
