create policy email_outbox_explicit_deny
  on public.email_outbox
  for all
  to anon, authenticated
  using (false)
  with check (false);

create or replace function private.accept_property_contract(
  p_contract_id uuid,
  p_acceptance_version text default 'contract-summary-v1'
)
returns public.property_contracts
language plpgsql
security definer
set search_path = ''
as $$
declare
  accepted public.property_contracts;
begin
  if (select auth.uid()) is null then
    raise exception 'authentication_required';
  end if;
  if p_acceptance_version <> 'contract-summary-v1' then
    raise exception 'contract_acceptance_version_invalid';
  end if;

  update public.property_contracts contract
  set status = 'signed',
      tenant_accepted_at = now(),
      tenant_acceptance_version = p_acceptance_version
  where contract.id = p_contract_id
    and contract.tenant_id = (select auth.uid())
    and contract.status = 'sent'
  returning contract.* into accepted;

  if accepted.id is null then
    raise exception 'contract_not_available_for_acceptance';
  end if;
  return accepted;
end;
$$;

revoke all on function private.accept_property_contract(uuid, text)
  from public, anon;
grant execute on function private.accept_property_contract(uuid, text)
  to authenticated;

create or replace function public.accept_property_contract(
  p_contract_id uuid,
  p_acceptance_version text default 'contract-summary-v1'
)
returns public.property_contracts
language sql
security invoker
set search_path = ''
as $$
  select private.accept_property_contract(p_contract_id, p_acceptance_version);
$$;

revoke all on function public.accept_property_contract(uuid, text)
  from public, anon;
grant execute on function public.accept_property_contract(uuid, text)
  to authenticated;
