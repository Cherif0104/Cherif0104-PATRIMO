-- Allow authenticated callers to reach explicitly granted private helpers.
-- The private schema is not exposed by PostgREST and no table access is granted.

grant usage on schema private to authenticated;
