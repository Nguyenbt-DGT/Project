import { useState } from 'react';
import { Link, router } from 'expo-router';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useLanguage } from '@/i18n';
import { supabase } from '@/lib/supabase';
import { COLORS, RADIUS, SPACING } from '@/theme';

/**
 * Real email/password Login screen (DEMO_FEEDBACK_005 #3), built against Supabase Auth (Rule 4.3)
 * now that the Turso migration is declined (DECISIONS.md D-DEMO5-TURSO). GLOBAL_REQ §1's Gmail-only
 * assumption (OQ-G1) is not yet reconciled with this — flagged there for product-owner review.
 */
export default function SignInRoute() {
  const { language } = useLanguage();
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const t = (en: string, vi: string) => (language === 'vi' ? vi : en);

  const onSubmit = async () => {
    setIsSubmitting(true);
    setErrorMessage(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setIsSubmitting(false);
    if (error) {
      setErrorMessage(error.message);
      return;
    }
    // index.tsx decides where to land (onboarding vs. Home) based on whether a vehicle exists.
    router.replace('/');
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + SPACING.xl }]}>
      <Text style={styles.brand}>NIGHT GARAGE</Text>
      <Text style={styles.title}>{t('Sign in', 'Đăng nhập')}</Text>

      <TextInput
        style={styles.input}
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        placeholder={t('Email', 'Email')}
        placeholderTextColor={COLORS.inkFaint}
      />
      <TextInput
        style={styles.input}
        value={password}
        onChangeText={setPassword}
        autoCapitalize="none"
        secureTextEntry
        placeholder={t('Password', 'Mật khẩu')}
        placeholderTextColor={COLORS.inkFaint}
      />

      {errorMessage ? <Text style={styles.error}>{errorMessage}</Text> : null}

      <Pressable
        style={styles.button}
        onPress={() => void onSubmit()}
        disabled={isSubmitting || !email || !password}
        accessibilityRole="button"
      >
        {isSubmitting ? (
          <ActivityIndicator color={COLORS.accentInk} />
        ) : (
          <Text style={styles.buttonText}>{t('Sign in', 'Đăng nhập')}</Text>
        )}
      </Pressable>

      <Link href="/(auth)/sign-up" style={styles.link}>
        {t("Don't have an account? Register", 'Chưa có tài khoản? Đăng ký')}
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.md,
    padding: SPACING.xl,
    backgroundColor: COLORS.bg,
  },
  brand: {
    fontSize: 12,
    letterSpacing: 3,
    color: COLORS.accent,
    fontWeight: '700',
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: COLORS.ink,
    marginBottom: SPACING.sm,
  },
  input: {
    width: '100%',
    borderWidth: 1,
    borderColor: COLORS.borderStrong,
    borderRadius: RADIUS.sm,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    fontSize: 16,
    color: COLORS.ink,
    backgroundColor: COLORS.surface,
  },
  error: {
    color: COLORS.accentStrong,
    fontSize: 13,
    textAlign: 'center',
  },
  button: {
    width: '100%',
    backgroundColor: COLORS.accent,
    borderRadius: RADIUS.sm,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    marginTop: SPACING.sm,
  },
  buttonText: {
    color: COLORS.accentInk,
    fontWeight: '700',
    fontSize: 16,
  },
  link: {
    color: COLORS.inkMuted,
    fontSize: 13,
    marginTop: SPACING.md,
    textAlign: 'center',
  },
});
