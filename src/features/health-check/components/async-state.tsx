import type { ReactNode } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { useT } from '../i18n';
import { HEALTH_LABELS } from '../logic/labels';
import { COLORS, RADIUS, SPACING, STATUS_COLORS } from './theme';

interface AsyncStateProps {
  isLoading: boolean;
  isError: boolean;
  errorMessage?: string;
  onRetry?: () => void;
  isEmpty?: boolean;
  emptyMessage?: string;
  children: ReactNode;
}

/**
 * Rule 3.7: every screen/section handles loading / error(+retry) / empty / populated explicitly.
 * Shared by every Health section so the four states aren't reimplemented per-section.
 */
export function AsyncState({
  isLoading,
  isError,
  errorMessage,
  onRetry,
  isEmpty,
  emptyMessage,
  children,
}: AsyncStateProps) {
  const t = useT();
  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={COLORS.accent} />
        <Text style={styles.mutedText}>{t(HEALTH_LABELS.common.loading)}</Text>
      </View>
    );
  }

  if (isError) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{errorMessage ?? t(HEALTH_LABELS.common.error)}</Text>
        {onRetry ? (
          <Pressable onPress={onRetry} style={styles.retryButton} accessibilityRole="button">
            <Text style={styles.retryButtonText}>{t(HEALTH_LABELS.common.retry)}</Text>
          </Pressable>
        ) : null}
      </View>
    );
  }

  if (isEmpty) {
    return (
      <View style={styles.centered}>
        <Text style={styles.mutedText}>{emptyMessage ?? ''}</Text>
      </View>
    );
  }

  return <>{children}</>;
}

const styles = StyleSheet.create({
  centered: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.xl,
  },
  mutedText: {
    color: COLORS.inkMuted,
    fontSize: 14,
    textAlign: 'center',
  },
  errorText: {
    color: STATUS_COLORS.overdue,
    fontSize: 14,
    textAlign: 'center',
  },
  retryButton: {
    borderWidth: 1,
    borderColor: COLORS.borderStrong,
    borderRadius: RADIUS.sm,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
  },
  retryButtonText: {
    color: COLORS.ink,
    fontWeight: '600',
  },
});
