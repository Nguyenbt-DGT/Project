import Ionicons from '@expo/vector-icons/Ionicons';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { COLORS, RADIUS, SPACING, STATUS_PALETTE } from '@/theme';

import type { OverduePart } from '../logic/overdue-parts';

interface OverduePartsCardProps {
  parts: OverduePart[];
}

/** Max rows visible before the list scrolls internally instead of growing the page
 * (DEMO_FEEDBACK_005 #7: "if more than 3 options, please implement the scroll function"). */
const VISIBLE_ROWS = 3;
const ROW_HEIGHT = 56;

/**
 * Home's overdue-parts warning (HOME_REQ.md / Home-4th-session.png mockup, DEMO_FEEDBACK_005 #7).
 * Renders nothing when there's nothing overdue. Worst-first order comes from
 * `computeOverdueParts`; this component only lays the rows out.
 */
export function OverduePartsCard({ parts }: OverduePartsCardProps) {
  if (parts.length === 0) return null;

  const rows = parts.map((part) => (
    <View key={part.id} style={styles.row}>
      <Ionicons name="warning" size={18} color={STATUS_PALETTE.overdue} style={styles.icon} />
      <View style={styles.rowText}>
        <Text style={styles.rowName}>{part.name}</Text>
        <Text style={styles.rowMessage}>{part.message}</Text>
      </View>
    </View>
  ));

  return (
    <View style={styles.card}>
      {parts.length > VISIBLE_ROWS ? (
        <ScrollView style={styles.scroll} nestedScrollEnabled showsVerticalScrollIndicator>
          {rows}
        </ScrollView>
      ) : (
        rows
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: STATUS_PALETTE.overdue + '1a', // ~10% alpha tint of the overdue color
    borderWidth: 1,
    borderColor: STATUS_PALETTE.overdue,
    borderRadius: RADIUS.md,
    padding: SPACING.sm,
  },
  scroll: {
    maxHeight: ROW_HEIGHT * VISIBLE_ROWS,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.sm,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.xs,
  },
  icon: {
    marginTop: 2,
  },
  rowText: {
    flex: 1,
    gap: 2,
  },
  rowName: {
    color: STATUS_PALETTE.overdue,
    fontWeight: '700',
    fontSize: 14,
    textTransform: 'uppercase',
  },
  rowMessage: {
    color: COLORS.ink,
    fontSize: 13,
  },
});
