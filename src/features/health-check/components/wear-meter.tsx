import { StyleSheet, View } from 'react-native';

import type { MetricStatus } from '../logic/status';
import { COLORS, STATUS_COLORS } from './theme';

interface WearMeterProps {
  status: MetricStatus;
  /** 0..1, already clamped by the caller (types.ts#toServiceItemViewModel). */
  progressClamped: number;
}

/** Thin, rounded-end progress bar colored by wear status (D-STATUS-BOUNDARIES: renders 0-100%
 * only — the caller is responsible for clamping progress before it reaches this component). */
export function WearMeter({ status, progressClamped }: WearMeterProps) {
  const widthPercent = `${Math.round(progressClamped * 100)}%` as const;

  return (
    <View
      style={styles.track}
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: Math.round(progressClamped * 100) }}
    >
      <View
        style={[styles.fill, { width: widthPercent, backgroundColor: STATUS_COLORS[status] }]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.surfaceMuted,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 4,
    minWidth: 6,
  },
});
