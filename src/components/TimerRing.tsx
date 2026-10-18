import type { ReactNode } from 'react';
import { View } from 'react-native';
import Svg, { Circle, Line } from 'react-native-svg';

import { colors } from '../theme';

type Props = {
  size: number;
  /** 0–1 */
  progress: number;
  stroke?: number;
  color?: string;
  /** מספר סימוני חלוקה (רבעים). */
  ticks?: number;
  children?: ReactNode;
};

/** טבעת התקדמות שמתמלאת עם כיוון השעון מלמעלה. */
export function TimerRing({ size, progress, stroke = 12, color = colors.primary, ticks = 4, children }: Props) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const center = size / 2;
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={{ position: 'absolute' }}>
        <Circle cx={center} cy={center} r={r} stroke={colors.surfaceRaised} strokeWidth={stroke} fill="none" />
        <Circle
          cx={center}
          cy={center}
          r={r}
          stroke={color}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${c} ${c}`}
          strokeDashoffset={c * (1 - Math.min(1, Math.max(0, progress)))}
          transform={`rotate(-90 ${center} ${center})`}
        />
        {Array.from({ length: ticks }, (_, i) => {
          const a = (i / ticks) * 2 * Math.PI - Math.PI / 2;
          const r1 = r - stroke / 2 - 4;
          const r2 = r - stroke / 2 - 12;
          return (
            <Line
              key={i}
              x1={center + r1 * Math.cos(a)}
              y1={center + r1 * Math.sin(a)}
              x2={center + r2 * Math.cos(a)}
              y2={center + r2 * Math.sin(a)}
              stroke={colors.textFaint}
              strokeWidth={2}
              strokeLinecap="round"
            />
          );
        })}
      </Svg>
      {children}
    </View>
  );
}
