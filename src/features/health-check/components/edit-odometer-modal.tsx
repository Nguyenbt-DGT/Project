import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { useT } from '../i18n';
import { HEALTH_LABELS } from '../logic/labels';
import { formatDistance, roundKmForStorage, type DistanceUnit } from '../logic/units';
import { COLORS, RADIUS, SPACING, STATUS_COLORS } from './theme';

interface EditOdometerModalProps {
  visible: boolean;
  currentOdometerKm: number;
  unit: DistanceUnit;
  onClose: () => void;
  onSave: (valueKm: number) => void;
  isSaving: boolean;
}

/** Manual "edit odometer" control (HEALTH_REQ §4.2, D-OQ-H1-ODOMETER-SOURCE). Entered in the
 * vehicle's display unit; converted + rounded to whole km before being sent to `set_odometer`
 * (D-UNIT-ROUNDING). */
export function EditOdometerModal({
  visible,
  currentOdometerKm,
  unit,
  onClose,
  onSave,
  isSaving,
}: EditOdometerModalProps) {
  const t = useT();
  const [input, setInput] = useState('');
  const [error, setError] = useState(false);

  if (!visible) {
    return null;
  }

  const handleSave = () => {
    const trimmed = input.trim();
    const entered = Number(trimmed);
    if (trimmed === '' || !Number.isFinite(entered) || entered < 0) {
      setError(true);
      return;
    }
    setError(false);
    const valueKm = unit === 'mi' ? roundKmForStorage(entered) : Math.round(entered);
    onSave(valueKm);
  };

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      {/* DEMO_FEEDBACK_003 #2: keep the input reachable above the keyboard. */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.overlay}
      >
        <View style={styles.card}>
          <Text style={styles.title}>{t(HEALTH_LABELS.editOdometer.title)}</Text>
          <Text style={styles.currentValue}>
            {t(HEALTH_LABELS.liveVitals.odometer)}: {formatDistance(currentOdometerKm, unit)}
          </Text>
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>
              {t(HEALTH_LABELS.editOdometer.inputLabel)} ({unit})
            </Text>
            <TextInput
              style={[styles.input, error ? styles.inputError : null]}
              keyboardType="numeric"
              value={input}
              onChangeText={(text) => {
                setInput(text);
                setError(false);
              }}
              placeholder={String(
                Math.round(unit === 'mi' ? currentOdometerKm * 0.621371 : currentOdometerKm)
              )}
            />
            {error ? (
              <Text style={styles.errorText}>{t(HEALTH_LABELS.editOdometer.error)}</Text>
            ) : null}
          </View>
          <View style={styles.actions}>
            <Pressable style={styles.ghostButton} onPress={onClose} accessibilityRole="button">
              <Text style={styles.ghostButtonText}>{t(HEALTH_LABELS.common.cancel)}</Text>
            </Pressable>
            <Pressable
              style={[styles.primaryButton, isSaving ? styles.primaryButtonDisabled : null]}
              onPress={handleSave}
              disabled={isSaving}
              accessibilityRole="button"
            >
              <Text style={styles.primaryButtonText}>
                {isSaving ? t(HEALTH_LABELS.common.loading) : t(HEALTH_LABELS.common.save)}
              </Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    padding: SPACING.lg,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    gap: SPACING.md,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.ink,
  },
  currentValue: {
    fontSize: 13,
    color: COLORS.inkMuted,
  },
  field: {
    gap: SPACING.xs,
  },
  fieldLabel: {
    fontSize: 12,
    color: COLORS.inkMuted,
    textTransform: 'uppercase',
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.borderStrong,
    borderRadius: RADIUS.sm,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    fontSize: 16,
    color: COLORS.ink,
  },
  inputError: {
    borderColor: STATUS_COLORS.overdue,
  },
  errorText: {
    color: STATUS_COLORS.overdue,
    fontSize: 12,
  },
  actions: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  ghostButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: COLORS.borderStrong,
    borderRadius: RADIUS.sm,
    paddingVertical: SPACING.sm,
    alignItems: 'center',
  },
  ghostButtonText: {
    color: COLORS.ink,
    fontWeight: '600',
  },
  primaryButton: {
    flex: 1,
    backgroundColor: COLORS.accent,
    borderRadius: RADIUS.sm,
    paddingVertical: SPACING.sm,
    alignItems: 'center',
  },
  primaryButtonDisabled: {
    opacity: 0.6,
  },
  primaryButtonText: {
    color: COLORS.accentInk,
    fontWeight: '700',
  },
});
