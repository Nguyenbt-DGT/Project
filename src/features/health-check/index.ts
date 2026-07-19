// Public API of the health-check feature (Rule 1.2: other code imports ONLY from here for
// screens/hooks). Pure `logic/` modules are the one documented exception — see Rule 1.2's
// carve-out and `./logic/status` (imported directly by the `home` feature) for why: re-exporting
// them from this barrel would force any consumer to also transitively load HealthCheckScreen and
// its native Ionicons/expo-font chain, which breaks plain-Node/Jest resolution for a module that
// never touches React in the first place.
export { HealthCheckScreen } from './screens/health-check-screen';
export { OnboardingScreen } from './screens/onboarding-screen';
export { useVehicle, VEHICLE_QUERY_KEY, useServiceItems, serviceItemsQueryKey } from './api';
