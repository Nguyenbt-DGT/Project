import { useCallback, useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';

import { useServiceItems, useVehicle, VEHICLE_QUERY_KEY } from '@/features/health-check';
import { COLORS, SPACING } from '@/theme';
import { toDistanceUnit } from '@/features/health-check/logic/units';
import { useLanguage } from '@/i18n';

import {
  useLastTrip,
  useMonthDistanceKm,
  pickVehiclePhoto,
  useUploadVehiclePhoto,
  PhotoTooLargeError,
} from '../api';
import { VehicleHeroCard } from '../components/vehicle-hero-card';
import { VehicleHeroDetailSheet } from '../components/vehicle-hero-detail-sheet';
import { StatsHealthCard } from '../components/stats-health-card';
import { OverduePartsCard } from '../components/overdue-parts-card';
import { HomeNavCards } from '../components/home-nav-cards';
import { computeHealthScore } from '../logic/health-score';
import { computeOverdueParts } from '../logic/overdue-parts';
import { HOME_LABELS } from '../logic/labels';
import { useT } from '../i18n';

/**
 * The Home tab (HOME_REQ.md) — the screen shown right after login, leftmost of the tab bar
 * (DEMO_FEEDBACK_004 #4). Two sections: the vehicle hero card (§3.1) and a merged
 * distance/health-score card (§4, combining the mockup's separate 2nd/3rd sessions into one
 * tappable card that navigates to the Health tab).
 */
export function HomeScreen() {
  const [now] = useState(() => new Date());
  const [showVehicleDetail, setShowVehicleDetail] = useState(false);
  const t = useT();
  const { language } = useLanguage();
  const queryClient = useQueryClient();

  const vehicleQuery = useVehicle();
  const vehicle = vehicleQuery.data;

  const serviceItemsQuery = useServiceItems(vehicle?.id);
  const lastTripQuery = useLastTrip(vehicle?.id);
  const monthDistanceQuery = useMonthDistanceKm(vehicle?.id);
  const uploadPhoto = useUploadVehiclePhoto();

  // DEMO_FEEDBACK_005 #6: refetch on every focus rather than relying purely on cross-tab
  // invalidation timing — e.g. editing the bike's name on the Health tab, then switching back to
  // Home, must never show the pre-edit value. Cheap (two short queries) and removes any doubt.
  useFocusEffect(
    useCallback(() => {
      void queryClient.invalidateQueries({ queryKey: VEHICLE_QUERY_KEY });
      void queryClient.invalidateQueries({ queryKey: ['health-check', 'service-items'] });
    }, [queryClient])
  );

  if (!vehicle) {
    // index.tsx only ever routes here once a vehicle exists (post-onboarding); if the query is
    // still loading or empty there is nothing meaningful to render yet.
    return <View style={styles.screen} />;
  }

  const unit = toDistanceUnit(vehicle.unit_preference);
  const { score, status } = computeHealthScore(serviceItemsQuery.data ?? [], vehicle, now);
  const overdueParts = computeOverdueParts(
    serviceItemsQuery.data ?? [],
    vehicle,
    now,
    unit,
    language
  );

  const handlePickPhoto = () => {
    void (async () => {
      const localUri = await pickVehiclePhoto();
      if (!localUri) return;
      uploadPhoto.mutate(
        { vehicleId: vehicle.id, localUri },
        {
          onError: (error) =>
            Alert.alert(
              error instanceof PhotoTooLargeError
                ? t(HOME_LABELS.hero.photoTooLarge)
                : t(HOME_LABELS.hero.photoUploadFailed)
            ),
        }
      );
    })();
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <VehicleHeroCard
        name={vehicle.name}
        brand={vehicle.brand}
        photoUrl={vehicle.photo_url}
        lastTripDistanceKm={lastTripQuery.data?.distance_km ?? null}
        lastTripAt={lastTripQuery.data?.recorded_at ?? null}
        unit={unit}
        now={now}
        onPress={() => setShowVehicleDetail(true)}
        onPickPhoto={handlePickPhoto}
        isUploadingPhoto={uploadPhoto.isPending}
      />

      <StatsHealthCard
        totalDistanceKm={vehicle.current_odometer_km}
        monthDistanceKm={monthDistanceQuery.data ?? 0}
        healthScore={score}
        healthStatus={status}
        unit={unit}
        onPress={() => router.push('/(tabs)/health-check')}
      />

      <OverduePartsCard parts={overdueParts} />

      <HomeNavCards />

      <VehicleHeroDetailSheet
        visible={showVehicleDetail}
        name={vehicle.name}
        brand={vehicle.brand}
        model={vehicle.model}
        photoUrl={vehicle.photo_url}
        lastTripDistanceKm={lastTripQuery.data?.distance_km ?? null}
        lastTripAt={lastTripQuery.data?.recorded_at ?? null}
        unit={unit}
        now={now}
        onClose={() => setShowVehicleDetail(false)}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  content: {
    padding: SPACING.lg,
    gap: SPACING.lg,
  },
});
