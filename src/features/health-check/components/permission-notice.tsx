import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import * as Location from 'expo-location';

import { useT } from '../i18n';
import { HEALTH_LABELS } from '../logic/labels';
import { COLORS, RADIUS, SPACING } from './theme';

type PermissionState = 'checking' | 'granted' | 'undetermined' | 'denied';

/**
 * Location-permission notice (DEMO_FEEDBACK_001 #4). Shown on app access when foreground location
 * hasn't been granted, explaining why the app needs it (ride recording / odometer) and offering to
 * request it. Renders nothing once granted or dismissed. Wrapped in try/catch so an unsupported
 * platform (e.g. web) degrades gracefully rather than throwing.
 */
export function PermissionNotice() {
  const t = useT();
  const [state, setState] = useState<PermissionState>('checking');
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const result = await Location.getForegroundPermissionsAsync();
        if (!active) return;
        setState(result.granted ? 'granted' : result.canAskAgain ? 'undetermined' : 'denied');
      } catch {
        if (active) setState('undetermined');
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const request = async () => {
    try {
      const result = await Location.requestForegroundPermissionsAsync();
      setState(result.granted ? 'granted' : result.canAskAgain ? 'undetermined' : 'denied');
    } catch {
      setState('denied');
    }
  };

  if (state === 'checking' || state === 'granted' || dismissed) return null;

  const isDenied = state === 'denied';

  return (
    <View style={styles.banner}>
      <Text style={styles.title}>{t(HEALTH_LABELS.permission.title)}</Text>
      <Text style={styles.body}>
        {isDenied ? t(HEALTH_LABELS.permission.denied) : t(HEALTH_LABELS.permission.body)}
      </Text>
      {!isDenied ? (
        <View style={styles.actions}>
          <Pressable style={styles.grant} onPress={() => void request()} accessibilityRole="button">
            <Text style={styles.grantText}>{t(HEALTH_LABELS.permission.grant)}</Text>
          </Pressable>
          <Pressable style={styles.dismiss} onPress={() => setDismissed(true)} accessibilityRole="button">
            <Text style={styles.dismissText}>{t(HEALTH_LABELS.permission.dismiss)}</Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: COLORS.accentSoft,
    borderWidth: 1,
    borderColor: COLORS.accent,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    gap: SPACING.sm,
  },
  title: {
    color: COLORS.accent,
    fontWeight: '700',
    fontSize: 14,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  body: {
    color: COLORS.ink,
    fontSize: 13,
    lineHeight: 18,
  },
  actions: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  grant: {
    backgroundColor: COLORS.accent,
    borderRadius: RADIUS.sm,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  grantText: {
    color: COLORS.accentInk,
    fontWeight: '700',
    fontSize: 13,
  },
  dismiss: {
    borderRadius: RADIUS.sm,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  dismissText: {
    color: COLORS.inkMuted,
    fontWeight: '600',
    fontSize: 13,
  },
});
