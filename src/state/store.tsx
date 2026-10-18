import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { AppState } from 'react-native';

import { logicalDate } from '../lib/date';
import { planNotifications } from '../lib/notificationPlan';
import { applyPlan, configureNotifications, ensurePermission } from '../lib/notifications';
import { deletePhotoFile } from '../lib/photos';
import { indexByDay, newId } from '../lib/sessions';
import { loadData, saveData } from '../lib/storage';
import { computeStreak } from '../lib/streak';
import type { AppData, Session, Settings, Slot, StreakState, WhiteningPhoto } from '../lib/types';

type NewSession = { slot: Slot; startedAt: Date; durationSec: number; type: Session['type'] };

type Store = {
  data: AppData;
  /** "עכשיו" שמתעדכן כל חצי דקה ובחזרה לאפליקציה — כדי שמצבים תלויי-שעה יתעדכנו. */
  now: Date;
  today: string;
  byDay: Map<string, Session[]>;
  streak: StreakState;
  notificationsGranted: boolean | null;
  addSession: (s: NewSession) => Session;
  addPhoto: (p: Omit<WhiteningPhoto, 'id'> & { id?: string }) => void;
  updatePhoto: (id: string, patch: Partial<WhiteningPhoto>) => void;
  deletePhoto: (id: string) => void;
  updateSettings: (patch: Partial<Settings>) => void;
};

const StoreContext = createContext<Store | null>(null);

export function StoreProvider({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) {
  const [data, setData] = useState<AppData | null>(null);
  const [now, setNow] = useState(() => new Date());
  const [granted, setGranted] = useState<boolean | null>(null);
  const loaded = useRef(false);

  useEffect(() => {
    loadData(logicalDate(new Date())).then((d) => {
      loaded.current = true;
      setData(d);
    });
    configureNotifications()
      .then(ensurePermission)
      .then(setGranted)
      .catch(() => setGranted(false));
  }, []);

  useEffect(() => {
    const tick = () => setNow(new Date());
    const id = setInterval(tick, 30_000);
    const sub = AppState.addEventListener('change', (s) => s === 'active' && tick());
    return () => {
      clearInterval(id);
      sub.remove();
    };
  }, []);

  useEffect(() => {
    if (data && loaded.current) saveData(data).catch(() => {});
  }, [data]);

  const today = logicalDate(now);
  const streak = useMemo(() => (data ? computeStreak(data.sessions, data.installDate, now) : null), [data, today]); // eslint-disable-line react-hooks/exhaustive-deps
  const byDay = useMemo(() => indexByDay(data?.sessions ?? []), [data?.sessions]);

  // תזמון מחדש של כל ההתראות: בפתיחה, בכל שינוי נתונים ובכל מעבר יום.
  useEffect(() => {
    if (!data || !streak || granted !== true) return;
    const plan = planNotifications({
      now: new Date(),
      settings: data.settings,
      sessions: data.sessions,
      installDate: data.installDate,
      currentStreak: streak.current,
    });
    applyPlan(plan).catch(() => {});
  }, [data, streak, granted, today]);

  const addSession = useCallback((s: NewSession) => {
    const session: Session = {
      id: newId(),
      date: logicalDate(s.startedAt),
      slot: s.slot,
      startedAt: s.startedAt.toISOString(),
      durationSec: Math.round(s.durationSec),
      type: s.type,
    };
    setData((d) => (d ? { ...d, sessions: [...d.sessions, session] } : d));
    setNow(new Date());
    return session;
  }, []);

  const addPhoto = useCallback((p: Omit<WhiteningPhoto, 'id'> & { id?: string }) => {
    const photo: WhiteningPhoto = { ...p, id: p.id ?? newId() };
    setData((d) => (d ? { ...d, photos: [...d.photos, photo].sort((a, b) => a.date.localeCompare(b.date)) } : d));
  }, []);

  const updatePhoto = useCallback((id: string, patch: Partial<WhiteningPhoto>) => {
    setData((d) => (d ? { ...d, photos: d.photos.map((p) => (p.id === id ? { ...p, ...patch } : p)) } : d));
  }, []);

  const deletePhoto = useCallback(
    (id: string) => {
      const photo = data?.photos.find((p) => p.id === id);
      if (photo) deletePhotoFile(photo.uri);
      setData((d) => (d ? { ...d, photos: d.photos.filter((p) => p.id !== id) } : d));
    },
    [data],
  );

  const updateSettings = useCallback((patch: Partial<Settings>) => {
    setData((d) => (d ? { ...d, settings: { ...d.settings, ...patch } } : d));
  }, []);

  if (!data || !streak) return <>{fallback ?? null}</>;

  return (
    <StoreContext.Provider
      value={{
        data,
        now,
        today,
        byDay,
        streak,
        notificationsGranted: granted,
        addSession,
        addPhoto,
        updatePhoto,
        deletePhoto,
        updateSettings,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
}

export function useStore(): Store {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used inside StoreProvider');
  return ctx;
}
