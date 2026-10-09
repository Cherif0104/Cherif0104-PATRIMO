-- Make service-only intent explicit and cover financial foreign keys.

create policy payment_webhook_inbox_service_only
  on public.payment_webhook_inbox for all to anon, authenticated
  using (false)
  with check (false);

create policy ledger_transactions_service_only
  on public.ledger_transactions for all to anon, authenticated
  using (false)
  with check (false);

create policy ledger_entries_service_only
  on public.ledger_entries for all to anon, authenticated
  using (false)
  with check (false);

create index payouts_booking_idx
  on public.payouts (booking_id)
  where booking_id is not null;
create index refunds_payment_order_idx
  on public.refunds (payment_order_id);

drop policy if exists availability_blocks_expired_hold_delete
  on public.availability_blocks;
drop policy if exists availability_blocks_owner_delete
  on public.availability_blocks;
create policy availability_blocks_delete
  on public.availability_blocks for delete to authenticated
  using (
    (
      source = 'reservation_hold'
      and expires_at is not null
      and expires_at <= now()
    )
    or (
      source not in ('reservation_hold', 'reservation_confirmed')
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
    )
  );
