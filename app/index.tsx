import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Redirect } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';

import { useVehicle } from '@/features/health-check';
import { supabase } from '@/lib/supabase';
import { COLORS } from '@/theme';

/**
 * Entry router: signed-out -> dev sign-in; signed-in with no vehicle yet -> onboarding
 * (GLOBAL_REQ §2 / DEMO_FEEDBACK_001 #2); signed-in with a vehicle -> the Home tab
 * (HOME_REQ.md §1 — "When user login into the application, Home page is displayed").
 */
export default function Index() {
  const [hasSession, setHasSession] = useState<boolean | null>(null);
  const queryClient = useQueryClient();
  const vehicleQuery = useVehicle();

  useEffect(() => {
    void supabase.auth.getSession().then(({ data }) => setHasSession(data.session !== null));

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      setHasSession(session !== null);
      // Session changed → the (globally-keyed) vehicle query must be refetched for the new user.
      void queryClient.invalidateQueries();
    });

    return () => subscription.subscription.unsubscribe();
  }, [queryClient]);

  const loading = (
    <View style={styles.center}>
      <ActivityIndicator color={COLORS.accent} />
    </View>
  );

  if (hasSession === null) return loading;
  if (!hasSession) return <Redirect href="/(auth)/sign-in" />;
  if (vehicleQuery.isLoading) return loading;
  return <Redirect href={vehicleQuery.data ? '/(tabs)/home' : '/onboarding'} />;
}

const styles = {
  center: { flex: 1, alignItems: 'center' as const, justifyContent: 'center' as const, backgroundColor: COLORS.bg },
};
