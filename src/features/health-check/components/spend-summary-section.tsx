import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useLanguage } from '@/i18n';

import { useT } from '../i18n';
import { formatCurrency } from '../logic/currency';
import { currentYearEntries, displayName, spendTotalCents, topNSpend } from '../logic/spend';
import { HEALTH_LABELS } from '../logic/labels';
import type { SpendEntryRow } from '../types';
import { AsyncState } from './async-state';
import { SpendDetailsSheet } from './spend-details-sheet';
import { COLORS, RADIUS, SPACING } from './theme';

interface SpendSummarySectionProps {
  entries: SpendEntryRow[] | undefined;
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
  now: Date;
}

/** Spent this year — secondary Health section (HEALTH_REQ §7, D-OQ-H5-SPEND-YEAR). Only the
 * on-tab total + top-3 ship in MVP; the full itemized Spend-details page is deferred
 * (D-HEALTH-MVP-SCOPE). */
export function SpendSummarySection({
  entries,
  isLoading,
  isError,
  onRetry,
  now,
}: SpendSummarySectionProps) {
  const t = useT();
  const { language } = useLanguage();
  const [showDetails, setShowDetails] = useState(false);
  const thisYear = useMemo(() => currentYearEntries(entries ?? [], now), [entries, now]);
  const totalCents = useMemo(() => spendTotalCents(thisYear), [thisYear]);
  const top3 = useMemo(() => topNSpend(thisYear, 3), [thisYear]);

  return (
    <View style={styles.section}>
      <Text style={styles.title}>{t(HEALTH_LABELS.spend.title)}</Text>
      <AsyncState
        isLoading={isLoading}
        isError={isError}
        errorMessage={t(HEALTH_LABELS.spend.error)}
        onRetry={onRetry}
        isEmpty={thisYear.length === 0}
        emptyMessage={t(HEALTH_LABELS.spend.empty)}
      >
        {/* DEMO_FEEDBACK_001 #6: the summary is tappable to open the full itemized details. */}
        <Pressable
          onPress={() => setShowDetails(true)}
          accessibilityRole="button"
          accessibilityLabel={t(HEALTH_LABELS.spend.viewDetails)}
        >
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>{t(HEALTH_LABELS.spend.total)}</Text>
            <Text style={styles.totalValue}>{formatCurrency(totalCents, language)}</Text>
          </View>
          <View style={styles.topList}>
            <Text style={styles.topListLabel}>{t(HEALTH_LABELS.spend.topItems)}</Text>
            {top3.map((entry) => (
              <View key={entry.id} style={styles.topItemRow}>
                <Text style={styles.topItemName}>{displayName(entry, language)}</Text>
                <Text style={styles.topItemAmount}>
                  {formatCurrency(entry.amount_cents, language)}
                </Text>
              </View>
            ))}
          </View>
          <Text style={styles.viewDetails}>{t(HEALTH_LABELS.spend.viewDetails)} ›</Text>
        </Pressable>
      </AsyncState>

      <SpendDetailsSheet
        visible={showDetails}
        entries={thisYear}
        totalCents={totalCents}
        onClose={() => setShowDetails(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: SPACING.md,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.ink,
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
    color: COLORS.ink,
    fontSize: 22,
    fontWeight: '700',
  },
  topList: {
    gap: 4,
  },
  topListLabel: {
    fontSize: 11,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    color: COLORS.inkFaint,
    marginBottom: 2,
  },
  topItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  topItemName: {
    color: COLORS.ink,
    fontSize: 13,
  },
  topItemAmount: {
    color: COLORS.inkMuted,
    fontSize: 13,
    fontWeight: '600',
  },
  viewDetails: {
    marginTop: SPACING.sm,
    color: COLORS.accent,
    fontSize: 12,
    fontWeight: '600',
  },
});
