import { Image, Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { useLanguage } from '@/i18n';
import { COLORS, RADIUS, SPACING } from '@/theme';
import { formatDistance, type DistanceUnit } from '@/features/health-check/logic/units';

import { useT } from '../i18n';
import { HOME_LABELS } from '../logic/labels';
import { formatNightsAgo } from '../logic/relative-time';

interface VehicleHeroDetailSheetProps {
  visible: boolean;
  name: string;
  brand: string;
  model: string | null;
  photoUrl: string | null;
  lastTripDistanceKm: number | null;
  lastTripAt: string | null;
  unit: DistanceUnit;
  now: Date;
  onClose: () => void;
}

/** Details popup for the hero card (HOME_REQ.md §3.1.1 — "tap to view a pop up, displays the
 * details of this session"). Read-only; editing the vehicle profile stays on the Health tab's
 * dedicated entry point (DEMO_FEEDBACK_003 #4). */
export function VehicleHeroDetailSheet({
  visible,
  name,
  brand,
  model,
  photoUrl,
  lastTripDistanceKm,
  lastTripAt,
  unit,
  now,
  onClose,
}: VehicleHeroDetailSheetProps) {
  const t = useT();
  const { language } = useLanguage();
  if (!visible) return null;

  const rideCaption =
    lastTripDistanceKm != null && lastTripAt != null
      ? `${formatDistance(lastTripDistanceKm, unit)} · ${formatNightsAgo(new Date(lastTripAt), now, language)}`
      : t(HOME_LABELS.hero.noRides);

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.title}>{t(HOME_LABELS.hero.detailTitle)}</Text>
            <Pressable onPress={onClose} accessibilityRole="button">
              <Text style={styles.closeText}>{t(HOME_LABELS.common.close)}</Text>
            </Pressable>
          </View>

          {photoUrl ? (
            <Image source={{ uri: photoUrl }} style={styles.photo} resizeMode="cover" />
          ) : null}

          <View style={styles.kvList}>
            <KvRow label={t(HOME_LABELS.hero.brandLabel)} value={brand || '—'} />
            {model ? <KvRow label={t(HOME_LABELS.hero.modelLabel)} value={model} /> : null}
            <KvRow label={name} value={rideCaption} />
          </View>
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
  photo: {
    width: '100%',
    height: 160,
    borderRadius: RADIUS.md,
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
});
