import { useMutation, useQueryClient } from '@tanstack/react-query';
import { File } from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';

import { VEHICLE_QUERY_KEY } from '@/features/health-check';
import { supabase } from '@/lib/supabase';

/** Storage bucket's own limit (migration `20260719080000_home_vehicle_photo.sql`) — enforced
 * client-side too so the user gets an immediate, clear error instead of a silent failed upload
 * (DEMO_FEEDBACK_005 #1). */
export const MAX_VEHICLE_PHOTO_BYTES = 10 * 1024 * 1024;

/**
 * Requests photo-library permission and lets the user pick a photo (HOME_REQ.md §3.1.4 — replaces
 * the static "Z800 hero shot" placeholder with a real user-uploaded photo). Returns the picked
 * image's local URI, or `null` if the user canceled or permission was denied.
 */
export async function pickVehiclePhoto(): Promise<string | null> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) return null;

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    quality: 0.8,
    allowsEditing: true,
    aspect: [16, 9],
  });
  if (result.canceled) return null;
  const asset = result.assets[0];
  return asset ? asset.uri : null;
}

export interface UploadVehiclePhotoInput {
  vehicleId: string;
  localUri: string;
}

function extensionAndMimeType(uri: string): { extension: string; mimeType: string } {
  const raw = uri.split('.').pop()?.toLowerCase() ?? 'jpg';
  if (raw === 'png') return { extension: 'png', mimeType: 'image/png' };
  if (raw === 'webp') return { extension: 'webp', mimeType: 'image/webp' };
  return { extension: 'jpg', mimeType: 'image/jpeg' };
}

/** Thrown when the picked photo exceeds `MAX_VEHICLE_PHOTO_BYTES` — a distinct error type so the
 * UI can show a size-specific message instead of a generic upload failure. */
export class PhotoTooLargeError extends Error {
  constructor() {
    super('Photo exceeds the maximum allowed size');
    this.name = 'PhotoTooLargeError';
  }
}

/**
 * Uploads a picked photo to the `vehicle-photos` Storage bucket (owner-scoped RLS, migration
 * `20260719080000_home_vehicle_photo.sql`) at `{auth.uid()}/{vehicleId}.{ext}`, then points
 * `vehicles.photo_url` at its public URL. Re-uploading overwrites the same path (`upsert: true`);
 * the URL gets a cache-busting query param each time so the new image actually shows up (the
 * public URL itself is otherwise identical for the same vehicle).
 *
 * DEMO_FEEDBACK_005 #1 fix: the previous implementation read the local file via
 * `fetch(localUri).blob()`, which is unreliable for local `file://` URIs across React Native
 * environments — the upload could "succeed" (no thrown error) while writing an empty/corrupt
 * object, so the photo never actually rendered. `expo-file-system`'s `File` class reads the actual
 * bytes through a native module, which is the robust alternative.
 */
export function useUploadVehiclePhoto() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ vehicleId, localUri }: UploadVehiclePhotoInput): Promise<string> => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const file = new File(localUri);
      if (file.size > MAX_VEHICLE_PHOTO_BYTES) {
        throw new PhotoTooLargeError();
      }

      const { extension, mimeType } = extensionAndMimeType(localUri);
      const path = `${user.id}/${vehicleId}.${extension}`;

      const bytes = await file.bytes();

      const { error: uploadError } = await supabase.storage
        .from('vehicle-photos')
        .upload(path, bytes, { contentType: mimeType, upsert: true });
      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from('vehicle-photos').getPublicUrl(path);
      const cacheBustedUrl = `${publicUrl}?t=${Date.now()}`;

      const { error: updateError } = await supabase
        .from('vehicles')
        .update({ photo_url: cacheBustedUrl })
        .eq('id', vehicleId);
      if (updateError) throw updateError;

      return cacheBustedUrl;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: VEHICLE_QUERY_KEY });
    },
  });
}
