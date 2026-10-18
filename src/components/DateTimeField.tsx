import DateTimePicker, { DateTimePickerAndroid, type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { Modal, Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { formatDateShort, formatTime, fromDateKey, parseTime, toDateKey } from '../lib/date';
import { colors, radius, space, tabular, type } from '../theme';
import { Button } from './ui';

type Props = {
  label: string;
  hint?: string;
  mode: 'date' | 'time';
  /** "YYYY-MM-DD" לתאריך, "HH:MM" לשעה. */
  value: string | undefined;
  placeholder?: string;
  onChange: (value: string) => void;
  maximumDate?: Date;
};

function toDate(mode: Props['mode'], value: string | undefined): Date {
  if (!value) return new Date();
  if (mode === 'date') return fromDateKey(value);
  const { h, m } = parseTime(value);
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d;
}

const serialize = (mode: Props['mode'], d: Date) => (mode === 'date' ? toDateKey(d) : formatTime(d));

/** שדה תאריך/שעה בסגנון האפליקציה. אנדרואיד: דיאלוג מערכת. iOS: גיליון תחתון עם בורר. */
export function DateTimeField({ label, hint, mode, value, placeholder = 'לא הוגדר', onChange, maximumDate }: Props) {
  const [iosOpen, setIosOpen] = useState(false);
  const [draft, setDraft] = useState(() => toDate(mode, value));

  const open = () => {
    const current = toDate(mode, value);
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value: current,
        mode,
        is24Hour: true,
        maximumDate,
        onChange: (e: DateTimePickerEvent, d?: Date) => {
          if (e.type === 'set' && d) onChange(serialize(mode, d));
        },
      });
    } else {
      setDraft(current);
      setIosOpen(true);
    }
  };

  const display = value ? (mode === 'date' ? formatDateShort(value) : value) : placeholder;

  return (
    <>
      <Pressable onPress={open} style={({ pressed }) => [styles.row, pressed && { opacity: 0.7 }]} accessibilityRole="button" accessibilityLabel={`${label}: ${display}`}>
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={type.body}>{label}</Text>
          {hint ? <Text style={type.caption}>{hint}</Text> : null}
        </View>
        <View style={styles.value}>
          <Text style={[type.heading, tabular, { color: value ? colors.primary : colors.textFaint }]}>{display}</Text>
          <Ionicons name={mode === 'date' ? 'calendar-outline' : 'time-outline'} size={18} color={colors.textMuted} />
        </View>
      </Pressable>

      {Platform.OS === 'ios' ? (
        <Modal visible={iosOpen} transparent animationType="slide" onRequestClose={() => setIosOpen(false)}>
          <Pressable style={styles.backdrop} onPress={() => setIosOpen(false)} />
          <View style={styles.sheet}>
            <Text style={[type.heading, { textAlign: 'center' }]}>{label}</Text>
            <DateTimePicker
              value={draft}
              mode={mode}
              display={mode === 'date' ? 'inline' : 'spinner'}
              locale="he-IL"
              themeVariant="dark"
              is24Hour
              maximumDate={maximumDate}
              accentColor={colors.primary}
              onChange={(_e, d) => d && setDraft(d)}
            />
            <Button
              label="שמירה"
              onPress={() => {
                onChange(serialize(mode, draft));
                setIosOpen(false);
              }}
            />
          </View>
        </Modal>
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingVertical: space.sm, minHeight: 48 },
  value: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' },
  sheet: {
    backgroundColor: colors.surface,
    padding: space.lg,
    paddingBottom: space.xxl,
    gap: space.md,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
  },
});
