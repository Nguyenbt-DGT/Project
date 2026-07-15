import Ionicons from '@expo/vector-icons/Ionicons';
import { Tabs } from 'expo-router';

export default function TabsLayout() {
  return (
    <Tabs screenOptions={{ headerShown: true }}>
      <Tabs.Screen
        name="health-check"
        options={{
          title: 'Health',
          tabBarIcon: ({ color, size }) => <Ionicons name="fitness" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="touring-plan"
        options={{
          title: 'Touring',
          tabBarIcon: ({ color, size }) => <Ionicons name="map" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="map-tracking"
        options={{
          title: 'Tracking',
          tabBarIcon: ({ color, size }) => <Ionicons name="navigate" color={color} size={size} />,
        }}
      />
    </Tabs>
  );
}
