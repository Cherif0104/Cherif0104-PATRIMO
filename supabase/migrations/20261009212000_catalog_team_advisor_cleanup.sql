create index organization_invitations_invited_by_idx
  on public.organization_invitations (invited_by);
create index user_notifications_listing_idx
  on public.user_notifications (listing_id);
