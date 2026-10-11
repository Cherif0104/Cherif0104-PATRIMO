drop policy if exists marketplace_listings_authorized_read
  on public.marketplace_listings;

create policy marketplace_listings_public_published_read
  on public.marketplace_listings
  for select
  to anon, authenticated
  using (status = 'published');

create policy marketplace_listings_authenticated_read
  on public.marketplace_listings
  for select
  to authenticated
  using (
    owner_id = (select auth.uid())
    or ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin'
    or private.is_listing_stakeholder(id)
    or (
      organization_id is not null
      and exists (
        select 1
        from public.organization_members member
        where member.organization_id = marketplace_listings.organization_id
          and member.user_id = (select auth.uid())
      )
    )
  );
