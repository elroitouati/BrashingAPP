import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { Banner, Button, Card, Screen, ScreenTitle } from '../../components/ui';
import { ShieldBadge } from '../../components/ShieldBadge';
import { formatDateLong, formatTime, slotFor } from '../../lib/date';
import { firstCounted, isSlotDone, missedYesterdayEvening, slotStatus, type SlotStatus } from '../../lib/sessions';
import type { Slot } from '../../lib/types';
import { useStore } from '../../state/store';
import { colors, radius, space, tabular, type } from '../../theme';

export default function TodayScreen() {
  const { data, now, today, byDay, streak, notificationsGranted } = useStore();

  const eveningDone = isSlotDone(byDay, today, 'evening');
  const missedYesterday = !eveningDone && missedYesterdayEvening(byDay, now, data.installDate);
  const nextSlot = slotFor(now);

  return (
    <Screen>
      <ScreenTitle title="היום" subtitle={formatDateLong(today)} />

      {missedYesterday ? <Banner tone="danger" icon="alert-circle-outline" text="פספסת אתמול. היום אסור לפספס פעמיים." /> : null}
      {notificationsGranted === false ? (
        <Banner tone="warning" icon="notifications-off-outline" text="ההתראות כבויות. בלי תזכורת הערב קל לפספס — אפשר להפעיל בהגדרות המכשיר." />
      ) : null}

      <View style={styles.slots}>
        <SlotCard slot="morning" status={slotStatus(byDay, today, 'morning', now)} time={firstCounted(byDay, today, 'morning')?.startedAt} />
        <SlotCard slot="evening" status={slotStatus(byDay, today, 'evening', now)} time={firstCounted(byDay, today, 'evening')?.startedAt} />
      </View>

      <Card style={styles.streakCard}>
        <View style={{ flex: 1 }}>
          <Text style={type.caption}>רצף ערב</Text>
          <Text style={[type.display, { color: colors.primary }]}>{streak.current}</Text>
          <Text style={[type.muted, tabular]}>השיא שלך: {streak.best}</Text>
        </View>
        <ShieldBadge active={streak.shieldActive} recovery={streak.shieldRecoveryCount} />
      </Card>

      {eveningDone ? (
        <Card style={styles.kitchen}>
          <Ionicons name="moon-outline" size={28} color={colors.primary} />
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={[type.heading, { color: colors.primary }]}>המטבח סגור</Text>
            <Text style={type.body}>מעכשיו רק מים עד הבוקר.</Text>
          </View>
        </Card>
      ) : null}

      <Button
        size="lg"
        icon="play"
        label="התחל צחצוח"
        onPress={() => router.navigate('/timer?autostart=1')}
        style={{ marginTop: space.sm }}
      />
      <Text style={[type.caption, { textAlign: 'center' }]}>
        {nextSlot === 'morning' ? 'יירשם כצחצוח בוקר' : eveningDone ? 'הערב כבר סומן' : 'יירשם כצחצוח ערב'}
      </Text>
    </Screen>
  );
}

const STATUS: Record<SlotStatus, { label: string; color: string; bg: string; icon: 'checkmark-circle' | 'ellipse-outline' | 'close-circle-outline' | 'flash' }> = {
  done: { label: 'בוצע', color: colors.success, bg: colors.successSoft, icon: 'checkmark-circle' },
  rescue: { label: 'בוצע · הצלה', color: colors.warning, bg: colors.warningSoft, icon: 'flash' },
  pending: { label: 'ממתין', color: colors.textMuted, bg: colors.surfaceRaised, icon: 'ellipse-outline' },
  missed: { label: 'פוספס', color: colors.textFaint, bg: colors.surfaceRaised, icon: 'close-circle-outline' },
};

function SlotCard({ slot, status, time }: { slot: Slot; status: SlotStatus; time?: string }) {
  const s = STATUS[status];
  return (
    <Card style={[styles.slotCard, (status === 'done' || status === 'rescue') && { borderColor: s.color }]}>
      <View style={styles.slotHead}>
        <Ionicons name={slot === 'morning' ? 'sunny-outline' : 'moon-outline'} size={20} color={colors.textMuted} />
        <Text style={type.heading}>{slot === 'morning' ? 'בוקר' : 'ערב'}</Text>
      </View>
      <View style={[styles.pill, { backgroundColor: s.bg }]}>
        <Ionicons name={s.icon} size={18} color={s.color} />
        <Text style={{ color: s.color, fontWeight: '700', fontSize: 14 }}>{s.label}</Text>
      </View>
      <Text style={[type.hero, { fontSize: 30, color: time ? colors.text : colors.textFaint }]}>{time ? formatTime(new Date(time)) : '--:--'}</Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  slots: { flexDirection: 'row', gap: space.md },
  slotCard: { flex: 1, gap: space.md },
  slotHead: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingHorizontal: space.md,
    paddingVertical: 6,
    borderRadius: radius.pill,
  },
  streakCard: { flexDirection: 'row', alignItems: 'center' },
  kitchen: { flexDirection: 'row', alignItems: 'center', gap: space.lg, backgroundColor: colors.primarySoft, borderColor: 'transparent' },
});
