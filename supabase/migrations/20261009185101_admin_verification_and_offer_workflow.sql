create policy verification_requests_admin_update
  on public.verification_requests for update to authenticated
  using (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin')
  with check (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin');

grant update (status, reviewed_at)
  on public.verification_requests to authenticated;

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
begin
  if coalesce((select auth.jwt()) -> 'app_metadata' ->> 'role', '') <> 'admin' then
    raise exception 'admin_required';
  end if;

  update public.verification_requests
  set status = case when p_approved then 'approved' else 'rejected' end,
      reviewed_at = now()
  where id = p_request_id
    and status in ('pending', 'reviewing')
  returning requester_id into target_user;

  if target_user is null then
    raise exception 'verification_request_not_found';
  end if;

  update public.profiles
  set identity_status = case when p_approved then 'verifie' else 'refuse' end,
      updated_at = now()
  where id = target_user;

  update public.host_public_profiles
  set certified = p_approved,
      updated_at = now()
  where owner_id = target_user;
end;
$$;

revoke all on function private.review_verification_request(uuid, boolean)
  from public, anon;
grant execute on function private.review_verification_request(uuid, boolean)
  to authenticated;

create or replace function public.review_verification_request(
  p_request_id uuid,
  p_approved boolean
)
returns void
language sql
security invoker
set search_path = ''
as $$
  select private.review_verification_request(p_request_id, p_approved);
$$;

revoke all on function public.review_verification_request(uuid, boolean)
  from public, anon;
grant execute on function public.review_verification_request(uuid, boolean)
  to authenticated;

create policy offer_requests_admin_update
  on public.offer_requests for update to authenticated
  using (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin')
  with check (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin');
