import AsyncStorage from '@react-native-async-storage/async-storage';

import type { AppData, Settings } from './types';

const KEY = 'brushing-app/data/v1';

export function defaultSettings(today: string): Settings {
  return {
    dinnerEndTime: '20:00',
    bedTime: '23:30',
    morningReminder: false,
    morningReminderTime: '08:00',
    lastBrushChange: today,
  };
}

export function emptyData(today: string): AppData {
  return { version: 1, installDate: today, sessions: [], photos: [], settings: defaultSettings(today) };
}

export async function loadData(today: string): Promise<AppData> {
  const raw = await AsyncStorage.getItem(KEY);
  if (!raw) return emptyData(today);
  try {
    const parsed = JSON.parse(raw) as Partial<AppData>;
    const base = emptyData(today);
    return {
      ...base,
      ...parsed,
      settings: { ...base.settings, ...parsed.settings },
      sessions: parsed.sessions ?? [],
      photos: parsed.photos ?? [],
    };
  } catch {
    return emptyData(today);
  }
}

export async function saveData(data: AppData): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify(data));
}
