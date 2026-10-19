import Ionicons from '@expo/vector-icons/Ionicons';
import { Tabs } from 'expo-router';

import type { IconName } from '../../components/ui';
import { colors, font } from '../../theme';

const TABS: { name: string; title: string; icon: IconName; iconActive: IconName }[] = [
  { name: 'index', title: 'היום', icon: 'today-outline', iconActive: 'today' },
  { name: 'timer', title: 'טיימר', icon: 'timer-outline', iconActive: 'timer' },
  { name: 'streak', title: 'רצף', icon: 'calendar-outline', iconActive: 'calendar' },
  { name: 'whitening', title: 'הלבנה', icon: 'sparkles-outline', iconActive: 'sparkles' },
  { name: 'settings', title: 'הגדרות', icon: 'settings-outline', iconActive: 'settings' },
];

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border },
        tabBarLabelStyle: { fontSize: 12, lineHeight: 16, fontFamily: font.semibold },
        // טאבים הם עמיתים, לא היררכיה — מעבר מיידי, בלי אנימציה.
        animation: 'none',
        sceneStyle: { backgroundColor: colors.bg },
      }}
    >
      {TABS.map((t) => (
        <Tabs.Screen
          key={t.name}
          name={t.name}
          options={{
            title: t.title,
            tabBarIcon: ({ color, focused, size }) => <Ionicons name={focused ? t.iconActive : t.icon} size={size} color={color as string} />,
          }}
        />
      ))}
    </Tabs>
  );
}
