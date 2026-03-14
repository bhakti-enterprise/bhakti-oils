-- Allow authenticated users to insert their own account row (id = auth.uid()).
-- This fixes users who signed up before the auth trigger existed or whose trigger failed.
create policy accounts_insert on public.accounts
  for insert
  to authenticated
  with check ((select auth.uid()) = id);
