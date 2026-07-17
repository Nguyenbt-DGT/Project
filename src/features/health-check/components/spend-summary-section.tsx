import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { currentYearEntries, spendTotalCents, topNSpend } from '../logic/spend';
import { HEALTH_LABELS } from '../logic/labels';
import type { SpendEntryRow } from '../types';
import { AsyncState } from './async-state';
import { COLORS, RADIUS, SPACING } from './theme';

interface SpendSummarySectionProps {
  entries: SpendEntryRow[] | undefined;
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
  now: Date;
}

function formatCents(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

function humanizePartTypeKey(key: string): string {
  return key
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function displayName(entry: SpendEntryRow): string {
  if (entry.note && entry.note.trim() !== '') return entry.note;
  if (entry.part_type_key) return humanizePartTypeKey(entry.part_type_key);
  return entry.kind === 'service' ? 'Service' : 'Parts';
}

/** Spent this year — secondary Health section (HEALTH_REQ §7, D-OQ-H5-SPEND-YEAR). Only the
 * on-tab total + top-3 ship in MVP; the full itemized Spend-details page is deferred
 * (D-HEALTH-MVP-SCOPE). */
export function SpendSummarySection({ entries, isLoading, isError, onRetry, now }: SpendSummarySectionProps) {
  const thisYear = useMemo(() => currentYearEntries(entries ?? [], now), [entries, now]);
  const totalCents = useMemo(() => spendTotalCents(thisYear), [thisYear]);
  const top3 = useMemo(() => topNSpend(thisYear, 3), [thisYear]);

  return (
    <View style={styles.section}>
      <Text style={styles.title}>{HEALTH_LABELS.spend.title.fallback}</Text>
      <AsyncState
        isLoading={isLoading}
        isError={isError}
        errorMessage={HEALTH_LABELS.spend.error.fallback}
        onRetry={onRetry}
        isEmpty={thisYear.length === 0}
        emptyMessage={HEALTH_LABELS.spend.empty.fallback}
      >
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>{HEALTH_LABELS.spend.total.fallback}</Text>
          <Text style={styles.totalValue}>{formatCents(totalCents)}</Text>
        </View>
        <View style={styles.topList}>
          <Text style={styles.topListLabel}>{HEALTH_LABELS.spend.topItems.fallback}</Text>
          {top3.map((entry) => (
            <View key={entry.id} style={styles.topItemRow}>
              <Text style={styles.topItemName}>{displayName(entry)}</Text>
              <Text style={styles.topItemAmount}>{formatCents(entry.amount_cents)}</Text>
            </View>
          ))}
        </View>
      </AsyncState>
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
});
