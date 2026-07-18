-- HEALTH_CHECK: shared reference tables.
-- Readable by any authenticated user; no client writes (RLS: SELECT-only policy, no
-- INSERT/UPDATE/DELETE policy for authenticated/anon, plus an explicit REVOKE for defense in
-- depth). Reference/lookup rows ship as part of this migration (not supabase/seed.sql) because
-- they must exist in every environment (dev, staging, prod), not just local dev resets.

-- ---------------------------------------------------------------------------------------------
-- part_type_defaults — the 13 generic-default metrics (HEALTH_REQ §6, D-OQ-H7-METRIC-LIST).
-- Rule 8.3: this is seed/reference data, not a hardcoded enum — service_items.type_key has no FK
-- here, so users can add metric types this table doesn't know about.
-- ---------------------------------------------------------------------------------------------

create table public.part_type_defaults (
  type_key         text primary key,
  name             text not null,
  interval_km      integer null check (interval_km is null or interval_km > 0),
  interval_days    integer null check (interval_days is null or interval_days > 0),
  interval_events  integer null check (interval_events is null or interval_events > 0),
  basis            text not null check (basis in ('distance', 'time', 'event_count')),

  constraint part_type_defaults_has_at_least_one_axis
    check (interval_km is not null or interval_days is not null or interval_events is not null)
);

comment on table public.part_type_defaults is
  'Generic-default interval per metric type (HEALTH_REQ §6). Battery is intentionally excluded '
  '(D-OQ-H7-METRIC-LIST) — no defensible generic default exists without brand data.';

insert into public.part_type_defaults (type_key, name, interval_km, interval_days, interval_events, basis) values
  ('chain_lube',        'Chain lube',        500,   null, null, 'distance'),
  ('engine_oil',        'Engine oil',        2500,  null, null, 'distance'),
  ('oil_filter',        'Oil filter',        null,  null, 2,    'event_count'),
  ('front_brake_pads',  'Front brake pads',  20000, null, null, 'distance'),
  ('rear_brake_pads',   'Rear brake pads',   25000, null, null, 'distance'),
  ('spark_plug',        'Spark plug',        15000, null, null, 'distance'),
  ('chain',             'Chain',             20000, null, null, 'distance'),
  ('tires',             'Tires',             30000, null, null, 'distance'),
  ('air_filter',        'Air filter',        10000, null, null, 'distance'),
  ('fuel_filter',       'Fuel filter',       10000, null, null, 'distance'),
  ('coolant',           'Coolant',           20000, null, null, 'distance'),
  ('brake_fluid',       'Brake fluid',       null,  1095, null, 'time'),
  ('clutch_plates',     'Clutch plates',     50000, null, null, 'distance');

alter table public.part_type_defaults enable row level security;

create policy "part_type_defaults_select_authenticated"
  on public.part_type_defaults for select
  to authenticated
  using (true);

-- See the vehicles migration comment: table-level GRANT is required alongside RLS in this
-- project (auto_expose_new_tables is off). Only SELECT — no client writes to reference data.
grant select on public.part_type_defaults to authenticated;
revoke insert, update, delete on public.part_type_defaults from authenticated, anon;

-- ---------------------------------------------------------------------------------------------
-- bike_catalog — small curated brand/bike/year sample (D-OQ-H4-BRAND-COVERAGE).
--
-- IMPORTANT: per D-OQ-H4, brand/bike coverage and the exact numbers are a "recommendation pending
-- real stakeholder sign-off", NOT a verified-accurate content decision. The rows below are a small
-- illustrative sample of well-known model generations, seeded only to prove the brand-select data
-- path end to end (catalog -> per-part overrides -> fallback to generic defaults). They are NOT a
-- substitute for the full brand-data research D-OQ-H4 still requires before these numbers are
-- treated as rider-facing fact.
-- ---------------------------------------------------------------------------------------------

create table public.bike_catalog (
  id          uuid primary key default gen_random_uuid(),
  brand       text not null,
  bike        text not null,
  year_from   integer not null,
  year_to     integer null check (year_to is null or year_to >= year_from)
);

comment on table public.bike_catalog is
  'Small curated sample only (D-OQ-H4) — proves the brand-select data path, not full launch '
  'coverage. year_to null = generation still in production as of seeding.';

insert into public.bike_catalog (brand, bike, year_from, year_to) values
  ('Honda',    'Africa Twin CRF1100L', 2020, null),
  ('Kawasaki', 'Versys 650',           2015, 2021),
  ('Suzuki',   'V-Strom 650',          2017, 2023),
  ('Honda',    'CB500X',               2019, 2023);

alter table public.bike_catalog enable row level security;

create policy "bike_catalog_select_authenticated"
  on public.bike_catalog for select
  to authenticated
  using (true);

grant select on public.bike_catalog to authenticated;
revoke insert, update, delete on public.bike_catalog from authenticated, anon;

-- ---------------------------------------------------------------------------------------------
-- bike_part_intervals — per-bike interval overrides that differ from generic defaults.
-- A bike/type_key pair with no row here falls back to part_type_defaults (the "using generic
-- defaults" note per D-OQ-H4). Only a couple of rows are seeded now to prove the override path;
-- full per-bike research is deferred.
-- ---------------------------------------------------------------------------------------------

create table public.bike_part_intervals (
  id               uuid primary key default gen_random_uuid(),
  bike_catalog_id  uuid not null references public.bike_catalog (id) on delete cascade,
  type_key         text not null references public.part_type_defaults (type_key) on delete cascade,
  interval_km      integer null check (interval_km is null or interval_km > 0),
  interval_days    integer null check (interval_days is null or interval_days > 0),
  interval_events  integer null check (interval_events is null or interval_events > 0),
  basis            text not null check (basis in ('distance', 'time', 'event_count')),

  constraint bike_part_intervals_has_at_least_one_axis
    check (interval_km is not null or interval_days is not null or interval_events is not null),
  constraint bike_part_intervals_unique_override unique (bike_catalog_id, type_key)
);

comment on table public.bike_part_intervals is
  'Overrides part_type_defaults for a specific catalog bike. Sample rows only (see bike_catalog '
  'comment) — illustrative of larger-displacement adventure/touring bikes typically specifying '
  'longer oil/chain intervals than the generic defaults, not brand-verified figures.';

insert into public.bike_part_intervals (bike_catalog_id, type_key, interval_km, interval_days, interval_events, basis)
select id, 'engine_oil', 8000, null, null, 'distance'
from public.bike_catalog where brand = 'Honda' and bike = 'Africa Twin CRF1100L';

insert into public.bike_part_intervals (bike_catalog_id, type_key, interval_km, interval_days, interval_events, basis)
select id, 'chain', 24000, null, null, 'distance'
from public.bike_catalog where brand = 'Honda' and bike = 'Africa Twin CRF1100L';

insert into public.bike_part_intervals (bike_catalog_id, type_key, interval_km, interval_days, interval_events, basis)
select id, 'engine_oil', 6000, null, null, 'distance'
from public.bike_catalog where brand = 'Kawasaki' and bike = 'Versys 650';

alter table public.bike_part_intervals enable row level security;

create policy "bike_part_intervals_select_authenticated"
  on public.bike_part_intervals for select
  to authenticated
  using (true);

grant select on public.bike_part_intervals to authenticated;
revoke insert, update, delete on public.bike_part_intervals from authenticated, anon;
