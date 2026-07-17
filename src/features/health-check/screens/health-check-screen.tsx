import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';

import {
  useMarkServiceDone,
  useServiceItems,
  useSetOdometer,
  useSpendEntries,
  useTodaysDistanceKm,
  useVehicle,
} from '../api';
import { AsyncState } from '../components/async-state';
import { LiveVitalsSection } from '../components/live-vitals-section';
import { ServiceRemindersSection } from '../components/service-reminders-section';
import { SpendSummarySection } from '../components/spend-summary-section';
import { COLORS, SPACING } from '../components/theme';
import { HEALTH_LABELS } from '../logic/labels';
import { toDistanceUnit } from '../logic/units';

/**
 * The Health tab (KB §2 / HEALTH_REQ). Composed in priority order (HEALTH_REQ §1): Service
 * Reminders (primary) -> Spent this year (secondary) -> Live Vitals (lowest emphasis). Rule 3.7:
 * the vehicle fetch drives the screen-level loading/error/empty/populated states; each section
 * additionally handles its own query's states so one slow/failed request doesn't blank the page.
 */
export function HealthCheckScreen() {
  const [now] = useState(() => new Date());

  const vehicleQuery = useVehicle();
  const vehicle = vehicleQuery.data;

  const serviceItemsQuery = useServiceItems(vehicle?.id);
  const spendEntriesQuery = useSpendEntries(vehicle?.id);
  const todaysDistanceQuery = useTodaysDistanceKm(vehicle?.id);

  const markServiceDone = useMarkServiceDone();
  const setOdometer = useSetOdometer();

  if (vehicleQuery.isLoading || vehicleQuery.isError || !vehicle) {
    return (
      <View style={styles.screen}>
        <AsyncState
          isLoading={vehicleQuery.isLoading}
          isError={vehicleQuery.isError}
          errorMessage={HEALTH_LABELS.vehicle.loadError.fallback}
          onRetry={() => void vehicleQuery.refetch()}
          isEmpty={!vehicleQuery.isLoading && !vehicleQuery.isError}
          emptyMessage={`${HEALTH_LABELS.vehicle.emptyTitle.fallback} — ${HEALTH_LABELS.vehicle.emptyBody.fallback}`}
        >
          <View />
        </AsyncState>
      </View>
    );
  }

  const unit = toDistanceUnit(vehicle.unit_preference);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <ServiceRemindersSection
        vehicle={vehicle}
        items={serviceItemsQuery.data}
        isLoading={serviceItemsQuery.isLoading}
        isError={serviceItemsQuery.isError}
        onRetry={() => void serviceItemsQuery.refetch()}
        unit={unit}
        now={now}
        isMarkingDone={markServiceDone.isPending}
        onMarkDone={(item, priceCents) => {
          markServiceDone.mutate(
            { serviceItemId: item.id, vehicleId: vehicle.id, priceCents, partTypeKey: item.typeKey },
            { onError: () => Alert.alert('Could not mark this item as replaced. Please try again.') }
          );
        }}
        isSavingOdometer={setOdometer.isPending}
        onEditOdometer={(valueKm) => {
          setOdometer.mutate(
            { vehicleId: vehicle.id, valueKm },
            { onError: () => Alert.alert('Could not update the odometer. Please try again.') }
          );
        }}
      />

      <SpendSummarySection
        entries={spendEntriesQuery.data}
        isLoading={spendEntriesQuery.isLoading}
        isError={spendEntriesQuery.isError}
        onRetry={() => void spendEntriesQuery.refetch()}
        now={now}
      />

      <LiveVitalsSection
        currentOdometerKm={vehicle.current_odometer_km}
        todaysDistanceKm={todaysDistanceQuery.data}
        isLoading={todaysDistanceQuery.isLoading}
        isError={todaysDistanceQuery.isError}
        onRetry={() => void todaysDistanceQuery.refetch()}
        unit={unit}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  content: {
    padding: SPACING.lg,
    gap: SPACING.xl,
  },
});
