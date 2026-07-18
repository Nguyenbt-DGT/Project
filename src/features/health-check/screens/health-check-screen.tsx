import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

import { LanguageToggle } from '@/components/language-toggle';
import { useToast } from '@/components/toast';

import {
  useMarkServiceDone,
  useServiceItems,
  useSetLastServiceKm,
  useSetOdometer,
  useSpendEntries,
  useTodaysDistanceKm,
  useUndoLastService,
  useUpdateVehicle,
  useVehicle,
} from '../api';
import { AsyncState } from '../components/async-state';
import { EditVehicleModal } from '../components/edit-vehicle-modal';
import { LiveVitalsSection } from '../components/live-vitals-section';
import { PermissionNotice } from '../components/permission-notice';
import { ServiceRemindersSection } from '../components/service-reminders-section';
import { SpendSummarySection } from '../components/spend-summary-section';
import { COLORS, SPACING } from '../components/theme';
import { useT } from '../i18n';
import { HEALTH_LABELS } from '../logic/labels';
import { toDistanceUnit } from '../logic/units';

/**
 * The Health tab (KB §2 / HEALTH_REQ). Section order per DEMO_FEEDBACK_001 #3: Live Vitals ->
 * Service Reminders -> Spent this year. Rule 3.7: the vehicle fetch drives the screen-level
 * loading/error/empty/populated states; each section additionally handles its own query's states
 * so one slow/failed request doesn't blank the page.
 */
export function HealthCheckScreen() {
  const [now] = useState(() => new Date());
  const [isEditingVehicle, setIsEditingVehicle] = useState(false);
  const t = useT();

  const vehicleQuery = useVehicle();
  const vehicle = vehicleQuery.data;

  const serviceItemsQuery = useServiceItems(vehicle?.id);
  const spendEntriesQuery = useSpendEntries(vehicle?.id);
  const todaysDistanceQuery = useTodaysDistanceKm(vehicle?.id);

  const markServiceDone = useMarkServiceDone();
  const undoLastService = useUndoLastService();
  const setOdometer = useSetOdometer();
  const setLastService = useSetLastServiceKm();
  const updateVehicle = useUpdateVehicle();
  const { showToast } = useToast();

  if (vehicleQuery.isLoading || vehicleQuery.isError || !vehicle) {
    return (
      <View style={styles.screen}>
        <View style={styles.headerRow}>
          <LanguageToggle />
        </View>
        <AsyncState
          isLoading={vehicleQuery.isLoading}
          isError={vehicleQuery.isError}
          errorMessage={t(HEALTH_LABELS.vehicle.loadError)}
          onRetry={() => void vehicleQuery.refetch()}
          isEmpty={!vehicleQuery.isLoading && !vehicleQuery.isError}
          emptyMessage={`${t(HEALTH_LABELS.vehicle.emptyTitle)} — ${t(HEALTH_LABELS.vehicle.emptyBody)}`}
        >
          <View />
        </AsyncState>
      </View>
    );
  }

  const unit = toDistanceUnit(vehicle.unit_preference);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.headerRow}>
        {/* DEMO_FEEDBACK_003 #4: a persistent, always-reachable place to view/edit the bike's
         * profile — not just at first-login onboarding. */}
        <Pressable
          style={styles.vehicleButton}
          onPress={() => setIsEditingVehicle(true)}
          accessibilityRole="button"
          accessibilityLabel={t(HEALTH_LABELS.vehicleEdit.entryLabel)}
        >
          <Ionicons name="pencil" size={14} color={COLORS.accent} />
          <Text style={styles.vehicleButtonText}>{vehicle.name}</Text>
        </Pressable>
        <LanguageToggle />
      </View>

      <PermissionNotice />

      <LiveVitalsSection
        currentOdometerKm={vehicle.current_odometer_km}
        todaysDistanceKm={todaysDistanceQuery.data}
        isLoading={todaysDistanceQuery.isLoading}
        isError={todaysDistanceQuery.isError}
        onRetry={() => void todaysDistanceQuery.refetch()}
        unit={unit}
      />

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
          // DEMO_FEEDBACK_001 #5.1: confirm before marking. On Yes -> mark, then a toast with the
          // part name (#5.2) offering Undo (#5.4). On No -> Alert dismisses, nothing happens (#5.3).
          Alert.alert(
            t(HEALTH_LABELS.serviceReminders.confirmTitle),
            `${t(HEALTH_LABELS.serviceReminders.confirmBody)} "${item.name}"?`,
            [
              { text: t(HEALTH_LABELS.common.no), style: 'cancel' },
              {
                text: t(HEALTH_LABELS.common.yes),
                onPress: () =>
                  markServiceDone.mutate(
                    {
                      serviceItemId: item.id,
                      vehicleId: vehicle.id,
                      priceCents,
                      partTypeKey: item.typeKey,
                    },
                    {
                      onSuccess: () =>
                        showToast({
                          message: `${item.name} ${t(HEALTH_LABELS.serviceReminders.markedToast)}`,
                          actionLabel: t(HEALTH_LABELS.common.undo),
                          onAction: () =>
                            undoLastService.mutate(
                              { serviceItemId: item.id, vehicleId: vehicle.id },
                              {
                                onSuccess: () =>
                                  showToast({
                                    message: `${item.name} ${t(HEALTH_LABELS.serviceReminders.undoneToast)}`,
                                  }),
                                onError: () =>
                                  Alert.alert(t(HEALTH_LABELS.serviceReminders.undoFailed)),
                              }
                            ),
                        }),
                      onError: () => Alert.alert(t(HEALTH_LABELS.serviceReminders.markFailed)),
                    }
                  ),
              },
            ]
          );
        }}
        isSavingOdometer={setOdometer.isPending}
        onEditOdometer={(valueKm) => {
          setOdometer.mutate(
            { vehicleId: vehicle.id, valueKm },
            { onError: () => Alert.alert(t(HEALTH_LABELS.serviceReminders.odometerFailed)) }
          );
        }}
        isSettingLastService={setLastService.isPending}
        onSetLastService={(item, lastServiceKm) => {
          setLastService.mutate(
            { serviceItemId: item.id, vehicleId: vehicle.id, lastServiceKm },
            { onError: () => Alert.alert(t(HEALTH_LABELS.common.error)) }
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

      <EditVehicleModal
        visible={isEditingVehicle}
        currentName={vehicle.name}
        currentBrand={vehicle.brand ?? ''}
        currentUnit={unit}
        isSaving={updateVehicle.isPending}
        onClose={() => setIsEditingVehicle(false)}
        onSave={({ name, brand, unit: newUnit }) => {
          updateVehicle.mutate(
            { vehicleId: vehicle.id, name, brand, unitPreference: newUnit },
            {
              onSuccess: () => setIsEditingVehicle(false),
              onError: () => Alert.alert(t(HEALTH_LABELS.vehicleEdit.error)),
            }
          );
        }}
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
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
  },
  vehicleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexShrink: 1,
  },
  vehicleButtonText: {
    color: COLORS.ink,
    fontSize: 14,
    fontWeight: '600',
    flexShrink: 1,
  },
});
