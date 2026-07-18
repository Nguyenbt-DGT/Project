import Ionicons from '@expo/vector-icons/Ionicons';
import { Tabs } from 'expo-router';

import { COLORS } from '@/theme';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: COLORS.bg },
        headerTitleStyle: { color: COLORS.ink, fontWeight: '700', letterSpacing: 1.5 },
        headerTintColor: COLORS.accent,
        headerShadowVisible: false,
        sceneStyle: { backgroundColor: COLORS.bg },
        tabBarStyle: { backgroundColor: COLORS.surface, borderTopColor: COLORS.border },
        tabBarActiveTintColor: COLORS.accent,
        tabBarInactiveTintColor: COLORS.inkFaint,
      }}
    >
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
  );
}
