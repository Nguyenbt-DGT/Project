import { StyleSheet, Text, View } from 'react-native';

import { COLORS } from '@/theme';

type PlaceholderScreenProps = {
  title: string;
  description: string;
};

/**
 * Temporary stand-in used while a feature screen is not implemented yet.
 * Real screens must implement the four states of Rule 3.7 (loading/error/empty/populated).
 */
export function PlaceholderScreen({ title, description }: PlaceholderScreenProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 24,
    backgroundColor: COLORS.bg,
  },
  title: {
    fontSize: 22,
    fontWeight: '600',
    color: COLORS.ink,
  },
  description: {
    fontSize: 15,
    color: COLORS.inkMuted,
    textAlign: 'center',
  },
});
