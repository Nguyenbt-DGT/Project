import { StyleSheet, Text, View } from 'react-native';

import { useT } from '../i18n';
import { HEALTH_LABELS } from '../logic/labels';
import { formatDistance, type DistanceUnit } from '../logic/units';
import { AsyncState } from './async-state';
import { StatTile } from './stat-tile';
import { COLORS, SPACING } from './theme';

interface LiveVitalsSectionProps {
  currentOdometerKm: number;
  todaysDistanceKm: number | undefined;
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
  unit: DistanceUnit;
}

/** Live Vitals — lowest-emphasis Health section (HEALTH_REQ §3). Today's distance sums whatever
 * trips were already recorded today; live GPS recording is MAP_TRACKING's flow (deferred here per
 * D-HEALTH-MVP-SCOPE), so a "coming soon" note is shown alongside the read-only figures. */
export function LiveVitalsSection({
  currentOdometerKm,
  todaysDistanceKm,
  isLoading,
  isError,
  onRetry,
  unit,
}: LiveVitalsSectionProps) {
  const t = useT();
  return (
    <View style={styles.section}>
      <Text style={styles.title}>{t(HEALTH_LABELS.liveVitals.title)}</Text>
      <AsyncState isLoading={isLoading} isError={isError} onRetry={onRetry} isEmpty={false}>
        <View style={styles.row}>
          <StatTile
            label={t(HEALTH_LABELS.liveVitals.odometer)}
            value={formatDistance(currentOdometerKm, unit)}
          />
          <StatTile
            label={t(HEALTH_LABELS.liveVitals.todaysDistance)}
            value={formatDistance(todaysDistanceKm ?? 0, unit)}
          />
        </View>
      </AsyncState>
      <Text style={styles.note}>{t(HEALTH_LABELS.liveVitals.gpsComingSoon)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: SPACING.sm,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.inkMuted,
  },
  row: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  note: {
    fontSize: 11,
    color: COLORS.inkFaint,
    fontStyle: 'italic',
  },
});
