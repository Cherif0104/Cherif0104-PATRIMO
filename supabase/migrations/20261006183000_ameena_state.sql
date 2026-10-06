-- État partagé de la démonstration Ameena.
-- Une seule ligne « live » : lecture et écriture publiques, le temps que l'authentification arrive.

create table if not exists public.ameena_state (
  id text primary key,
  payload jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.ameena_state enable row level security;

drop policy if exists ameena_state_select on public.ameena_state;
drop policy if exists ameena_state_insert on public.ameena_state;
drop policy if exists ameena_state_update on public.ameena_state;

create policy ameena_state_select on public.ameena_state
  for select to anon, authenticated
  using (id = 'live');

create policy ameena_state_insert on public.ameena_state
  for insert to anon, authenticated
  with check (id = 'live');

create policy ameena_state_update on public.ameena_state
  for update to anon, authenticated
  using (id = 'live')
  with check (id = 'live');

grant select, insert, update on public.ameena_state to anon, authenticated;
