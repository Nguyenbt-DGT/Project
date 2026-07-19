// Internal barrel for the health-check feature's own screens/components (not a cross-feature
// boundary — Rule 1.2's index.ts is `src/features/health-check/index.ts`).

export { useVehicle, VEHICLE_QUERY_KEY } from './use-vehicle';
export { useUpdateVehicle } from './use-update-vehicle';
export type { UpdateVehicleInput } from './use-update-vehicle';
export { useServiceItems, serviceItemsQueryKey } from './use-service-items';
export { useSpendEntries, spendEntriesQueryKey } from './use-spend-entries';
export { useTodaysDistanceKm, todaysDistanceQueryKey } from './use-todays-distance';
export { useMarkServiceDone } from './use-mark-service-done';
export type { MarkServiceDoneInput } from './use-mark-service-done';
export { useUndoLastService } from './use-undo-last-service';
export type { UndoLastServiceInput } from './use-undo-last-service';
export { useSetOdometer } from './use-set-odometer';
export type { SetOdometerInput } from './use-set-odometer';
export { useUpdateServiceItem } from './use-update-service-item';
export type { UpdateServiceItemInput, ServiceItemPatch } from './use-update-service-item';
export { usePartTypeDefaults, PART_TYPE_DEFAULTS_QUERY_KEY } from './use-part-type-defaults';
export { useOnboardVehicle } from './use-onboard-vehicle';
export type { OnboardVehicleInput } from './use-onboard-vehicle';
export { useBikeCatalog, BIKE_CATALOG_QUERY_KEY } from './use-bike-catalog';
