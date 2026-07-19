import { useState } from 'react';
import { Link, router } from 'expo-router';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useLanguage } from '@/i18n';
import { supabase } from '@/lib/supabase';
import { COLORS, RADIUS, SPACING } from '@/theme';

const MIN_PASSWORD_LENGTH = 6;

/**
 * Real Register screen (DEMO_FEEDBACK_005 #3), built against Supabase Auth (Rule 4.3) now that the
 * Turso migration is declined (DECISIONS.md D-DEMO5-TURSO). The display name is passed as sign-up
 * metadata so the `handle_new_user` DB trigger (20260719090000_create_profiles.sql) can seed the
 * new `profiles` row (#4) without a second round-trip.
 */
export default function SignUpRoute() {
  const { language } = useLanguage();
  const insets = useSafeAreaInsets();
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [checkEmailNotice, setCheckEmailNotice] = useState(false);

  const t = (en: string, vi: string) => (language === 'vi' ? vi : en);

  const onSubmit = async () => {
    setErrorMessage(null);
    if (password.length < MIN_PASSWORD_LENGTH) {
      setErrorMessage(
        t(
          `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`,
          `Mật khẩu phải có ít nhất ${MIN_PASSWORD_LENGTH} ký tự.`
        )
      );
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage(t('Passwords do not match.', 'Mật khẩu không khớp.'));
      return;
    }

    setIsSubmitting(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { display_name: displayName.trim() || null } },
    });
    setIsSubmitting(false);
    if (error) {
      setErrorMessage(error.message);
      return;
    }
    if (!data.session) {
      // Email confirmation is required (production config) — no session yet, nothing to route to.
      setCheckEmailNotice(true);
      return;
    }
    // index.tsx decides where to land (onboarding vs. Home) based on whether a vehicle exists.
    router.replace('/');
  };

  if (checkEmailNotice) {
    return (
      <View style={styles.container}>
        <Text style={styles.brand}>NIGHT GARAGE</Text>
        <Text style={styles.title}>{t('Check your email', 'Kiểm tra email của bạn')}</Text>
        <Text style={styles.description}>
          {t(
            "We've sent a confirmation link to finish creating your account.",
            'Chúng tôi đã gửi một liên kết xác nhận để hoàn tất tạo tài khoản của bạn.'
          )}
        </Text>
        <Link href="/(auth)/sign-in" style={styles.link}>
          {t('Back to sign in', 'Quay lại đăng nhập')}
        </Link>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top + SPACING.xl }]}>
      <Text style={styles.brand}>NIGHT GARAGE</Text>
      <Text style={styles.title}>{t('Register', 'Đăng ký')}</Text>

      <TextInput
        style={styles.input}
        value={displayName}
        onChangeText={setDisplayName}
        placeholder={t('Name (optional)', 'Tên (tùy chọn)')}
        placeholderTextColor={COLORS.inkFaint}
      />
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
      <TextInput
        style={styles.input}
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        autoCapitalize="none"
        secureTextEntry
        placeholder={t('Confirm password', 'Xác nhận mật khẩu')}
        placeholderTextColor={COLORS.inkFaint}
      />

      {errorMessage ? <Text style={styles.error}>{errorMessage}</Text> : null}

      <Pressable
        style={styles.button}
        onPress={() => void onSubmit()}
        disabled={isSubmitting || !email || !password || !confirmPassword}
        accessibilityRole="button"
      >
        {isSubmitting ? (
          <ActivityIndicator color={COLORS.accentInk} />
        ) : (
          <Text style={styles.buttonText}>{t('Create account', 'Tạo tài khoản')}</Text>
        )}
      </Pressable>

      <Link href="/(auth)/sign-in" style={styles.link}>
        {t('Already have an account? Sign in', 'Đã có tài khoản? Đăng nhập')}
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
  description: {
    fontSize: 13,
    color: COLORS.inkMuted,
    textAlign: 'center',
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
