import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { HE_DAY_LETTERS, monthName, toDateKey } from '../lib/date';
import { slotQuality, type SlotQuality } from '../lib/sessions';
import type { Session } from '../lib/types';
import { colors, space, tabular, type } from '../theme';

type Props = {
  year: number;
  month: number;
  byDay: Map<string, Session[]>;
  today: string;
  installDate: string;
  onPrev: () => void;
  onNext: () => void;
  canNext: boolean;
};

/**
 * לוח חודשי: לכל יום שתי נקודות — בוקר וערב.
 * מלא = 2:00, חצי = הצלה/חלקי, ריק = פוספס.
 * בפריסת RTL שורת השבוע מתחילה ביום ראשון מימין.
 */
export function MonthHeatmap({ year, month, byDay, today, installDate, onPrev, onNext, canNext }: Props) {
  const first = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (string | null)[] = Array.from({ length: first.getDay() }, () => null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(toDateKey(new Date(year, month, d)));
  while (cells.length % 7) cells.push(null);
  const weeks = Array.from({ length: cells.length / 7 }, (_, i) => cells.slice(i * 7, i * 7 + 7));

  return (
    <View style={{ gap: space.md }}>
      <View style={styles.nav}>
        {/* RTL: הכפתור הראשון מימין = חודש קודם */}
        <Pressable onPress={onPrev} hitSlop={12} accessibilityRole="button" accessibilityLabel="חודש קודם">
          <Ionicons name="chevron-forward" size={22} color={colors.text} />
        </Pressable>
        <Text style={[type.heading, tabular]}>
          {monthName(month)} {year}
        </Text>
        <Pressable onPress={onNext} disabled={!canNext} hitSlop={12} accessibilityRole="button" accessibilityLabel="חודש הבא">
          <Ionicons name="chevron-back" size={22} color={canNext ? colors.text : colors.textFaint} />
        </Pressable>
      </View>

      <View style={styles.week}>
        {HE_DAY_LETTERS.map((l) => (
          <Text key={l} style={[type.caption, styles.cell, { textAlign: 'center' }]}>
            {l}
          </Text>
        ))}
      </View>

      {weeks.map((week, wi) => (
        <View key={wi} style={styles.week}>
          {week.map((key, di) => {
            if (!key) return <View key={di} style={styles.cell} />;
            const inactive = key > today || key < installDate;
            const isToday = key === today;
            return (
              <View key={key} style={[styles.cell, styles.day, isToday && styles.today]}>
                <Text style={[type.caption, tabular, { textAlign: 'center', color: inactive ? colors.textFaint : colors.text }]}>{Number(key.slice(8))}</Text>
                <View style={styles.dots}>
                  <Dot quality={inactive ? null : slotQuality(byDay, key, 'morning')} pending={isToday} />
                  <Dot quality={inactive ? null : slotQuality(byDay, key, 'evening')} pending={isToday} />
                </View>
              </View>
            );
          })}
        </View>
      ))}

      <View style={styles.legend}>
        <LegendItem quality="full" label="2:00" />
        <LegendItem quality="half" label="הצלה" />
        <LegendItem quality="none" label="פוספס" />
        <Text style={type.caption}>· נקודה ימנית = בוקר</Text>
      </View>
    </View>
  );
}

const DOT = 9;

function Dot({ quality, pending }: { quality: SlotQuality | null; pending?: boolean }) {
  if (quality === null) return <View style={[styles.dot, { borderColor: 'transparent', backgroundColor: colors.surfaceRaised }]} />;
  if (quality === 'full') return <View style={[styles.dot, { backgroundColor: colors.primary, borderColor: colors.primary }]} />;
  if (quality === 'half')
    return (
      <View style={[styles.dot, { borderColor: colors.primary, overflow: 'hidden' }]}>
        <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: DOT / 2, backgroundColor: colors.primary }} />
      </View>
    );
  return <View style={[styles.dot, { borderColor: pending ? colors.textFaint : colors.border }]} />;
}

function LegendItem({ quality, label }: { quality: SlotQuality; label: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
      <Dot quality={quality} />
      <Text style={type.caption}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  nav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  week: { flexDirection: 'row', gap: 4 },
  cell: { flex: 1 },
  day: { alignItems: 'center', gap: 4, paddingVertical: 6, borderRadius: 10 },
  today: { backgroundColor: colors.primarySoft },
  dots: { flexDirection: 'row', gap: 3 },
  dot: { width: DOT, height: DOT, borderRadius: DOT / 2, borderWidth: 1.5 },
  legend: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: space.md, marginTop: space.xs },
});
