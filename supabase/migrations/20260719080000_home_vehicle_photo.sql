-- HOME tab: vehicle hero photo (DEMO_FEEDBACK_004 #4 / HOME_REQ.md §3.1.4). Users upload a photo
-- of their bike from the phone, replacing the static "Z800 hero shot" placeholder in the mockup.
--
-- Adds a `photo_url` column on vehicles (a public Storage URL, or null before any upload) and a
-- `vehicle-photos` Storage bucket with owner-scoped RLS on `storage.objects`. Upload path
-- convention: `{auth.uid()}/{vehicle_id}.jpg` — the RLS policies check the FIRST path segment
-- against auth.uid(), the standard Supabase Storage ownership pattern.

alter table public.vehicles
  add column photo_url text null;

comment on column public.vehicles.photo_url is
  'Public Storage URL of the user-uploaded vehicle photo (HOME_REQ §3.1.4). Null until the user '
  'uploads one; the app shows an "add photo" placeholder in that case, never a static stock image.';

-- Bucket is public-READ (photo URLs are rendered directly as <Image> sources with no auth header)
-- but every WRITE is gated by the owner-scoped policies below — the path itself encodes ownership.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('vehicle-photos', 'vehicle-photos', true, 10485760, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

create policy "vehicle_photos_select_public"
  on storage.objects for select
  to public
  using (bucket_id = 'vehicle-photos');

create policy "vehicle_photos_insert_own"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'vehicle-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "vehicle_photos_update_own"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'vehicle-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "vehicle_photos_delete_own"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'vehicle-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
