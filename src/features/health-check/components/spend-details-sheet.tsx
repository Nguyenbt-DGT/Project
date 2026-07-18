import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { useLanguage } from '@/i18n';

import { useT } from '../i18n';
import { HEALTH_LABELS } from '../logic/labels';
import type { SpendEntryRow } from '../types';
import { displayName } from './spend-summary-section';
import { COLORS, SPACING } from './theme';

interface SpendDetailsSheetProps {
  visible: boolean;
  entries: SpendEntryRow[];
  totalCents: number;
  onClose: () => void;
}

function formatCents(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

/** Spend details (DEMO_FEEDBACK_001 #6): the full itemized list of this year's spend entries,
 * highest first. Opened by tapping the Spent-this-year summary. */
export function SpendDetailsSheet({ visible, entries, totalCents, onClose }: SpendDetailsSheetProps) {
  const t = useT();
  const { language } = useLanguage();
  if (!visible) return null;

  const sorted = [...entries].sort((a, b) => b.amount_cents - a.amount_cents);

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.title}>{t(HEALTH_LABELS.spend.detailsTitle)}</Text>
            <Pressable onPress={onClose} accessibilityRole="button" hitSlop={8}>
              <Text style={styles.closeText}>{t(HEALTH_LABELS.common.cancel)}</Text>
            </Pressable>
          </View>

          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>{t(HEALTH_LABELS.spend.total)}</Text>
            <Text style={styles.totalValue}>{formatCents(totalCents)}</Text>
          </View>

          <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
            {sorted.map((entry) => (
              <View key={entry.id} style={styles.row}>
                <View style={styles.rowLeft}>
                  <Text style={styles.rowName}>{displayName(entry, language)}</Text>
                  <Text style={styles.rowMeta}>
                    {entry.spent_at} ·{' '}
                    {t(entry.kind === 'service' ? HEALTH_LABELS.spend.kindService : HEALTH_LABELS.spend.kindParts)}
                  </Text>
                </View>
                <Text style={styles.rowAmount}>{formatCents(entry.amount_cents)}</Text>
              </View>
            ))}
            {sorted.length === 0 ? (
              <Text style={styles.empty}>{t(HEALTH_LABELS.spend.empty)}</Text>
            ) : null}
          </ScrollView>
        </View>
      </View>
    </Modal>
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
    maxHeight: '80%',
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
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  totalLabel: {
    color: COLORS.inkMuted,
    fontSize: 13,
  },
  totalValue: {
    color: COLORS.accent,
    fontSize: 22,
    fontWeight: '700',
  },
  list: {
    flexGrow: 0,
  },
  listContent: {
    gap: SPACING.sm,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: SPACING.sm,
  },
  rowLeft: {
    flexShrink: 1,
    gap: 2,
  },
  rowName: {
    color: COLORS.ink,
    fontSize: 14,
  },
  rowMeta: {
    color: COLORS.inkFaint,
    fontSize: 11,
  },
  rowAmount: {
    color: COLORS.ink,
    fontSize: 14,
    fontWeight: '700',
  },
  empty: {
    color: COLORS.inkMuted,
    fontSize: 13,
    textAlign: 'center',
    paddingVertical: SPACING.md,
  },
});
