-- HuntBoard schema.

create type public.stage as enum ('wishlist', 'applied', 'interview', 'offer', 'rejected');

create table public.applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade default auth.uid(),
  company text not null,
  role text not null,
  url text,
  location text,
  stage public.stage not null default 'wishlist',
  applied_on date,
  follow_up_on date,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on public.applications (user_id, stage);

alter table public.applications enable row level security;
create policy "own applications" on public.applications for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Keep updated_at fresh, and stamp applied_on the first time a card reaches "applied".
create function public.touch_application() returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  if new.stage <> 'wishlist' and new.applied_on is null then new.applied_on := current_date; end if;
  return new;
end $$;
create trigger applications_touch before insert or update on public.applications
  for each row execute function public.touch_application();
