-- HEALTH_CHECK: business-invariant RPCs (Rule 4.5).
-- Each function is SECURITY DEFINER (so it can update rows across the ownership-join RLS
-- policies) but re-checks ownership internally via auth.uid() before writing anything, and
-- pins search_path to prevent search-path hijacking.

-- =================================================================================================
-- mark_service_done(p_service_item_id) — reset ONE item's baseline to "just serviced now".
--
-- - km axis (interval_km not null)     -> last_service_km = vehicle's current_odometer_km
-- - time axis (interval_days not null) -> last_service_at = now()
-- - event axis (interval_events not null) -> events_elapsed = 0
--
-- D-OQ-H9 coupling: marking Engine Oil (type_key = 'engine_oil') done also increments the SAME
-- vehicle's Oil Filter (type_key = 'oil_filter') events_elapsed by 1, if present. This is the one
-- confirmed cross-item coupling (KB §2.2/§2.3) — no other item is touched.
-- =================================================================================================

create or replace function public.mark_service_done(p_service_item_id uuid)
returns public.service_items
language plpgsql
security definer
set search_path = public
as $$
declare
  v_item      public.service_items%rowtype;
  v_vehicle   public.vehicles%rowtype;
  v_vehicle_id uuid;
begin
  -- Look up (unlocked) which vehicle this item belongs to, then lock the VEHICLE row before any
  -- service_items row. vehicle_id never changes on an existing row, so this read is safe. Locking
  -- the vehicle first, always, is what makes every mark_service_done call for a given vehicle
  -- serialize on one consistent lock order — including the oil-filter coupling update below —
  -- which avoids a lock-order deadlock against a concurrent call that targets the coupled item
  -- directly (e.g. one call marking engine_oil done, another marking oil_filter done, at the same
  -- time, on the same vehicle).
  select si.vehicle_id into v_vehicle_id
  from public.service_items si
  where si.id = p_service_item_id;

  if not found then
    raise exception 'service item not found' using errcode = 'P0002';
  end if;

  select v.* into v_vehicle
  from public.vehicles v
  where v.id = v_vehicle_id
  for update;

  if v_vehicle.user_id is distinct from auth.uid() then
    raise exception 'not authorized to modify this service item' using errcode = '42501';
  end if;

  select si.* into v_item
  from public.service_items si
  where si.id = p_service_item_id
  for update;

  update public.service_items
  set
    last_service_km = case when interval_km is not null then v_vehicle.current_odometer_km else last_service_km end,
    last_service_at = case when interval_days is not null then now() else last_service_at end,
    events_elapsed  = case when interval_events is not null then 0 else events_elapsed end
  where id = p_service_item_id
  returning * into v_item;

  -- D-OQ-H9: engine oil replaced -> bump this vehicle's oil filter event counter by 1.
  if v_item.type_key = 'engine_oil' then
    update public.service_items
    set events_elapsed = events_elapsed + 1
    where vehicle_id = v_item.vehicle_id
      and type_key = 'oil_filter';
  end if;

  return v_item;
end;
$$;

comment on function public.mark_service_done(uuid) is
  'Resets a service item''s baseline on whichever axis/axes it uses. Owner-only. Couples '
  'engine_oil -> oil_filter events_elapsed per D-OQ-H9-OIL-FILTER-SEEDING. Never touches any '
  'other item or the vehicle''s current_odometer_km (KB §2.3).';

revoke all on function public.mark_service_done(uuid) from public;
grant execute on function public.mark_service_done(uuid) to authenticated;

-- =================================================================================================
-- apply_trip_distance(p_trip_id) — idempotent: fold a recorded trip's distance into the vehicle's
-- shared current_odometer_km exactly once. Second call for the same trip is a no-op (AC-5). Never
-- touches any service_item row (that is the core KB §2.3 invariant).
-- =================================================================================================

create or replace function public.apply_trip_distance(p_trip_id uuid)
returns public.trips
language plpgsql
security definer
set search_path = public
as $$
declare
  v_trip  public.trips%rowtype;
  v_owner uuid;
begin
  select t.* into v_trip
  from public.trips t
  where t.id = p_trip_id
  for update;

  if not found then
    raise exception 'trip not found' using errcode = 'P0002';
  end if;

  select v.user_id into v_owner
  from public.vehicles v
  where v.id = v_trip.vehicle_id;

  if v_owner is distinct from auth.uid() then
    raise exception 'not authorized to apply this trip' using errcode = '42501';
  end if;

  if v_trip.distance_applied_at is null then
    update public.vehicles
    set current_odometer_km = current_odometer_km + v_trip.distance_km
    where id = v_trip.vehicle_id;

    update public.trips
    set distance_applied_at = now()
    where id = p_trip_id
    returning * into v_trip;
  end if;

  return v_trip;
end;
$$;

comment on function public.apply_trip_distance(uuid) is
  'Idempotent per trip_id (guarded by distance_applied_at IS NULL, row-locked via FOR UPDATE). '
  'Increments vehicles.current_odometer_km exactly once; never writes to service_items (AC-5).';

revoke all on function public.apply_trip_distance(uuid) from public;
grant execute on function public.apply_trip_distance(uuid) to authenticated;

-- =================================================================================================
-- set_odometer(p_vehicle_id, p_value_km) — manual absolute set of the shared odometer
-- (D-OQ-H1-ODOMETER-SOURCE). Never touches any service_item baseline.
-- =================================================================================================

create or replace function public.set_odometer(p_vehicle_id uuid, p_value_km integer)
returns public.vehicles
language plpgsql
security definer
set search_path = public
as $$
declare
  v_vehicle public.vehicles%rowtype;
begin
  if p_value_km < 0 then
    raise exception 'odometer value must be >= 0' using errcode = '22003';
  end if;

  select v.* into v_vehicle
  from public.vehicles v
  where v.id = p_vehicle_id
  for update;

  if not found then
    raise exception 'vehicle not found' using errcode = 'P0002';
  end if;

  if v_vehicle.user_id is distinct from auth.uid() then
    raise exception 'not authorized to modify this vehicle' using errcode = '42501';
  end if;

  update public.vehicles
  set current_odometer_km = p_value_km
  where id = p_vehicle_id
  returning * into v_vehicle;

  return v_vehicle;
end;
$$;

comment on function public.set_odometer(uuid, integer) is
  'Manual absolute set of the vehicle''s shared current_odometer_km. Owner-only, value >= 0. '
  'Never writes to service_items (only mark_service_done moves a baseline, per KB §2.3).';

revoke all on function public.set_odometer(uuid, integer) from public;
grant execute on function public.set_odometer(uuid, integer) to authenticated;
