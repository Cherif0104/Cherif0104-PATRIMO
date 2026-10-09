create table public.marketplace_offers (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  owner_id uuid references auth.users(id) on delete restrict,
  kind text not null check (kind in ('experience', 'service')),
  status text not null default 'pending_review'
    check (status in ('draft', 'pending_review', 'published', 'suspended', 'archived')),
  title text not null check (char_length(title) between 5 and 140),
  city text not null,
  country text not null default 'Sénégal',
  neighborhood text not null,
  price numeric(14,2) not null check (price > 0),
  currency text not null check (currency in ('XOF', 'EUR')),
  data jsonb not null,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index marketplace_offers_kind_status_idx
  on public.marketplace_offers (kind, status, published_at desc);
create index marketplace_offers_owner_idx
  on public.marketplace_offers (owner_id);

alter table public.marketplace_offers enable row level security;

create policy marketplace_offers_read
  on public.marketplace_offers for select
  using (
    status = 'published'
    or owner_id = (select auth.uid())
    or ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin'
  );

create policy marketplace_offers_insert
  on public.marketplace_offers for insert to authenticated
  with check (
    owner_id = (select auth.uid())
    and (
      (
        status in ('draft', 'pending_review')
        and exists (
          select 1 from public.profiles profile
          where profile.id = (select auth.uid())
            and profile.identity_status = 'verifie'
            and profile.account_type in ('proprietaire', 'agence')
        )
      )
      or (
        ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin'
        and status in ('draft', 'pending_review', 'published')
      )
    )
  );

create policy marketplace_offers_update
  on public.marketplace_offers for update to authenticated
  using (
    owner_id = (select auth.uid())
    or ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin'
  )
  with check (
    (
      owner_id = (select auth.uid())
      and status in ('draft', 'pending_review')
    )
    or ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin'
  );

grant select on public.marketplace_offers to anon, authenticated;
grant insert, update on public.marketplace_offers to authenticated;

create table public.organization_invitations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  email text not null check (position('@' in email) > 1),
  role text not null check (role in ('manager', 'agent', 'viewer')),
  token uuid not null unique default gen_random_uuid(),
  invited_by uuid not null references auth.users(id) on delete restrict,
  expires_at timestamptz not null default (now() + interval '7 days'),
  accepted_at timestamptz,
  created_at timestamptz not null default now()
);

create index organization_invitations_org_idx
  on public.organization_invitations (organization_id, created_at desc);

alter table public.organization_invitations enable row level security;

create policy organization_invitations_owner_manage
  on public.organization_invitations for all to authenticated
  using (
    exists (
      select 1 from public.organizations organization
      where organization.id = organization_invitations.organization_id
        and organization.owner_id = (select auth.uid())
    )
  )
  with check (
    invited_by = (select auth.uid())
    and exists (
      select 1 from public.organizations organization
      where organization.id = organization_invitations.organization_id
        and organization.owner_id = (select auth.uid())
    )
  );

grant select, insert, delete on public.organization_invitations to authenticated;

create or replace function private.accept_organization_invitation(p_token uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  invitation public.organization_invitations;
  jwt_email text;
begin
  if (select auth.uid()) is null then
    raise exception 'authentication_required';
  end if;
  jwt_email := lower(coalesce((select auth.jwt()) ->> 'email', ''));
  select * into invitation
  from public.organization_invitations
  where token = p_token
    and accepted_at is null
    and expires_at > now()
  for update;
  if invitation.id is null or lower(invitation.email) <> jwt_email then
    raise exception 'invitation_invalid';
  end if;
  insert into public.organization_members (organization_id, user_id, role)
  values (invitation.organization_id, (select auth.uid()), invitation.role)
  on conflict (organization_id, user_id) do update set role = excluded.role;
  update public.organization_invitations
  set accepted_at = now()
  where id = invitation.id;
  return invitation.organization_id;
end;
$$;

revoke all on function private.accept_organization_invitation(uuid) from public, anon;
grant execute on function private.accept_organization_invitation(uuid) to authenticated;

create or replace function public.accept_organization_invitation(p_token uuid)
returns uuid
language sql
security invoker
set search_path = ''
as $$
  select private.accept_organization_invitation(p_token);
$$;

revoke all on function public.accept_organization_invitation(uuid) from public, anon;
grant execute on function public.accept_organization_invitation(uuid) to authenticated;

create table public.user_notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(title) between 2 and 160),
  body text not null check (char_length(body) between 2 and 500),
  href text,
  listing_id uuid references public.marketplace_listings(id) on delete cascade,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index user_notifications_user_created_idx
  on public.user_notifications (user_id, created_at desc);

alter table public.user_notifications enable row level security;
create policy user_notifications_self_read
  on public.user_notifications for select to authenticated
  using (user_id = (select auth.uid()));
create policy user_notifications_self_update
  on public.user_notifications for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
grant select on public.user_notifications to authenticated;
grant update (read_at) on public.user_notifications to authenticated;

create or replace function private.notify_booking_owner()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_owner uuid;
begin
  select owner_id into target_owner
  from public.marketplace_listings
  where id = new.listing_id;
  if target_owner is not null and target_owner <> new.guest_id then
    insert into public.user_notifications (user_id, title, body, href, listing_id)
    values (
      target_owner,
      'Nouvelle demande',
      new.guest_name || ' souhaite réserver « ' || new.listing_title || ' ».',
      '/gestion/reservations',
      new.listing_id
    );
  end if;
  return new;
end;
$$;

create trigger booking_request_notify_owner
  after insert on public.booking_requests
  for each row execute function private.notify_booking_owner();

create or replace function private.notify_incident_owner()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_owner uuid;
begin
  select owner_id into target_owner
  from public.marketplace_listings
  where id = new.listing_id;
  if target_owner is not null and target_owner <> new.created_by then
    insert into public.user_notifications (user_id, title, body, href, listing_id)
    values (
      target_owner,
      'Nouvel incident',
      new.title,
      '/gestion/incidents/' || new.id::text,
      new.listing_id
    );
  end if;
  return new;
end;
$$;

create trigger property_incident_notify_owner
  after insert on public.property_incidents
  for each row execute function private.notify_incident_owner();

alter publication supabase_realtime add table public.user_notifications;
