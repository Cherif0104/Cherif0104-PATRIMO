create or replace function private.set_owner_listing_status(
  p_listing_id uuid,
  p_status text
)
returns public.marketplace_listings
language plpgsql
security definer
set search_path = ''
as $$
declare
  updated_listing public.marketplace_listings;
begin
  if p_status not in ('archived', 'pending_review') then
    raise exception 'invalid_owner_listing_status';
  end if;

  update public.marketplace_listings
  set status = p_status,
      published_at = case when p_status = 'archived' then null else published_at end,
      updated_at = now()
  where id = p_listing_id
    and owner_id = (select auth.uid())
  returning * into updated_listing;

  if updated_listing.id is null then
    raise exception 'listing_not_found';
  end if;

  return updated_listing;
end;
$$;

revoke all on function private.set_owner_listing_status(uuid, text)
  from public, anon;
grant execute on function private.set_owner_listing_status(uuid, text)
  to authenticated;

create or replace function public.set_owner_listing_status(
  p_listing_id uuid,
  p_status text
)
returns public.marketplace_listings
language sql
security invoker
set search_path = ''
as $$
  select private.set_owner_listing_status(p_listing_id, p_status);
$$;

revoke all on function public.set_owner_listing_status(uuid, text)
  from public, anon;
grant execute on function public.set_owner_listing_status(uuid, text)
  to authenticated;
