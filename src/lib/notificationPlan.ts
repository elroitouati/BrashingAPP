import { addDays, addMonths, atLogicalTime, fromDateKey, logicalDate } from './date';
import { indexByDay, isSlotDone } from './sessions';
import type { Session, Settings } from './types';

/** כמה ימים קדימה מתזמנים, כדי שההתראות יגיעו גם אם האפליקציה לא נפתחת. */
export const PLAN_DAYS = 7;
export const MAX_EVENING_NOTIFICATIONS = 3;

export type PlannedKind = 'evening-main' | 'evening-followup' | 'evening-rescue' | 'morning' | 'brush' | 'hygienist';

export type PlannedNotification = {
  kind: PlannedKind;
  /** היום הלוגי שאליו ההתראה שייכת. */
  day: string;
  at: Date;
  title: string;
  body: string;
  /** הנתיב שנפתח בלחיצה. */
  url: string;
  /** התראות ערב מקבלות כפתור "התחל טיימר" ב-iOS. */
  withStartAction: boolean;
};

export const TEXT = {
  appTitle: 'צחצוח ערב',
  main: 'סיימת לאכול? עכשיו זה הזמן. 2 דקות ואתה חופשי.',
  mainAfterMiss: 'פספסת אתמול. היום אסור לפספס פעמיים.',
  followup: (streak: number) => `הערב עוד לא סומן. הרצף שלך: ${streak} ערבים.`,
  followupGeneric: 'הערב עוד לא סומן. 2 דקות והרצף ממשיך.',
  rescue: 'לפני שנכנסים למיטה. גם 30 שניות נחשבות.',
  morning: 'בוקר טוב. 2 דקות צחצוח והיום מתחיל נכון.',
  brush: 'עברו 3 חודשים מאז החלפת המברשת. הגיע הזמן למברשת חדשה.',
  hygienist: 'עברו 6 חודשים מהתור האחרון לשיננית. זה הזמן לקבוע תור.',
} as const;

const DUE_HOUR = 10;

type PlanInput = {
  now: Date;
  settings: Settings;
  sessions: Session[];
  installDate: string;
  /** רצף הערב הנוכחי (לא כולל היום אם עוד לא בוצע). */
  currentStreak: number;
};

/**
 * תכנון כל ההתראות המקומיות (סעיף 5). פונקציה טהורה — הביצוע ב-notifications.ts.
 *
 * - ערב שכבר סומן: אין התראות ערב לאותו יום.
 * - אין התראות אחרי שעת השינה, ולא יותר מ-3 בערב.
 * - ימים עתידיים: אם האפליקציה לא נפתחה עד אז, הערב הקודם בהכרח לא סומן,
 *   ולכן ההתראה הראשית שלהם היא נוסח "פספסת אתמול".
 */
export function planNotifications({ now, settings, sessions, installDate, currentStreak }: PlanInput): PlannedNotification[] {
  const byDay = indexByDay(sessions);
  const today = logicalDate(now);
  const out: PlannedNotification[] = [];

  for (let i = 0; i < PLAN_DAYS; i++) {
    const day = addDays(today, i);
    const eveningDone = isSlotDone(byDay, day, 'evening');

    if (settings.morningReminder && !isSlotDone(byDay, day, 'morning')) {
      const at = atLogicalTime(day, settings.morningReminderTime);
      if (at > now) {
        out.push({ kind: 'morning', day, at, title: TEXT.appTitle, body: TEXT.morning, url: '/timer', withStartAction: true });
      }
    }

    if (eveningDone) continue;

    const prev = addDays(day, -1);
    const prevMissed = prev < installDate ? false : prev <= today ? !isSlotDone(byDay, prev, 'evening') : true;
    const todayDone = isSlotDone(byDay, today, 'evening');
    const knownStreak = i === 0 ? currentStreak : i === 1 && todayDone ? currentStreak : null;

    const bed = atLogicalTime(day, settings.bedTime);
    const candidates: PlannedNotification[] = [
      {
        kind: 'evening-main',
        day,
        at: atLogicalTime(day, settings.dinnerEndTime, 10),
        title: TEXT.appTitle,
        body: prevMissed ? `${TEXT.mainAfterMiss} ${TEXT.main}` : TEXT.main,
        url: '/timer',
        withStartAction: true,
      },
      {
        kind: 'evening-followup',
        day,
        at: atLogicalTime(day, settings.dinnerEndTime, 45),
        title: TEXT.appTitle,
        body: knownStreak !== null ? TEXT.followup(knownStreak) : TEXT.followupGeneric,
        url: '/timer',
        withStartAction: true,
      },
      {
        kind: 'evening-rescue',
        day,
        at: atLogicalTime(day, settings.bedTime, -30),
        title: TEXT.appTitle,
        body: TEXT.rescue,
        url: '/timer?mode=rescue',
        withStartAction: true,
      },
    ];

    candidates
      .filter((n) => n.at > now && n.at < bed)
      .sort((a, b) => a.at.getTime() - b.at.getTime())
      .slice(0, MAX_EVENING_NOTIFICATIONS)
      .forEach((n) => out.push(n));
  }

  const due = (kind: 'brush' | 'hygienist', dateKey: string, body: string) => {
    const at = fromDateKey(dateKey);
    at.setHours(DUE_HOUR, 0, 0, 0);
    if (at > now) out.push({ kind, day: dateKey, at, title: TEXT.appTitle, body, url: kind === 'brush' ? '/settings' : '/whitening', withStartAction: false });
  };
  due('brush', addMonths(settings.lastBrushChange, 3), TEXT.brush);
  if (settings.lastHygienist) due('hygienist', addMonths(settings.lastHygienist, 6), TEXT.hygienist);

  return out.sort((a, b) => a.at.getTime() - b.at.getTime());
}
