-- Everything lives in the "huntboard" schema so this app can share a Supabase project with others.
-- After running, add "huntboard" under Supabase → Project Settings → Data API → Exposed schemas.
create schema if not exists huntboard;
grant usage on schema huntboard to anon, authenticated, service_role;
alter default privileges in schema huntboard grant all on tables to anon, authenticated, service_role;
alter default privileges in schema huntboard grant all on sequences to anon, authenticated, service_role;
alter default privileges in schema huntboard grant execute on functions to anon, authenticated, service_role;

-- HuntBoard schema.

create type huntboard.stage as enum ('wishlist', 'applied', 'interview', 'offer', 'rejected');

create table huntboard.applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade default auth.uid(),
  company text not null,
  role text not null,
  url text,
  location text,
  stage huntboard.stage not null default 'wishlist',
  applied_on date,
  follow_up_on date,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on huntboard.applications (user_id, stage);

alter table huntboard.applications enable row level security;
create policy "own applications" on huntboard.applications for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Keep updated_at fresh, and stamp applied_on the first time a card reaches "applied".
create function huntboard.touch_application() returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  if new.stage <> 'wishlist' and new.applied_on is null then new.applied_on := current_date; end if;
  return new;
end $$;
create trigger applications_touch before insert or update on huntboard.applications
  for each row execute function huntboard.touch_application();

-- Table access is still governed by the RLS policies above.
grant all on all tables in schema huntboard to anon, authenticated, service_role;
grant all on all sequences in schema huntboard to anon, authenticated, service_role;
grant execute on all functions in schema huntboard to anon, authenticated, service_role;
