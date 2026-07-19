import { useState } from 'react';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Tabs } from 'expo-router';
import { Pressable } from 'react-native';

import { ProfilePopup } from '@/components/profile-popup';
import { COLORS, SPACING } from '@/theme';

/**
 * DEMO_FEEDBACK_005 #5: the profile entry point is a `headerRight` on the shared Tabs
 * `screenOptions`, so it renders on every screen inside this navigator (Home, Health, Touring,
 * Lucky Draw) without being wired into each screen individually — "displayed through all the tabs
 * ... user can view their profile whenever they want."
 */
export default function TabsLayout() {
  const [showProfile, setShowProfile] = useState(false);

  return (
    <>
      <Tabs
        screenOptions={{
          headerShown: true,
          headerStyle: { backgroundColor: COLORS.bg },
          headerTitleStyle: { color: COLORS.ink, fontWeight: '700', letterSpacing: 1.5 },
          headerTintColor: COLORS.accent,
          headerShadowVisible: false,
          headerRight: () => (
            <Pressable
              onPress={() => setShowProfile(true)}
              accessibilityRole="button"
              accessibilityLabel="Profile"
              style={{ paddingHorizontal: SPACING.md }}
            >
              <Ionicons name="person-circle" size={26} color={COLORS.accent} />
            </Pressable>
          ),
          sceneStyle: { backgroundColor: COLORS.bg },
          tabBarStyle: { backgroundColor: COLORS.surface, borderTopColor: COLORS.border },
          tabBarActiveTintColor: COLORS.accent,
          tabBarInactiveTintColor: COLORS.inkFaint,
        }}
      >
        <Tabs.Screen
          name="home"
          options={{
            title: 'HOME',
            tabBarIcon: ({ color, size }) => <Ionicons name="home" color={color} size={size} />,
          }}
        />
        <Tabs.Screen
          name="health-check"
          options={{
            title: 'HEALTH',
            tabBarIcon: ({ color, size }) => <Ionicons name="pulse" color={color} size={size} />,
          }}
        />
        <Tabs.Screen
          name="touring-plan"
          options={{
            title: 'TOURING',
            tabBarIcon: ({ color, size }) => <Ionicons name="map" color={color} size={size} />,
          }}
        />
        <Tabs.Screen
          name="lucky-draw"
          options={{
            title: 'LUCKY DRAW',
            tabBarIcon: ({ color, size }) => <Ionicons name="gift" color={color} size={size} />,
          }}
        />
      </Tabs>

      <ProfilePopup visible={showProfile} onClose={() => setShowProfile(false)} />
    </>
  );
}
