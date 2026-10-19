import Ionicons from '@expo/vector-icons/Ionicons';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  FadeIn,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { MouthDiagram } from '../../components/MouthDiagram';
import { TimerRing } from '../../components/TimerRing';
import { Banner, Button, PressableScale, Screen } from '../../components/ui';
import { formatDuration, isRescueHour, slotFor } from '../../lib/date';
import { finishCue, prepareFeedback, quarterCue, tapCue } from '../../lib/feedback';
import { isSlotDone, MIN_COUNTED_PARTIAL_SEC } from '../../lib/sessions';
import { cuesBetween, durationFor, QUARTER_GUIDANCE, QUARTER_LABELS, timerPhase, type TimerMode } from '../../lib/timer';
import type { Slot } from '../../lib/types';
import { useStore } from '../../state/store';
import { colors, font, motion, radius, space, tabular, type } from '../../theme';

const KEEP_AWAKE_TAG = 'brushing-timer';
const TICK_MS = 50;

type Phase = 'idle' | 'running' | 'paused' | 'finished';

export default function TimerScreen() {
  const { now, today, byDay, addSession } = useStore();
  const params = useLocalSearchParams<{ mode?: string; autostart?: string }>();

  const [selectedMode, setMode] = useState<TimerMode>('full');
  const [phase, setPhase] = useState<Phase>('idle');
  const [elapsedMs, setElapsedMs] = useState(0);
  const [slot, setSlot] = useState<Slot>(() => slotFor(new Date()));

  const startRef = useRef(0); // Date.now() פחות הזמן שכבר נצבר
  const lastRef = useRef(0);
  const startedAtRef = useRef<Date>(new Date());
  // התקדמות הטבעת רצה על ה-UI thread; React מתרנדר רק פעם בשנייה, כשהספרות משתנות.
  const progress = useSharedValue(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const eveningDone = isSlotDone(byDay, today, 'evening');
  const rescueAvailable = isRescueHour(now) && !eveningDone;
  // גרסת הצלה שנבחרה ולא התחילה חוזרת ל-2:00 אם החלון שלה נסגר (04:00) או שהערב כבר סומן.
  const mode: TimerMode = phase === 'idle' && selectedMode === 'rescue' && !rescueAvailable ? 'full' : selectedMode;
  const total = durationFor(mode);
  const t = timerPhase(elapsedMs, total);

  useEffect(prepareFeedback, []);

  const stopTicking = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = null;
    cancelAnimation(progress);
    deactivateKeepAwake(KEEP_AWAKE_TAG).catch(() => {});
  }, [progress]);

  useEffect(() => stopTicking, [stopTicking]);

  const tick = useCallback(
    (totalSec: number) => {
      const elapsed = Date.now() - startRef.current;
      for (const cue of cuesBetween(lastRef.current, elapsed, totalSec)) {
        if (cue === 'quarter') quarterCue();
        else finishCue();
      }
      lastRef.current = elapsed;
      // עיגול לשנייה: אותו ערך = אין רינדור. הטיק הצפוף (50ms) קיים רק כדי שהרטט ייצא בזמן.
      setElapsedMs(Math.floor(elapsed / 1000) * 1000);
      if (elapsed >= totalSec * 1000) {
        stopTicking();
        setPhase('finished');
      }
    },
    [stopTicking],
  );

  const run = useCallback(
    (fromMs: number, totalSec: number) => {
      startRef.current = Date.now() - fromMs;
      lastRef.current = fromMs;
      activateKeepAwakeAsync(KEEP_AWAKE_TAG).catch(() => {});
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = setInterval(() => tick(totalSec), TICK_MS);
      const totalMs = totalSec * 1000;
      progress.set(fromMs / totalMs);
      progress.set(withTiming(1, { duration: totalMs - fromMs, easing: Easing.linear }));
      setPhase('running');
    },
    [tick, progress],
  );

  const start = useCallback(
    (m: TimerMode) => {
      tapCue();
      const startedAt = new Date();
      startedAtRef.current = startedAt;
      setMode(m);
      setSlot(m === 'rescue' ? 'evening' : slotFor(startedAt));
      setElapsedMs(0);
      run(0, durationFor(m));
    },
    [run],
  );

  const elapsedNow = useCallback(() => Date.now() - startRef.current, []);

  const reset = useCallback(() => {
    stopTicking();
    progress.set(0);
    setPhase('idle');
    setElapsedMs(0);
    setMode('full');
    setSlot(slotFor(new Date()));
  }, [stopTicking, progress]);

  // פתיחה מהתראה או מכפתור "התחל צחצוח": ?mode=rescue / ?autostart=1
  // זה סנכרון חד-פעמי מפרמטרי הניווט, ולכן עדכון state בתוך effect מוצדק כאן.
  useEffect(() => {
    if (!params.mode && !params.autostart) return;
    /* eslint-disable react-hooks/set-state-in-effect */
    if (phase === 'idle') {
      const wantRescue = params.mode === 'rescue' && rescueAvailable;
      if (params.autostart === '1') start(wantRescue ? 'rescue' : 'full');
      else if (wantRescue) setMode('rescue');
    }
    /* eslint-enable react-hooks/set-state-in-effect */
    router.setParams({ mode: undefined, autostart: undefined });
  }, [params.mode, params.autostart]); // eslint-disable-line react-hooks/exhaustive-deps

  const save = (type: 'full' | 'rescue' | 'partial', durationSec: number) => {
    addSession({ slot, startedAt: startedAtRef.current, durationSec, type });
    reset();
    router.navigate('/');
  };

  const stopEarly = () => {
    const sofar = elapsedNow();
    stopTicking();
    setElapsedMs(sofar);
    setPhase('paused');
    const sec = Math.floor(sofar / 1000);
    const counts = mode === 'rescue' || sec >= MIN_COUNTED_PARTIAL_SEC;
    Alert.alert(
      'לסמן כבוצע חלקית?',
      counts
        ? `צחצחת ${formatDuration(sec)}.`
        : `צחצחת ${formatDuration(sec)}. צחצוח מתחת לדקה נשמר, אבל לא נספר לרצף.`,
      [
        { text: 'המשך לצחצח', style: 'cancel', onPress: () => run(sofar, total) },
        { text: 'סמן חלקית', onPress: () => save(mode === 'rescue' ? 'rescue' : 'partial', sec) },
        { text: 'בטל בלי לשמור', style: 'destructive', onPress: reset },
      ],
      { cancelable: false },
    );
  };

  if (phase === 'finished') {
    return <FinishedView mode={mode} slot={slot} onMark={() => save(mode === 'rescue' ? 'rescue' : 'full', total)} onDiscard={reset} />;
  }

  const active = phase !== 'idle';
  const slotLabel = mode === 'rescue' ? 'גרסת הצלה' : slot === 'morning' ? 'צחצוח בוקר' : 'צחצוח ערב';

  return (
    <Screen>
      <View style={styles.header}>
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={type.title}>{slotLabel}</Text>
          <Text style={type.caption}>{mode === 'rescue' ? '30 שניות על כל הפה. נחשב לרצף.' : '4 רבעים × 30 שניות'}</Text>
        </View>
        {!active ? (
          <RescueToggle
            available={rescueAvailable}
            selected={mode === 'rescue'}
            onPress={() => {
              tapCue();
              setMode((m) => (m === 'rescue' ? 'full' : 'rescue'));
            }}
          />
        ) : null}
      </View>

      {!active && slotFor(now) === 'evening' && eveningDone ? <Banner tone="info" icon="checkmark-circle" text="הערב כבר סומן. אפשר לצחצח שוב — זה לא ישנה את הרצף." /> : null}

      <View style={styles.center}>
        <TimerRing size={264} progress={progress} ticks={mode === 'rescue' ? 0 : 4} color={mode === 'rescue' ? colors.warning : colors.primary}>
          <Text style={type.timer} accessibilityLabel={`נותרו ${t.remainingSec} שניות`}>
            {formatDuration(t.remainingSec)}
          </Text>
          <Text style={[type.label, tabular]}>{mode === 'rescue' ? 'כל הפה' : `רבע ${t.quarter + 1} מתוך 4`}</Text>
        </TimerRing>
      </View>

      <QuarterPanel mode={mode} quarter={t.quarter} active={active} />

      <View style={{ marginTop: space.sm }}>
        {phase === 'idle' ? <Button size="lg" icon="play" label={mode === 'rescue' ? 'התחל גרסת הצלה' : 'התחל צחצוח'} onPress={() => start(mode)} /> : null}
        {phase === 'running' ? <Button size="lg" variant="secondary" icon="stop" label="עצור" onPress={stopEarly} /> : null}
        {phase === 'paused' ? <Button size="lg" icon="play" label="המשך" onPress={() => run(elapsedMs, total)} /> : null}
      </View>
    </Screen>
  );
}

function RescueToggle({ available, selected, onPress }: { available: boolean; selected: boolean; onPress: () => void }) {
  if (!available) return null;
  return (
    <PressableScale
      onPress={onPress}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      style={[styles.rescue, selected && { backgroundColor: colors.warningSoft, borderColor: colors.warning }]}
    >
      <Ionicons name={selected ? 'refresh' : 'flash-outline'} size={16} color={colors.warning} />
      <Text style={{ color: colors.warning, fontSize: 14, lineHeight: 20, fontFamily: font.semibold }}>{selected ? 'חזרה ל-2:00' : 'הצלה · 30 שנ׳'}</Text>
    </PressableScale>
  );
}

/** מעבר רבע: הטקסט מתחלף ב-crossfade קצר, באותו רגע של הרטט והצליל — מצב, לא קישוט. */
function QuarterPanel({ mode, quarter, active }: { mode: TimerMode; quarter: number; active: boolean }) {
  const name = mode === 'rescue' ? 'כל הפה' : QUARTER_LABELS[active ? quarter : 0];
  return (
    <View style={styles.quarterPanel}>
      <MouthDiagram active={mode === 'rescue' ? null : active ? quarter : 0} completed={active ? quarter : 0} size={124} />
      <Animated.View key={`${mode}-${name}`} entering={FadeIn.duration(motion.small).easing(motion.easeOut)} style={{ flex: 1, gap: space.xs }}>
        <Text style={type.label}>{active ? 'עכשיו' : 'מתחילים ב'}</Text>
        <Text style={[type.title, { color: colors.primary, fontSize: 24, lineHeight: 32 }]}>{name}</Text>
        <Text style={type.caption}>{QUARTER_GUIDANCE}</Text>
      </Animated.View>
    </View>
  );
}

/**
 * "סיימת" — הרגע הנדיר של היום, ולכן היחיד שמקבל קצת חגיגה:
 * התג נוחת בקפיץ עדין מ-0.9 (לא מ-0), והמסך מהבהב בעדינות שלוש פעמים.
 * בהפחתת תנועה: בלי קנה מידה ובלי הבהוב — רק fade.
 */
function FinishedView({ mode, slot, onMark, onDiscard }: { mode: TimerMode; slot: Slot; onMark: () => void; onDiscard: () => void }) {
  const reduced = useReducedMotion();
  const glow = useSharedValue(0);
  const badge = useSharedValue(reduced ? 1 : 0.9);
  const badgeOpacity = useSharedValue(0);

  useEffect(() => {
    badgeOpacity.set(withTiming(1, { duration: motion.small, easing: motion.easeOut }));
    if (reduced) return;
    badge.set(withSpring(1, { duration: 400, dampingRatio: 0.7 }));
    glow.set(
      withDelay(
        80,
        withRepeat(
          withSequence(
            withTiming(1, { duration: 220, easing: motion.easeOut }),
            withTiming(0, { duration: 380, easing: motion.easeInOut }),
          ),
          3,
        ),
      ),
    );
  }, [reduced, badge, badgeOpacity, glow]);

  const glowStyle = useAnimatedStyle(() => ({ opacity: glow.get() * 0.12 }));
  const badgeStyle = useAnimatedStyle(() => ({ opacity: badgeOpacity.get(), transform: [{ scale: badge.get() }] }));

  return (
    <Screen scroll={false}>
      <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: colors.primary }, glowStyle]} />
      <View style={styles.finished}>
        <Animated.View style={[styles.finishedBadge, badgeStyle]}>
          <Ionicons name="checkmark" size={56} color={colors.onPrimary} />
        </Animated.View>
        <Text style={[type.display, { textAlign: 'center' }]}>סיימת</Text>
        <Text style={[type.muted, tabular, { textAlign: 'center' }]}>
          {mode === 'rescue' ? 'גרסת הצלה · 0:30' : `${slot === 'morning' ? 'בוקר' : 'ערב'} · 2:00 מלאות`}
        </Text>
        <View style={styles.tip}>
          <Ionicons name="water-outline" size={22} color={colors.primary} />
          <Text style={[type.body, { flex: 1 }]}>תירק, אל תשטוף בהרבה מים — כך הפלואוריד נשאר על השיניים.</Text>
        </View>
      </View>
      <View style={{ gap: space.xs }}>
        <Button size="lg" icon="checkmark-circle" label="סמן כבוצע" onPress={onMark} />
        <Button variant="ghost" label="לא לשמור" onPress={onDiscard} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'flex-start', gap: space.md },
  center: { alignItems: 'center', marginVertical: space.lg },
  quarterPanel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.lg,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: space.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  rescue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: 36,
    paddingHorizontal: space.md,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.warningLine,
  },
  finished: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: space.md },
  finishedBadge: {
    width: 104,
    height: 104,
    borderRadius: 52,
    backgroundColor: colors.success,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: space.sm,
  },
  tip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    backgroundColor: colors.primarySoft,
    padding: space.lg,
    borderRadius: radius.md,
    marginTop: space.xl,
  },
});
