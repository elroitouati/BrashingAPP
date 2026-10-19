import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { MonthHeatmap } from '../../components/MonthHeatmap';
import { ShieldBadge } from '../../components/ShieldBadge';
import { Card, Screen, ScreenTitle } from '../../components/ui';
import { fromDateKey } from '../../lib/date';
import { monthlyEveningPercent, weeklyStats } from '../../lib/stats';
import { SHIELD_RECOVERY_NIGHTS } from '../../lib/streak';
import { useStore } from '../../state/store';
import { colors, space, type } from '../../theme';

export default function StreakScreen() {
  const { data, now, today, byDay, streak } = useStore();
  const todayDate = fromDateKey(today);
  const [cursor, setCursor] = useState({ year: todayDate.getFullYear(), month: todayDate.getMonth() });

  const week = weeklyStats(data.sessions, now, data.installDate);
  const monthPct = monthlyEveningPercent(data.sessions, cursor.year, cursor.month, now, data.installDate);
  const isCurrentMonth = cursor.year === todayDate.getFullYear() && cursor.month === todayDate.getMonth();

  const shift = (delta: number) =>
    setCursor(({ year, month }) => {
      const d = new Date(year, month + delta, 1);
      return { year: d.getFullYear(), month: d.getMonth() };
    });

  return (
    <Screen>
      <ScreenTitle title="רצף" subtitle="רצף ערבים — הלב של ההרגל" />

      <View style={styles.bigRow}>
        <Card style={styles.big}>
          <Text style={type.label}>רצף נוכחי</Text>
          <Text style={[type.display, { color: colors.primary }]}>{streak.current}</Text>
          <Text style={type.caption}>ערבים</Text>
        </Card>
        <Card style={styles.big}>
          <Text style={type.label}>שיא</Text>
          <Text style={type.display}>{streak.best}</Text>
          <Text style={type.caption}>ערבים</Text>
        </Card>
      </View>

      <Card style={styles.shield}>
        <ShieldBadge active={streak.shieldActive} recovery={streak.shieldRecoveryCount} />
        <View style={{ flex: 1, gap: 4 }}>
          <Text style={type.heading}>{'מגן "לא פעמיים"'}</Text>
          <Text style={type.muted}>
            {streak.shieldActive
              ? 'פספוס ערב בודד לא יאפס את הרצף — רק ישבור את המגן. פספוס אחד הוא אירוע, שניים זה הרגל.'
              : `המגן נשבר. פספוס נוסף יאפס את הרצף. ${SHIELD_RECOVERY_NIGHTS} ערבים רצופים מחזירים אותו.`}
          </Text>
        </View>
      </Card>

      <Card>
        <Text style={[type.label, { marginBottom: space.sm }]}>7 הימים האחרונים</Text>
        <View style={styles.statsRow}>
          <Stat label="ערב" value={`${week.evening}/${week.days}`} highlight />
          <Stat label="בוקר" value={`${week.morning}/${week.days}`} />
          <Stat label="ערבים החודש" value={monthPct === null ? '—' : `${monthPct}%`} />
        </View>
      </Card>

      <Card>
        <MonthHeatmap
          year={cursor.year}
          month={cursor.month}
          byDay={byDay}
          today={today}
          installDate={data.installDate}
          onPrev={() => shift(-1)}
          onNext={() => shift(1)}
          canNext={!isCurrentMonth}
        />
      </Card>
    </Screen>
  );
}

function Stat({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <View style={{ flex: 1, gap: 2 }}>
      <Text style={[type.display, { fontSize: 30, lineHeight: 38 }, highlight && { color: colors.primary }]}>{value}</Text>
      <Text style={type.caption}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  bigRow: { flexDirection: 'row', gap: space.md },
  big: { flex: 1, alignItems: 'flex-start' },
  shield: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  statsRow: { flexDirection: 'row', gap: space.md },
});
