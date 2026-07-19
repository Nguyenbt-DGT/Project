import Ionicons from '@expo/vector-icons/Ionicons';
import { ActivityIndicator, Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { useLanguage } from '@/i18n';
import { COLORS, RADIUS, SPACING } from '@/theme';

import { useT } from '../i18n';
import { HOME_LABELS } from '../logic/labels';
import { formatNightsAgo } from '../logic/relative-time';
import type { DistanceUnit } from '@/features/health-check/logic/units';
import { formatDistance } from '@/features/health-check/logic/units';

interface VehicleHeroCardProps {
  name: string;
  brand: string;
  photoUrl: string | null;
  lastTripDistanceKm: number | null;
  lastTripAt: string | null;
  unit: DistanceUnit;
  now: Date;
  onPress: () => void;
  onPickPhoto: () => void;
  isUploadingPhoto: boolean;
}

/**
 * Home tab's "session 1" (HOME_REQ.md §3.1 / Home-1st-session.png): a tappable vehicle hero card.
 * Tapping the photo area specifically triggers picking a new photo (§3.1.4 — no more static
 * "Z800 hero shot" text); tapping the rest of the card opens the details popup (§3.1.1).
 */
export function VehicleHeroCard({
  name,
  brand,
  photoUrl,
  lastTripDistanceKm,
  lastTripAt,
  unit,
  now,
  onPress,
  onPickPhoto,
  isUploadingPhoto,
}: VehicleHeroCardProps) {
  const t = useT();
  const { language } = useLanguage();

  const rideCaption =
    lastTripDistanceKm != null && lastTripAt != null
      ? `${t(HOME_LABELS.hero.lastRide)} · ${formatDistance(lastTripDistanceKm, unit)} · ${formatNightsAgo(new Date(lastTripAt), now, language)}`
      : t(HOME_LABELS.hero.noRides);

  return (
    <Pressable style={styles.card} onPress={onPress} accessibilityRole="button">
      <Pressable
        style={styles.photoArea}
        onPress={onPickPhoto}
        accessibilityRole="button"
        accessibilityLabel={t(HOME_LABELS.hero.addPhotoHint)}
      >
        {photoUrl ? (
          <Image source={{ uri: photoUrl }} style={styles.photo} resizeMode="cover" />
        ) : (
          <View style={styles.photoPlaceholder}>
            {isUploadingPhoto ? (
              <ActivityIndicator color={COLORS.accent} />
            ) : (
              <>
                <Ionicons name="camera" size={22} color={COLORS.inkFaint} />
                <Text style={styles.photoPlaceholderText}>{t(HOME_LABELS.hero.addPhotoHint)}</Text>
              </>
            )}
          </View>
        )}
      </Pressable>

      <Text style={styles.name}>{brand ? `${brand} ${name}` : name}</Text>
      <Text style={styles.caption}>{rideCaption}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    gap: SPACING.sm,
  },
  photoArea: {
    borderRadius: RADIUS.sm,
    overflow: 'hidden',
    height: 120,
    backgroundColor: COLORS.surfaceMuted,
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  photoPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
    borderWidth: 1,
    borderColor: COLORS.borderStrong,
    borderStyle: 'dashed',
    borderRadius: RADIUS.sm,
    margin: 1,
  },
  photoPlaceholderText: {
    color: COLORS.inkFaint,
    fontSize: 12,
  },
  name: {
    color: COLORS.ink,
    fontSize: 18,
    fontWeight: '700',
  },
  caption: {
    color: COLORS.inkMuted,
    fontSize: 13,
  },
});
