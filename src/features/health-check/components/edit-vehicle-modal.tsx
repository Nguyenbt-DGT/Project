import { useState } from 'react';
import Ionicons from '@expo/vector-icons/Ionicons';
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

import { useBikeCatalog } from '../api';
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
 * odometer has its own dedicated editor (EditOdometerModal).
 *
 * Brand and name are now cascading dropdowns sourced from the shared `bike_catalog` reference
 * table ("since we have database now" — DEMO_FEEDBACK_005 mid-turn request), falling back to free
 * text via an "Other" option since the catalog is a small curated sample (D-OQ-H4), not full brand
 * coverage — a strict dropdown-only field would otherwise trap any user whose bike isn't one of
 * the ~4 seeded rows. */
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

  const catalogQuery = useBikeCatalog();
  const catalog = catalogQuery.data ?? [];
  const brandOptions = Array.from(new Set(catalog.map((row) => row.brand))).sort();
  const nameOptions = Array.from(
    new Set(catalog.filter((row) => row.brand === brand).map((row) => row.bike))
  ).sort();

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
              <Text style={styles.fieldLabel}>{t(HEALTH_LABELS.onboarding.brandLabel)}</Text>
              <SelectField
                value={brand}
                options={brandOptions}
                otherLabel={t(HEALTH_LABELS.vehicleEdit.otherOption)}
                placeholder={t(HEALTH_LABELS.onboarding.brandPlaceholder)}
                onSelect={setBrand}
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.fieldLabel}>{t(HEALTH_LABELS.onboarding.nameLabel)}</Text>
              <SelectField
                value={name}
                options={nameOptions}
                otherLabel={t(HEALTH_LABELS.vehicleEdit.otherOption)}
                placeholder={t(HEALTH_LABELS.onboarding.namePlaceholder)}
                onSelect={(text) => {
                  setName(text);
                  setError(false);
                }}
              />
              {error ? (
                <Text style={styles.errorText}>{t(HEALTH_LABELS.vehicleEdit.validation)}</Text>
              ) : null}
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

interface SelectFieldProps {
  value: string;
  options: string[];
  otherLabel: string;
  placeholder: string;
  onSelect: (value: string) => void;
}

/** A dropdown backed by `options`, with a free-text "Other" fallback — shared shape behind the
 * brand/name selectors above. Starts in free-text mode when the current value doesn't match any
 * option (e.g. a bike outside the small curated catalog), so existing custom entries aren't
 * clobbered on open. */
function SelectField({ value, options, otherLabel, placeholder, onSelect }: SelectFieldProps) {
  const [expanded, setExpanded] = useState(false);
  const [mode, setMode] = useState<'select' | 'custom'>(
    value !== '' && !options.includes(value) ? 'custom' : 'select'
  );

  if (mode === 'custom') {
    return (
      <View style={styles.inlineRow}>
        <TextInput
          style={[styles.input, styles.inlineInput]}
          value={value}
          onChangeText={onSelect}
          placeholder={placeholder}
          placeholderTextColor={COLORS.inkFaint}
        />
        {options.length > 0 ? (
          <Pressable onPress={() => setMode('select')} accessibilityRole="button" hitSlop={8}>
            <Ionicons name="list" size={20} color={COLORS.accent} />
          </Pressable>
        ) : null}
      </View>
    );
  }

  return (
    <View>
      <Pressable
        style={styles.selectTrigger}
        onPress={() => setExpanded((prev) => !prev)}
        accessibilityRole="button"
      >
        <Text style={value ? styles.selectValue : styles.selectPlaceholder}>
          {value || placeholder}
        </Text>
        <Ionicons
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={16}
          color={COLORS.inkMuted}
        />
      </Pressable>
      {expanded ? (
        <View style={styles.optionsList}>
          {options.map((option) => (
            <Pressable
              key={option}
              style={styles.optionRow}
              onPress={() => {
                onSelect(option);
                setExpanded(false);
              }}
              accessibilityRole="button"
            >
              <Text style={option === value ? styles.optionTextActive : styles.optionText}>
                {option}
              </Text>
            </Pressable>
          ))}
          <Pressable
            style={styles.optionRow}
            onPress={() => {
              setMode('custom');
              setExpanded(false);
            }}
            accessibilityRole="button"
          >
            <Text style={styles.optionTextOther}>{otherLabel}</Text>
          </Pressable>
        </View>
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
  errorText: {
    color: COLORS.accentStrong,
    fontSize: 12,
  },
  inlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  inlineInput: {
    flex: 1,
  },
  selectTrigger: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.borderStrong,
    borderRadius: RADIUS.sm,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  selectValue: {
    fontSize: 16,
    color: COLORS.ink,
  },
  selectPlaceholder: {
    fontSize: 16,
    color: COLORS.inkFaint,
  },
  optionsList: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.sm,
    marginTop: SPACING.xs,
    overflow: 'hidden',
  },
  optionRow: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  optionText: {
    color: COLORS.ink,
    fontSize: 15,
  },
  optionTextActive: {
    color: COLORS.accent,
    fontSize: 15,
    fontWeight: '700',
  },
  optionTextOther: {
    color: COLORS.inkMuted,
    fontSize: 15,
    fontStyle: 'italic',
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
