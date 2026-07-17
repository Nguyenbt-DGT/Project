-- HEALTH_CHECK: service_items table.
-- A trackable maintenance part/task for a vehicle (KB §2.2/§2.3). Rule 8.3: metrics are rows,
-- never a fixed enum — type_key is free text (no FK to part_type_defaults) so a user can add a
-- brand-new metric type at any time.
--
-- A row uses whichever interval_* axis/axes are non-null:
--   interval_km     -> distance axis, progress uses the vehicle's shared current_odometer_km
--   interval_days   -> time axis, progress uses now() vs last_service_at
--   interval_events -> event-count axis, progress uses events_elapsed (e.g. Oil filter, interval 2)
-- Status computation itself stays client-side (Rule 1.3) — this table only stores raw inputs.

create table public.service_items (
  id               uuid primary key default gen_random_uuid(),
  vehicle_id       uuid not null references public.vehicles (id) on delete cascade,
  type_key         text not null,
  name             text not null,
  interval_km      integer null check (interval_km is null or interval_km > 0),
  interval_days    integer null check (interval_days is null or interval_days > 0),
  interval_events  integer null check (interval_events is null or interval_events > 0),
  last_service_km  integer null check (last_service_km is null or last_service_km >= 0),
  last_service_at  timestamptz null,
  events_elapsed   integer not null default 0 check (events_elapsed >= 0),
  price_cents      integer null check (price_cents is null or price_cents >= 0),
  created_at       timestamptz not null default now(),

  constraint service_items_has_at_least_one_axis
    check (interval_km is not null or interval_days is not null or interval_events is not null)
);

comment on table public.service_items is
  'Baseline (last_service_km / last_service_at / events_elapsed) moves only via mark_service_done '
  '(KB §2.3) — never as a side effect of trip-distance accumulation or servicing a different item, '
  'except the one confirmed Oil Filter <- Engine Oil event-count coupling (D-OQ-H9).';

create index service_items_vehicle_id_idx on public.service_items (vehicle_id);

alter table public.service_items enable row level security;

-- Ownership flows through the parent vehicle (Rule 4.2 default posture, applied via join).
create policy "service_items_select_own"
  on public.service_items for select
  to authenticated
  using (
    exists (
      select 1 from public.vehicles v
      where v.id = service_items.vehicle_id and v.user_id = auth.uid()
    )
  );

create policy "service_items_insert_own"
  on public.service_items for insert
  to authenticated
  with check (
    exists (
      select 1 from public.vehicles v
      where v.id = service_items.vehicle_id and v.user_id = auth.uid()
    )
  );

create policy "service_items_update_own"
  on public.service_items for update
  to authenticated
  using (
    exists (
      select 1 from public.vehicles v
      where v.id = service_items.vehicle_id and v.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.vehicles v
      where v.id = service_items.vehicle_id and v.user_id = auth.uid()
    )
  );

create policy "service_items_delete_own"
  on public.service_items for delete
  to authenticated
  using (
    exists (
      select 1 from public.vehicles v
      where v.id = service_items.vehicle_id and v.user_id = auth.uid()
    )
  );

-- See vehicles migration comment: table-level GRANT is required alongside RLS in this project.
grant select, insert, update, delete on public.service_items to authenticated;
