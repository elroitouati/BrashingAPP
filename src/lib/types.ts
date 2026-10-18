// מודל הנתונים לפי סעיף 7 באפיון.

export type Slot = 'morning' | 'evening';
export type SessionType = 'full' | 'rescue' | 'partial';

export type Session = {
  id: string;
  date: string; // YYYY-MM-DD — יום לוגי (עד 04:00 נחשב ליום הקודם)
  slot: Slot;
  startedAt: string; // ISO
  durationSec: number; // משך בפועל
  type: SessionType;
};

export type WhiteningPhoto = {
  id: string;
  date: string;
  uri: string;
  selfRating: number; // 1–10
};

export type Settings = {
  dinnerEndTime: string; // "20:00"
  bedTime: string; // "23:30"
  morningReminder: boolean;
  morningReminderTime: string; // "08:00" — שעת תזכורת הבוקר כשהיא מופעלת
  lastBrushChange: string; // תאריך
  lastHygienist?: string; // תאריך
  toothpaste?: { name: string; since: string };
};

export type StreakState = {
  current: number;
  best: number;
  shieldActive: boolean;
  shieldRecoveryCount: number; // 0–7
};

export type AppData = {
  version: 1;
  installDate: string; // היום הלוגי הראשון שבו האפליקציה נפתחה
  sessions: Session[];
  photos: WhiteningPhoto[];
  settings: Settings;
};
