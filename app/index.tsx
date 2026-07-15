import { Redirect } from 'expo-router';

// TODO(auth): redirect to /(auth)/sign-in when there is no active Supabase session.
export default function Index() {
  return <Redirect href="/(tabs)/health-check" />;
}
