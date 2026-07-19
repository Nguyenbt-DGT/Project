import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useLanguage } from '@/i18n';

import { useT } from '../i18n';
import { formatCurrency } from '../logic/currency';
import { HEALTH_LABELS } from '../logic/labels';
import type { DistanceUnit } from '../logic/units';
import type { ServiceItemPatch } from '../api';
import {
  toServiceItemViewModel,
  type ServiceItemRow,
  type ServiceItemViewModel,
  type VehicleRow,
} from '../types';
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
  onUpdateItem: (item: ServiceItemViewModel, patch: ServiceItemPatch) => void;
  isUpdatingItem: boolean;
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
  onUpdateItem,
  isUpdatingItem,
}: ServiceRemindersSectionProps) {
  const [selectedItem, setSelectedItem] = useState<ServiceItemViewModel | null>(null);
  const [isEditingOdometer, setIsEditingOdometer] = useState(false);
  const t = useT();
  const { language } = useLanguage();

  const viewModels = useMemo(
    () => (items ?? []).map((row) => toServiceItemViewModel(row, vehicle, now, unit, language)),
    [items, vehicle, now, unit, language]
  );

  const runningTotalCents = useMemo(
    () => (items ?? []).reduce((sum, row) => sum + (row.price_cents ?? 0), 0),
    [items]
  );

  return (
    <View style={styles.section}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>{t(HEALTH_LABELS.serviceReminders.title)}</Text>
        <Pressable
          onPress={() => setIsEditingOdometer(true)}
          accessibilityRole="button"
          style={styles.editOdometerButton}
        >
          <Text style={styles.editOdometerText}>
            {t(HEALTH_LABELS.serviceReminders.editOdometer)}
          </Text>
        </Pressable>
      </View>

      <AsyncState
        isLoading={isLoading}
        isError={isError}
        errorMessage={t(HEALTH_LABELS.serviceReminders.error)}
        onRetry={onRetry}
        isEmpty={viewModels.length === 0}
        emptyMessage={t(HEALTH_LABELS.serviceReminders.empty)}
      >
        <View style={styles.list}>
          {viewModels.map((item) => (
            <ServiceItemCard key={item.id} item={item} onPress={setSelectedItem} />
          ))}
        </View>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>{t(HEALTH_LABELS.serviceReminders.runningTotal)}</Text>
          <Text style={styles.totalValue}>{formatCurrency(runningTotalCents, language)}</Text>
        </View>
      </AsyncState>

      <ServiceItemDetailSheet
        item={selectedItem}
        unit={unit}
        currentOdometerKm={vehicle.current_odometer_km}
        onClose={() => setSelectedItem(null)}
        isMarking={isMarkingDone}
        onMarkDone={(priceCents) => {
          if (!selectedItem) return;
          onMarkDone(selectedItem, priceCents);
          setSelectedItem(null);
        }}
        isUpdatingItem={isUpdatingItem}
        onUpdateItem={(patch) => {
          if (!selectedItem) return;
          // Deliberately do NOT close the sheet here (unlike onMarkDone above) — the sheet now
          // has several independently-editable fields (interval, last-service, price), and
          // closing after every single save would be disruptive (DEMO_FEEDBACK_004 #3).
          onUpdateItem(selectedItem, patch);
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
