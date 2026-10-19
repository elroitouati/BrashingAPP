import { Image } from 'expo-image';
import { useState } from 'react';
import { StyleSheet, Text, View, type LayoutChangeEvent } from 'react-native';
import { GestureDetector, usePanGesture } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue } from 'react-native-reanimated';

import { formatDateShort } from '../lib/date';
import type { WhiteningPhoto } from '../lib/types';
import { colors, font, radius, space, tabular, type } from '../theme';

/**
 * השוואת לפני/אחרי עם סליידר.
 * "לפני" בצד ימין ו"אחרי" בצד שמאל (כיוון הקריאה). התמונה החדשה מונחת מעל וגזורה מהצד השמאלי.
 * הרכיב עובד בקואורדינטות פיזיות (direction: ltr) כדי שהמגע והגזירה יתאימו בדיוק.
 * הגרירה רצה על ה-UI thread: shared values בלבד, בלי רינדור של React בכל תזוזת אצבע.
 */
export function BeforeAfterSlider({ before, after }: { before: WhiteningPhoto; after: WhiteningPhoto }) {
  const [width, setWidth] = useState(0);
  const w = useSharedValue(0);
  const pos = useSharedValue(0.5); // חלק התמונה החדשה, נמדד משמאל

  const pan = usePanGesture({
    // מופעל רק בתנועה אופקית, כדי שגלילה אנכית של המסך תמשיך לעבוד.
    activeOffsetX: [-6, 6],
    failOffsetY: [-12, 12],
    onUpdate: (e) => {
      const width = w.get();
      if (width > 0) pos.set(Math.min(1, Math.max(0, e.x / width)));
    },
  });

  const onLayout = (e: LayoutChangeEvent) => {
    w.set(e.nativeEvent.layout.width);
    setWidth(e.nativeEvent.layout.width);
  };

  // הגזירה ממוקמת אבסולוטית ובגודל קבוע לילד שלה, כך שהרוחב שלה לא גורם ל-relayout לאחרים.
  const clipStyle = useAnimatedStyle(() => ({ width: pos.get() * w.get() }));
  const handleStyle = useAnimatedStyle(() => ({ transform: [{ translateX: pos.get() * w.get() - 1 }] }));

  const height = width * 0.75;

  return (
    <View style={{ gap: space.sm }}>
      <GestureDetector gesture={pan}>
        <View onLayout={onLayout} style={[styles.frame, { height: height || 240, direction: 'ltr' }]}>
          {width > 0 ? (
            <>
              <Image source={{ uri: before.uri }} style={StyleSheet.absoluteFill} contentFit="cover" accessibilityLabel={`לפני, ${formatDateShort(before.date)}`} />
              <Animated.View style={[styles.clip, clipStyle]} pointerEvents="none">
                <Image source={{ uri: after.uri }} style={{ width, height }} contentFit="cover" accessibilityLabel={`אחרי, ${formatDateShort(after.date)}`} />
              </Animated.View>
              <Animated.View style={[styles.handleLine, handleStyle]} pointerEvents="none">
                <View style={styles.knob} />
              </Animated.View>
              <View style={[styles.tag, { left: space.sm }]} pointerEvents="none">
                <Text style={styles.tagText}>אחרי</Text>
              </View>
              <View style={[styles.tag, { right: space.sm }]} pointerEvents="none">
                <Text style={styles.tagText}>לפני</Text>
              </View>
            </>
          ) : null}
        </View>
      </GestureDetector>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <Text style={[type.caption, tabular]}>
          {formatDateShort(before.date)} · גוון {before.selfRating}/10
        </Text>
        <Text style={[type.caption, tabular]}>
          {formatDateShort(after.date)} · גוון {after.selfRating}/10
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  frame: { width: '100%', borderRadius: radius.md, overflow: 'hidden', backgroundColor: colors.surfaceRaised },
  clip: { position: 'absolute', top: 0, bottom: 0, left: 0, overflow: 'hidden' },
  handleLine: { position: 'absolute', top: 0, bottom: 0, left: 0, width: 2, backgroundColor: colors.text, alignItems: 'center', justifyContent: 'center' },
  knob: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.text, borderWidth: 3, borderColor: colors.primary },
  tag: {
    position: 'absolute',
    top: space.sm,
    backgroundColor: 'rgba(11,18,20,0.6)',
    paddingHorizontal: space.sm,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  tagText: { color: colors.text, fontSize: 13, lineHeight: 19, fontFamily: font.semibold },
});
