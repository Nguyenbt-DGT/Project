import { StyleSheet, Text, View } from 'react-native';

import { COLORS, RADIUS, SPACING } from './theme';

interface StatTileProps {
  label: string;
  value: string;
  /** Optional accent color for the value (e.g. a status color) — defaults to primary ink. */
  valueColor?: string;
}

/** A single-headline stat (odometer, today's distance, spend total) — per the dataviz skill, a
 * lone number is a stat tile, not a chart. */
export function StatTile({ label, value, valueColor }: StatTileProps) {
  return (
    <View style={styles.tile}>
      <Text style={[styles.value, valueColor ? { color: valueColor } : null]}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  tile: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.sm,
    alignItems: 'center',
    gap: 2,
  },
  value: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.ink,
  },
  label: {
    fontSize: 11,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    color: COLORS.inkFaint,
  },
});
