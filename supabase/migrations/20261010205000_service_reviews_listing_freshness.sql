-- Public professional reviews and recurring confirmation of listing availability.

create table public.partner_reviews (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid not null references public.marketplace_partners(id) on delete cascade,
  author_id uuid not null references auth.users(id) on delete cascade,
  rating smallint not null check (rating between 1 and 5),
  body text not null check (char_length(btrim(body)) between 20 and 1200),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (partner_id, author_id)
);

create index partner_reviews_partner_created_idx
  on public.partner_reviews (partner_id, created_at desc);
create index partner_reviews_author_idx
  on public.partner_reviews (author_id);

alter table public.partner_reviews enable row level security;

create policy partner_reviews_public_read
  on public.partner_reviews for select
  using (
    exists (
      select 1
      from public.marketplace_partners partner
      where partner.id = partner_reviews.partner_id
        and partner.status = 'published'
    )
  );

create policy partner_reviews_self_insert
  on public.partner_reviews for insert to authenticated
  with check (
    author_id = (select auth.uid())
    and exists (
      select 1
      from public.marketplace_partners partner
      where partner.id = partner_reviews.partner_id
        and partner.status = 'published'
        and partner.owner_id is distinct from (select auth.uid())
    )
  );

create policy partner_reviews_self_update
  on public.partner_reviews for update to authenticated
  using (author_id = (select auth.uid()))
  with check (author_id = (select auth.uid()));

create policy partner_reviews_self_delete
  on public.partner_reviews for delete to authenticated
  using (
    author_id = (select auth.uid())
    or coalesce((select auth.jwt()) -> 'app_metadata' ->> 'role', '') = 'admin'
  );

grant select on public.partner_reviews to anon, authenticated;
grant insert, update (rating, body, updated_at), delete on public.partner_reviews to authenticated;

alter table public.marketplace_listings
  add column availability_status text not null default 'available'
    check (availability_status in ('available', 'rented', 'sold')),
  add column last_availability_confirmed_at timestamptz,
  add column last_availability_prompt_at timestamptz;

create index marketplace_listings_freshness_idx
  on public.marketplace_listings (
    status,
    last_availability_confirmed_at,
    last_availability_prompt_at,
    published_at
  )
  where status = 'published';

create or replace function public.confirm_listing_availability(
  p_listing_id uuid,
  p_outcome text
)
returns public.marketplace_listings
language plpgsql
security definer
set search_path = ''
as $$
declare
  target public.marketplace_listings;
begin
  if p_outcome not in ('available', 'rented', 'sold') then
    raise exception 'invalid_availability_outcome';
  end if;

  select * into target
  from public.marketplace_listings
  where id = p_listing_id
  for update;

  if target.id is null then
    raise exception 'listing_not_found';
  end if;

  if target.owner_id <> (select auth.uid())
    and not (
      target.organization_id is not null
      and private.can_manage_organization_domain(target.organization_id, 'catalogue')
    )
    and coalesce((select auth.jwt()) -> 'app_metadata' ->> 'role', '') <> 'admin'
  then
    raise exception 'listing_access_denied';
  end if;

  update public.marketplace_listings
  set availability_status = p_outcome,
      status = case when p_outcome = 'available' then status else 'archived' end,
      last_availability_confirmed_at = now(),
      last_availability_prompt_at = now(),
      updated_at = now()
  where id = p_listing_id
  returning * into target;

  update public.user_notifications
  set read_at = coalesce(read_at, now())
  where user_id = (select auth.uid())
    and listing_id = p_listing_id
    and href like '/gestion/biens/%';

  return target;
end;
$$;

revoke all on function public.confirm_listing_availability(uuid, text) from public, anon;
grant execute on function public.confirm_listing_availability(uuid, text) to authenticated;

create or replace function private.enqueue_stale_listing_confirmations()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  inserted_count integer;
begin
  with prompted as (
    update public.marketplace_listings listing
    set last_availability_prompt_at = now()
    where listing.status = 'published'
      and coalesce(listing.last_availability_confirmed_at, listing.published_at, listing.created_at)
        <= now() - interval '14 days'
      and (
        listing.last_availability_prompt_at is null
        or listing.last_availability_prompt_at <= now() - interval '7 days'
      )
    returning listing.id, listing.slug, listing.owner_id, listing.title,
      coalesce(listing.data ->> 'purpose', 'location') as purpose
  )
  insert into public.user_notifications (user_id, title, body, href, listing_id)
  select
    prompted.owner_id,
    'Votre annonce est-elle toujours disponible ?',
    case
      when prompted.purpose = 'vente'
        then '« ' || prompted.title || ' » est publiée depuis au moins deux semaines. Confirmez si elle est toujours à vendre.'
      else '« ' || prompted.title || ' » est publiée depuis au moins deux semaines. Confirmez si elle est toujours disponible ou déjà louée.'
    end,
    '/gestion/biens/' || prompted.slug,
    prompted.id
  from prompted;

  get diagnostics inserted_count = row_count;
  return inserted_count;
end;
$$;

revoke all on function private.enqueue_stale_listing_confirmations() from public, anon, authenticated;

do $$
declare
  existing_job bigint;
begin
  select jobid into existing_job
  from cron.job
  where jobname = 'confirm-stale-listings';

  if existing_job is not null then
    perform cron.unschedule(existing_job);
  end if;

  perform cron.schedule(
    'confirm-stale-listings',
    '15 8 * * *',
    'select private.enqueue_stale_listing_confirmations();'
  );
end;
$$;
