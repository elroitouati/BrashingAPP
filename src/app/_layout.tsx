import { Heebo_400Regular, Heebo_600SemiBold, Heebo_800ExtraBold, useFonts } from '@expo-google-fonts/heebo';
import * as Notifications from 'expo-notifications';
import { router, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { I18nManager, Platform, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
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

/** הטעינה מקומית ונמשכת רגע — רקע שקט במקום ספינר. */
const blank = <View style={{ flex: 1, backgroundColor: colors.bg }} />;

export default function RootLayout() {
  const [fontsLoaded] = useFonts({ Heebo_400Regular, Heebo_600SemiBold, Heebo_800ExtraBold });
  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.bg }}>
      <SafeAreaProvider>
        <StatusBar style="light" />
        {fontsLoaded ? (
          <StoreProvider fallback={blank}>
            <RoutedStack />
          </StoreProvider>
        ) : (
          blank
        )}
      </SafeAreaProvider>
    </GestureHandlerRootView>
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
