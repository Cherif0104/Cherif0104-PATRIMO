-- Keep profile identity and authorization fields server-controlled.
-- RLS already limits rows; column grants now also limit what clients can mutate.

revoke all privileges on table public.profiles from anon;
revoke all privileges on table public.profiles from authenticated;

grant select on table public.profiles to authenticated;
grant update (
  full_name,
  avatar_url,
  phone,
  country_code,
  requested_account_type,
  updated_at
) on table public.profiles to authenticated;
