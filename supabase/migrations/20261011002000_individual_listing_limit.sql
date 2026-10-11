alter table public.marketplace_listings
  add column individual_publisher boolean not null default false;

update public.marketplace_listings listing
set individual_publisher = true
where exists (
  select 1
  from public.profiles profile
  where profile.id = listing.owner_id
    and profile.account_type = 'proprietaire'
)
and listing.organization_id is null;

create unique index marketplace_listings_one_active_individual_idx
  on public.marketplace_listings (owner_id)
  where individual_publisher and status <> 'archived';

create or replace function private.set_listing_publisher_scope()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  select profile.account_type = 'proprietaire' and new.organization_id is null
  into new.individual_publisher
  from public.profiles profile
  where profile.id = new.owner_id;

  new.individual_publisher := coalesce(new.individual_publisher, false);
  return new;
end;
$$;

create trigger marketplace_listings_set_publisher_scope
  before insert or update of owner_id, organization_id
  on public.marketplace_listings
  for each row
  execute function private.set_listing_publisher_scope();

revoke update (individual_publisher) on public.marketplace_listings
  from authenticated;
