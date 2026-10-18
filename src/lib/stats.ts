import { addDays, daysBetween, logicalDate, toDateKey } from './date';
import { indexByDay, isSlotDone } from './sessions';
import type { Session } from './types';

export type WeeklyStats = { evening: number; morning: number; days: number };

/** 7 הימים האחרונים כולל היום ("ערב: 5/7 · בוקר: 7/7"). */
export function weeklyStats(sessions: Session[], now: Date, installDate: string): WeeklyStats {
  const byDay = indexByDay(sessions);
  const today = logicalDate(now);
  let evening = 0;
  let morning = 0;
  for (let i = 0; i < 7; i++) {
    const day = addDays(today, -i);
    if (isSlotDone(byDay, day, 'evening')) evening++;
    if (isSlotDone(byDay, day, 'morning')) morning++;
  }
  // ימים לפני ההתקנה לא נכנסים למכנה.
  const firstDay = addDays(today, -6) < installDate ? installDate : addDays(today, -6);
  return { evening, morning, days: Math.max(1, daysBetween(firstDay, today) + 1) };
}

/** אחוז ערבים שבוצעו בחודש (מתוך הימים שכבר עברו בו ומאז ההתקנה). */
export function monthlyEveningPercent(sessions: Session[], year: number, month: number, now: Date, installDate: string): number | null {
  const byDay = indexByDay(sessions);
  const today = logicalDate(now);
  const lastDay = new Date(year, month + 1, 0).getDate();
  let done = 0;
  let total = 0;
  for (let d = 1; d <= lastDay; d++) {
    const key = toDateKey(new Date(year, month, d));
    if (key < installDate || key > today) continue;
    const isDone = isSlotDone(byDay, key, 'evening');
    if (key === today && !isDone) continue;
    total++;
    if (isDone) done++;
  }
  return total === 0 ? null : Math.round((done / total) * 100);
}
