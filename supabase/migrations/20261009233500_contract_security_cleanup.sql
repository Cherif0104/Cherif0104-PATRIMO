create index property_stakeholders_created_by_idx
  on public.property_stakeholders (created_by);
create index property_contracts_created_by_idx
  on public.property_contracts (created_by);

create or replace function private.is_listing_stakeholder(p_listing_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.property_stakeholders stakeholder
    where stakeholder.listing_id = p_listing_id
      and stakeholder.user_id = (select auth.uid())
  );
$$;

revoke all on function private.is_listing_stakeholder(uuid) from public, anon;
grant execute on function private.is_listing_stakeholder(uuid) to authenticated;

drop policy if exists marketplace_listings_stakeholder_read
  on public.marketplace_listings;
drop policy if exists marketplace_listings_authorized_read
  on public.marketplace_listings;
create policy marketplace_listings_authorized_read
  on public.marketplace_listings for select
  using (
    status = 'published'
    or owner_id = (select auth.uid())
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

drop policy if exists property_contracts_read
  on public.property_contracts;
create policy property_contracts_read
  on public.property_contracts for select to authenticated
  using (
    public.can_manage_listing(listing_id)
    or tenant_id = (select auth.uid())
    or owner_id = (select auth.uid())
    or private.is_listing_stakeholder(listing_id)
  );

create or replace function private.add_property_stakeholder_by_email(
  p_listing_id uuid,
  p_email text,
  p_role text,
  p_share_percent numeric default null
)
returns public.property_stakeholders
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_user_id uuid;
  stakeholder public.property_stakeholders;
begin
  if not public.can_manage_listing(p_listing_id) then
    raise exception 'not_authorized';
  end if;
  if p_role not in ('proprietaire', 'investisseur', 'locataire', 'observateur') then
    raise exception 'invalid_role';
  end if;
  select id into target_user_id
  from auth.users
  where lower(email) = lower(trim(p_email))
  limit 1;
  if target_user_id is null then
    raise exception 'account_not_found';
  end if;
  insert into public.property_stakeholders (
    listing_id, user_id, role, share_percent, created_by
  ) values (
    p_listing_id, target_user_id, p_role, p_share_percent, (select auth.uid())
  )
  on conflict (listing_id, user_id, role) do update
    set share_percent = excluded.share_percent
  returning * into stakeholder;
  return stakeholder;
end;
$$;

revoke all on function private.add_property_stakeholder_by_email(uuid, text, text, numeric)
  from public, anon;
grant execute on function private.add_property_stakeholder_by_email(uuid, text, text, numeric)
  to authenticated;

drop trigger if exists property_contracts_notify
  on public.property_contracts;
create or replace function private.notify_property_contract()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.tenant_id is not null and (tg_op = 'INSERT' or old.status is distinct from new.status) then
    insert into public.user_notifications (user_id, title, body, href, listing_id)
    values (
      new.tenant_id,
      'Mise à jour de votre contrat',
      new.title || ' · ' || new.status,
      '/voyages',
      new.listing_id
    );
  end if;
  return new;
end;
$$;
revoke all on function private.notify_property_contract() from public, anon, authenticated;
create trigger property_contracts_notify
  after insert or update of status on public.property_contracts
  for each row execute function private.notify_property_contract();

drop function if exists public.add_property_stakeholder_by_email(uuid, text, text, numeric);
drop function if exists public.is_listing_stakeholder(uuid);
drop function if exists public.notify_property_contract();
