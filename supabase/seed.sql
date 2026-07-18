-- Local development seed data (Rule 4.7).
-- Loaded by `npx supabase db reset` after all migrations.
--
-- Exercises HEALTH_CHECK end-to-end:
--   * one confirmed auth user (fixed UUID) + one vehicle at a known odometer
--   * service_items covering every wear status (Fresh / Due soon / Replace / Overdue), the
--     event-count oil-filter axis, and a time-based item (brake fluid) — exact numbers derived
--     from D-STATUS-BOUNDARIES so QA can rely on them
--   * spend_entries: four this-calendar-year entries matching AC-6's fixture shape
--     ([Tires 150, Chain 80, Brake pads 45, Engine oil 30] -> top-3 + $305 total) plus one entry
--     dated last year (excluded from the total, but retained)
--   * one unapplied trips row so apply_trip_distance can be exercised
--
-- No schema statements here — schema changes go in supabase/migrations/ only (Rule 4.1).

-- ---------------------------------------------------------------------------------------------
-- Auth user (fixed UUID so RPC sanity checks / RLS tests can reference it deterministically).
-- ---------------------------------------------------------------------------------------------

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  recovery_sent_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token
) values (
  '00000000-0000-0000-0000-000000000000',
  '11111111-1111-1111-1111-111111111111',
  'authenticated',
  'authenticated',
  'rider@example.com',
  crypt('password123', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"provider":"email","providers":["email"]}',
  '{}',
  now(),
  now(),
  '',
  '',
  '',
  ''
);

insert into auth.identities (
  id, provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at
) values (
  gen_random_uuid(),
  '11111111-1111-1111-1111-111111111111',
  '11111111-1111-1111-1111-111111111111',
  '{"sub":"11111111-1111-1111-1111-111111111111","email":"rider@example.com"}',
  'email',
  now(),
  now(),
  now()
);

-- ---------------------------------------------------------------------------------------------
-- Vehicle — current_odometer_km = 25000. Every service_item below is authored against this value
-- so its status is exact and reproducible (D-STATUS-BOUNDARIES: Fresh <=65%, Due soon <=90%,
-- Replace <=100%, Overdue >100%).
-- ---------------------------------------------------------------------------------------------

insert into public.vehicles (id, user_id, name, brand, model, current_odometer_km, unit_preference)
values (
  '22222222-2222-2222-2222-222222222222',
  '11111111-1111-1111-1111-111111111111',
  'My Daily Rider',
  'Honda',
  'CB500X',
  25000,
  'km'
);

-- ---------------------------------------------------------------------------------------------
-- Service items — progress = (current_odometer_km - last_service_km) / interval_km unless noted.
-- current_odometer_km = 25000 throughout.
-- ---------------------------------------------------------------------------------------------

insert into public.service_items
  (vehicle_id, type_key, name, interval_km, interval_days, interval_events, last_service_km, last_service_at, events_elapsed, price_cents)
values
  -- Due soon: (25000-24650)/500   = 70.0%
  ('22222222-2222-2222-2222-222222222222', 'chain_lube',       'Chain lube',       500,   null, null, 24650, null, 0, null),

  -- Fresh: (25000-24000)/2500     = 40.0%. Price seeded to match AC-6's fixture ($30).
  ('22222222-2222-2222-2222-222222222222', 'engine_oil',       'Engine oil',       2500,  null, null, 24000, null, 0, 3000),

  -- Fresh (event axis): 1 of 2 oil-change events elapsed = 50.0%
  ('22222222-2222-2222-2222-222222222222', 'oil_filter',       'Oil filter',       null,  null, 2,    null,  null, 1, null),

  -- Due soon: (25000-9000)/20000  = 80.0%. Price seeded to match AC-6's fixture ($45).
  ('22222222-2222-2222-2222-222222222222', 'front_brake_pads', 'Front brake pads', 20000, null, null, 9000,  null, 0, 4500),

  -- Fresh: (25000-20000)/25000    = 20.0%
  ('22222222-2222-2222-2222-222222222222', 'rear_brake_pads',  'Rear brake pads',  25000, null, null, 20000, null, 0, null),

  -- Overdue: (25000-0)/15000      = 166.7%, ⚠
  ('22222222-2222-2222-2222-222222222222', 'spark_plug',       'Spark plug',       15000, null, null, 0,     null, 0, null),

  -- Replace: (25000-6000)/20000   = 95.0%. Price seeded to match AC-6's fixture ($80).
  ('22222222-2222-2222-2222-222222222222', 'chain',            'Chain',            20000, null, null, 6000,  null, 0, 8000),

  -- Fresh: (25000-15000)/30000    = 33.3%. Price seeded to match AC-6's fixture ($150).
  ('22222222-2222-2222-2222-222222222222', 'tires',            'Tires',            30000, null, null, 15000, null, 0, 15000),

  -- Due soon: (25000-16500)/10000 = 85.0%
  ('22222222-2222-2222-2222-222222222222', 'air_filter',       'Air filter',       10000, null, null, 16500, null, 0, null),

  -- Fresh: (25000-20000)/10000    = 50.0%
  ('22222222-2222-2222-2222-222222222222', 'fuel_filter',      'Fuel filter',      10000, null, null, 20000, null, 0, null),

  -- Replace: (25000-6500)/20000   = 92.5%
  ('22222222-2222-2222-2222-222222222222', 'coolant',          'Coolant',          20000, null, null, 6500,  null, 0, null),

  -- Fresh: (25000-0)/50000        = 50.0%
  ('22222222-2222-2222-2222-222222222222', 'clutch_plates',    'Clutch plates',    50000, null, null, 0,     null, 0, null);

-- Time-based item (Brake fluid, interval_days = 1095 ~ 3 years): last_service_at set relative to
-- now() so it stays reproducible across when `db reset` runs. Due soon: 900/1095 = 82.2%.
insert into public.service_items
  (vehicle_id, type_key, name, interval_km, interval_days, interval_events, last_service_km, last_service_at, events_elapsed, price_cents)
values (
  '22222222-2222-2222-2222-222222222222', 'brake_fluid', 'Brake fluid', null, 1095, null, null, now() - interval '900 days', 0, null
);

-- ---------------------------------------------------------------------------------------------
-- Spend entries — matches AC-6's fixture exactly: Top-3 = [Tires 150, Chain 80, Brake pads 45],
-- Total = 305 (includes Engine oil 30, which falls outside the top-3). Plus one prior-year entry
-- that must be excluded from the current-year total but not deleted.
-- ---------------------------------------------------------------------------------------------

insert into public.spend_entries (vehicle_id, kind, amount_cents, spent_at, part_type_key, note)
values
  ('22222222-2222-2222-2222-222222222222', 'parts', 15000, current_date, 'tires',            'New front+rear tires'),
  ('22222222-2222-2222-2222-222222222222', 'parts', 8000,  current_date, 'chain',             'Chain replacement'),
  ('22222222-2222-2222-2222-222222222222', 'parts', 4500,  current_date, 'front_brake_pads',  'Front brake pad set'),
  ('22222222-2222-2222-2222-222222222222', 'parts', 3000,  current_date, 'engine_oil',        'Oil change'),
  -- Prior calendar year — must be excluded from this year's total/top-3 but retained (AC-6).
  ('22222222-2222-2222-2222-222222222222', 'service', 5000, (date_trunc('year', current_date) - interval '6 months')::date, null, 'Prior-year service bill');

-- ---------------------------------------------------------------------------------------------
-- Trip — unapplied, so apply_trip_distance(trip_id) can be exercised (AC-5).
-- ---------------------------------------------------------------------------------------------

insert into public.trips (id, vehicle_id, distance_km, recorded_at, distance_applied_at)
values (
  '33333333-3333-3333-3333-333333333333',
  '22222222-2222-2222-2222-222222222222',
  355,
  now(),
  null
);
