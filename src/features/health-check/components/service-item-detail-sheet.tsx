import { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { HEALTH_LABELS } from '../logic/labels';
import type { MetricStatus } from '../logic/status';
import { formatDistance, type DistanceUnit } from '../logic/units';
import type { ServiceItemViewModel } from '../types';
import { COLORS, RADIUS, SPACING, STATUS_COLORS } from './theme';

interface ServiceItemDetailSheetProps {
  item: ServiceItemViewModel | null;
  unit: DistanceUnit;
  onClose: () => void;
  onMarkDone: (priceCents: number | undefined) => void;
  isMarking: boolean;
}

function formatCents(cents: number | null): string {
  if (cents == null) return '—';
  return `$${(cents / 100).toFixed(2)}`;
}

function formatLastServiceKm(item: ServiceItemViewModel, unit: DistanceUnit): string | null {
  if (item.intervalKm == null || item.lastServiceKm == null) return null;
  return formatDistance(item.lastServiceKm, unit);
}

function formatLastServiceDate(item: ServiceItemViewModel): string | null {
  if (item.intervalDays == null || item.lastServiceAt == null) return null;
  return new Date(item.lastServiceAt).toLocaleDateString();
}

function formatIntervalSummary(item: ServiceItemViewModel, unit: DistanceUnit): string {
  const parts: string[] = [];
  if (item.intervalKm != null) parts.push(formatDistance(item.intervalKm, unit));
  if (item.intervalDays != null) parts.push(`${item.intervalDays} days`);
  if (item.intervalEvents != null) parts.push(`every ${item.intervalEvents} events`);
  return parts.length > 0 ? parts.join(' · ') : '—';
}

/** "Basic" detail view per D-HEALTH-MVP-SCOPE: name, interval, last service, price — plus the
 * mark-as-replaced action with an optional price entry (HEALTH_ACCEPTANCE AC-2). Full part
 * history/browsing is out of scope for MVP. */
export function ServiceItemDetailSheet({
  item,
  unit,
  onClose,
  onMarkDone,
  isMarking,
}: ServiceItemDetailSheetProps) {
  const [priceInput, setPriceInput] = useState('');

  if (!item) {
    return null;
  }

  const lastServiceKm = formatLastServiceKm(item, unit);
  const lastServiceDate = formatLastServiceDate(item);

  const handleMarkDone = () => {
    const trimmed = priceInput.trim();
    if (trimmed === '') {
      onMarkDone(undefined);
      return;
    }
    const dollars = Number(trimmed);
    if (!Number.isFinite(dollars) || dollars < 0) {
      onMarkDone(undefined);
      return;
    }
    onMarkDone(Math.round(dollars * 100));
  };

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.title}>{item.name}</Text>
            <Pressable onPress={onClose} accessibilityRole="button" accessibilityLabel={HEALTH_LABELS.common.cancel.fallback}>
              <Text style={styles.closeText}>{HEALTH_LABELS.common.cancel.fallback}</Text>
            </Pressable>
          </View>

          <StatusPill status={item.status} label={item.displayLabel} />

          <View style={styles.kvList}>
            <KvRow label={HEALTH_LABELS.detail.interval.fallback} value={formatIntervalSummary(item, unit)} />
            {lastServiceKm ? (
              <KvRow label={HEALTH_LABELS.detail.lastServiceKm.fallback} value={lastServiceKm} />
            ) : null}
            {lastServiceDate ? (
              <KvRow label={HEALTH_LABELS.detail.lastServiceAt.fallback} value={lastServiceDate} />
            ) : null}
            <KvRow label={HEALTH_LABELS.detail.price.fallback} value={formatCents(item.priceCents)} />
          </View>

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>{HEALTH_LABELS.detail.priceInputLabel.fallback}</Text>
            <TextInput
              style={styles.input}
              keyboardType="decimal-pad"
              placeholder={HEALTH_LABELS.detail.pricePlaceholder.fallback}
              value={priceInput}
              onChangeText={setPriceInput}
            />
          </View>

          <Pressable
            style={[styles.primaryButton, isMarking ? styles.primaryButtonDisabled : null]}
            onPress={handleMarkDone}
            disabled={isMarking}
            accessibilityRole="button"
          >
            <Text style={styles.primaryButtonText}>
              {isMarking ? HEALTH_LABELS.common.loading.fallback : HEALTH_LABELS.serviceReminders.markAsReplaced.fallback}
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

function KvRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.kvRow}>
      <Text style={styles.kvKey}>{label}</Text>
      <Text style={styles.kvValue}>{value}</Text>
    </View>
  );
}

function StatusPill({ status, label }: { status: MetricStatus; label: string }) {
  return (
    <View style={[styles.statusPill, { backgroundColor: STATUS_COLORS[status] }]}>
      <Text style={styles.statusPillText}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(10,16,13,0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: SPACING.lg,
    gap: SPACING.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.ink,
  },
  closeText: {
    color: COLORS.accent,
    fontSize: 14,
  },
  statusPill: {
    alignSelf: 'flex-start',
    borderRadius: 6,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
  },
  statusPillText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12,
  },
  kvList: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    overflow: 'hidden',
  },
  kvRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  kvKey: {
    color: COLORS.inkMuted,
    fontSize: 13,
  },
  kvValue: {
    color: COLORS.ink,
    fontWeight: '600',
    fontSize: 13,
  },
  field: {
    gap: SPACING.xs,
  },
  fieldLabel: {
    fontSize: 12,
    color: COLORS.inkMuted,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.borderStrong,
    borderRadius: RADIUS.sm,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    fontSize: 15,
    color: COLORS.ink,
  },
  primaryButton: {
    backgroundColor: COLORS.accent,
    borderRadius: RADIUS.sm,
    paddingVertical: SPACING.md,
    alignItems: 'center',
  },
  primaryButtonDisabled: {
    opacity: 0.6,
  },
  primaryButtonText: {
    color: COLORS.accentInk,
    fontWeight: '700',
    fontSize: 15,
  },
});
