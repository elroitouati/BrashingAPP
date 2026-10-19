import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { ShieldBadge } from '../../components/ShieldBadge';
import { Banner, Button, Card, PressableScale, Screen, ScreenTitle } from '../../components/ui';
import { atLogicalTime, formatDateLong, formatTime, slotFor } from '../../lib/date';
import { firstCounted, missedYesterdayEvening, slotStatus, type SlotStatus } from '../../lib/sessions';
import { useStore } from '../../state/store';
import { colors, font, motion, radius, space, tabular, type } from '../../theme';

export default function TodayScreen() {
  const { data, now, today, byDay, streak, notificationsGranted } = useStore();

  const evening = slotStatus(byDay, today, 'evening', now);
  const morning = slotStatus(byDay, today, 'morning', now);
  const eveningDone = evening === 'done' || evening === 'rescue';
  const missedYesterday = !eveningDone && missedYesterdayEvening(byDay, now, data.installDate);
  const isMorningNow = slotFor(now) === 'morning';
  const startBrushing = () => router.navigate('/timer?autostart=1');

  return (
    <Screen>
      <ScreenTitle title="היום" subtitle={formatDateLong(today)} />

      {missedYesterday ? <Banner tone="danger" icon="alert-circle-outline" text="פספסת אתמול. היום אסור לפספס פעמיים." /> : null}
      {notificationsGranted === false ? (
        <Banner tone="warning" icon="notifications-off-outline" text="ההתראות כבויות. בלי תזכורת הערב קל לפספס — אפשר להפעיל בהגדרות המכשיר." />
      ) : null}

      <EveningHero
        status={evening}
        doneAt={firstCounted(byDay, today, 'evening')?.startedAt}
        reminderAt={formatTime(atLogicalTime(today, data.settings.dinnerEndTime, 10))}
        dinnerEnd={data.settings.dinnerEndTime}
        primaryCta={!isMorningNow && !eveningDone}
        onStart={startBrushing}
      />

      <MorningRow status={morning} doneAt={firstCounted(byDay, today, 'morning')?.startedAt} primaryCta={isMorningNow && morning === 'pending'} onStart={startBrushing} />

      <PressableScale onPress={() => router.navigate('/streak')} accessibilityRole="button" accessibilityLabel={`רצף ערב ${streak.current}, השיא ${streak.best}`} style={styles.streak}>
        <View style={{ flex: 1 }}>
          <Text style={type.label}>רצף ערב</Text>
          <View style={styles.streakNumber}>
            <Text style={[type.display, { color: colors.primary }]}>{streak.current}</Text>
            <Text style={type.muted}>{streak.current === 1 ? 'ערב' : 'ערבים'}</Text>
          </View>
          <Text style={[type.caption, tabular]}>{streak.current === 0 ? 'הרצף מתחיל הערב.' : `השיא שלך: ${streak.best}`}</Text>
        </View>
        <ShieldBadge active={streak.shieldActive} recovery={streak.shieldRecoveryCount} />
      </PressableScale>
    </Screen>
  );
}

type HeroProps = {
  status: SlotStatus;
  doneAt?: string;
  reminderAt: string;
  dinnerEnd: string;
  primaryCta: boolean;
  onStart: () => void;
};

/** החתימה של המסך: הערב הוא הסיבה שהאפליקציה קיימת, ולכן הוא הכרטיס הגדול. */
function EveningHero({ status, doneAt, reminderAt, dinnerEnd, primaryCta, onStart }: HeroProps) {
  const done = status === 'done' || status === 'rescue';

  if (done) {
    return (
      <Animated.View entering={FadeIn.duration(motion.enter).easing(motion.easeOut)} style={[styles.hero, styles.heroDone]}>
        <View style={styles.heroHead}>
          <Ionicons name="moon" size={20} color={colors.primary} />
          <Text style={[type.label, { color: colors.primary, flex: 1 }]}>הערב</Text>
          <StatusChip status={status} />
        </View>
        <Text style={[type.title, { fontSize: 32, lineHeight: 40 }]}>המטבח סגור</Text>
        <Text style={type.body}>מעכשיו רק מים עד הבוקר.</Text>
        {doneAt ? <Text style={[type.caption, tabular]}>סומן ב-{formatTime(new Date(doneAt))}</Text> : null}
      </Animated.View>
    );
  }

  return (
    <View style={styles.hero}>
      <View style={styles.heroHead}>
        <Ionicons name="moon-outline" size={20} color={colors.textMuted} />
        <Text style={[type.label, { flex: 1 }]}>הערב</Text>
        <StatusChip status={status} />
      </View>
      <Text style={[type.title, { fontSize: 32, lineHeight: 40 }]}>מיד אחרי הארוחה</Text>
      <Text style={type.muted}>
        הארוחה נגמרת ב-{dinnerEnd}, התזכורת מגיעה ב-{reminderAt}. אחרי זה רק מים — ואין ״כבר מאוחר״.
      </Text>
      <Button size="lg" icon="play" label="התחל צחצוח" variant={primaryCta ? 'primary' : 'secondary'} onPress={onStart} style={{ marginTop: space.sm }} />
    </View>
  );
}

function MorningRow({ status, doneAt, primaryCta, onStart }: { status: SlotStatus; doneAt?: string; primaryCta: boolean; onStart: () => void }) {
  return (
    <Card style={styles.morning}>
      <Ionicons name="sunny-outline" size={22} color={colors.textMuted} />
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={type.heading}>בוקר</Text>
        <Text style={[type.caption, tabular]}>{doneAt ? `בוצע ב-${formatTime(new Date(doneAt))}` : status === 'missed' ? 'לא סומן הבוקר' : 'עד 15:00'}</Text>
      </View>
      {primaryCta ? <Button size="sm" icon="play" label="התחל" onPress={onStart} /> : <StatusChip status={status} />}
    </Card>
  );
}

const CHIP: Record<SlotStatus, { label: string; color: string; bg: string; icon: 'checkmark' | 'ellipse-outline' | 'remove' | 'flash' }> = {
  done: { label: 'בוצע', color: colors.success, bg: colors.successSoft, icon: 'checkmark' },
  rescue: { label: 'בוצע · הצלה', color: colors.warning, bg: colors.warningSoft, icon: 'flash' },
  pending: { label: 'ממתין', color: colors.textMuted, bg: colors.surfaceRaised, icon: 'ellipse-outline' },
  missed: { label: 'פוספס', color: colors.textMuted, bg: colors.surfaceRaised, icon: 'remove' },
};

function StatusChip({ status }: { status: SlotStatus }) {
  const c = CHIP[status];
  return (
    <View style={[styles.chip, { backgroundColor: c.bg }]}>
      <Ionicons name={c.icon} size={14} color={c.color} />
      <Text style={{ color: c.color, fontFamily: font.semibold, fontSize: 13, lineHeight: 18 }}>{c.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: space.xl,
    gap: space.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  heroDone: { backgroundColor: colors.primarySoft, borderColor: colors.primaryLine },
  heroHead: { flexDirection: 'row', alignItems: 'center', gap: space.sm, marginBottom: space.xs },
  morning: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingVertical: space.lg },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: space.md,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  streak: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: space.lg + 4,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  streakNumber: { flexDirection: 'row', alignItems: 'baseline', gap: space.sm },
});
