import { useState } from 'react';
import { Link, router } from 'expo-router';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useToast } from '@/components/toast';
import { useLanguage } from '@/i18n';
import { getAuthErrorMessage } from '@/lib/auth-errors';
import { supabase } from '@/lib/supabase';
import { COLORS, RADIUS, SPACING } from '@/theme';

const MIN_PASSWORD_LENGTH = 6;

/**
 * Real Register screen (DEMO_FEEDBACK_005 #3), built against Supabase Auth (Rule 4.3) now that the
 * Turso migration is declined (DECISIONS.md D-DEMO5-TURSO). The display name is passed as sign-up
 * metadata so the `handle_new_user` DB trigger (20260719090000_create_profiles.sql) can seed the
 * new `profiles` row (#4) without a second round-trip.
 *
 * Verification is by typed CODE, not the magic link (D-DEMO7-OTP-CODE): a mobile app has no
 * website to land on, so Supabase's confirmation link falls back to the project's default Site URL
 * (`http://localhost:3000`), and email clients that prescan links for safety (Gmail in particular)
 * silently consume the one-time link token before the user ever taps it — both show up as the same
 * "otp_expired" dead end. A typed code sidesteps both: nothing to prescan, no redirect URL involved.
 * Requires the hosted project's "Confirm signup" email template to include `{{ .Token }}` (dashboard
 * config, not something this code controls — see GUIDELINE.md §8.4). The code's length is whatever
 * that project's Auth config generates (observed 8 digits, not a universal 6) — the input/copy here
 * deliberately don't hardcode a digit count.
 */
export default function SignUpRoute() {
  const { language } = useLanguage();
  const insets = useSafeAreaInsets();
  const { showToast } = useToast();
  const [step, setStep] = useState<'form' | 'verify'>('form');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [code, setCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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
      setErrorMessage(getAuthErrorMessage(error, language));
      return;
    }
    if (!data.session) {
      // Email confirmation is required (production config) — enter the code sent by email.
      setStep('verify');
      return;
    }
    // index.tsx decides where to land (onboarding vs. Home) based on whether a vehicle exists.
    router.replace('/');
  };

  const onVerify = async () => {
    const trimmed = code.trim();
    if (trimmed === '') {
      setErrorMessage(t('Enter the code from your email.', 'Nhập mã từ email của bạn.'));
      return;
    }
    setErrorMessage(null);
    setIsSubmitting(true);
    const { error } = await supabase.auth.verifyOtp({ email, token: trimmed, type: 'signup' });
    setIsSubmitting(false);
    if (error) {
      setErrorMessage(getAuthErrorMessage(error, language));
      return;
    }
    // index.tsx decides where to land (onboarding vs. Home) based on whether a vehicle exists.
    router.replace('/');
  };

  const onResend = async () => {
    setIsResending(true);
    const { error } = await supabase.auth.resend({ type: 'signup', email });
    setIsResending(false);
    if (error) {
      setErrorMessage(getAuthErrorMessage(error, language));
      return;
    }
    showToast({ message: t('A new code has been sent.', 'Mã mới đã được gửi.') });
  };

  if (step === 'verify') {
    return (
      <View style={[styles.container, { paddingTop: insets.top + SPACING.xl }]}>
        <Text style={styles.brand}>NIGHT GARAGE</Text>
        <Text style={styles.title}>{t('Enter your code', 'Nhập mã của bạn')}</Text>
        <Text style={styles.description}>
          {t(`We've sent a code to ${email}.`, `Chúng tôi đã gửi mã đến ${email}.`)}
        </Text>

        <TextInput
          style={[styles.input, styles.codeInput]}
          value={code}
          onChangeText={setCode}
          keyboardType="number-pad"
          // Supabase's OTP length isn't a fixed constant we should hardcode (observed 8 digits on
          // this project, not the 6 originally assumed) — cap generously instead of to an exact
          // count, so a longer code never gets silently truncated.
          maxLength={12}
          placeholder={t('Enter code', 'Nhập mã')}
          placeholderTextColor={COLORS.inkFaint}
          autoFocus
        />

        {errorMessage ? <Text style={styles.error}>{errorMessage}</Text> : null}

        <Pressable
          style={styles.button}
          onPress={() => void onVerify()}
          disabled={isSubmitting || code.trim() === ''}
          accessibilityRole="button"
        >
          {isSubmitting ? (
            <ActivityIndicator color={COLORS.accentInk} />
          ) : (
            <Text style={styles.buttonText}>{t('Verify', 'Xác nhận')}</Text>
          )}
        </Pressable>

        <Pressable onPress={() => void onResend()} disabled={isResending} accessibilityRole="button">
          <Text style={styles.link}>
            {isResending ? t('Sending…', 'Đang gửi…') : t('Resend code', 'Gửi lại mã')}
          </Text>
        </Pressable>

        <Pressable onPress={() => setStep('form')} accessibilityRole="button">
          <Text style={styles.link}>{t('Back', 'Quay lại')}</Text>
        </Pressable>
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
  codeInput: {
    textAlign: 'center',
    fontSize: 24,
    letterSpacing: 4,
    fontWeight: '700',
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
