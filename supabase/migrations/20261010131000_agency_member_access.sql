-- Let invited collaborators resolve the organization attached to their own
-- membership without reintroducing recursive RLS policies.
drop policy if exists organizations_owner_read on public.organizations;
drop policy if exists organizations_access_read on public.organizations;

create policy organizations_access_read
  on public.organizations
  for select
  to authenticated
  using (private.can_access_organization(id));
