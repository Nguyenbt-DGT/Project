import { Pressable, StyleSheet, Text, View } from 'react-native';

import { LANGUAGES, useLanguage } from '@/i18n';
import { COLORS, RADIUS } from '@/theme';

/** Compact EN / VI language switch (DEMO_FEEDBACK_002 #1). Reads/writes the app-wide language. */
export function LanguageToggle() {
  const { language, setLanguage } = useLanguage();

  return (
    <View style={styles.row}>
      {LANGUAGES.map((lang) => {
        const active = lang.value === language;
        return (
          <Pressable
            key={lang.value}
            onPress={() => setLanguage(lang.value)}
            style={[styles.pill, active ? styles.pillActive : null]}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            accessibilityLabel={lang.label}
          >
            <Text style={[styles.text, active ? styles.textActive : null]}>{lang.value.toUpperCase()}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.sm,
    padding: 2,
    gap: 2,
    alignSelf: 'flex-end',
  },
  pill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.sm - 2,
  },
  pillActive: {
    backgroundColor: COLORS.accent,
  },
  text: {
    color: COLORS.inkMuted,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  textActive: {
    color: COLORS.accentInk,
  },
});
