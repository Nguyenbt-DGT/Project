import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { COLORS } from '@/theme';

const SIZE = 56;
const STROKE_WIDTH = 6;
const RADIUS = (SIZE - STROKE_WIDTH) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

interface HealthRingProps {
  score: number;
  color: string;
}

/**
 * A true SVG progress ring for the Home health score (DEMO_FEEDBACK_005 mid-turn request —
 * supersedes the flat-circle simplification in `D-HOME-HEALTH-SCORE`, now that
 * `react-native-svg` is an accepted dependency). Only the arc itself carries the status color;
 * the center stays the plain background/ink colors so the number reads clearly regardless of
 * status, matching the reference image.
 */
export function HealthRing({ score, color }: HealthRingProps) {
  const clamped = Math.max(0, Math.min(100, score));
  const dashOffset = CIRCUMFERENCE * (1 - clamped / 100);

  return (
    <View style={styles.container}>
      <Svg width={SIZE} height={SIZE} style={styles.svg}>
        <Circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          stroke={COLORS.surfaceMuted}
          strokeWidth={STROKE_WIDTH}
          fill="none"
        />
        <Circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          stroke={color}
          strokeWidth={STROKE_WIDTH}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${CIRCUMFERENCE} ${CIRCUMFERENCE}`}
          strokeDashoffset={dashOffset}
          // Start the arc at 12 o'clock (SVG circles start at 3 o'clock by default).
          rotation={-90}
          originX={SIZE / 2}
          originY={SIZE / 2}
        />
      </Svg>
      <Text style={styles.scoreText}>{score}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: SIZE,
    height: SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  svg: {
    position: 'absolute',
  },
  scoreText: {
    color: COLORS.ink,
    fontWeight: '700',
    fontSize: 16,
  },
});
