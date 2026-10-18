import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { BeforeAfterSlider } from '../../components/BeforeAfterSlider';
import { DateTimeField } from '../../components/DateTimeField';
import { RatingChart } from '../../components/RatingChart';
import { Banner, Button, Card, Divider, Screen, ScreenTitle } from '../../components/ui';
import { addMonths, daysBetween, formatDateShort } from '../../lib/date';
import { useStore } from '../../state/store';
import { colors, radius, space, tabular, type } from '../../theme';

const PHOTO_INTERVAL_DAYS = 7;

export default function WhiteningScreen() {
  const { data, today, updateSettings, deletePhoto } = useStore();
  const photos = data.photos;
  const first = photos[0];
  const latest = photos[photos.length - 1];
  const daysSinceLast = latest ? daysBetween(latest.date, today) : null;
  const photoDue = daysSinceLast === null || daysSinceLast >= PHOTO_INTERVAL_DAYS;
  const weekNumber = (date: string) => (first ? Math.floor(daysBetween(first.date, date) / 7) + 1 : 1);

  const hygienistDue = data.settings.lastHygienist ? addMonths(data.settings.lastHygienist, 6) : null;
  const hygienistOverdue = hygienistDue !== null && hygienistDue <= today;

  const confirmDelete = (id: string) =>
    Alert.alert('למחוק את התמונה?', 'התמונה תימחק מהמכשיר.', [
      { text: 'ביטול', style: 'cancel' },
      { text: 'מחיקה', style: 'destructive', onPress: () => deletePhoto(id) },
    ]);

  return (
    <Screen>
      <ScreenTitle title="הלבנה" subtitle="תמונת מעקב שבועית — אותה זווית, אותו אור" />

      <Card style={{ gap: space.md }}>
        <View style={styles.row}>
          <Ionicons name="camera-outline" size={26} color={colors.primary} />
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={type.heading}>{photoDue ? 'הגיע הזמן לתמונה השבועית' : 'התמונה השבועית צולמה'}</Text>
            <Text style={type.muted}>
              {daysSinceLast === null
                ? 'התמונה הראשונה היא נקודת ההתחלה — שבוע 1.'
                : photoDue
                  ? `עברו ${daysSinceLast} ימים מהתמונה האחרונה.`
                  : `התמונה הבאה בעוד ${PHOTO_INTERVAL_DAYS - daysSinceLast} ימים.`}
            </Text>
          </View>
        </View>
        <Text style={type.caption}>אותה שעה, אותו מקום, אור יום.</Text>
        <Button icon="camera" label="צילום תמונת מעקב" variant={photoDue ? 'primary' : 'secondary'} onPress={() => router.push('/camera')} />
      </Card>

      {first && latest && first.id !== latest.id ? (
        <Card style={{ gap: space.md }}>
          <Text style={type.heading}>
            שבוע 1 מול שבוע {weekNumber(latest.date)}
          </Text>
          <BeforeAfterSlider before={first} after={latest} />
          <Text style={type.caption}>גרור את הסליידר כדי להשוות.</Text>
        </Card>
      ) : null}

      <Card style={{ gap: space.md }}>
        <Text style={type.heading}>גוון לאורך זמן</Text>
        <RatingChart photos={photos} toothpaste={data.settings.toothpaste} />
        {data.settings.toothpaste ? (
          <View style={styles.row}>
            <View style={styles.dash} />
            <Text style={type.caption}>
              החלפת משחה: {data.settings.toothpaste.name} · {formatDateShort(data.settings.toothpaste.since)}
            </Text>
          </View>
        ) : null}
      </Card>

      {photos.length > 0 ? (
        <Card style={{ gap: space.md }}>
          <Text style={type.heading}>כל התמונות</Text>
          <View style={styles.grid}>
            {[...photos].reverse().map((p) => (
              <Pressable key={p.id} onLongPress={() => confirmDelete(p.id)} style={styles.thumbWrap} accessibilityHint="לחיצה ארוכה למחיקה">
                <Image source={{ uri: p.uri }} style={styles.thumb} contentFit="cover" />
                <Text style={[type.caption, tabular]}>
                  שבוע {weekNumber(p.date)} · {p.selfRating}/10
                </Text>
              </Pressable>
            ))}
          </View>
          <Text style={type.caption}>לחיצה ארוכה על תמונה למחיקה.</Text>
        </Card>
      ) : null}

      <Card style={{ gap: space.sm }}>
        <View style={styles.row}>
          <Ionicons name="medkit-outline" size={24} color={colors.primary} />
          <Text style={[type.heading, { flex: 1 }]}>תור לשיננית</Text>
        </View>
        <Text style={type.muted}>
          רוב הצהוב שנוצר מחוסר צחצוח הוא רובד ואבנית. ניקוי אצל שיננית מוריד אותם, וצחצוח קבוע שומר על התוצאה.
        </Text>
        <Divider />
        <DateTimeField
          mode="date"
          label="התור האחרון"
          value={data.settings.lastHygienist}
          maximumDate={new Date()}
          onChange={(v) => updateSettings({ lastHygienist: v })}
        />
        {hygienistDue ? (
          hygienistOverdue ? (
            <Banner tone="warning" icon="calendar-outline" text="עברו 6 חודשים. זה הזמן לקבוע תור." />
          ) : (
            <Text style={[type.caption, tabular]}>תזכורת לתור הבא: {formatDateShort(hygienistDue)}</Text>
          )
        ) : (
          <Text style={type.caption}>הזן תאריך ונזכיר לך כל 6 חודשים.</Text>
        )}
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  thumbWrap: { width: '31%', gap: 4 },
  thumb: { width: '100%', aspectRatio: 1, borderRadius: radius.sm, backgroundColor: colors.surfaceRaised },
  dash: { width: 18, borderTopWidth: 2, borderColor: colors.warning, borderStyle: 'dashed' },
});
