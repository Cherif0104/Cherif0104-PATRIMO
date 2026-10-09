create table public.verification_documents (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.verification_requests(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,
  document_kind text not null
    check (document_kind in ('identity', 'ownership', 'business_registration', 'other')),
  storage_path text not null unique,
  created_at timestamptz not null default now()
);

create index verification_documents_request_idx
  on public.verification_documents (request_id, created_at);

alter table public.verification_documents enable row level security;

create policy verification_documents_participant_read
  on public.verification_documents for select to authenticated
  using (
    owner_id = (select auth.uid())
    or ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin'
  );

create policy verification_documents_owner_insert
  on public.verification_documents for insert to authenticated
  with check (
    owner_id = (select auth.uid())
    and exists (
      select 1
      from public.verification_requests request
      where request.id = verification_documents.request_id
        and request.requester_id = (select auth.uid())
        and request.status in ('pending', 'reviewing')
    )
  );

create policy verification_documents_owner_delete
  on public.verification_documents for delete to authenticated
  using (owner_id = (select auth.uid()));

grant select, insert, delete on public.verification_documents to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'verification-documents',
  'verification-documents',
  false,
  10485760,
  array['image/jpeg', 'image/png', 'application/pdf']
)
on conflict (id) do update set
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy verification_documents_storage_insert
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'verification-documents'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy verification_documents_storage_select
  on storage.objects for select to authenticated
  using (
    bucket_id = 'verification-documents'
    and (
      (storage.foldername(name))[1] = (select auth.uid())::text
      or ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin'
    )
  );

create policy verification_documents_storage_delete
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'verification-documents'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
