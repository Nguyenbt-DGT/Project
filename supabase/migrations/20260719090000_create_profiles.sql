-- GLOBAL_REQ §4 / DEMO_FEEDBACK_005 #4 ("handle user's data in the database").
-- One row per auth user, auto-created on sign-up so every user has a profile row from the start
-- (Rule 4.5: this invariant is enforced in the database via a trigger, not scattered across every
-- sign-up code path — Register screen or otherwise). Built against Supabase; the Turso migration
-- that would have bundled this is declined (DECISIONS.md D-DEMO5-TURSO).

create table public.profiles (
  id            uuid primary key references auth.users (id) on delete cascade,
  display_name  text null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

comment on table public.profiles is
  'One row per auth user (DEMO_FEEDBACK_005 #4). Auto-created by handle_new_user() on sign-up.';

alter table public.profiles enable row level security;

-- Owner-only: a user can only see/edit their own profile. No insert/delete policy — rows are
-- created only by the handle_new_user() trigger (security definer) and removed via the auth.users
-- cascade, never directly by the client.
create policy "profiles_select_own"
  on public.profiles for select
  to authenticated
  using (auth.uid() = id);

create policy "profiles_update_own"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- This project's local config does not auto-expose new tables to the Data API roles
-- (config.toml [api] auto_expose_new_tables, cloud default), so table-level GRANTs are required
-- in addition to RLS.
grant select, update on public.profiles to authenticated;

-- Auto-create a profile row whenever a new auth user is created — covers Register (app/(auth)/
-- sign-up.tsx) and any other future sign-up path (e.g. Gmail OAuth, GLOBAL_REQ §1) uniformly.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, new.raw_user_meta_data ->> 'display_name');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Keep updated_at current on every edit (profile editing, DEMO_FEEDBACK_005 #4).
create function public.set_profiles_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_profiles_updated_at();
