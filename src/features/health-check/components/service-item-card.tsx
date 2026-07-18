import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useT } from '../i18n';
import { HEALTH_LABELS } from '../logic/labels';
import type { ServiceItemViewModel } from '../types';
import { COLORS, RADIUS, SPACING, STATUS_COLORS, STATUS_SOFT_COLORS } from './theme';
import { WearMeter } from './wear-meter';

interface ServiceItemCardProps {
  item: ServiceItemViewModel;
  onPress: (item: ServiceItemViewModel) => void;
}

/** One Service Reminders card (HEALTH_REQ §4.1): name, ⚠ on overdue, colored wear meter, status
 * message, remaining caption. Tapping opens the basic detail view. */
export function ServiceItemCard({ item, onPress }: ServiceItemCardProps) {
  const t = useT();
  return (
    <Pressable
      style={styles.card}
      onPress={() => onPress(item)}
      accessibilityRole="button"
      accessibilityLabel={`${item.name}, ${item.displayLabel}`}
    >
      <View style={styles.topRow}>
        <View style={styles.nameRow}>
          {item.isOverdue ? (
            <Ionicons
              name="warning"
              size={16}
              color={STATUS_COLORS.overdue}
              accessibilityLabel={t(HEALTH_LABELS.serviceReminders.overdueIcon)}
            />
          ) : null}
          <Text style={styles.name}>{item.name}</Text>
        </View>
        <View style={[styles.badge, { backgroundColor: STATUS_SOFT_COLORS[item.status] }]}>
          <Text style={[styles.badgeText, { color: STATUS_COLORS[item.status] }]}>{item.displayLabel}</Text>
        </View>
      </View>
      <WearMeter status={item.status} progressClamped={item.progressClamped} />
      {item.remainingCaption ? <Text style={styles.caption}>{item.remainingCaption}</Text> : null}
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
    gap: SPACING.sm,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: SPACING.sm,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    flexShrink: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.ink,
    flexShrink: 1,
  },
  badge: {
    borderRadius: 6,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    maxWidth: '55%',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  caption: {
    fontSize: 12,
    color: COLORS.inkFaint,
  },
});
