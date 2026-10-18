import * as Notifications from 'expo-notifications';
import { AndroidImportance } from 'expo-notifications';
import { Platform } from 'react-native';

import type { PlannedNotification } from './notificationPlan';

export const EVENING_CATEGORY = 'brushing_evening';
export const START_TIMER_ACTION = 'start_timer';
const CHANNEL_ID = 'brushing';

let configured = false;

/** הגדרה חד-פעמית: הצגה גם כשהאפליקציה פתוחה, ערוץ אנדרואיד, וכפתור "התחל טיימר". */
export async function configureNotifications(): Promise<void> {
  if (configured) return;
  configured = true;

  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
      name: 'תזכורות צחצוח',
      importance: AndroidImportance.HIGH,
      vibrationPattern: [0, 200, 120, 200],
      lightColor: '#6FD6C9',
    });
  }

  await Notifications.setNotificationCategoryAsync(EVENING_CATEGORY, [
    {
      identifier: START_TIMER_ACTION,
      buttonTitle: 'התחל טיימר',
      options: { opensAppToForeground: true },
    },
  ]);
}

export async function ensurePermission(): Promise<boolean> {
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  if (!current.canAskAgain) return false;
  const req = await Notifications.requestPermissionsAsync();
  return req.granted;
}

/**
 * מחליף את כל ההתראות המתוזמנות בתוכנית החדשה.
 * נקרא בכל פתיחה, בכל שינוי הגדרות ובכל סימון צחצוח —
 * כך שסימון צחצוח ערב מבטל מיד את כל התראות הערב שנותרו לאותו יום.
 */
export async function applyPlan(plan: PlannedNotification[]): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
  for (const n of plan) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: n.title,
        body: n.body,
        sound: true,
        data: { url: n.url, kind: n.kind, day: n.day },
        categoryIdentifier: n.withStartAction ? EVENING_CATEGORY : undefined,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: n.at,
        channelId: CHANNEL_ID,
      },
    });
  }
}
