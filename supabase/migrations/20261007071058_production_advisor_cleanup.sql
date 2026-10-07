-- Remove the retired demo storage and resolve the actionable database advisor findings.

drop table if exists public.ameena_state;

create index organization_members_user_idx on public.organization_members (user_id);
create index organizations_owner_idx on public.organizations (owner_id);
create index availability_blocks_created_by_idx on public.availability_blocks (created_by);
create index payment_orders_booking_idx on public.payment_orders (booking_id);
create index payment_orders_payer_idx on public.payment_orders (payer_id);

drop policy if exists organization_members_owner_write on public.organization_members;
create policy organization_members_owner_insert
  on public.organization_members for insert to authenticated
  with check (
    exists (
      select 1 from public.organizations o
      where o.id = organization_members.organization_id
        and o.owner_id = (select auth.uid())
    )
  );
create policy organization_members_owner_update
  on public.organization_members for update to authenticated
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
create policy organization_members_owner_delete
  on public.organization_members for delete to authenticated
  using (
    exists (
      select 1 from public.organizations o
      where o.id = organization_members.organization_id
        and o.owner_id = (select auth.uid())
    )
  );

drop policy if exists availability_blocks_owner_write on public.availability_blocks;
create policy availability_blocks_owner_insert
  on public.availability_blocks for insert to authenticated
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
create policy availability_blocks_owner_update
  on public.availability_blocks for update to authenticated
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
  with check (created_by = (select auth.uid()));
create policy availability_blocks_owner_delete
  on public.availability_blocks for delete to authenticated
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
  );

drop policy if exists booking_requests_guest_cancel on public.booking_requests;
drop policy if exists booking_requests_owner_update on public.booking_requests;
create policy booking_requests_participant_update
  on public.booking_requests for update to authenticated
  using (
    (guest_id = (select auth.uid()) and status in ('requested', 'preapproved', 'awaiting_payment'))
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
                and m.role in ('owner', 'manager', 'agent')
            )
          )
      )
    )
  )
  with check (
    (guest_id = (select auth.uid()) and status = 'cancelled')
    or (
      listing_id is not null
      and status in ('preapproved', 'awaiting_payment', 'confirmed', 'declined', 'completed')
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
  );
