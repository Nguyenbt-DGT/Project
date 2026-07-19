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

import { useLanguage } from '@/i18n';

import type { ServiceItemPatch } from '../api';
import { useT } from '../i18n';
import { formatCurrency, parseCurrencyToCents } from '../logic/currency';
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
  /** DEMO_FEEDBACK_004 #3: interval, last-service (any axis), and price are all directly editable
   * here via one general patch callback, not just at mark-as-replaced time. */
  onUpdateItem: (patch: ServiceItemPatch) => void;
  isUpdatingItem: boolean;
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

/** How many whole days ago `lastServiceAt` was, for the "last service (days ago)" editor's
 * placeholder — the inverse of how that field is written (now - N days). */
function daysAgo(iso: string): number {
  return Math.round((Date.now() - new Date(iso).getTime()) / 86_400_000);
}

/** "Basic" detail view per D-HEALTH-MVP-SCOPE, extended with mark-as-replaced (AC-2) and direct
 * editors for interval / last-service (any axis) / price (DEMO_FEEDBACK_002 #2, DEMO_FEEDBACK_004
 * #3). */
export function ServiceItemDetailSheet({
  item,
  unit,
  currentOdometerKm,
  onClose,
  onMarkDone,
  isMarking,
  onUpdateItem,
  isUpdatingItem,
}: ServiceItemDetailSheetProps) {
  const t = useT();
  const { language } = useLanguage();
  const [priceInput, setPriceInput] = useState('');

  const [intervalInput, setIntervalInput] = useState('');
  const [intervalError, setIntervalError] = useState(false);

  const [lastServiceKmInput, setLastServiceKmInput] = useState('');
  const [lastServiceKmError, setLastServiceKmError] = useState(false);

  const [lastServiceDaysInput, setLastServiceDaysInput] = useState('');
  const [lastServiceDaysError, setLastServiceDaysError] = useState(false);

  const [lastServiceEventsInput, setLastServiceEventsInput] = useState('');
  const [lastServiceEventsError, setLastServiceEventsError] = useState(false);

  const [editPriceInput, setEditPriceInput] = useState('');
  const [editPriceError, setEditPriceError] = useState(false);

  if (!item) {
    return null;
  }

  const lastServiceKmDisplay = formatLastServiceKm(item, unit);
  const lastServiceDateDisplay = formatLastServiceDate(item);
  const isKmBased = item.intervalKm != null;
  const isDaysBased = item.intervalDays != null;
  const isEventsBased = item.intervalEvents != null;

  const handleMarkDone = () => {
    onMarkDone(parseCurrencyToCents(priceInput, language) ?? undefined);
  };

  const handleSaveInterval = () => {
    const trimmed = intervalInput.trim();
    const entered = Number(trimmed);
    if (trimmed === '' || !Number.isFinite(entered) || entered <= 0) {
      setIntervalError(true);
      return;
    }
    setIntervalError(false);
    if (isKmBased) {
      const valueKm = unit === 'mi' ? roundKmForStorage(entered) : Math.round(entered);
      onUpdateItem({ interval_km: valueKm });
    } else if (isDaysBased) {
      onUpdateItem({ interval_days: Math.round(entered) });
    } else if (isEventsBased) {
      onUpdateItem({ interval_events: Math.round(entered) });
    }
  };

  const handleSaveLastServiceKm = () => {
    const trimmed = lastServiceKmInput.trim();
    const entered = Number(trimmed);
    if (trimmed === '' || !Number.isFinite(entered) || entered < 0) {
      setLastServiceKmError(true);
      return;
    }
    const valueKm = unit === 'mi' ? roundKmForStorage(entered) : Math.round(entered);
    // Can't have serviced the bike at a higher odometer than it currently reads.
    if (valueKm > currentOdometerKm) {
      setLastServiceKmError(true);
      return;
    }
    setLastServiceKmError(false);
    onUpdateItem({ last_service_km: valueKm });
  };

  const handleSaveLastServiceDays = () => {
    const trimmed = lastServiceDaysInput.trim();
    const entered = Number(trimmed);
    if (trimmed === '' || !Number.isFinite(entered) || entered < 0) {
      setLastServiceDaysError(true);
      return;
    }
    setLastServiceDaysError(false);
    const iso = new Date(Date.now() - Math.round(entered) * 86_400_000).toISOString();
    onUpdateItem({ last_service_at: iso });
  };

  const handleSaveLastServiceEvents = () => {
    const trimmed = lastServiceEventsInput.trim();
    const entered = Number(trimmed);
    if (trimmed === '' || !Number.isFinite(entered) || entered < 0) {
      setLastServiceEventsError(true);
      return;
    }
    setLastServiceEventsError(false);
    onUpdateItem({ events_elapsed: Math.round(entered) });
  };

  const handleSavePrice = () => {
    const cents = parseCurrencyToCents(editPriceInput, language);
    if (cents == null) {
      setEditPriceError(true);
      return;
    }
    setEditPriceError(false);
    onUpdateItem({ price_cents: cents });
  };

  const lastServiceKmPlaceholder =
    item.lastServiceKm != null
      ? String(unit === 'mi' ? kmToMi(item.lastServiceKm) : item.lastServiceKm)
      : '0';
  const intervalPlaceholder = isKmBased
    ? String(
        item.intervalKm != null ? (unit === 'mi' ? kmToMi(item.intervalKm) : item.intervalKm) : ''
      )
    : isDaysBased
      ? String(item.intervalDays ?? '')
      : String(item.intervalEvents ?? '');
  const intervalUnitSuffix = isKmBased ? unit : isDaysBased ? 'days' : 'events';

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
              {lastServiceKmDisplay ? (
                <KvRow label={t(HEALTH_LABELS.detail.lastServiceKm)} value={lastServiceKmDisplay} />
              ) : null}
              {lastServiceDateDisplay ? (
                <KvRow
                  label={t(HEALTH_LABELS.detail.lastServiceAt)}
                  value={lastServiceDateDisplay}
                />
              ) : null}
              <KvRow
                label={t(HEALTH_LABELS.detail.price)}
                value={item.priceCents == null ? '—' : formatCurrency(item.priceCents, language)}
              />
            </View>

            {/* DEMO_FEEDBACK_004 #3: edit the service interval directly (whichever axis this item
             * uses). */}
            <EditRow
              label={`${t(HEALTH_LABELS.detail.editIntervalLabel)} (${intervalUnitSuffix})`}
              value={intervalInput}
              placeholder={intervalPlaceholder}
              onChangeText={(text) => {
                setIntervalInput(text);
                setIntervalError(false);
              }}
              onSave={handleSaveInterval}
              isSaving={isUpdatingItem}
              saveLabel={t(HEALTH_LABELS.detail.editIntervalSave)}
              error={intervalError ? t(HEALTH_LABELS.detail.invalidValueError) : null}
            />

            {/* DEMO_FEEDBACK_002 #2 / DEMO_FEEDBACK_004 #3: last-service checkpoint editors, one
             * per axis this item actually uses. */}
            {isKmBased ? (
              <EditRow
                label={`${t(HEALTH_LABELS.detail.setLastServiceLabel)} (${unit})`}
                value={lastServiceKmInput}
                placeholder={lastServiceKmPlaceholder}
                onChangeText={(text) => {
                  setLastServiceKmInput(text);
                  setLastServiceKmError(false);
                }}
                onSave={handleSaveLastServiceKm}
                isSaving={isUpdatingItem}
                saveLabel={t(HEALTH_LABELS.detail.setLastServiceSave)}
                error={lastServiceKmError ? t(HEALTH_LABELS.detail.setLastServiceError) : null}
                help={!lastServiceKmError ? t(HEALTH_LABELS.detail.setLastServiceHelp) : undefined}
              />
            ) : null}

            {isDaysBased ? (
              <EditRow
                label={t(HEALTH_LABELS.detail.lastServiceDaysAgoLabel)}
                value={lastServiceDaysInput}
                placeholder={item.lastServiceAt != null ? String(daysAgo(item.lastServiceAt)) : '0'}
                onChangeText={(text) => {
                  setLastServiceDaysInput(text);
                  setLastServiceDaysError(false);
                }}
                onSave={handleSaveLastServiceDays}
                isSaving={isUpdatingItem}
                saveLabel={t(HEALTH_LABELS.detail.setLastServiceSave)}
                error={lastServiceDaysError ? t(HEALTH_LABELS.detail.invalidValueError) : null}
              />
            ) : null}

            {isEventsBased ? (
              <EditRow
                label={t(HEALTH_LABELS.detail.lastServiceEventsLabel)}
                value={lastServiceEventsInput}
                placeholder={String(item.eventsElapsed)}
                onChangeText={(text) => {
                  setLastServiceEventsInput(text);
                  setLastServiceEventsError(false);
                }}
                onSave={handleSaveLastServiceEvents}
                isSaving={isUpdatingItem}
                saveLabel={t(HEALTH_LABELS.detail.setLastServiceSave)}
                error={lastServiceEventsError ? t(HEALTH_LABELS.detail.invalidValueError) : null}
              />
            ) : null}

            {/* DEMO_FEEDBACK_004 #3: correct the stored price directly (independent of the
             * mark-as-replaced flow below — this does not create a new spend entry). */}
            <EditRow
              label={t(HEALTH_LABELS.detail.editPriceLabel)}
              value={editPriceInput}
              placeholder={t(HEALTH_LABELS.detail.pricePlaceholder)}
              onChangeText={(text) => {
                setEditPriceInput(text);
                setEditPriceError(false);
              }}
              onSave={handleSavePrice}
              isSaving={isUpdatingItem}
              saveLabel={t(HEALTH_LABELS.detail.editPriceSave)}
              error={editPriceError ? t(HEALTH_LABELS.detail.invalidValueError) : null}
            />

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

interface EditRowProps {
  label: string;
  value: string;
  placeholder: string;
  onChangeText: (text: string) => void;
  onSave: () => void;
  isSaving: boolean;
  saveLabel: string;
  error?: string | null;
  help?: string;
}

/** One inline "label + input + Save" editor row, the shared shape behind every direct-edit field
 * in this sheet (interval, last-service per axis, price — DEMO_FEEDBACK_004 #3). */
function EditRow({
  label,
  value,
  placeholder,
  onChangeText,
  onSave,
  isSaving,
  saveLabel,
  error,
  help,
}: EditRowProps) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={styles.inlineRow}>
        <TextInput
          style={[styles.input, styles.inlineInput, error ? styles.inputError : null]}
          keyboardType="numeric"
          placeholder={placeholder}
          placeholderTextColor={COLORS.inkFaint}
          value={value}
          onChangeText={onChangeText}
        />
        <Pressable
          style={[styles.secondaryButton, isSaving ? styles.buttonDisabled : null]}
          onPress={onSave}
          disabled={isSaving}
          accessibilityRole="button"
        >
          <Text style={styles.secondaryButtonText}>{isSaving ? '…' : saveLabel}</Text>
        </Pressable>
      </View>
      {error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : help ? (
        <Text style={styles.helpText}>{help}</Text>
      ) : null}
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
