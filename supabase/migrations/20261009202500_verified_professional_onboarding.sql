alter table public.profiles
  add column requested_account_type text not null default 'voyageur'
    check (requested_account_type in ('voyageur', 'proprietaire', 'agence'));

update public.profiles
set requested_account_type = account_type;

revoke update (account_type) on public.profiles from authenticated;
grant update (full_name, avatar_url, phone, country_code, requested_account_type)
  on public.profiles to authenticated;

create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (
    id,
    full_name,
    account_type,
    requested_account_type
  )
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    'voyageur',
    case
      when new.raw_user_meta_data ->> 'requested_account_type' in ('proprietaire', 'agence')
        then new.raw_user_meta_data ->> 'requested_account_type'
      else 'voyageur'
    end
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop policy if exists verification_requests_self_insert
  on public.verification_requests;
create policy verification_requests_self_insert
  on public.verification_requests for insert to authenticated
  with check (
    requester_id = (select auth.uid())
    and status = 'pending'
    and account_type in ('proprietaire', 'agence')
    and exists (
      select 1
      from public.profiles profile
      where profile.id = (select auth.uid())
        and profile.requested_account_type = verification_requests.account_type
        and profile.identity_status in ('non_verifie', 'refuse')
    )
  );

drop policy if exists marketplace_listings_owner_insert
  on public.marketplace_listings;
create policy marketplace_listings_verified_owner_insert
  on public.marketplace_listings for insert to authenticated
  with check (
    owner_id = (select auth.uid())
    and status in ('draft', 'pending_review')
    and exists (
      select 1
      from public.profiles profile
      where profile.id = (select auth.uid())
        and profile.account_type in ('proprietaire', 'agence')
        and profile.identity_status = 'verifie'
    )
    and (
      organization_id is null
      or exists (
        select 1
        from public.organization_members member
        where member.organization_id = marketplace_listings.organization_id
          and member.user_id = (select auth.uid())
          and member.role in ('owner', 'manager', 'agent')
      )
    )
  );

create or replace function private.review_verification_request(
  p_request_id uuid,
  p_approved boolean
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_user uuid;
  target_account_type text;
begin
  if coalesce((select auth.jwt()) -> 'app_metadata' ->> 'role', '') <> 'admin' then
    raise exception 'admin_required';
  end if;

  if p_approved and not exists (
    select 1
    from public.verification_documents document
    where document.request_id = p_request_id
  ) then
    raise exception 'verification_document_required';
  end if;

  update public.verification_requests
  set status = case when p_approved then 'approved' else 'rejected' end,
      reviewed_at = now()
  where id = p_request_id
    and status in ('pending', 'reviewing')
  returning requester_id, account_type
    into target_user, target_account_type;

  if target_user is null then
    raise exception 'verification_request_not_found';
  end if;

  update public.profiles
  set account_type = case when p_approved then target_account_type else 'voyageur' end,
      requested_account_type = target_account_type,
      identity_status = case when p_approved then 'verifie' else 'refuse' end,
      updated_at = now()
  where id = target_user;

  update public.host_public_profiles
  set certified = p_approved,
      updated_at = now()
  where owner_id = target_user;
end;
$$;
