-- HEALTH_CHECK: vehicles table.
-- One row per bike. Rule 8.4: everything else hangs off vehicle_id so the schema is
-- multi-vehicle-ready even though MVP UI only surfaces one bike (D-OQ-G2-MULTI-VEHICLE).
-- RLS enabled in this same migration (Rule 4.2).

create table public.vehicles (
  id                   uuid primary key default gen_random_uuid(),
  user_id              uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name                 text not null,
  brand                text not null,
  model                text null,
  current_odometer_km  integer not null default 0 check (current_odometer_km >= 0),
  unit_preference      text not null default 'km' check (unit_preference in ('km', 'mi')),
  created_at           timestamptz not null default now()
);

comment on table public.vehicles is
  'One row per bike. current_odometer_km is the single shared odometer value (KB §2.3) — '
  'no service item has its own private "current km".';

create index vehicles_user_id_idx on public.vehicles (user_id);

alter table public.vehicles enable row level security;

-- Owner-only: a user can only see/manage their own vehicles.
create policy "vehicles_select_own"
  on public.vehicles for select
  to authenticated
  using (auth.uid() = user_id);

create policy "vehicles_insert_own"
  on public.vehicles for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "vehicles_update_own"
  on public.vehicles for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "vehicles_delete_own"
  on public.vehicles for delete
  to authenticated
  using (auth.uid() = user_id);

-- This project's local config does not auto-expose new tables to the Data API roles
-- (config.toml [api] auto_expose_new_tables, cloud default), so table-level GRANTs are required
-- in addition to RLS — RLS alone restricts rows, not whether the role can touch the table at all.
grant select, insert, update, delete on public.vehicles to authenticated;
