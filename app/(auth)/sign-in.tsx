import { useState } from 'react';
import { router } from 'expo-router';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { supabase } from '@/lib/supabase';
import { COLORS, RADIUS, SPACING } from '@/theme';

/**
 * TEMPORARY local-dev stand-in only. GLOBAL_REQ.md §1 (OQ-G1) decided the real MVP auth is
 * Gmail-only Google OAuth — this email/password form exists solely to sign in with the seeded
 * `rider@example.com` fixture (supabase/seed.sql) for local testing. Do not treat this as the
 * finished auth screen; it must be replaced by the Google OAuth flow before ship.
 */
export default function SignInRoute() {
  const [email, setEmail] = useState('rider@example.com');
  const [password, setPassword] = useState('password123');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const onSubmit = async () => {
    setIsSubmitting(true);
    setErrorMessage(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setIsSubmitting(false);
    if (error) {
      setErrorMessage(error.message);
      return;
    }
    // index.tsx decides where to land (onboarding vs. Health) based on whether a vehicle exists.
    router.replace('/');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.brand}>NIGHT GARAGE</Text>
      <Text style={styles.title}>Sign in</Text>
      <Text style={styles.description}>
        Temporary email/password sign-in for local testing. Real MVP auth is Gmail OAuth.
      </Text>

      <TextInput
        style={styles.input}
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        placeholder="Email"
        placeholderTextColor={COLORS.inkFaint}
      />
      <TextInput
        style={styles.input}
        value={password}
        onChangeText={setPassword}
        autoCapitalize="none"
        secureTextEntry
        placeholder="Password"
        placeholderTextColor={COLORS.inkFaint}
      />

      {errorMessage ? <Text style={styles.error}>{errorMessage}</Text> : null}

      <Pressable style={styles.button} onPress={() => void onSubmit()} disabled={isSubmitting}>
        {isSubmitting ? (
          <ActivityIndicator color={COLORS.accentInk} />
        ) : (
          <Text style={styles.buttonText}>Sign in</Text>
        )}
      </Pressable>
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
  },
  description: {
    fontSize: 13,
    color: COLORS.inkMuted,
    textAlign: 'center',
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
});
