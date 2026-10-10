alter table public.organization_members
  add column functional_domains text[] not null default array['catalogue']::text[]
    check (functional_domains <@ array['catalogue', 'crm', 'reservations', 'contracts', 'finance', 'maintenance', 'administration']::text[]);
alter table public.organization_invitations
  add column functional_domains text[] not null default array['catalogue']::text[]
    check (functional_domains <@ array['catalogue', 'crm', 'reservations', 'contracts', 'finance', 'maintenance', 'administration']::text[]);

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
  insert into public.organization_members (organization_id, user_id, role, functional_domains)
  values (invitation.organization_id, (select auth.uid()), invitation.role, invitation.functional_domains)
  on conflict (organization_id, user_id) do update
    set role = excluded.role,
        functional_domains = excluded.functional_domains;
  update public.organization_invitations
  set accepted_at = now()
  where id = invitation.id;
  return invitation.organization_id;
end;
$$;

create or replace function private.can_access_organization(p_organization_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.organization_members member
    where member.organization_id = p_organization_id
      and member.user_id = (select auth.uid())
  )
  or exists (
    select 1
    from public.organizations organization
    where organization.id = p_organization_id
      and organization.owner_id = (select auth.uid())
  )
  or coalesce((select auth.jwt()) -> 'app_metadata' ->> 'role', '') = 'admin';
$$;

create or replace function private.can_manage_organization(p_organization_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.organization_members member
    where member.organization_id = p_organization_id
      and member.user_id = (select auth.uid())
      and member.role in ('owner', 'manager', 'agent')
  )
  or exists (
    select 1
    from public.organizations organization
    where organization.id = p_organization_id
      and organization.owner_id = (select auth.uid())
  )
  or coalesce((select auth.jwt()) -> 'app_metadata' ->> 'role', '') = 'admin';
$$;

revoke all on function private.can_access_organization(uuid) from public, anon;
revoke all on function private.can_manage_organization(uuid) from public, anon;
grant execute on function private.can_access_organization(uuid) to authenticated;
grant execute on function private.can_manage_organization(uuid) to authenticated;

create or replace function private.can_access_organization_domain(p_organization_id uuid, p_domain text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.organization_members member
    where member.organization_id = p_organization_id
      and member.user_id = (select auth.uid())
      and p_domain = any(member.functional_domains)
  )
  or exists (
    select 1
    from public.organizations organization
    where organization.id = p_organization_id
      and organization.owner_id = (select auth.uid())
  )
  or coalesce((select auth.jwt()) -> 'app_metadata' ->> 'role', '') = 'admin';
$$;

create or replace function private.can_manage_organization_domain(p_organization_id uuid, p_domain text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.organization_members member
    where member.organization_id = p_organization_id
      and member.user_id = (select auth.uid())
      and member.role in ('owner', 'manager', 'agent')
      and p_domain = any(member.functional_domains)
  )
  or exists (
    select 1
    from public.organizations organization
    where organization.id = p_organization_id
      and organization.owner_id = (select auth.uid())
  )
  or coalesce((select auth.jwt()) -> 'app_metadata' ->> 'role', '') = 'admin';
$$;

revoke all on function private.can_access_organization_domain(uuid, text) from public, anon;
revoke all on function private.can_manage_organization_domain(uuid, text) from public, anon;
grant execute on function private.can_access_organization_domain(uuid, text) to authenticated;
grant execute on function private.can_manage_organization_domain(uuid, text) to authenticated;

create table public.crm_contacts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  full_name text not null check (char_length(full_name) between 2 and 160),
  email text,
  phone text,
  contact_kind text not null default 'prospect'
    check (contact_kind in ('prospect', 'client', 'proprietaire', 'investisseur', 'partenaire')),
  qualification text not null default 'nouveau'
    check (qualification in ('nouveau', 'a_qualifier', 'qualifie', 'prioritaire', 'inactif')),
  source text not null default 'manuel'
    check (source in ('manuel', 'site', 'whatsapp', 'telephone', 'recommandation', 'import')),
  score integer not null default 0 check (score between 0 and 100),
  tags text[] not null default '{}',
  assigned_to uuid references auth.users(id) on delete set null,
  notes text not null default '' check (char_length(notes) <= 4000),
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (email is not null or phone is not null)
);
create index crm_contacts_org_updated_idx on public.crm_contacts (organization_id, updated_at desc);
create index crm_contacts_assigned_idx on public.crm_contacts (assigned_to, qualification) where assigned_to is not null;
create index crm_contacts_created_by_idx on public.crm_contacts (created_by);

create table public.crm_interactions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  contact_id uuid not null references public.crm_contacts(id) on delete cascade,
  channel text not null check (channel in ('appel', 'whatsapp', 'email', 'visite', 'message', 'note')),
  direction text not null default 'sortant' check (direction in ('entrant', 'sortant', 'interne')),
  outcome text not null default 'information'
    check (outcome in ('information', 'a_relancer', 'rendez_vous', 'interesse', 'non_interesse', 'conclu')),
  summary text not null check (char_length(summary) between 2 and 2000),
  occurred_at timestamptz not null default now(),
  next_action_at timestamptz,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now()
);
create index crm_interactions_contact_date_idx on public.crm_interactions (contact_id, occurred_at desc);
create index crm_interactions_org_next_idx on public.crm_interactions (organization_id, next_action_at) where next_action_at is not null;
create index crm_interactions_created_by_idx on public.crm_interactions (created_by);

create table public.crm_opportunities (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  contact_id uuid not null references public.crm_contacts(id) on delete cascade,
  listing_id uuid references public.marketplace_listings(id) on delete set null,
  title text not null check (char_length(title) between 2 and 180),
  stage text not null default 'nouveau'
    check (stage in ('nouveau', 'qualifie', 'visite', 'negociation', 'gagne', 'perdu')),
  value numeric(14,2) check (value is null or value >= 0),
  currency text not null default 'XOF' check (currency in ('XOF', 'EUR')),
  probability integer not null default 10 check (probability between 0 and 100),
  expected_close_date date,
  assigned_to uuid references auth.users(id) on delete set null,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index crm_opportunities_org_stage_idx on public.crm_opportunities (organization_id, stage, updated_at desc);
create index crm_opportunities_contact_idx on public.crm_opportunities (contact_id);
create index crm_opportunities_listing_idx on public.crm_opportunities (listing_id) where listing_id is not null;
create index crm_opportunities_assigned_idx on public.crm_opportunities (assigned_to, stage) where assigned_to is not null;
create index crm_opportunities_created_by_idx on public.crm_opportunities (created_by);

alter table public.crm_contacts enable row level security;
alter table public.crm_interactions enable row level security;
alter table public.crm_opportunities enable row level security;

create policy crm_contacts_read on public.crm_contacts for select to authenticated
  using (private.can_access_organization_domain(organization_id, 'crm'));
create policy crm_contacts_insert on public.crm_contacts for insert to authenticated
  with check (private.can_manage_organization_domain(organization_id, 'crm') and created_by = (select auth.uid()));
create policy crm_contacts_update on public.crm_contacts for update to authenticated
  using (private.can_manage_organization_domain(organization_id, 'crm'))
  with check (private.can_manage_organization_domain(organization_id, 'crm'));
create policy crm_contacts_delete on public.crm_contacts for delete to authenticated
  using (private.can_manage_organization_domain(organization_id, 'crm'));

create policy crm_interactions_read on public.crm_interactions for select to authenticated
  using (private.can_access_organization_domain(organization_id, 'crm'));
create policy crm_interactions_insert on public.crm_interactions for insert to authenticated
  with check (private.can_manage_organization_domain(organization_id, 'crm') and created_by = (select auth.uid()));
create policy crm_interactions_update on public.crm_interactions for update to authenticated
  using (private.can_manage_organization_domain(organization_id, 'crm'))
  with check (private.can_manage_organization_domain(organization_id, 'crm'));
create policy crm_interactions_delete on public.crm_interactions for delete to authenticated
  using (private.can_manage_organization_domain(organization_id, 'crm'));

create policy crm_opportunities_read on public.crm_opportunities for select to authenticated
  using (private.can_access_organization_domain(organization_id, 'crm'));
create policy crm_opportunities_insert on public.crm_opportunities for insert to authenticated
  with check (private.can_manage_organization_domain(organization_id, 'crm') and created_by = (select auth.uid()));
create policy crm_opportunities_update on public.crm_opportunities for update to authenticated
  using (private.can_manage_organization_domain(organization_id, 'crm'))
  with check (private.can_manage_organization_domain(organization_id, 'crm'));
create policy crm_opportunities_delete on public.crm_opportunities for delete to authenticated
  using (private.can_manage_organization_domain(organization_id, 'crm'));

grant select, insert, update, delete on public.crm_contacts to authenticated;
grant select, insert, update, delete on public.crm_interactions to authenticated;
grant select, insert, update, delete on public.crm_opportunities to authenticated;

create table public.marketplace_partners (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references auth.users(id) on delete set null,
  status text not null default 'pending_review'
    check (status in ('pending_review', 'published', 'suspended', 'archived')),
  business_name text not null check (char_length(business_name) between 2 and 160),
  category text not null
    check (category in ('artisan', 'blanchisserie', 'demenagement', 'mobilite', 'securite', 'assurance', 'ameublement', 'entretien', 'juridique', 'autre')),
  description text not null default '' check (char_length(description) <= 2000),
  phone text,
  whatsapp_e164 text,
  website text,
  address text not null,
  city text not null,
  lat double precision not null check (lat between -90 and 90),
  lng double precision not null check (lng between -180 and 180),
  service_radius_km integer not null default 15 check (service_radius_km between 1 and 500),
  image_url text,
  verified boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (phone is not null or whatsapp_e164 is not null)
);
create index marketplace_partners_status_category_city_idx on public.marketplace_partners (status, category, city);
create index marketplace_partners_owner_idx on public.marketplace_partners (owner_id) where owner_id is not null;
alter table public.marketplace_partners enable row level security;
create policy marketplace_partners_read on public.marketplace_partners for select
  using (
    status = 'published'
    or owner_id = (select auth.uid())
    or coalesce((select auth.jwt()) -> 'app_metadata' ->> 'role', '') = 'admin'
  );
create policy marketplace_partners_admin_insert on public.marketplace_partners for insert to authenticated
  with check (coalesce((select auth.jwt()) -> 'app_metadata' ->> 'role', '') = 'admin');
create policy marketplace_partners_admin_update on public.marketplace_partners for update to authenticated
  using (coalesce((select auth.jwt()) -> 'app_metadata' ->> 'role', '') = 'admin')
  with check (coalesce((select auth.jwt()) -> 'app_metadata' ->> 'role', '') = 'admin');
grant select on public.marketplace_partners to anon, authenticated;
grant insert, update on public.marketplace_partners to authenticated;

create table public.partner_products (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid not null references public.marketplace_partners(id) on delete cascade,
  name text not null check (char_length(name) between 2 and 160),
  description text not null default '' check (char_length(description) <= 2000),
  price numeric(14,2) check (price is null or price >= 0),
  currency text not null default 'XOF' check (currency in ('XOF', 'EUR')),
  image_url text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index partner_products_partner_active_idx on public.partner_products (partner_id, active, created_at desc);
alter table public.partner_products enable row level security;
create policy partner_products_public_read on public.partner_products for select
  using (
    active
    and exists (
      select 1 from public.marketplace_partners partner
      where partner.id = partner_products.partner_id
        and (
          partner.status = 'published'
          or partner.owner_id = (select auth.uid())
          or coalesce((select auth.jwt()) -> 'app_metadata' ->> 'role', '') = 'admin'
        )
    )
  );
create policy partner_products_insert on public.partner_products for insert to authenticated
  with check (
    exists (
      select 1 from public.marketplace_partners partner
      where partner.id = partner_products.partner_id
        and (
          partner.owner_id = (select auth.uid())
          or coalesce((select auth.jwt()) -> 'app_metadata' ->> 'role', '') = 'admin'
        )
    )
  );
create policy partner_products_update on public.partner_products for update to authenticated
  using (
    exists (
      select 1 from public.marketplace_partners partner
      where partner.id = partner_products.partner_id
        and (
          partner.owner_id = (select auth.uid())
          or coalesce((select auth.jwt()) -> 'app_metadata' ->> 'role', '') = 'admin'
        )
    )
  )
  with check (
    exists (
      select 1 from public.marketplace_partners partner
      where partner.id = partner_products.partner_id
        and (
          partner.owner_id = (select auth.uid())
          or coalesce((select auth.jwt()) -> 'app_metadata' ->> 'role', '') = 'admin'
        )
    )
  );
create policy partner_products_delete on public.partner_products for delete to authenticated
  using (
    exists (
      select 1 from public.marketplace_partners partner
      where partner.id = partner_products.partner_id
        and (
          partner.owner_id = (select auth.uid())
          or coalesce((select auth.jwt()) -> 'app_metadata' ->> 'role', '') = 'admin'
        )
    )
  );
grant select on public.partner_products to anon, authenticated;
grant insert, update, delete on public.partner_products to authenticated;

create table public.partner_applications (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references auth.users(id) on delete cascade,
  business_name text not null check (char_length(business_name) between 2 and 160),
  category text not null
    check (category in ('artisan', 'blanchisserie', 'demenagement', 'mobilite', 'securite', 'assurance', 'ameublement', 'entretien', 'juridique', 'autre')),
  city text not null,
  phone text not null,
  message text not null default '' check (char_length(message) <= 2000),
  status text not null default 'pending' check (status in ('pending', 'contacted', 'approved', 'rejected')),
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);
create index partner_applications_requester_idx on public.partner_applications (requester_id, created_at desc);
create index partner_applications_status_idx on public.partner_applications (status, created_at);
alter table public.partner_applications enable row level security;
create policy partner_applications_self_read on public.partner_applications for select to authenticated
  using (requester_id = (select auth.uid()) or coalesce((select auth.jwt()) -> 'app_metadata' ->> 'role', '') = 'admin');
create policy partner_applications_self_insert on public.partner_applications for insert to authenticated
  with check (requester_id = (select auth.uid()) and status = 'pending');
create policy partner_applications_admin_update on public.partner_applications for update to authenticated
  using (coalesce((select auth.jwt()) -> 'app_metadata' ->> 'role', '') = 'admin')
  with check (coalesce((select auth.jwt()) -> 'app_metadata' ->> 'role', '') = 'admin');
grant select, insert, update on public.partner_applications to authenticated;
