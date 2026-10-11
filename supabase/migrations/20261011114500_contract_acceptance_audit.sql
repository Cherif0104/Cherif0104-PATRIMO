alter table public.property_contracts
  add column sent_at timestamptz,
  add column tenant_accepted_at timestamptz,
  add column tenant_acceptance_version text;

create or replace function private.enforce_contract_status_transition()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := (select auth.uid());
  is_admin boolean :=
    coalesce((select auth.jwt()) -> 'app_metadata' ->> 'role', '') = 'admin'
    or (select auth.role()) = 'service_role';
begin
  if old.status is not distinct from new.status then
    return new;
  end if;

  if old.status = 'draft' and new.status = 'sent' then
    new.sent_at := now();
  elsif old.status = 'sent'
    and new.status = 'signed'
    and (new.tenant_id = current_user_id or is_admin) then
    new.tenant_accepted_at := coalesce(new.tenant_accepted_at, now());
  elsif old.status = 'signed' and new.status = 'active' then
    null;
  elsif old.status = 'active' and new.status = 'ended' then
    null;
  elsif old.status in ('draft', 'sent') and new.status = 'cancelled' then
    null;
  elsif not is_admin then
    raise exception 'contract_status_transition_not_allowed';
  end if;

  new.updated_at := now();
  return new;
end;
$$;

create trigger property_contracts_enforce_status
  before update of status on public.property_contracts
  for each row execute function private.enforce_contract_status_transition();

create or replace function public.accept_property_contract(
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

revoke all on function public.accept_property_contract(uuid, text)
  from public, anon;
grant execute on function public.accept_property_contract(uuid, text)
  to authenticated;
