-- Production messaging and automatic release of expired payment holds.

create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.marketplace_listings(id) on delete cascade,
  guest_id uuid not null references auth.users(id) on delete cascade,
  host_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (listing_id, guest_id, host_id),
  check (guest_id <> host_id)
);

create index conversations_guest_updated_idx
  on public.conversations (guest_id, updated_at desc);
create index conversations_host_updated_idx
  on public.conversations (host_id, updated_at desc);

alter table public.conversations enable row level security;

create policy conversations_participant_read
  on public.conversations for select to authenticated
  using ((select auth.uid()) in (guest_id, host_id));

create policy conversations_guest_insert
  on public.conversations for insert to authenticated
  with check (
    guest_id = (select auth.uid())
    and guest_id <> host_id
    and exists (
      select 1
      from public.marketplace_listings listing
      where listing.id = conversations.listing_id
        and listing.owner_id = conversations.host_id
        and listing.status = 'published'
    )
  );

grant select, insert on public.conversations to authenticated;

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id uuid not null references auth.users(id) on delete cascade,
  body text not null check (char_length(btrim(body)) between 1 and 4000),
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index messages_conversation_created_idx
  on public.messages (conversation_id, created_at);

alter table public.messages enable row level security;

create policy messages_participant_read
  on public.messages for select to authenticated
  using (
    exists (
      select 1
      from public.conversations conversation
      where conversation.id = messages.conversation_id
        and (select auth.uid()) in (conversation.guest_id, conversation.host_id)
    )
  );

create policy messages_participant_insert
  on public.messages for insert to authenticated
  with check (
    sender_id = (select auth.uid())
    and exists (
      select 1
      from public.conversations conversation
      where conversation.id = messages.conversation_id
        and (select auth.uid()) in (conversation.guest_id, conversation.host_id)
    )
  );

create policy messages_recipient_mark_read
  on public.messages for update to authenticated
  using (
    sender_id <> (select auth.uid())
    and exists (
      select 1
      from public.conversations conversation
      where conversation.id = messages.conversation_id
        and (select auth.uid()) in (conversation.guest_id, conversation.host_id)
    )
  )
  with check (
    sender_id <> (select auth.uid())
    and read_at is not null
  );

grant select, insert, update (read_at) on public.messages to authenticated;

create or replace function private.touch_conversation_from_message()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.conversations
  set updated_at = new.created_at
  where id = new.conversation_id;
  return new;
end;
$$;

create trigger messages_touch_conversation
  after insert on public.messages
  for each row execute procedure private.touch_conversation_from_message();

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'messages'
  ) then
    alter publication supabase_realtime add table public.messages;
  end if;
end;
$$;

create extension if not exists pg_cron with schema pg_catalog;

do $$
declare
  existing_job bigint;
begin
  select jobid into existing_job
  from cron.job
  where jobname = 'expire-payment-holds';

  if existing_job is not null then
    perform cron.unschedule(existing_job);
  end if;

  perform cron.schedule(
    'expire-payment-holds',
    '* * * * *',
    'select public.expire_payment_holds();'
  );
end;
$$;
