import { useState } from 'react';
import { Text, View } from 'react-native';
import Svg, { Circle, Line, Path, Text as SvgText } from 'react-native-svg';

import { formatDateShort, fromDateKey } from '../lib/date';
import type { WhiteningPhoto } from '../lib/types';
import { colors, type } from '../theme';

type Props = {
  photos: WhiteningPhoto[];
  toothpaste?: { name: string; since: string };
};

const H = 180;
const PAD_TOP = 14;
const PAD_BOTTOM = 26;
const AXIS_W = 26; // עמודת ציר הגוון — בצד ימין (תחילת הקריאה)
const PAD_END = 14;

/**
 * גרף דירוג הגוון העצמי לאורך זמן, בכיוון RTL: הזמן מתקדם מימין לשמאל.
 * קו מקווקו מסמן מתי הוחלפה המשחה.
 */
export function RatingChart({ photos, toothpaste }: Props) {
  const [w, setW] = useState(0);
  const pts = [...photos].sort((a, b) => a.date.localeCompare(b.date));

  if (pts.length < 2) {
    return <Text style={type.muted}>הגרף יופיע אחרי שתי תמונות לפחות.</Text>;
  }

  const t0 = fromDateKey(pts[0].date).getTime();
  const t1 = Math.max(fromDateKey(pts[pts.length - 1].date).getTime(), t0 + 86_400_000);
  const plotW = Math.max(1, w - AXIS_W - PAD_END);
  const plotH = H - PAD_TOP - PAD_BOTTOM;
  const xOf = (key: string) => w - AXIS_W - ((fromDateKey(key).getTime() - t0) / (t1 - t0)) * plotW;
  const yOf = (rating: number) => PAD_TOP + (1 - (rating - 1) / 9) * plotH;

  const line = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${xOf(p.date)} ${yOf(p.selfRating)}`).join(' ');
  const pasteTime = toothpaste ? fromDateKey(toothpaste.since).getTime() : NaN;
  const showPaste = toothpaste && pasteTime >= t0 && pasteTime <= t1;

  return (
    <View onLayout={(e) => setW(e.nativeEvent.layout.width)} style={{ height: H }}>
      {w > 0 ? (
        <Svg width={w} height={H}>
          {[1, 4, 7, 10].map((r) => (
            <Line key={r} x1={PAD_END} x2={w - AXIS_W} y1={yOf(r)} y2={yOf(r)} stroke={colors.border} strokeWidth={1} />
          ))}
          {[1, 4, 7, 10].map((r) => (
            <SvgText key={`l${r}`} x={w - 4} y={yOf(r) + 4} fontSize={11} fill={colors.textMuted} textAnchor="end">
              {r}
            </SvgText>
          ))}

          {showPaste ? (
            <>
              <Line
                x1={xOf(toothpaste.since)}
                x2={xOf(toothpaste.since)}
                y1={PAD_TOP - 6}
                y2={H - PAD_BOTTOM}
                stroke={colors.warning}
                strokeWidth={1.5}
                strokeDasharray="4 4"
              />
              <SvgText x={xOf(toothpaste.since) - 4} y={PAD_TOP + 2} fontSize={11} fill={colors.warning} textAnchor="end">
                {toothpaste.name}
              </SvgText>
            </>
          ) : null}

          <Path d={line} stroke={colors.primary} strokeWidth={2.5} fill="none" strokeLinejoin="round" strokeLinecap="round" />
          {pts.map((p) => (
            <Circle key={p.id} cx={xOf(p.date)} cy={yOf(p.selfRating)} r={4} fill={colors.bg} stroke={colors.primary} strokeWidth={2} />
          ))}

          <SvgText x={w - AXIS_W} y={H - 6} fontSize={11} fill={colors.textMuted} textAnchor="end">
            {formatDateShort(pts[0].date)}
          </SvgText>
          <SvgText x={PAD_END} y={H - 6} fontSize={11} fill={colors.textMuted} textAnchor="start">
            {formatDateShort(pts[pts.length - 1].date)}
          </SvgText>
        </Svg>
      ) : null}
    </View>
  );
}
