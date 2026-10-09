alter function public.can_manage_listing(uuid) security invoker;

create index property_incidents_created_by_idx
  on public.property_incidents (created_by);
create index property_inspections_created_by_idx
  on public.property_inspections (created_by);
create index property_expenses_created_by_idx
  on public.property_expenses (created_by);
create index property_media_listing_idx
  on public.property_media (listing_id);
create index property_media_uploaded_by_idx
  on public.property_media (uploaded_by);
