-- Tighten the first production policies before any real account is onboarded.

drop policy if exists profiles_public_read on public.profiles;
create policy profiles_self_read
  on public.profiles for select to authenticated
  using (id = (select auth.uid()));
revoke select on public.profiles from anon, authenticated;
grant select on public.profiles to authenticated;

-- Avoid policy recursion between organizations and memberships.
drop policy if exists organizations_member_read on public.organizations;
create policy organizations_owner_read
  on public.organizations for select to authenticated
  using (owner_id = (select auth.uid()));

drop policy if exists organization_members_member_read on public.organization_members;
create policy organization_members_self_read
  on public.organization_members for select to authenticated
  using (user_id = (select auth.uid()));

-- Owners submit content for review; only a trusted backend can publish it.
drop policy if exists marketplace_listings_owner_insert on public.marketplace_listings;
create policy marketplace_listings_owner_insert
  on public.marketplace_listings for insert to authenticated
  with check (
    owner_id = (select auth.uid())
    and status in ('draft', 'pending_review')
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

drop policy if exists marketplace_listings_owner_update on public.marketplace_listings;
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
  );

revoke update on public.marketplace_listings from authenticated;
grant update (
  mode, title, city, country, neighborhood, price, currency,
  lat, lng, data, updated_at
) on public.marketplace_listings to authenticated;

-- Public visitors only need occupied dates, never an owner's private note.
revoke select on public.availability_blocks from anon, authenticated;
grant select (listing_id, start_date, end_date, source) on public.availability_blocks to anon;
grant select on public.availability_blocks to authenticated;

-- A browser may only move a booking through statuses allowed by RLS.
revoke update on public.booking_requests from authenticated;
grant update (status, updated_at) on public.booking_requests to authenticated;
