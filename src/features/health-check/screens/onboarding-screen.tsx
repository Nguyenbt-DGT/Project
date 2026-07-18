import { useState } from 'react';
import { router } from 'expo-router';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { useLanguage, type Language } from '@/i18n';
import { COLORS, RADIUS, SPACING } from '@/theme';

import { useOnboardVehicle, usePartTypeDefaults } from '../api';
import { useT } from '../i18n';
import { HEALTH_LABELS } from '../logic/labels';
import { resolvePartName } from '../logic/part-names';
import { roundKmForStorage, type DistanceUnit } from '../logic/units';

/**
 * First-login onboarding (GLOBAL_REQ §2 / DEMO_FEEDBACK_001 #2): choose language, enter bike info,
 * and tick recently-changed parts. Submitting calls the `onboard_vehicle` RPC, which creates the
 * vehicle + its service items; index.tsx then routes to the Health tab once a vehicle exists.
 * The language picker is bound to the app-wide language (DEMO_FEEDBACK_002 #1), so the whole
 * screen re-renders in the chosen language immediately.
 */
export function OnboardingScreen() {
  const { language, setLanguage } = useLanguage();
  const t = useT();
  const [name, setName] = useState('');
  const [brand, setBrand] = useState('');
  const [mileage, setMileage] = useState('');
  const [unit, setUnit] = useState<DistanceUnit>('km');
  const [recentlyChanged, setRecentlyChanged] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);

  const partTypes = usePartTypeDefaults();
  const onboard = useOnboardVehicle();

  const toggle = (typeKey: string) =>
    setRecentlyChanged((prev) => ({ ...prev, [typeKey]: !prev[typeKey] }));

  const onSubmit = () => {
    const trimmedName = name.trim();
    const mileageNum = Number(mileage.trim());
    if (trimmedName === '' || !Number.isFinite(mileageNum) || mileageNum < 0) {
      setError(t(HEALTH_LABELS.onboarding.validation));
      return;
    }
    setError(null);
    const currentOdometerKm =
      unit === 'mi' ? roundKmForStorage(mileageNum) : Math.round(mileageNum);
    const recentKeys = Object.keys(recentlyChanged).filter((k) => recentlyChanged[k]);

    onboard.mutate(
      {
        name: trimmedName,
        brand: brand.trim(),
        currentOdometerKm,
        unit,
        recentlyChanged: recentKeys,
      },
      {
        onSuccess: () => router.replace('/(tabs)/health-check'),
        onError: () => setError(t(HEALTH_LABELS.onboarding.error)),
      }
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.brand}>{t(HEALTH_LABELS.onboarding.brand)}</Text>
        <Text style={styles.title}>{t(HEALTH_LABELS.onboarding.title)}</Text>
        <Text style={styles.subtitle}>{t(HEALTH_LABELS.onboarding.subtitle)}</Text>

        <Text style={styles.fieldLabel}>{t(HEALTH_LABELS.onboarding.language)}</Text>
        <SegmentedRow<Language>
          options={[
            { value: 'en', label: 'English' },
            { value: 'vi', label: 'Tiếng Việt' },
          ]}
          selected={language}
          onSelect={setLanguage}
        />

        <Text style={styles.fieldLabel}>{t(HEALTH_LABELS.onboarding.nameLabel)}</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder={t(HEALTH_LABELS.onboarding.namePlaceholder)}
          placeholderTextColor={COLORS.inkFaint}
        />

        <Text style={styles.fieldLabel}>{t(HEALTH_LABELS.onboarding.brandLabel)}</Text>
        <TextInput
          style={styles.input}
          value={brand}
          onChangeText={setBrand}
          placeholder={t(HEALTH_LABELS.onboarding.brandPlaceholder)}
          placeholderTextColor={COLORS.inkFaint}
        />

        <Text style={styles.fieldLabel}>{t(HEALTH_LABELS.onboarding.mileageLabel)}</Text>
        <View style={styles.mileageRow}>
          <TextInput
            style={[styles.input, styles.mileageInput]}
            value={mileage}
            onChangeText={setMileage}
            keyboardType="numeric"
            placeholder="0"
            placeholderTextColor={COLORS.inkFaint}
          />
          <SegmentedRow<DistanceUnit>
            options={[
              { value: 'km', label: 'km' },
              { value: 'mi', label: 'mi' },
            ]}
            selected={unit}
            onSelect={setUnit}
            compact
          />
        </View>

        <Text style={styles.fieldLabel}>{t(HEALTH_LABELS.onboarding.recentlyChanged)}</Text>
        <Text style={styles.hint}>{t(HEALTH_LABELS.onboarding.recentlyChangedHint)}</Text>
        <View style={styles.checkList}>
          {(partTypes.data ?? []).map((part) => {
            const checked = !!recentlyChanged[part.type_key];
            return (
              <Pressable
                key={part.type_key}
                style={styles.checkRow}
                onPress={() => toggle(part.type_key)}
                accessibilityRole="checkbox"
                accessibilityState={{ checked }}
              >
                <View style={[styles.checkbox, checked ? styles.checkboxChecked : null]}>
                  {checked ? <Text style={styles.checkboxMark}>✓</Text> : null}
                </View>
                <Text style={styles.checkLabel}>
                  {resolvePartName(part.type_key, part.name, language)}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Pressable
          style={[styles.submit, onboard.isPending ? styles.submitDisabled : null]}
          onPress={onSubmit}
          disabled={onboard.isPending}
          accessibilityRole="button"
        >
          {onboard.isPending ? (
            <ActivityIndicator color={COLORS.accentInk} />
          ) : (
            <Text style={styles.submitText}>{t(HEALTH_LABELS.onboarding.submit)}</Text>
          )}
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

interface SegmentedOption<T> {
  value: T;
  label: string;
}

function SegmentedRow<T extends string>({
  options,
  selected,
  onSelect,
  compact,
}: {
  options: SegmentedOption<T>[];
  selected: T;
  onSelect: (value: T) => void;
  compact?: boolean;
}) {
  return (
    <View style={[styles.segmented, compact ? styles.segmentedCompact : null]}>
      {options.map((option) => {
        const active = option.value === selected;
        return (
          <Pressable
            key={option.value}
            style={[styles.segment, active ? styles.segmentActive : null]}
            onPress={() => onSelect(option.value)}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
          >
            <Text style={[styles.segmentText, active ? styles.segmentTextActive : null]}>
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.bg },
  content: { padding: SPACING.xl, gap: SPACING.sm },
  brand: { fontSize: 12, letterSpacing: 3, color: COLORS.accent, fontWeight: '700' },
  title: { fontSize: 26, fontWeight: '700', color: COLORS.ink },
  subtitle: { fontSize: 14, color: COLORS.inkMuted, marginBottom: SPACING.md },
  fieldLabel: {
    fontSize: 12,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    color: COLORS.inkFaint,
    marginTop: SPACING.md,
  },
  hint: { fontSize: 12, color: COLORS.inkMuted },
  input: {
    borderWidth: 1,
    borderColor: COLORS.borderStrong,
    borderRadius: RADIUS.sm,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    fontSize: 16,
    color: COLORS.ink,
    backgroundColor: COLORS.surface,
  },
  mileageRow: { flexDirection: 'row', gap: SPACING.sm, alignItems: 'center' },
  mileageInput: { flex: 1 },
  segmented: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.sm,
    padding: 2,
    gap: 2,
  },
  segmentedCompact: { alignSelf: 'flex-start' },
  segment: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.sm - 2,
    alignItems: 'center',
    flexGrow: 1,
  },
  segmentActive: { backgroundColor: COLORS.accent },
  segmentText: { color: COLORS.inkMuted, fontWeight: '600', fontSize: 14 },
  segmentTextActive: { color: COLORS.accentInk },
  checkList: { gap: SPACING.xs, marginTop: SPACING.xs },
  checkRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, paddingVertical: 6 },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: COLORS.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: { backgroundColor: COLORS.accent, borderColor: COLORS.accent },
  checkboxMark: { color: COLORS.accentInk, fontSize: 14, fontWeight: '900' },
  checkLabel: { color: COLORS.ink, fontSize: 15 },
  error: { color: COLORS.accentStrong, fontSize: 13, marginTop: SPACING.sm },
  submit: {
    backgroundColor: COLORS.accent,
    borderRadius: RADIUS.sm,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    marginTop: SPACING.lg,
  },
  submitDisabled: { opacity: 0.6 },
  submitText: { color: COLORS.accentInk, fontWeight: '700', fontSize: 16 },
});
