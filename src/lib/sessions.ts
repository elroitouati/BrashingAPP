import { addDays, logicalDate, MORNING_END_HOUR } from './date';
import type { Session, Slot } from './types';

/** צחצוח שנעצר באמצע ונמשך פחות מזה לא נספר לרצף. */
export const MIN_COUNTED_PARTIAL_SEC = 60;

export type SlotStatus = 'pending' | 'done' | 'rescue' | 'missed';

/** האם הצחצוח נספר כבוצע: מלא, הצלה, או חלקי של דקה לפחות. */
export function isCounted(s: Session): boolean {
  if (s.type === 'full' || s.type === 'rescue') return true;
  return s.durationSec >= MIN_COUNTED_PARTIAL_SEC;
}

/** איכות הצחצוח הטוב ביותר בסלוט: full ‏> rescue/partial-counted ‏> none. */
export type SlotQuality = 'full' | 'half' | 'none';

export function indexByDay(sessions: Session[]): Map<string, Session[]> {
  const map = new Map<string, Session[]>();
  for (const s of sessions) {
    const list = map.get(s.date);
    if (list) list.push(s);
    else map.set(s.date, [s]);
  }
  return map;
}

export function slotSessions(byDay: Map<string, Session[]>, date: string, slot: Slot): Session[] {
  return (byDay.get(date) ?? []).filter((s) => s.slot === slot);
}

export function slotQuality(byDay: Map<string, Session[]>, date: string, slot: Slot): SlotQuality {
  const list = slotSessions(byDay, date, slot).filter(isCounted);
  if (list.some((s) => s.type === 'full')) return 'full';
  return list.length > 0 ? 'half' : 'none';
}

export function isSlotDone(byDay: Map<string, Session[]>, date: string, slot: Slot): boolean {
  return slotQuality(byDay, date, slot) !== 'none';
}

/** הצחצוח הנספר הראשון בסלוט (להצגת שעת הביצוע). */
export function firstCounted(byDay: Map<string, Session[]>, date: string, slot: Slot): Session | undefined {
  return slotSessions(byDay, date, slot)
    .filter(isCounted)
    .sort((a, b) => a.startedAt.localeCompare(b.startedAt))[0];
}

/** מצב סלוט ביום מסוים, יחסית לרגע הנוכחי. */
export function slotStatus(byDay: Map<string, Session[]>, date: string, slot: Slot, now: Date): SlotStatus {
  const q = slotQuality(byDay, date, slot);
  if (q === 'full') return 'done';
  if (q === 'half') return 'rescue';
  const today = logicalDate(now);
  if (date < today) return 'missed';
  if (date > today) return 'pending';
  // היום: בוקר פוספס אחרי 15:00 (או אחרי חצות), ערב פתוח עד סוף היום הלוגי.
  if (slot === 'morning') {
    const h = now.getHours();
    return h >= MORNING_END_HOUR || h < 4 ? 'missed' : 'pending';
  }
  return 'pending';
}

/** האם הערב של אתמול פוספס (ואתמול היה כבר יום פעיל באפליקציה). */
export function missedYesterdayEvening(byDay: Map<string, Session[]>, now: Date, installDate: string): boolean {
  const yesterday = addDays(logicalDate(now), -1);
  if (yesterday < installDate) return false;
  return !isSlotDone(byDay, yesterday, 'evening');
}

export function newId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}
