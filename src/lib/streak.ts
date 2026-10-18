import { addDays, logicalDate } from './date';
import { indexByDay, isSlotDone } from './sessions';
import type { Session, StreakState } from './types';

/** כמה ערבים רצופים מחזירים מגן שנשבר. */
export const SHIELD_RECOVERY_NIGHTS = 7;

/**
 * חישוב רצף הערב ומגן "לא פעמיים" (סעיף 4.3).
 *
 * - ערב שבוצע: הרצף עולה ב-1. אם המגן שבור, נספר ערב לקראת החזרתו.
 * - פספוס ערב בודד כשהמגן פעיל: המגן נשבר, הרצף נשמר (לא עולה ולא מתאפס).
 * - פספוס כשהמגן שבור (כולל פספוס שני ברצף): הרצף מתאפס.
 * - המגן חוזר אחרי 7 ערבים רצופים.
 * - היום הנוכחי נספר רק אם כבר בוצע — הערב עדיין פתוח עד 04:00.
 */
export function computeStreak(sessions: Session[], installDate: string, now: Date): StreakState {
  const byDay = indexByDay(sessions);
  const today = logicalDate(now);

  const firstSession = sessions.reduce<string | undefined>(
    (min, s) => (min === undefined || s.date < min ? s.date : min),
    undefined,
  );
  let day = firstSession && firstSession < installDate ? firstSession : installDate;

  let current = 0;
  let best = 0;
  let shieldActive = true;
  let shieldRecoveryCount = 0;

  while (day <= today) {
    const done = isSlotDone(byDay, day, 'evening');
    if (day === today && !done) break;

    if (done) {
      current += 1;
      best = Math.max(best, current);
      if (!shieldActive) {
        shieldRecoveryCount += 1;
        if (shieldRecoveryCount >= SHIELD_RECOVERY_NIGHTS) {
          shieldActive = true;
          shieldRecoveryCount = 0;
        }
      }
    } else if (shieldActive) {
      shieldActive = false;
      shieldRecoveryCount = 0;
    } else {
      current = 0;
      shieldRecoveryCount = 0;
    }
    day = addDays(day, 1);
  }

  return { current, best, shieldActive, shieldRecoveryCount };
}
