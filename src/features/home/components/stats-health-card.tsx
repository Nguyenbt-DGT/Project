import { Pressable, StyleSheet, Text, View } from 'react-native';

import { COLORS, RADIUS, SPACING, STATUS_PALETTE } from '@/theme';
import { formatDistance, type DistanceUnit } from '@/features/health-check/logic/units';
import type { MetricStatus } from '@/features/health-check/logic/status';

import { HealthRing } from './health-ring';
import { useT } from '../i18n';
import { HOME_LABELS } from '../logic/labels';

interface StatsHealthCardProps {
  totalDistanceKm: number;
  monthDistanceKm: number;
  healthScore: number;
  healthStatus: MetricStatus;
  unit: DistanceUnit;
  onPress: () => void;
}

/**
 * Home's merged "session 2+3" (HOME_REQ.md §4 — the mockup's separate Total-Distance and
 * Bike-Health cards become one tappable card here). Tapping navigates to the Health tab. The score
 * renders as a true SVG progress ring (`HealthRing`) matching the mockup — see D-HOME-HEALTH-SCORE
 * for the formula/wording, and its follow-up note reversing the earlier flat-circle simplification.
 */
export function StatsHealthCard({
  totalDistanceKm,
  monthDistanceKm,
  healthScore,
  healthStatus,
  unit,
  onPress,
}: StatsHealthCardProps) {
  const t = useT();
  const statusMessage = t(HOME_LABELS.statusMessage[healthStatus]);

  return (
    <Pressable style={styles.card} onPress={onPress} accessibilityRole="button">
      <View style={styles.distanceRow}>
        <View>
          <Text style={styles.distanceLabel}>{t(HOME_LABELS.stats.totalDistance)}</Text>
          <Text style={styles.distanceValue}>{formatDistance(totalDistanceKm, unit)}</Text>
        </View>
        <View style={styles.monthBlock}>
          <Text style={styles.distanceLabel}>{t(HOME_LABELS.stats.thisMonth)}</Text>
          <Text style={styles.monthValue}>{formatDistance(monthDistanceKm, unit)}</Text>
        </View>
      </View>

      <View style={styles.divider} />

      <View style={styles.healthRow}>
        <HealthRing score={healthScore} color={STATUS_PALETTE[healthStatus]} />
        <View style={styles.healthTextBlock}>
          <Text style={styles.healthTitle}>{t(HOME_LABELS.stats.bikeHealth)}</Text>
          <Text style={styles.healthMessage}>{statusMessage}</Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    gap: SPACING.md,
  },
  distanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  monthBlock: {
    alignItems: 'flex-end',
  },
  distanceLabel: {
    fontSize: 11,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    color: COLORS.inkFaint,
    marginBottom: 2,
  },
  distanceValue: {
    color: COLORS.accent,
    fontSize: 28,
    fontWeight: '700',
  },
  monthValue: {
    color: COLORS.ink,
    fontSize: 16,
    fontWeight: '700',
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
  },
  healthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  healthTextBlock: {
    flex: 1,
    gap: 2,
  },
  healthTitle: {
    color: COLORS.ink,
    fontWeight: '700',
    fontSize: 15,
  },
  healthMessage: {
    color: COLORS.inkMuted,
    fontSize: 13,
  },
});
