import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { COLORS, RADIUS, SPACING } from '@/theme';

import { useT } from '../i18n';
import { HOME_LABELS } from '../logic/labels';

/**
 * Home's navigation shortcuts to Touring and Lucky Draw (HOME_REQ.md / Home-5th-session.png,
 * DEMO_FEEDBACK_005 #8). Both target tabs are "Feature coming soon" placeholders today
 * (DEMO_FEEDBACK_003 #5) — tapping still navigates there; the coming-soon message is the
 * destination screen's own concern, not this card's.
 */
export function HomeNavCards() {
  const t = useT();

  return (
    <View style={styles.row}>
      <Pressable
        style={[styles.card, styles.primaryCard]}
        onPress={() => router.push('/(tabs)/touring-plan')}
        accessibilityRole="button"
      >
        <Text style={styles.primaryTitle}>{t(HOME_LABELS.nav.planARide)}</Text>
        <Text style={styles.primaryCaption}>{t(HOME_LABELS.nav.planARideCaption)}</Text>
      </Pressable>

      <Pressable
        style={[styles.card, styles.secondaryCard]}
        onPress={() => router.push('/(tabs)/lucky-draw')}
        accessibilityRole="button"
      >
        <Text style={styles.secondaryTitle}>{t(HOME_LABELS.nav.luckyDraw)}</Text>
        <Text style={styles.secondaryCaption}>{t(HOME_LABELS.nav.luckyDrawCaption)}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  card: {
    flex: 1,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    gap: 2,
  },
  primaryCard: {
    backgroundColor: COLORS.accent,
  },
  primaryTitle: {
    color: COLORS.accentInk,
    fontWeight: '700',
    fontSize: 15,
  },
  primaryCaption: {
    color: COLORS.accentInk,
    opacity: 0.8,
    fontSize: 12,
  },
  secondaryCard: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  secondaryTitle: {
    color: COLORS.accent,
    fontWeight: '700',
    fontSize: 15,
  },
  secondaryCaption: {
    color: COLORS.inkMuted,
    fontSize: 12,
  },
});
