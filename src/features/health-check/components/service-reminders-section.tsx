import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { HEALTH_LABELS } from '../logic/labels';
import type { DistanceUnit } from '../logic/units';
import { toServiceItemViewModel, type ServiceItemRow, type ServiceItemViewModel, type VehicleRow } from '../types';
import { AsyncState } from './async-state';
import { EditOdometerModal } from './edit-odometer-modal';
import { ServiceItemCard } from './service-item-card';
import { ServiceItemDetailSheet } from './service-item-detail-sheet';
import { COLORS, RADIUS, SPACING } from './theme';

interface ServiceRemindersSectionProps {
  vehicle: VehicleRow;
  items: ServiceItemRow[] | undefined;
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
  unit: DistanceUnit;
  now: Date;
  onMarkDone: (item: ServiceItemViewModel, priceCents: number | undefined) => void;
  isMarkingDone: boolean;
  onEditOdometer: (valueKm: number) => void;
  isSavingOdometer: boolean;
}

function formatCentsTotal(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

/** Service Reminders — the primary Health section (HEALTH_REQ §4 / D-HEALTH-MVP-SCOPE). */
export function ServiceRemindersSection({
  vehicle,
  items,
  isLoading,
  isError,
  onRetry,
  unit,
  now,
  onMarkDone,
  isMarkingDone,
  onEditOdometer,
  isSavingOdometer,
}: ServiceRemindersSectionProps) {
  const [selectedItem, setSelectedItem] = useState<ServiceItemViewModel | null>(null);
  const [isEditingOdometer, setIsEditingOdometer] = useState(false);

  const viewModels = useMemo(
    () => (items ?? []).map((row) => toServiceItemViewModel(row, vehicle, now, unit)),
    [items, vehicle, now, unit]
  );

  const runningTotalCents = useMemo(
    () => (items ?? []).reduce((sum, row) => sum + (row.price_cents ?? 0), 0),
    [items]
  );

  return (
    <View style={styles.section}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>{HEALTH_LABELS.serviceReminders.title.fallback}</Text>
        <Pressable
          onPress={() => setIsEditingOdometer(true)}
          accessibilityRole="button"
          style={styles.editOdometerButton}
        >
          <Text style={styles.editOdometerText}>{HEALTH_LABELS.serviceReminders.editOdometer.fallback}</Text>
        </Pressable>
      </View>

      <AsyncState
        isLoading={isLoading}
        isError={isError}
        errorMessage={HEALTH_LABELS.serviceReminders.error.fallback}
        onRetry={onRetry}
        isEmpty={viewModels.length === 0}
        emptyMessage={HEALTH_LABELS.serviceReminders.empty.fallback}
      >
        <View style={styles.list}>
          {viewModels.map((item) => (
            <ServiceItemCard key={item.id} item={item} onPress={setSelectedItem} />
          ))}
        </View>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>{HEALTH_LABELS.serviceReminders.runningTotal.fallback}</Text>
          <Text style={styles.totalValue}>{formatCentsTotal(runningTotalCents)}</Text>
        </View>
      </AsyncState>

      <ServiceItemDetailSheet
        item={selectedItem}
        unit={unit}
        onClose={() => setSelectedItem(null)}
        isMarking={isMarkingDone}
        onMarkDone={(priceCents) => {
          if (!selectedItem) return;
          onMarkDone(selectedItem, priceCents);
          setSelectedItem(null);
        }}
      />

      <EditOdometerModal
        visible={isEditingOdometer}
        currentOdometerKm={vehicle.current_odometer_km}
        unit={unit}
        isSaving={isSavingOdometer}
        onClose={() => setIsEditingOdometer(false)}
        onSave={(valueKm) => {
          onEditOdometer(valueKm);
          setIsEditingOdometer(false);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: SPACING.md,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.ink,
  },
  editOdometerButton: {
    borderWidth: 1,
    borderColor: COLORS.accent,
    borderRadius: RADIUS.sm,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 6,
  },
  editOdometerText: {
    color: COLORS.accent,
    fontSize: 12,
    fontWeight: '600',
  },
  list: {
    gap: SPACING.sm,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: COLORS.surfaceMuted,
    borderRadius: RADIUS.sm,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  totalLabel: {
    color: COLORS.inkMuted,
    fontWeight: '600',
  },
  totalValue: {
    color: COLORS.ink,
    fontWeight: '700',
  },
});
