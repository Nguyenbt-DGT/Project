// Internal barrel for the home feature's own screens/components (not a cross-feature boundary —
// Rule 1.2's index.ts is `src/features/home/index.ts`).

export { useLastTrip, lastTripQueryKey } from './use-last-trip';
export { useMonthDistanceKm, monthDistanceQueryKey } from './use-month-distance';
export {
  pickVehiclePhoto,
  useUploadVehiclePhoto,
  PhotoTooLargeError,
  MAX_VEHICLE_PHOTO_BYTES,
} from './use-vehicle-photo';
export type { UploadVehiclePhotoInput } from './use-vehicle-photo';
