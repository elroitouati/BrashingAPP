import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';
import * as Haptics from 'expo-haptics';

let quarterPlayer: AudioPlayer | null = null;
let donePlayer: AudioPlayer | null = null;

/** טוען את הצלילים מראש, כדי שהצליל יישמע בדיוק ברגע המעבר. */
export function prepareFeedback(): void {
  if (quarterPlayer) return;
  setAudioModeAsync({ playsInSilentMode: false, interruptionMode: 'mixWithOthers' }).catch(() => {});
  quarterPlayer = createAudioPlayer(require('../../assets/sounds/quarter.wav'));
  donePlayer = createAudioPlayer(require('../../assets/sounds/done.wav'));
}

function play(p: AudioPlayer | null) {
  if (!p) return;
  p.seekTo(0)
    .then(() => p.play())
    .catch(() => {});
}

/** מעבר רבע: רטט + צליל קצר. */
export function quarterCue(): void {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});
  play(quarterPlayer);
}

/** סיום: רטט כפול + צליל. */
export function finishCue(): void {
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
  setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {}), 220);
  play(donePlayer);
}

export function tapCue(): void {
  Haptics.selectionAsync().catch(() => {});
}
