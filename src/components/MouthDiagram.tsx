import { Text, View } from 'react-native';
import Svg, { G, Path, Text as SvgText } from 'react-native-svg';

import { colors, font, type } from '../theme';

const SIZE = 220;
const CX = SIZE / 2;
const CY = SIZE / 2;
const R_OUT = 92;
const R_IN = 58;
const ARCH_GAP = 7; // רווח בין הלסת העליונה לתחתונה
const MID_GAP_DEG = 3; // רווח בין ימין לשמאל

function polar(r: number, deg: number, dy: number) {
  const a = (deg * Math.PI) / 180;
  return { x: CX + r * Math.cos(a), y: CY + dy + r * Math.sin(a) };
}

/** מקטע טבעת בין שתי זוויות (מעלות, 0 = ימין המסך, עם כיוון השעון). */
function segment(from: number, to: number, dy: number): string {
  const o1 = polar(R_OUT, from, dy);
  const o2 = polar(R_OUT, to, dy);
  const i2 = polar(R_IN, to, dy);
  const i1 = polar(R_IN, from, dy);
  return [
    `M ${o1.x} ${o1.y}`,
    `A ${R_OUT} ${R_OUT} 0 0 1 ${o2.x} ${o2.y}`,
    `L ${i2.x} ${i2.y}`,
    `A ${R_IN} ${R_IN} 0 0 0 ${i1.x} ${i1.y}`,
    'Z',
  ].join(' ');
}

/**
 * מבט כמו במראה: הצד הימני של הפה מופיע בצד ימין של המסך.
 * סדר: 0 ימין למעלה, 1 שמאל למעלה, 2 שמאל למטה, 3 ימין למטה.
 */
const QUADRANTS = [
  { d: segment(180 + 90 + MID_GAP_DEG, 360, -ARCH_GAP), label: polar((R_IN + R_OUT) / 2, 315, -ARCH_GAP) },
  { d: segment(180, 270 - MID_GAP_DEG, -ARCH_GAP), label: polar((R_IN + R_OUT) / 2, 225, -ARCH_GAP) },
  { d: segment(90 + MID_GAP_DEG, 180, ARCH_GAP), label: polar((R_IN + R_OUT) / 2, 135, ARCH_GAP) },
  { d: segment(0, 90 - MID_GAP_DEG, ARCH_GAP), label: polar((R_IN + R_OUT) / 2, 45, ARCH_GAP) },
];

type Props = {
  /** הרבע הפעיל, או null כשכל הפה פעיל (גרסת הצלה). */
  active: number | null;
  /** רבעים שהושלמו. */
  completed?: number;
  size?: number;
};

export function MouthDiagram({ active, completed = 0, size = SIZE }: Props) {
  return (
    <View style={{ width: size, alignItems: 'stretch' }}>
    <Svg width={size} height={size} viewBox={`0 0 ${SIZE} ${SIZE}`} accessibilityLabel="איור הפה, הרבע הפעיל מודגש">
      <G>
        {QUADRANTS.map((q, i) => {
          const isActive = active === null || active === i;
          const isDone = active !== null && i < completed;
          const fill = isActive ? colors.primary : isDone ? colors.primarySoft : colors.surfaceRaised;
          const stroke = isActive ? colors.primary : colors.border;
          return (
            <G key={i}>
              <Path d={q.d} fill={fill} stroke={stroke} strokeWidth={1.5} strokeLinejoin="round" />
              <SvgText
                x={q.label.x}
                y={q.label.y + 5}
                fontSize={15}
                fontFamily={font.semibold}
                fill={isActive ? colors.onPrimary : colors.textMuted}
                textAnchor="middle"
              >
                {i + 1}
              </SvgText>
            </G>
          );
        })}
      </G>
    </Svg>
      {/* בפריסת RTL הילד הראשון בשורה מוצג מימין */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: -6 }}>
        <Text style={type.label}>ימין</Text>
        <Text style={[type.caption, { color: colors.textFaint }]}>מראה</Text>
        <Text style={type.label}>שמאל</Text>
      </View>
    </View>
  );
}
