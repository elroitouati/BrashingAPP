import { atLogicalTime, isRescueHour, logicalDate, slotFor } from './date';
import { planNotifications, TEXT } from './notificationPlan';
import { isCounted, slotStatus, indexByDay } from './sessions';
import { computeStreak } from './streak';
import { cuesBetween, timerPhase } from './timer';
import type { Session, Settings } from './types';

const at = (iso: string) => new Date(iso); // זמן מקומי (ללא Z)

let seq = 0;
function evening(date: string, type: Session['type'] = 'full', durationSec = 120): Session {
  return { id: String(seq++), date, slot: 'evening', startedAt: `${date}T20:15:00`, durationSec, type };
}

const settings: Settings = {
  dinnerEndTime: '20:00',
  bedTime: '23:30',
  morningReminder: false,
  morningReminderTime: '08:00',
  lastBrushChange: '2026-10-01',
};

describe('יום לוגי ושיוך סלוט', () => {
  it('צחצוח ב-00:30 נרשם לערב של היום הקודם', () => {
    const t = at('2026-10-19T00:30:00');
    expect(logicalDate(t)).toBe('2026-10-18');
    expect(slotFor(t)).toBe('evening');
  });

  it('04:00 כבר שייך ליום החדש ולבוקר', () => {
    const t = at('2026-10-19T04:00:00');
    expect(logicalDate(t)).toBe('2026-10-19');
    expect(slotFor(t)).toBe('morning');
  });

  it('לפני 15:00 בוקר, מ-15:00 ערב', () => {
    expect(slotFor(at('2026-10-18T14:59:00'))).toBe('morning');
    expect(slotFor(at('2026-10-18T15:00:00'))).toBe('evening');
  });

  it('שעת שינה אחרי חצות שייכת ללילה של אותו יום לוגי', () => {
    expect(atLogicalTime('2026-10-18', '00:30').toString()).toBe(at('2026-10-19T00:30:00').toString());
  });
});

describe('טיימר', () => {
  it('120 שניות מדויקות, רבעים ב-30/60/90 וסיום ב-120', () => {
    const cues: { t: number; cue: string }[] = [];
    let prev = 0;
    for (let ms = 16; ms <= 121_000; ms += 16) {
      for (const cue of cuesBetween(prev, ms, 120)) cues.push({ t: ms, cue });
      prev = ms;
    }
    expect(cues.map((c) => c.cue)).toEqual(['quarter', 'quarter', 'quarter', 'finish']);
    expect(cues.map((c) => Math.floor(c.t / 1000))).toEqual([30, 60, 90, 120]);
  });

  it('תצוגה: 2:00 בהתחלה, 0 בסיום, רבע פעיל נכון', () => {
    expect(timerPhase(0, 120)).toMatchObject({ remainingSec: 120, quarter: 0, finished: false });
    expect(timerPhase(29_999, 120).quarter).toBe(0);
    expect(timerPhase(30_000, 120).quarter).toBe(1);
    expect(timerPhase(90_000, 120).quarter).toBe(3);
    expect(timerPhase(120_000, 120)).toMatchObject({ remainingSec: 0, quarter: 3, finished: true });
  });
});

describe('רצף ומגן "לא פעמיים"', () => {
  const now = at('2026-10-10T12:00:00');

  it('פספוס ערב אחד עם מגן פעיל לא מאפס את הרצף', () => {
    const s = [evening('2026-10-01'), evening('2026-10-02'), evening('2026-10-03'), /* 4 פוספס */ evening('2026-10-05')];
    const r = computeStreak(s, '2026-10-01', at('2026-10-05T22:00:00'));
    expect(r).toMatchObject({ current: 4, shieldActive: false, shieldRecoveryCount: 1 });
  });

  it('פספוס שני ברצף מאפס', () => {
    const s = [evening('2026-10-01'), evening('2026-10-02'), evening('2026-10-03')];
    const r = computeStreak(s, '2026-10-01', at('2026-10-06T12:00:00'));
    expect(r.current).toBe(0);
    expect(r.best).toBe(3);
  });

  it('פספוס כשהמגן שבור מאפס, והמגן חוזר אחרי 7 ערבים', () => {
    const days = ['01', '03', '04', '05', '06', '07', '08', '09'].map((d) => evening(`2026-10-${d}`));
    const r = computeStreak(days, '2026-10-01', now);
    expect(r).toMatchObject({ current: 8, shieldActive: true, shieldRecoveryCount: 0 });

    const r2 = computeStreak([evening('2026-10-01'), evening('2026-10-03'), evening('2026-10-05')], '2026-10-01', at('2026-10-05T23:00:00'));
    expect(r2.current).toBe(1);
  });

  it('ערב היום שעוד לא בוצע לא נחשב פספוס', () => {
    const r = computeStreak([evening('2026-10-09')], '2026-10-09', at('2026-10-10T21:00:00'));
    expect(r).toMatchObject({ current: 1, shieldActive: true });
  });

  it('הצלה נספרת, חלקי מתחת ל-60 שניות לא נספר', () => {
    expect(isCounted(evening('2026-10-01', 'rescue', 30))).toBe(true);
    expect(isCounted(evening('2026-10-01', 'partial', 59))).toBe(false);
    expect(isCounted(evening('2026-10-01', 'partial', 75))).toBe(true);
    const r = computeStreak([evening('2026-10-09', 'partial', 40)], '2026-10-09', at('2026-10-10T21:00:00'));
    expect(r.current).toBe(0);
  });
});

describe('גרסת הצלה', () => {
  it('זמינה רק מ-22:00 ועד סוף היום הלוגי', () => {
    expect(isRescueHour(at('2026-10-18T21:59:00'))).toBe(false);
    expect(isRescueHour(at('2026-10-18T22:00:00'))).toBe(true);
    expect(isRescueHour(at('2026-10-19T01:00:00'))).toBe(true);
    expect(isRescueHour(at('2026-10-19T05:00:00'))).toBe(false);
  });
});

describe('סטטוס סלוטים', () => {
  it('בוקר פוספס אחרי 15:00, ערב ממתין עד סוף היום', () => {
    const byDay = indexByDay([]);
    expect(slotStatus(byDay, '2026-10-18', 'morning', at('2026-10-18T16:00:00'))).toBe('missed');
    expect(slotStatus(byDay, '2026-10-18', 'evening', at('2026-10-19T02:00:00'))).toBe('pending');
  });
});

describe('תכנון התראות', () => {
  const base = { settings, installDate: '2026-10-01', currentStreak: 5 };

  it('שלוש התראות ערב בזמנים הנכונים, אף אחת אחרי שעת השינה', () => {
    const now = at('2026-10-18T12:00:00');
    const plan = planNotifications({ ...base, now, sessions: [evening('2026-10-17')] }).filter((n) => n.day === '2026-10-18');
    expect(plan.map((n) => n.kind)).toEqual(['evening-main', 'evening-followup', 'evening-rescue']);
    expect(plan.map((n) => n.at.toTimeString().slice(0, 5))).toEqual(['20:10', '20:45', '23:00']);
    expect(plan[0].body).toBe(TEXT.main);
    expect(plan[1].body).toBe(TEXT.followup(5));
    expect(plan[2].url).toBe('/timer?mode=rescue');
  });

  it('סימון צחצוח ערב מבטל את כל התראות הערב שנשארו באותו יום', () => {
    const now = at('2026-10-18T20:20:00');
    const before = planNotifications({ ...base, now, sessions: [evening('2026-10-17')] });
    expect(before.some((n) => n.day === '2026-10-18')).toBe(true);
    const after = planNotifications({ ...base, now, sessions: [evening('2026-10-17'), evening('2026-10-18')] });
    expect(after.some((n) => n.day === '2026-10-18')).toBe(false);
    // מחר ההתראה הראשית רגילה, כי היום בוצע.
    expect(after.find((n) => n.kind === 'evening-main')?.body).toBe(TEXT.main);
  });

  it('אם אתמול פוספס — ההתראה הראשית אומרת "אסור לפספס פעמיים"', () => {
    const now = at('2026-10-18T12:00:00');
    const plan = planNotifications({ ...base, now, sessions: [] });
    expect(plan[0].body.startsWith(TEXT.mainAfterMiss)).toBe(true);
  });

  it('בלי התראות אחרי שעת השינה גם כששעת השינה מוקדמת', () => {
    const now = at('2026-10-18T12:00:00');
    const plan = planNotifications({ ...base, now, settings: { ...settings, bedTime: '20:40' }, sessions: [] }).filter(
      (n) => n.day === '2026-10-18',
    );
    expect(plan.map((n) => n.kind)).toEqual(['evening-main', 'evening-rescue']);
    expect(plan.every((n) => n.at < atLogicalTime('2026-10-18', '20:40'))).toBe(true);
  });

  it('לא יותר מ-3 התראות בערב, ובלי התראות שזמנן עבר', () => {
    const now = at('2026-10-18T20:30:00');
    const plan = planNotifications({ ...base, now, sessions: [] });
    const byDay = new Map<string, number>();
    plan.forEach((n) => n.kind.startsWith('evening') && byDay.set(n.day, (byDay.get(n.day) ?? 0) + 1));
    expect(Math.max(...byDay.values())).toBeLessThanOrEqual(3);
    expect(byDay.get('2026-10-18')).toBe(2);
    expect(plan.every((n) => n.at > now)).toBe(true);
  });
});
