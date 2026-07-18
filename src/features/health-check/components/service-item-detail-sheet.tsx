import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { useT } from '../i18n';
import { HEALTH_LABELS } from '../logic/labels';
import type { MetricStatus } from '../logic/status';
import { formatDistance, kmToMi, roundKmForStorage, type DistanceUnit } from '../logic/units';
import type { ServiceItemViewModel } from '../types';
import { COLORS, RADIUS, SPACING, STATUS_COLORS } from './theme';

interface ServiceItemDetailSheetProps {
  item: ServiceItemViewModel | null;
  unit: DistanceUnit;
  /** Vehicle's current odometer (km) — upper bound for the "last service" checkpoint. */
  currentOdometerKm: number;
  onClose: () => void;
  onMarkDone: (priceCents: number | undefined) => void;
  isMarking: boolean;
  /** DEMO_FEEDBACK_002 #2: set the km checkpoint the next service is counted from. */
  onSetLastService: (lastServiceKm: number) => void;
  isSettingLastService: boolean;
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

/** "Basic" detail view per D-HEALTH-MVP-SCOPE, plus mark-as-replaced (AC-2) and a "Last service"
 * checkpoint editor for km-based items (DEMO_FEEDBACK_002 #2). */
export function ServiceItemDetailSheet({
  item,
  unit,
  currentOdometerKm,
  onClose,
  onMarkDone,
  isMarking,
  onSetLastService,
  isSettingLastService,
}: ServiceItemDetailSheetProps) {
  const t = useT();
  const [priceInput, setPriceInput] = useState('');
  const [lastServiceInput, setLastServiceInput] = useState('');
  const [lastServiceError, setLastServiceError] = useState(false);

  if (!item) {
    return null;
  }

  const lastServiceKm = formatLastServiceKm(item, unit);
  const lastServiceDate = formatLastServiceDate(item);
  const isKmBased = item.intervalKm != null;

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

  const handleSaveLastService = () => {
    const trimmed = lastServiceInput.trim();
    const entered = Number(trimmed);
    if (trimmed === '' || !Number.isFinite(entered) || entered < 0) {
      setLastServiceError(true);
      return;
    }
    const valueKm = unit === 'mi' ? roundKmForStorage(entered) : Math.round(entered);
    // Can't have serviced the bike at a higher odometer than it currently reads.
    if (valueKm > currentOdometerKm) {
      setLastServiceError(true);
      return;
    }
    setLastServiceError(false);
    onSetLastService(valueKm);
  };

  const lastServicePlaceholder =
    item.lastServiceKm != null
      ? String(unit === 'mi' ? kmToMi(item.lastServiceKm) : item.lastServiceKm)
      : '0';

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      {/* DEMO_FEEDBACK_003 #2: without this, the phone keyboard covers the input fields (and the
       * mark-as-replaced button) instead of the sheet shifting up to make room. Header stays
       * pinned; only the body scrolls, so the sheet never grows taller than the screen. */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.overlay}
      >
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.title}>{item.name}</Text>
            <Pressable
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel={t(HEALTH_LABELS.common.cancel)}
            >
              <Text style={styles.closeText}>{t(HEALTH_LABELS.common.cancel)}</Text>
            </Pressable>
          </View>

          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <StatusPill status={item.status} label={item.displayLabel} />

            <View style={styles.kvList}>
              <KvRow
                label={t(HEALTH_LABELS.detail.interval)}
                value={formatIntervalSummary(item, unit)}
              />
              {lastServiceKm ? (
                <KvRow label={t(HEALTH_LABELS.detail.lastServiceKm)} value={lastServiceKm} />
              ) : null}
              {lastServiceDate ? (
                <KvRow label={t(HEALTH_LABELS.detail.lastServiceAt)} value={lastServiceDate} />
              ) : null}
              <KvRow label={t(HEALTH_LABELS.detail.price)} value={formatCents(item.priceCents)} />
            </View>

            {/* DEMO_FEEDBACK_002 #2: edit the "last service" odometer checkpoint (km items only). */}
            {isKmBased ? (
              <View style={styles.field}>
                <Text style={styles.fieldLabel}>
                  {t(HEALTH_LABELS.detail.setLastServiceLabel)} ({unit})
                </Text>
                <View style={styles.inlineRow}>
                  <TextInput
                    style={[
                      styles.input,
                      styles.inlineInput,
                      lastServiceError ? styles.inputError : null,
                    ]}
                    keyboardType="numeric"
                    placeholder={lastServicePlaceholder}
                    placeholderTextColor={COLORS.inkFaint}
                    value={lastServiceInput}
                    onChangeText={(text) => {
                      setLastServiceInput(text);
                      setLastServiceError(false);
                    }}
                  />
                  <Pressable
                    style={[
                      styles.secondaryButton,
                      isSettingLastService ? styles.buttonDisabled : null,
                    ]}
                    onPress={handleSaveLastService}
                    disabled={isSettingLastService}
                    accessibilityRole="button"
                  >
                    <Text style={styles.secondaryButtonText}>
                      {isSettingLastService
                        ? t(HEALTH_LABELS.common.loading)
                        : t(HEALTH_LABELS.detail.setLastServiceSave)}
                    </Text>
                  </Pressable>
                </View>
                {lastServiceError ? (
                  <Text style={styles.errorText}>
                    {t(HEALTH_LABELS.detail.setLastServiceError)}
                  </Text>
                ) : (
                  <Text style={styles.helpText}>{t(HEALTH_LABELS.detail.setLastServiceHelp)}</Text>
                )}
              </View>
            ) : null}

            <View style={styles.field}>
              <Text style={styles.fieldLabel}>{t(HEALTH_LABELS.detail.priceInputLabel)}</Text>
              <TextInput
                style={styles.input}
                keyboardType="decimal-pad"
                placeholder={t(HEALTH_LABELS.detail.pricePlaceholder)}
                placeholderTextColor={COLORS.inkFaint}
                value={priceInput}
                onChangeText={setPriceInput}
              />
            </View>

            <Pressable
              style={[styles.primaryButton, isMarking ? styles.buttonDisabled : null]}
              onPress={handleMarkDone}
              disabled={isMarking}
              accessibilityRole="button"
            >
              <Text style={styles.primaryButtonText}>
                {isMarking
                  ? t(HEALTH_LABELS.common.loading)
                  : t(HEALTH_LABELS.serviceReminders.markAsReplaced)}
              </Text>
            </Pressable>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
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
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: SPACING.lg,
    // Bounded so the ScrollView below has room to work with once the keyboard is up, instead of
    // the sheet trying to grow past the visible screen.
    maxHeight: '90%',
  },
  scrollContent: {
    gap: SPACING.md,
    paddingTop: SPACING.md,
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
    color: COLORS.accentInk,
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
  inlineRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    alignItems: 'center',
  },
  inlineInput: {
    flex: 1,
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
  inputError: {
    borderColor: STATUS_COLORS.overdue,
  },
  errorText: {
    color: STATUS_COLORS.overdue,
    fontSize: 12,
  },
  helpText: {
    color: COLORS.inkFaint,
    fontSize: 12,
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: COLORS.accent,
    borderRadius: RADIUS.sm,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  secondaryButtonText: {
    color: COLORS.accent,
    fontWeight: '700',
    fontSize: 13,
  },
  primaryButton: {
    backgroundColor: COLORS.accent,
    borderRadius: RADIUS.sm,
    paddingVertical: SPACING.md,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  primaryButtonText: {
    color: COLORS.accentInk,
    fontWeight: '700',
    fontSize: 15,
  },
});
