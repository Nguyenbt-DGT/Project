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
import type { DistanceUnit } from '../logic/units';
import { COLORS, RADIUS, SPACING } from './theme';

interface EditVehicleModalProps {
  visible: boolean;
  currentName: string;
  currentBrand: string;
  currentUnit: DistanceUnit;
  onClose: () => void;
  onSave: (input: { name: string; brand: string; unit: DistanceUnit }) => void;
  isSaving: boolean;
}

/** Persistent "edit vehicle profile" entry point (DEMO_FEEDBACK_003 #4) — reachable at any time
 * from the Health header, not just at first-login onboarding. Edits name/brand/unit only; the
 * odometer has its own dedicated editor (EditOdometerModal). */
export function EditVehicleModal({
  visible,
  currentName,
  currentBrand,
  currentUnit,
  onClose,
  onSave,
  isSaving,
}: EditVehicleModalProps) {
  const t = useT();
  const [name, setName] = useState(currentName);
  const [brand, setBrand] = useState(currentBrand);
  const [unit, setUnit] = useState<DistanceUnit>(currentUnit);
  const [error, setError] = useState(false);

  if (!visible) {
    return null;
  }

  const handleSave = () => {
    const trimmedName = name.trim();
    if (trimmedName === '') {
      setError(true);
      return;
    }
    setError(false);
    onSave({ name: trimmedName, brand: brand.trim(), unit });
  };

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.overlay}
      >
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.title}>{t(HEALTH_LABELS.vehicleEdit.title)}</Text>
            <Pressable onPress={onClose} accessibilityRole="button">
              <Text style={styles.closeText}>{t(HEALTH_LABELS.common.cancel)}</Text>
            </Pressable>
          </View>

          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>{t(HEALTH_LABELS.onboarding.nameLabel)}</Text>
              <TextInput
                style={[styles.input, error ? styles.inputError : null]}
                value={name}
                onChangeText={(text) => {
                  setName(text);
                  setError(false);
                }}
                placeholder={t(HEALTH_LABELS.onboarding.namePlaceholder)}
                placeholderTextColor={COLORS.inkFaint}
              />
              {error ? (
                <Text style={styles.errorText}>{t(HEALTH_LABELS.vehicleEdit.validation)}</Text>
              ) : null}
            </View>

            <View style={styles.field}>
              <Text style={styles.fieldLabel}>{t(HEALTH_LABELS.onboarding.brandLabel)}</Text>
              <TextInput
                style={styles.input}
                value={brand}
                onChangeText={setBrand}
                placeholder={t(HEALTH_LABELS.onboarding.brandPlaceholder)}
                placeholderTextColor={COLORS.inkFaint}
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.fieldLabel}>{t(HEALTH_LABELS.onboarding.unitLabel)}</Text>
              <View style={styles.segmented}>
                {(['km', 'mi'] as const).map((option) => {
                  const active = option === unit;
                  return (
                    <Pressable
                      key={option}
                      style={[styles.segment, active ? styles.segmentActive : null]}
                      onPress={() => setUnit(option)}
                      accessibilityRole="button"
                      accessibilityState={{ selected: active }}
                    >
                      <Text style={[styles.segmentText, active ? styles.segmentTextActive : null]}>
                        {option}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <Pressable
              style={[styles.primaryButton, isSaving ? styles.buttonDisabled : null]}
              onPress={handleSave}
              disabled={isSaving}
              accessibilityRole="button"
            >
              <Text style={styles.primaryButtonText}>
                {isSaving ? t(HEALTH_LABELS.common.loading) : t(HEALTH_LABELS.common.save)}
              </Text>
            </Pressable>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
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
    borderColor: COLORS.accentStrong,
  },
  errorText: {
    color: COLORS.accentStrong,
    fontSize: 12,
  },
  segmented: {
    flexDirection: 'row',
    backgroundColor: COLORS.surfaceMuted,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.sm,
    padding: 2,
    gap: 2,
    alignSelf: 'flex-start',
  },
  segment: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    borderRadius: RADIUS.sm - 2,
  },
  segmentActive: {
    backgroundColor: COLORS.accent,
  },
  segmentText: {
    color: COLORS.inkMuted,
    fontWeight: '600',
    fontSize: 14,
  },
  segmentTextActive: {
    color: COLORS.accentInk,
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
