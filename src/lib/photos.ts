import { Directory, File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

import type { AppData } from './types';

function photosDir(): Directory {
  const dir = new Directory(Paths.document, 'whitening');
  if (!dir.exists) dir.create({ intermediates: true, idempotent: true });
  return dir;
}

/** מעתיק תמונה (מהמצלמה או מהגלריה) לתיקיית המסמכים של האפליקציה — אחסון מקומי קבוע. */
export function persistPhoto(sourceUri: string, id: string): string {
  const src = new File(sourceUri);
  const dest = new File(photosDir(), `${id}.jpg`);
  if (dest.exists) dest.delete();
  src.copy(dest);
  return dest.uri;
}

export function deletePhotoFile(uri: string): void {
  try {
    const f = new File(uri);
    if (f.exists) f.delete();
  } catch {
    // הקובץ כבר לא קיים — אין מה לעשות.
  }
}

/** ייצוא כל הנתונים ל-JSON ושיתוף (גיבוי). */
export async function exportJson(data: AppData): Promise<void> {
  const stamp = new Date().toISOString().slice(0, 10);
  const file = new File(Paths.cache, `brushing-backup-${stamp}.json`);
  if (file.exists) file.delete();
  file.create();
  file.write(JSON.stringify({ exportedAt: new Date().toISOString(), ...data }, null, 2));
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(file.uri, { mimeType: 'application/json', dialogTitle: 'ייצוא נתונים', UTI: 'public.json' });
  } else {
    throw new Error('sharing-unavailable');
  }
}
