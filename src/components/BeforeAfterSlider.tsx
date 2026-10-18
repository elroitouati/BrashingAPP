import { Image } from 'expo-image';
import { useRef, useState } from 'react';
import { StyleSheet, Text, View, type GestureResponderEvent, type HostInstance, type LayoutChangeEvent } from 'react-native';

import { formatDateShort } from '../lib/date';
import type { WhiteningPhoto } from '../lib/types';
import { colors, radius, space } from '../theme';

/**
 * השוואת לפני/אחרי עם סליידר.
 * בעברית "לפני" בצד ימין ו"אחרי" בצד שמאל (כיוון הקריאה). התמונה החדשה מונחת מעל וגזורה מהצד השמאלי.
 * הרכיב עובד בקואורדינטות פיזיות (direction: ltr) כדי שהמגע והגזירה יתאימו בדיוק.
 */
export function BeforeAfterSlider({ before, after }: { before: WhiteningPhoto; after: WhiteningPhoto }) {
  const [width, setWidth] = useState(0);
  const [pos, setPos] = useState(0.5); // חלק התמונה החדשה, נמדד משמאל
  const widthRef = useRef(0);
  const frameX = useRef(0);
  const frameRef = useRef<HostInstance>(null);

  // מיקום לפי pageX פחות מיקום המסגרת בחלון — לא תלוי באיזה ילד נגעו.
  const update = (pageX: number) => {
    if (!widthRef.current) return;
    setPos(Math.min(1, Math.max(0, (pageX - frameX.current) / widthRef.current)));
  };

  const onGrant = (e: GestureResponderEvent) => {
    const pageX = e.nativeEvent.pageX;
    frameRef.current?.measureInWindow((x) => {
      frameX.current = x;
      update(pageX);
    });
  };

  const onLayout = (e: LayoutChangeEvent) => {
    widthRef.current = e.nativeEvent.layout.width;
    setWidth(e.nativeEvent.layout.width);
  };

  const height = width * 0.75;
  const split = width * pos;

  return (
    <View style={{ gap: space.sm }}>
      <View ref={frameRef} onLayout={onLayout} style={[styles.frame, { height: height || 240, direction: 'ltr' }]} onStartShouldSetResponder={() => true}
        onMoveShouldSetResponder={() => true}
        onResponderTerminationRequest={() => false}
        onResponderGrant={onGrant}
        onResponderMove={(e) => update(e.nativeEvent.pageX)}>
        {width > 0 ? (
          <>
            <Image source={{ uri: before.uri }} style={StyleSheet.absoluteFill} contentFit="cover" />
            <View style={[styles.clip, { width: split }]} pointerEvents="none">
              <Image source={{ uri: after.uri }} style={{ width, height }} contentFit="cover" />
            </View>
            <View style={[styles.handleLine, { left: split - 1 }]} pointerEvents="none">
              <View style={styles.knob} />
            </View>
            <Text style={[styles.tag, { left: space.sm }]}>אחרי</Text>
            <Text style={[styles.tag, { right: space.sm }]}>לפני</Text>
          </>
        ) : null}
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <Text style={styles.caption}>
          לפני · {formatDateShort(before.date)} · גוון {before.selfRating}/10
        </Text>
        <Text style={styles.caption}>
          אחרי · {formatDateShort(after.date)} · גוון {after.selfRating}/10
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  frame: { width: '100%', borderRadius: radius.md, overflow: 'hidden', backgroundColor: colors.surfaceRaised },
  clip: { position: 'absolute', top: 0, bottom: 0, left: 0, overflow: 'hidden' },
  handleLine: { position: 'absolute', top: 0, bottom: 0, width: 2, backgroundColor: colors.text, alignItems: 'center', justifyContent: 'center' },
  knob: { width: 28, height: 28, borderRadius: 14, backgroundColor: colors.text, borderWidth: 3, borderColor: colors.primary },
  tag: {
    position: 'absolute',
    top: space.sm,
    color: colors.text,
    fontSize: 12,
    fontWeight: '700',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    overflow: 'hidden',
  },
  caption: { color: colors.textMuted, fontSize: 12 },
});
