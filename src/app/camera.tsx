import Ionicons from '@expo/vector-icons/Ionicons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useRef, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Line, Path } from 'react-native-svg';

import { RatingPicker } from '../components/RatingPicker';
import { Button } from '../components/ui';
import { logicalDate } from '../lib/date';
import { persistPhoto } from '../lib/photos';
import { newId } from '../lib/sessions';
import { useStore } from '../state/store';
import { colors, radius, space, type } from '../theme';

/** מסגרת חיוך קבועה — כל תמונה מצולמת באותה זווית ובאותו מרחק. */
function SmileOverlay({ width, height }: { width: number; height: number }) {
  const w = width * 0.78;
  const h = w * 0.42;
  const x0 = (width - w) / 2;
  const y0 = height * 0.42 - h / 2;
  const x1 = x0 + w;
  const midY = y0 + h * 0.32;
  // שפה עליונה שטוחה-מעט, שפה תחתונה מעוגלת — צורת חיוך.
  const smile = [
    `M ${x0} ${midY}`,
    `C ${x0 + w * 0.2} ${y0 - h * 0.05}, ${x1 - w * 0.2} ${y0 - h * 0.05}, ${x1} ${midY}`,
    `C ${x1 - w * 0.12} ${y0 + h * 1.1}, ${x0 + w * 0.12} ${y0 + h * 1.1}, ${x0} ${midY}`,
    'Z',
  ].join(' ');
  const mask = `M 0 0 H ${width} V ${height} H 0 Z ${smile}`;

  return (
    <Svg width={width} height={height} style={StyleSheet.absoluteFill} pointerEvents="none">
      <Path d={mask} fill="rgba(0,0,0,0.55)" fillRule="evenodd" />
      <Path d={smile} stroke={colors.primary} strokeWidth={3} fill="none" />
      <Line x1={width / 2} x2={width / 2} y1={y0 - 18} y2={y0 + h + 18} stroke={colors.primary} strokeOpacity={0.6} strokeWidth={1.5} strokeDasharray="5 6" />
    </Svg>
  );
}

export default function CameraScreen() {
  const { addPhoto } = useStore();
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  const [shot, setShot] = useState<string | null>(null);
  const [rating, setRating] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const { width, height } = useWindowDimensions();

  const capture = async () => {
    if (!cameraRef.current || busy) return;
    setBusy(true);
    try {
      const pic = await cameraRef.current.takePictureAsync({ quality: 0.85 });
      if (pic?.uri) setShot(pic.uri);
    } catch {
      Alert.alert('הצילום נכשל', 'נסה שוב.');
    } finally {
      setBusy(false);
    }
  };

  const pickFromLibrary = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.85, allowsEditing: true, aspect: [4, 3] });
    if (!res.canceled && res.assets[0]?.uri) setShot(res.assets[0].uri);
  };

  const save = () => {
    if (!shot || rating === null) return;
    try {
      const id = newId();
      const uri = persistPhoto(shot, id);
      addPhoto({ id, uri, date: logicalDate(new Date()), selfRating: rating });
      router.back();
    } catch {
      Alert.alert('השמירה נכשלה', 'לא הצלחנו לשמור את התמונה במכשיר.');
    }
  };

  if (shot) {
    return (
      <SafeAreaView style={styles.screen}>
        <View style={{ flex: 1, padding: space.lg, gap: space.lg }}>
          <Text style={type.title}>דירוג גוון</Text>
          <Image source={{ uri: shot }} style={styles.preview} contentFit="cover" />
          <Text style={type.muted}>איך נראה הגוון היום? דרג בכנות — מה שחשוב זה המגמה לאורך זמן.</Text>
          <RatingPicker value={rating} onChange={setRating} />
          <View style={{ flex: 1 }} />
          <Button size="lg" label="שמירה" icon="checkmark" disabled={rating === null} onPress={save} />
          <Button variant="ghost" label="צילום מחדש" onPress={() => setShot(null)} />
        </View>
      </SafeAreaView>
    );
  }

  if (!permission) return <View style={styles.screen} />;

  if (!permission.granted) {
    return (
      <SafeAreaView style={[styles.screen, { padding: space.lg, justifyContent: 'center', gap: space.lg }]}>
        <Text style={type.title}>צריך גישה למצלמה</Text>
        <Text style={type.muted}>התמונות נשמרות רק במכשיר שלך ולא נשלחות לשום מקום.</Text>
        <Button label="אישור גישה" onPress={requestPermission} />
        <Button variant="secondary" label="בחירה מהגלריה" icon="images-outline" onPress={pickFromLibrary} />
        <Button variant="ghost" label="ביטול" onPress={() => router.back()} />
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.screen}>
      <CameraView ref={cameraRef} style={StyleSheet.absoluteFill} facing="front" mirror />
      <SmileOverlay width={width} height={height} />
      <SafeAreaView style={styles.overlay} pointerEvents="box-none">
        <View style={styles.topBar}>
          <Pressable onPress={() => router.back()} hitSlop={12} accessibilityRole="button" accessibilityLabel="סגירה">
            <Ionicons name="close" size={28} color={colors.text} />
          </Pressable>
        </View>
        <View style={styles.hint}>
          <Text style={[type.heading, { textAlign: 'center' }]}>חיוך רחב בתוך המסגרת</Text>
          <Text style={[type.muted, { textAlign: 'center' }]}>אותה שעה, אותו מקום, אור יום.</Text>
        </View>
        <View style={{ flex: 1 }} />
        <View style={styles.controls}>
          <Pressable onPress={pickFromLibrary} style={styles.sideBtn} accessibilityRole="button" accessibilityLabel="בחירה מהגלריה">
            <Ionicons name="images-outline" size={26} color={colors.text} />
          </Pressable>
          <Pressable onPress={capture} disabled={busy} style={({ pressed }) => [styles.shutter, pressed && { transform: [{ scale: 0.94 }] }]} accessibilityRole="button" accessibilityLabel="צילום">
            <View style={styles.shutterInner} />
          </Pressable>
          <View style={styles.sideBtn} />
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  overlay: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 },
  topBar: { flexDirection: 'row', padding: space.lg },
  hint: { paddingHorizontal: space.xl, gap: 4 },
  controls: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', paddingBottom: space.xl },
  sideBtn: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.35)' },
  shutter: { width: 78, height: 78, borderRadius: 39, borderWidth: 4, borderColor: colors.text, alignItems: 'center', justifyContent: 'center' },
  shutterInner: { width: 60, height: 60, borderRadius: 30, backgroundColor: colors.text },
  preview: { width: '100%', aspectRatio: 4 / 3, borderRadius: radius.md, backgroundColor: colors.surfaceRaised },
});
