import type { Slot } from './types';

/** שעת המעבר של היום הלוגי: צחצוח עד 04:00 בלילה נרשם ליום הקודם. */
export const DAY_ROLLOVER_HOUR = 4;
/** לפני 15:00 = בוקר. */
export const MORNING_END_HOUR = 15;
/** גרסת ההצלה זמינה רק מהשעה הזו. */
export const RESCUE_FROM_HOUR = 22;

const pad = (n: number) => String(n).padStart(2, '0');

/** תאריך קלנדרי מקומי בפורמט YYYY-MM-DD. */
export function toDateKey(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** חצות מקומית של התאריך. */
export function fromDateKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(key: string, days: number): string {
  const d = fromDateKey(key);
  d.setDate(d.getDate() + days);
  return toDateKey(d);
}

export function addMonths(key: string, months: number): string {
  const d = fromDateKey(key);
  const day = d.getDate();
  d.setDate(1);
  d.setMonth(d.getMonth() + months);
  const lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  d.setDate(Math.min(day, lastDay));
  return toDateKey(d);
}

/** מספר הימים בין שני תאריכים (b - a). */
export function daysBetween(a: string, b: string): number {
  return Math.round((fromDateKey(b).getTime() - fromDateKey(a).getTime()) / 86_400_000);
}

/** היום הלוגי של רגע נתון: לפני 04:00 שייך ליום הקודם. */
export function logicalDate(at: Date): string {
  const d = new Date(at);
  if (d.getHours() < DAY_ROLLOVER_HOUR) d.setDate(d.getDate() - 1);
  return toDateKey(d);
}

/** שיוך אוטומטי לבוקר או לערב לפי השעה. */
export function slotFor(at: Date): Slot {
  const h = at.getHours();
  return h >= DAY_ROLLOVER_HOUR && h < MORNING_END_HOUR ? 'morning' : 'evening';
}

export function parseTime(hhmm: string): { h: number; m: number } {
  const [h, m] = hhmm.split(':').map(Number);
  return { h: h || 0, m: m || 0 };
}

export function formatTime(d: Date): string {
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function timeFromDate(d: Date): string {
  return formatTime(d);
}

/**
 * הרגע המוחלט של שעה "HH:MM" בתוך יום לוגי.
 * שעות לפני 04:00 שייכות ללילה שאחרי (למשל שעת שינה 00:30).
 */
export function atLogicalTime(dateKey: string, hhmm: string, offsetMin = 0): Date {
  const { h, m } = parseTime(hhmm);
  const d = fromDateKey(dateKey);
  if (h < DAY_ROLLOVER_HOUR) d.setDate(d.getDate() + 1);
  d.setHours(h, m + offsetMin, 0, 0);
  return d;
}

/** האם גרסת ההצלה פתוחה בשעה הנוכחית: מ-22:00 ועד סוף היום הלוגי. */
export function isRescueHour(at: Date): boolean {
  const h = at.getHours();
  return h >= RESCUE_FROM_HOUR || h < DAY_ROLLOVER_HOUR;
}

const HE_MONTHS = [
  'ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני',
  'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר',
];
const HE_DAYS = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];
export const HE_DAY_LETTERS = ['א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳', 'ש׳'];

export function monthName(month: number): string {
  return HE_MONTHS[month];
}

/** "18.10.2026" */
export function formatDateShort(key: string): string {
  const [y, m, d] = key.split('-');
  return `${Number(d)}.${Number(m)}.${y}`;
}

/** "יום ראשון, 18 באוקטובר" */
export function formatDateLong(key: string): string {
  const d = fromDateKey(key);
  return `יום ${HE_DAYS[d.getDay()]}, ${d.getDate()} ב${HE_MONTHS[d.getMonth()]}`;
}

export function formatDuration(sec: number): string {
  const s = Math.max(0, Math.round(sec));
  return `${Math.floor(s / 60)}:${pad(s % 60)}`;
}
