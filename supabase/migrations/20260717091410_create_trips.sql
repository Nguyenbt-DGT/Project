-- HEALTH_CHECK: trips table (minimal — MAP_TRACKING owns this table fully later).
-- Just enough to make apply_trip_distance idempotent per trip (AC-5): distance_applied_at is the
-- idempotency marker, set exactly once, never reset by the client.

create table public.trips (
  id                    uuid primary key default gen_random_uuid(),
  vehicle_id            uuid not null references public.vehicles (id) on delete cascade,
  distance_km           integer not null check (distance_km >= 0),
  recorded_at           timestamptz not null default now(),
  distance_applied_at   timestamptz null
);

comment on table public.trips is
  'distance_applied_at IS NULL means the trip''s distance has not yet been folded into the '
  'vehicle''s current_odometer_km. Set once by apply_trip_distance() and never cleared — that is '
  'the idempotency guarantee (AC-5).';

create index trips_vehicle_id_idx on public.trips (vehicle_id);
create index trips_unapplied_idx on public.trips (vehicle_id) where distance_applied_at is null;

alter table public.trips enable row level security;

create policy "trips_select_own"
  on public.trips for select
  to authenticated
  using (
    exists (
      select 1 from public.vehicles v
      where v.id = trips.vehicle_id and v.user_id = auth.uid()
    )
  );

create policy "trips_insert_own"
  on public.trips for insert
  to authenticated
  with check (
    exists (
      select 1 from public.vehicles v
      where v.id = trips.vehicle_id and v.user_id = auth.uid()
    )
  );

create policy "trips_update_own"
  on public.trips for update
  to authenticated
  using (
    exists (
      select 1 from public.vehicles v
      where v.id = trips.vehicle_id and v.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.vehicles v
      where v.id = trips.vehicle_id and v.user_id = auth.uid()
    )
  );

create policy "trips_delete_own"
  on public.trips for delete
  to authenticated
  using (
    exists (
      select 1 from public.vehicles v
      where v.id = trips.vehicle_id and v.user_id = auth.uid()
    )
  );

-- See vehicles migration comment: table-level GRANT is required alongside RLS in this project.
grant select, insert, update, delete on public.trips to authenticated;
