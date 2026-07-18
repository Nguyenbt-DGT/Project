-- DEMO_FEEDBACK_001: undo "mark as replaced" (#5.4) and first-login onboarding (#2).
--
-- Adds:
--   * service_events  — append-only snapshot log so a mark_service_done can be reversed.
--   * mark_service_done (replaced) — now records a snapshot event for undo.
--   * undo_last_service(item)      — reverses the most recent, not-yet-undone mark for an item,
--                                    restoring its baseline (and the coupled oil_filter counter).
--   * onboard_vehicle(...)         — creates a vehicle + its service items from part_type_defaults
--                                    for a first-login user (GLOBAL_REQ §2 / HEALTH_REQ §4.3).
--
-- All RPCs stay SECURITY DEFINER + owner-checked via auth.uid() (Rule 4.5). Lock ordering is
-- vehicle-first everywhere to stay deadlock-free (matches the fix in the prior RPC migration).

-- =================================================================================================
-- service_events — one row per mark_service_done, holding the item's pre-mark baseline snapshot
-- (and, when the marked item is engine_oil, the coupled oil_filter's pre-bump event count). undo
-- flips undone_at and restores the snapshot.
-- =================================================================================================

create table public.service_events (
  id                             uuid primary key default gen_random_uuid(),
  vehicle_id                     uuid not null references public.vehicles(id) on delete cascade,
  service_item_id                uuid not null references public.service_items(id) on delete cascade,
  event_type                     text not null default 'mark_done' check (event_type in ('mark_done')),
  prev_last_service_km           integer,
  prev_last_service_at           timestamptz,
  prev_events_elapsed            integer not null,
  coupled_oil_filter_id          uuid references public.service_items(id) on delete set null,
  coupled_oil_filter_prev_events integer,
  undone_at                      timestamptz,
  created_at                     timestamptz not null default now()
);

alter table public.service_events enable row level security;

-- Owner-only via vehicle ownership. Clients only ever read this log (writes happen inside the
-- SECURITY DEFINER RPCs below), so only SELECT is granted to authenticated.
create policy service_events_select on public.service_events for select
  using (exists (select 1 from public.vehicles v
                 where v.id = service_events.vehicle_id and v.user_id = auth.uid()));

grant select on public.service_events to authenticated;

create index service_events_active_idx
  on public.service_events (service_item_id, created_at desc)
  where undone_at is null;

-- =================================================================================================
-- mark_service_done (replaced) — same behavior as before (reset baseline on the item's axis/axes;
-- engine_oil bumps the vehicle's oil_filter events_elapsed by 1) PLUS it now writes a
-- service_events snapshot so the action can be undone. Vehicle row is locked first (deadlock-safe).
-- =================================================================================================

create or replace function public.mark_service_done(p_service_item_id uuid)
returns public.service_items
language plpgsql
security definer
set search_path = public
as $$
declare
  v_item                    public.service_items%rowtype;
  v_vehicle                 public.vehicles%rowtype;
  v_vehicle_id              uuid;
  v_prev_km                 integer;
  v_prev_at                 timestamptz;
  v_prev_events             integer;
  v_oil_filter_id           uuid;
  v_oil_filter_prev_events  integer;
begin
  -- Resolve the owning vehicle without locking, then lock vehicle first (consistent order).
  select vehicle_id into v_vehicle_id from public.service_items where id = p_service_item_id;
  if v_vehicle_id is null then
    raise exception 'service item not found' using errcode = 'P0002';
  end if;

  select v.* into v_vehicle from public.vehicles v where v.id = v_vehicle_id for update;
  if v_vehicle.user_id is distinct from auth.uid() then
    raise exception 'not authorized to modify this service item' using errcode = '42501';
  end if;

  select si.* into v_item from public.service_items si where si.id = p_service_item_id for update;

  -- Snapshot the pre-mark baseline for undo.
  v_prev_km     := v_item.last_service_km;
  v_prev_at     := v_item.last_service_at;
  v_prev_events := v_item.events_elapsed;

  update public.service_items
  set
    last_service_km = case when interval_km is not null then v_vehicle.current_odometer_km else last_service_km end,
    last_service_at = case when interval_days is not null then now() else last_service_at end,
    events_elapsed  = case when interval_events is not null then 0 else events_elapsed end
  where id = p_service_item_id
  returning * into v_item;

  -- D-OQ-H9: engine oil replaced -> bump this vehicle's oil filter event counter by 1 (snapshot it).
  if v_item.type_key = 'engine_oil' then
    select id, events_elapsed into v_oil_filter_id, v_oil_filter_prev_events
    from public.service_items
    where vehicle_id = v_item.vehicle_id and type_key = 'oil_filter'
    for update;
    if found then
      update public.service_items set events_elapsed = events_elapsed + 1 where id = v_oil_filter_id;
    end if;
  end if;

  insert into public.service_events (
    vehicle_id, service_item_id, event_type,
    prev_last_service_km, prev_last_service_at, prev_events_elapsed,
    coupled_oil_filter_id, coupled_oil_filter_prev_events
  ) values (
    v_item.vehicle_id, v_item.id, 'mark_done',
    v_prev_km, v_prev_at, v_prev_events,
    v_oil_filter_id, v_oil_filter_prev_events
  );

  return v_item;
end;
$$;

revoke all on function public.mark_service_done(uuid) from public;
grant execute on function public.mark_service_done(uuid) to authenticated;

-- =================================================================================================
-- undo_last_service(p_service_item_id) — reverse the most recent not-yet-undone mark_service_done
-- for the item: restore its baseline snapshot and, if that mark bumped the coupled oil_filter,
-- restore the oil_filter's event count too. Owner-only, vehicle-locked first.
-- =================================================================================================

create or replace function public.undo_last_service(p_service_item_id uuid)
returns public.service_items
language plpgsql
security definer
set search_path = public
as $$
declare
  v_item       public.service_items%rowtype;
  v_vehicle_id uuid;
  v_owner      uuid;
  v_event      public.service_events%rowtype;
begin
  select vehicle_id into v_vehicle_id from public.service_items where id = p_service_item_id;
  if v_vehicle_id is null then
    raise exception 'service item not found' using errcode = 'P0002';
  end if;

  select user_id into v_owner from public.vehicles where id = v_vehicle_id for update;
  if v_owner is distinct from auth.uid() then
    raise exception 'not authorized to modify this service item' using errcode = '42501';
  end if;

  select * into v_event
  from public.service_events
  where service_item_id = p_service_item_id and undone_at is null
  order by created_at desc
  limit 1
  for update;

  if not found then
    raise exception 'nothing to undo for this item' using errcode = 'P0002';
  end if;

  update public.service_items
  set last_service_km = v_event.prev_last_service_km,
      last_service_at = v_event.prev_last_service_at,
      events_elapsed  = v_event.prev_events_elapsed
  where id = p_service_item_id
  returning * into v_item;

  if v_event.coupled_oil_filter_id is not null then
    update public.service_items
    set events_elapsed = v_event.coupled_oil_filter_prev_events
    where id = v_event.coupled_oil_filter_id;
  end if;

  update public.service_events set undone_at = now() where id = v_event.id;

  return v_item;
end;
$$;

comment on function public.undo_last_service(uuid) is
  'Reverses the most recent not-yet-undone mark_service_done for a service item, restoring its '
  'baseline snapshot (and the coupled oil_filter counter). Owner-only. DEMO_FEEDBACK_001 #5.4.';

revoke all on function public.undo_last_service(uuid) from public;
grant execute on function public.undo_last_service(uuid) to authenticated;

-- =================================================================================================
-- onboard_vehicle(...) — first-login: create the user's vehicle and seed its service items from
-- part_type_defaults (GLOBAL_REQ §2). Baseline rule (see DECISIONS D-OQ-H2, reconciled):
--   * recently-changed part  -> starts Fresh (0%): km baseline = entered odometer; time = now();
--                               event count = 0.
--   * not recently-changed   -> km baseline = 0 (reflects accumulated km-wear, so the reminder is
--                               meaningful, per GLOBAL_REQ §2 acceptance); time baseline = now()
--                               (no past-service-date signal exists, so start the clock); events = 0.
-- =================================================================================================

create or replace function public.onboard_vehicle(
  p_name                text,
  p_brand               text,
  p_current_odometer_km integer,
  p_unit                text,
  p_recently_changed    text[]
)
returns public.vehicles
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid     uuid := auth.uid();
  v_vehicle public.vehicles%rowtype;
  d         record;
  v_recent  boolean;
begin
  if v_uid is null then
    raise exception 'not authenticated' using errcode = '42501';
  end if;
  if p_current_odometer_km is null or p_current_odometer_km < 0 then
    raise exception 'odometer must be >= 0' using errcode = '22003';
  end if;
  if p_unit is null or p_unit not in ('km', 'mi') then
    raise exception 'unit must be km or mi' using errcode = '22023';
  end if;

  insert into public.vehicles (user_id, name, brand, current_odometer_km, unit_preference)
  values (v_uid, p_name, p_brand, p_current_odometer_km, p_unit)
  returning * into v_vehicle;

  for d in select * from public.part_type_defaults loop
    v_recent := d.type_key = any (coalesce(p_recently_changed, array[]::text[]));

    insert into public.service_items (
      vehicle_id, type_key, name, interval_km, interval_days, interval_events,
      last_service_km, last_service_at, events_elapsed, price_cents
    ) values (
      v_vehicle.id, d.type_key, d.name, d.interval_km, d.interval_days, d.interval_events,
      case
        when d.interval_km is null then null
        when v_recent then p_current_odometer_km
        else 0
      end,
      case when d.interval_days is not null then now() else null end,
      0,
      null
    );
  end loop;

  return v_vehicle;
end;
$$;

comment on function public.onboard_vehicle(text, text, integer, text, text[]) is
  'First-login: creates the caller''s vehicle and seeds service items from part_type_defaults. '
  'Recently-changed parts start Fresh; others reflect accumulated km-wear. DEMO_FEEDBACK_001 #2.';

revoke all on function public.onboard_vehicle(text, text, integer, text, text[]) from public;
grant execute on function public.onboard_vehicle(text, text, integer, text, text[]) to authenticated;
