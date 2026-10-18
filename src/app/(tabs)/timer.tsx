import Ionicons from '@expo/vector-icons/Ionicons';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';

import { MouthDiagram } from '../../components/MouthDiagram';
import { TimerRing } from '../../components/TimerRing';
import { Banner, Button, Screen } from '../../components/ui';
import { formatDuration, isRescueHour, slotFor } from '../../lib/date';
import { finishCue, prepareFeedback, quarterCue, tapCue } from '../../lib/feedback';
import { isSlotDone, MIN_COUNTED_PARTIAL_SEC } from '../../lib/sessions';
import { cuesBetween, durationFor, QUARTER_GUIDANCE, QUARTER_LABELS, timerPhase, type TimerMode } from '../../lib/timer';
import type { Slot } from '../../lib/types';
import { useStore } from '../../state/store';
import { colors, radius, space, tabular, type } from '../../theme';

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
    deactivateKeepAwake(KEEP_AWAKE_TAG).catch(() => {});
  }, []);

  useEffect(() => stopTicking, [stopTicking]);

  const tick = useCallback(
    (totalSec: number) => {
      const elapsed = Date.now() - startRef.current;
      for (const cue of cuesBetween(lastRef.current, elapsed, totalSec)) {
        if (cue === 'quarter') quarterCue();
        else finishCue();
      }
      lastRef.current = elapsed;
      setElapsedMs(elapsed);
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
      setPhase('running');
    },
    [tick],
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
    setPhase('idle');
    setElapsedMs(0);
    setMode('full');
    setSlot(slotFor(new Date()));
  }, [stopTicking]);

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
  const slotLabel = mode === 'rescue' ? 'גרסת הצלה · ערב' : slot === 'morning' ? 'צחצוח בוקר' : 'צחצוח ערב';

  return (
    <Screen>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={type.title}>{slotLabel}</Text>
          <Text style={type.muted}>{mode === 'rescue' ? '30 שניות על כל הפה. נחשב לרצף.' : '2:00 בדיוק · 4 רבעים × 30 שניות'}</Text>
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
        <TimerRing size={250} progress={t.progress} ticks={mode === 'rescue' ? 0 : 4}>
          <Text style={[type.display, styles.time]} accessibilityLabel={`נותרו ${t.remainingSec} שניות`}>
            {formatDuration(t.remainingSec)}
          </Text>
          <Text style={[type.muted, tabular]}>{mode === 'rescue' ? 'כל הפה' : `רבע ${t.quarter + 1} מתוך 4`}</Text>
        </TimerRing>
      </View>

      <QuarterPanel mode={mode} quarter={t.quarter} active={active} />

      <View style={{ gap: space.sm, marginTop: space.sm }}>
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
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      style={[styles.rescue, selected && { backgroundColor: colors.warningSoft, borderColor: colors.warning }]}
    >
      <Ionicons name="flash-outline" size={14} color={colors.warning} />
      <Text style={{ color: colors.warning, fontSize: 13, fontWeight: '700' }}>{selected ? 'חזרה ל-2:00' : 'גרסת הצלה – 30 שניות'}</Text>
    </Pressable>
  );
}

function QuarterPanel({ mode, quarter, active }: { mode: TimerMode; quarter: number; active: boolean }) {
  const [bump] = useState(() => new Animated.Value(1));
  useEffect(() => {
    if (!active) return;
    bump.setValue(0.92);
    Animated.spring(bump, { toValue: 1, friction: 5, tension: 160, useNativeDriver: true }).start();
  }, [quarter, active, bump]);

  return (
    <View style={styles.quarterPanel}>
      <MouthDiagram active={mode === 'rescue' ? null : active ? quarter : 0} completed={quarter} size={150} />
      <Animated.View style={{ flex: 1, gap: space.xs, transform: [{ scale: bump }] }}>
        <Text style={type.caption}>{mode === 'rescue' ? 'עכשיו' : `רבע ${quarter + 1}`}</Text>
        <Text style={[type.title, { color: colors.primary }]}>{mode === 'rescue' ? 'כל הפה' : QUARTER_LABELS[quarter]}</Text>
        <Text style={type.muted}>{QUARTER_GUIDANCE}</Text>
      </Animated.View>
    </View>
  );
}

function FinishedView({ mode, slot, onMark, onDiscard }: { mode: TimerMode; slot: Slot; onMark: () => void; onDiscard: () => void }) {
  const [glow] = useState(() => new Animated.Value(0));
  useEffect(() => {
    Animated.sequence(
      [0, 1, 2].flatMap(() => [
        Animated.timing(glow, { toValue: 1, duration: 260, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.timing(glow, { toValue: 0, duration: 420, easing: Easing.in(Easing.quad), useNativeDriver: true }),
      ]),
    ).start();
  }, [glow]);

  return (
    <Screen scroll={false}>
      <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: colors.primary, opacity: glow.interpolate({ inputRange: [0, 1], outputRange: [0, 0.12] }) }]} />
      <View style={styles.finished}>
        <View style={styles.finishedBadge}>
          <Ionicons name="checkmark" size={56} color={colors.onPrimary} />
        </View>
        <Text style={[type.hero, { textAlign: 'center' }]}>סיימת</Text>
        <Text style={[type.muted, { textAlign: 'center' }]}>
          {mode === 'rescue' ? 'גרסת הצלה · 0:30' : `${slot === 'morning' ? 'בוקר' : 'ערב'} · 2:00 מלאות`}
        </Text>
        <View style={styles.tip}>
          <Ionicons name="water-outline" size={22} color={colors.primary} />
          <Text style={[type.body, { flex: 1 }]}>תירק, אל תשטוף בהרבה מים — כך הפלואוריד נשאר על השיניים.</Text>
        </View>
      </View>
      <View style={{ gap: space.sm }}>
        <Button size="lg" icon="checkmark-circle" label="סמן כבוצע" onPress={onMark} />
        <Button variant="ghost" label="לא לשמור" onPress={onDiscard} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'flex-start', gap: space.md },
  center: { alignItems: 'center', marginVertical: space.md },
  time: { fontSize: 68, lineHeight: 76 },
  quarterPanel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.lg,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: space.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  rescue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: space.md,
    paddingVertical: 6,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: 'rgba(242,167,102,0.35)',
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
    marginTop: space.lg,
  },
});
