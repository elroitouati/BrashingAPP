/** צחצוח מלא: 120 שניות, 4 רבעים × 30 שניות. */
export const FULL_DURATION_SEC = 120;
/** גרסת הצלה: 30 שניות. */
export const RESCUE_DURATION_SEC = 30;
export const QUARTERS = 4;

export type TimerMode = 'full' | 'rescue';

/** סדר הרבעים: ימין למעלה, שמאל למעלה, שמאל למטה, ימין למטה. */
export const QUARTER_LABELS = ['ימין למעלה', 'שמאל למעלה', 'שמאל למטה', 'ימין למטה'] as const;

export const QUARTER_GUIDANCE =
  'צד חיצוני, צד פנימי, משטח לעיסה. זווית 45° לחניכיים, תנועות קטנות.';

export function durationFor(mode: TimerMode): number {
  return mode === 'rescue' ? RESCUE_DURATION_SEC : FULL_DURATION_SEC;
}

export type TimerPhase = {
  /** שניות שעברו (שלמות). */
  elapsedSec: number;
  /** שניות שנותרו לתצוגה — מעוגל כלפי מעלה, כך ש-2:00 מוצג עד שעוברת שנייה שלמה. */
  remainingSec: number;
  /** הרבע הפעיל, 0–3. */
  quarter: number;
  /** 0–1 */
  progress: number;
  finished: boolean;
};

/** מצב הטיימר לפי זמן שעבר במילישניות. מבוסס שעון, לא ספירת טיקים — לכן מדויק. */
export function timerPhase(elapsedMs: number, totalSec: number): TimerPhase {
  const totalMs = totalSec * 1000;
  const clamped = Math.min(Math.max(elapsedMs, 0), totalMs);
  const quarterMs = totalMs / QUARTERS;
  return {
    elapsedSec: Math.floor(clamped / 1000),
    remainingSec: Math.ceil((totalMs - clamped) / 1000),
    quarter: Math.min(QUARTERS - 1, Math.floor(clamped / quarterMs)),
    progress: clamped / totalMs,
    finished: clamped >= totalMs,
  };
}

export type TimerCue = 'quarter' | 'finish';

/**
 * אילו אותות (רטט + צליל) צריך להשמיע במעבר בין שני רגעים.
 * בטיימר מלא: רבע ב-30/60/90, סיום ב-120.
 */
export function cuesBetween(prevMs: number, nextMs: number, totalSec: number): TimerCue[] {
  const totalMs = totalSec * 1000;
  const quarterMs = totalMs / QUARTERS;
  const cues: TimerCue[] = [];
  for (let q = 1; q < QUARTERS; q++) {
    const t = q * quarterMs;
    if (prevMs < t && nextMs >= t) cues.push('quarter');
  }
  if (prevMs < totalMs && nextMs >= totalMs) cues.push('finish');
  return cues;
}
