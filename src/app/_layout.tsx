import * as Notifications from 'expo-notifications';
import { router, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { ActivityIndicator, I18nManager, Platform, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { START_TIMER_ACTION } from '../lib/notifications';
import { StoreProvider } from '../state/store';
import { colors } from '../theme';

// כל הממשק בעברית ו-RTL מלא. ה-config plugin של expo-localization מכריח RTL כבר בבנייה הנייטיבית;
// הקריאות כאן מבטיחות את אותו מצב גם בסביבת פיתוח.
I18nManager.allowRTL(true);
I18nManager.forceRTL(true);

/** לחיצה על התראה פותחת ישר את הטיימר, ו"התחל טיימר" מתחיל אותו מיד. */
function useNotificationRouting() {
  useEffect(() => {
    if (Platform.OS === 'web') return; // התראות מקומיות קיימות רק ב-iOS/Android
    function open(response: Notifications.NotificationResponse) {
      const url = response.notification.request.content.data?.url;
      if (typeof url !== 'string') return;
      const autostart = response.actionIdentifier === START_TIMER_ACTION;
      const target = autostart ? `${url}${url.includes('?') ? '&' : '?'}autostart=1` : url;
      router.navigate(target as never);
      Notifications.clearLastNotificationResponse();
    }

    const last = Notifications.getLastNotificationResponse();
    if (last) setTimeout(() => open(last), 0);

    const sub = Notifications.addNotificationResponseReceivedListener(open);
    return () => sub.remove();
  }, []);
}

function Splash() {
  return (
    <View style={{ flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' }}>
      <ActivityIndicator color={colors.primary} />
    </View>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <StoreProvider fallback={<Splash />}>
        <RoutedStack />
      </StoreProvider>
    </SafeAreaProvider>
  );
}

function RoutedStack() {
  useNotificationRouting();
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="camera" options={{ presentation: 'fullScreenModal', animation: 'slide_from_bottom' }} />
    </Stack>
  );
}
