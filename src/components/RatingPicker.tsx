import { StyleSheet, Text, View } from 'react-native';

import { tapCue } from '../lib/feedback';
import { colors, radius, tabular, type } from '../theme';
import { PressableScale } from './ui';

/** דירוג גוון עצמי 1–10 (10 = הכי לבן). */
export function RatingPicker({ value, onChange }: { value: number | null; onChange: (v: number) => void }) {
  return (
    <View style={{ gap: 6 }}>
      <View style={styles.row}>
        {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => {
          const selected = value === n;
          return (
            <PressableScale
              key={n}
              onPress={() => {
                tapCue();
                onChange(n);
              }}
              accessibilityRole="button"
              accessibilityLabel={`גוון ${n}`}
              accessibilityState={{ selected }}
              style={[styles.item, selected && styles.selected]}
            >
              <Text style={[type.heading, tabular, { textAlign: 'center', color: selected ? colors.onPrimary : colors.text }]}>{n}</Text>
            </PressableScale>
          );
        })}
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <Text style={type.caption}>1 · צהוב</Text>
        <Text style={type.caption}>10 · הכי לבן</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 4 },
  item: {
    flex: 1,
    height: 44,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceRaised,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selected: { backgroundColor: colors.primary },
});
