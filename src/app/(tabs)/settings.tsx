import { useState } from 'react';
import { Alert, Linking, StyleSheet, Switch, Text, TextInput, View } from 'react-native';

import { DateTimeField } from '../../components/DateTimeField';
import { Banner, Button, Card, Divider, Screen, ScreenTitle, SectionLabel } from '../../components/ui';
import { addMonths, formatDateShort } from '../../lib/date';
import { exportJson } from '../../lib/photos';
import { useStore } from '../../state/store';
import { colors, font, radius, space, tabular, type } from '../../theme';

export default function SettingsScreen() {
  const { data, today, updateSettings, notificationsGranted } = useStore();
  const s = data.settings;
  const [pasteName, setPasteName] = useState(s.toothpaste?.name ?? '');
  const [pasteSince, setPasteSince] = useState(s.toothpaste?.since ?? today);

  const brushDue = addMonths(s.lastBrushChange, 3);
  const brushOverdue = brushDue <= today;
  const pasteDirty = pasteName.trim() !== (s.toothpaste?.name ?? '') || (pasteName.trim() !== '' && pasteSince !== s.toothpaste?.since);

  const onExport = async () => {
    try {
      await exportJson(data);
    } catch {
      Alert.alert('הייצוא נכשל', 'לא הצלחנו ליצור את קובץ הגיבוי.');
    }
  };

  return (
    <Screen>
      <ScreenTitle title="הגדרות" />

      {notificationsGranted === false ? (
        <Card style={{ gap: space.md }}>
          <Banner tone="warning" icon="notifications-off-outline" text="ההתראות כבויות — תזכורות הערב לא יגיעו." />
          <Button variant="secondary" label="פתיחת הגדרות המכשיר" onPress={() => Linking.openSettings()} />
        </Card>
      ) : null}

      <SectionLabel>ערב</SectionLabel>
      <Card>
        <DateTimeField
          mode="time"
          label="סיום ארוחת ערב"
          hint="העוגן של תזכורת הערב — ההתראה הראשית 10 דק׳ אחרי"
          value={s.dinnerEndTime}
          onChange={(v) => updateSettings({ dinnerEndTime: v })}
        />
        <Divider />
        <DateTimeField
          mode="time"
          label="שעת שינה משוערת"
          hint="תזכורת אחרונה 30 דק׳ לפני. אין התראות אחרי השעה הזו"
          value={s.bedTime}
          onChange={(v) => updateSettings({ bedTime: v })}
        />
      </Card>

      <SectionLabel>בוקר</SectionLabel>
      <Card>
        <View style={styles.switchRow}>
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={type.body}>תזכורת בוקר</Text>
            <Text style={type.caption}>כבוי כברירת מחדל — הבוקר כבר עובד</Text>
          </View>
          <Switch
            value={s.morningReminder}
            onValueChange={(v) => updateSettings({ morningReminder: v })}
            trackColor={{ true: colors.primary, false: colors.surfaceRaised }}
            thumbColor={colors.text}
          />
        </View>
        {s.morningReminder ? (
          <>
            <Divider />
            <DateTimeField mode="time" label="שעת התזכורת" value={s.morningReminderTime} onChange={(v) => updateSettings({ morningReminderTime: v })} />
          </>
        ) : null}
      </Card>

      <SectionLabel>מברשת</SectionLabel>
      <Card style={{ gap: space.sm }}>
        <DateTimeField
          mode="date"
          label="החלפת מברשת אחרונה"
          value={s.lastBrushChange}
          maximumDate={new Date()}
          onChange={(v) => updateSettings({ lastBrushChange: v })}
        />
        {brushOverdue ? (
          <Banner tone="warning" icon="refresh-outline" text="עברו 3 חודשים. הגיע הזמן למברשת חדשה." />
        ) : (
          <Text style={[type.caption, tabular]}>החלפה הבאה: {formatDateShort(brushDue)}</Text>
        )}
        {brushOverdue ? <Button variant="secondary" size="sm" label="החלפתי היום" onPress={() => updateSettings({ lastBrushChange: today })} /> : null}
      </Card>

      <SectionLabel>המשחה שלי</SectionLabel>
      <Card style={{ gap: space.sm }}>
        <Text style={type.caption}>כך רואים בגרף ההלבנה מתי הוחלפה המשחה.</Text>
        <TextInput
          value={pasteName}
          onChangeText={setPasteName}
          placeholder="שם המשחה"
          placeholderTextColor={colors.textFaint}
          style={styles.input}
          returnKeyType="done"
        />
        <DateTimeField mode="date" label="בשימוש מאז" value={pasteSince} maximumDate={new Date()} onChange={setPasteSince} />
        {pasteDirty ? (
          <Button
            size="sm"
            label="שמירה"
            onPress={() => updateSettings({ toothpaste: pasteName.trim() ? { name: pasteName.trim(), since: pasteSince } : undefined })}
          />
        ) : null}
      </Card>

      <SectionLabel>גיבוי</SectionLabel>
      <Card style={{ gap: space.sm }}>
        <Text style={type.muted}>כל הנתונים נשמרים רק במכשיר. הייצוא יוצר קובץ JSON עם כל הצחצוחים, ההגדרות ופרטי התמונות.</Text>
        <Button variant="secondary" icon="download-outline" label="ייצוא נתונים ל-JSON" onPress={onExport} />
      </Card>

      <Text style={[type.caption, { textAlign: 'center', marginTop: space.lg }]}>
        {data.sessions.length} צחצוחים נשמרו · מאז {formatDateShort(data.installDate)}
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  switchRow: { flexDirection: 'row', alignItems: 'center', gap: space.md, minHeight: 48 },
  input: {
    backgroundColor: colors.surfaceRaised,
    color: colors.text,
    borderRadius: radius.sm,
    paddingHorizontal: space.md,
    height: 48,
    fontSize: 16,
    fontFamily: font.regular,
    writingDirection: 'rtl',
  },
});
