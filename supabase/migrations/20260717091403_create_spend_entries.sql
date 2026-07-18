-- HEALTH_CHECK: spend_entries table.
-- Backs "Spent this year" (HEALTH_REQ §7). One row per money-spent event on a vehicle's parts or
-- service labor. Year filtering (D-OQ-H5-SPEND-YEAR, D-YEAR-BOUNDARY-TZ) is done by the client
-- against the user's device-local date — this table stores every entry, never deletes past years.

create table public.spend_entries (
  id             uuid primary key default gen_random_uuid(),
  vehicle_id     uuid not null references public.vehicles (id) on delete cascade,
  kind           text not null check (kind in ('parts', 'service')),
  amount_cents   integer not null check (amount_cents >= 0),
  spent_at       date not null default current_date,
  part_type_key  text null,
  note           text null,
  created_at     timestamptz not null default now()
);

comment on table public.spend_entries is
  'Every spend entry is retained indefinitely; "Spent this year" is a read-side filter by '
  'spent_at, never a delete (AC-6 — prior-year entries stay queryable for a future history view).';

create index spend_entries_vehicle_id_idx on public.spend_entries (vehicle_id);
create index spend_entries_vehicle_id_spent_at_idx on public.spend_entries (vehicle_id, spent_at);

alter table public.spend_entries enable row level security;

create policy "spend_entries_select_own"
  on public.spend_entries for select
  to authenticated
  using (
    exists (
      select 1 from public.vehicles v
      where v.id = spend_entries.vehicle_id and v.user_id = auth.uid()
    )
  );

create policy "spend_entries_insert_own"
  on public.spend_entries for insert
  to authenticated
  with check (
    exists (
      select 1 from public.vehicles v
      where v.id = spend_entries.vehicle_id and v.user_id = auth.uid()
    )
  );

create policy "spend_entries_update_own"
  on public.spend_entries for update
  to authenticated
  using (
    exists (
      select 1 from public.vehicles v
      where v.id = spend_entries.vehicle_id and v.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.vehicles v
      where v.id = spend_entries.vehicle_id and v.user_id = auth.uid()
    )
  );

create policy "spend_entries_delete_own"
  on public.spend_entries for delete
  to authenticated
  using (
    exists (
      select 1 from public.vehicles v
      where v.id = spend_entries.vehicle_id and v.user_id = auth.uid()
    )
  );

-- See vehicles migration comment: table-level GRANT is required alongside RLS in this project.
grant select, insert, update, delete on public.spend_entries to authenticated;
