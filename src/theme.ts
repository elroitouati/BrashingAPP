import { StyleSheet, type TextStyle } from 'react-native';
import { Easing } from 'react-native-reanimated';

/*
 * כיוון עיצובי: "טקס לילי שקט" — כהה, רגוע, הרבה אוויר, גוון אחד (טורקיז-מנטה רך) על ניטרליים.
 * החתימה: כרטיס הערב במסך הבית וטבעת הטיימר — המספרים הגדולים הם הגיבורים.
 * עומק בא מגווני משטח וגבול דק, לא מצללים (צללים לא נראים על כהה).
 */

export const colors = {
  bg: '#0B1214', // לא שחור טהור
  surface: '#121C1F',
  surfaceRaised: '#192629',
  border: '#223236',
  borderStrong: '#2C4045',
  text: '#EEF4F3', // לא לבן טהור
  textMuted: '#A3B4B5', // טקסט משני — עדיין עובר 4.5:1 על המשטחים
  textFaint: '#6B7F81', // תוויות ומצבים כבויים בלבד, לעולם לא גוף טקסט
  primary: '#6FD6C9', // טורקיז/מנטה רך
  primarySoft: 'rgba(111, 214, 201, 0.12)',
  primaryLine: 'rgba(111, 214, 201, 0.32)',
  onPrimary: '#062421',
  success: '#5CCB8F',
  successSoft: 'rgba(92, 203, 143, 0.12)',
  warning: '#F2A766', // כתום עדין, לא אדום מאשים
  warningSoft: 'rgba(242, 167, 102, 0.12)',
  warningLine: 'rgba(242, 167, 102, 0.34)',
  danger: '#EE8E7E',
  dangerSoft: 'rgba(238, 142, 126, 0.11)',
} as const;

/** רשת 4pt. */
export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32, xxxl: 48 } as const;

/** שפת פינות אחת: פקדים קטנים 10, כפתורים 14, כרטיסים 20, גלולה לתגיות בלבד. */
export const radius = { sm: 10, md: 14, lg: 20, pill: 999 } as const;

/** Heebo — גופן שצויר לעברית. שלושה משקלים בלבד; ההיררכיה נבנית מקפיצות גודל ומשקל. */
export const font = {
  regular: 'Heebo_400Regular',
  semibold: 'Heebo_600SemiBold',
  heavy: 'Heebo_800ExtraBold',
} as const;

/** ספרות טבולריות — מספרים לא "קופצים" בזמן ספירה. */
export const tabular: TextStyle = { fontVariant: ['tabular-nums'] };

// textAlign: 'left' = תחילת השורה. ב-RTL של React Native הוא מתהפך לימין.
export const type = StyleSheet.create({
  timer: { color: colors.text, fontFamily: font.heavy, fontSize: 72, lineHeight: 84, ...tabular },
  display: { color: colors.text, fontFamily: font.heavy, fontSize: 56, lineHeight: 64, ...tabular },
  title: { color: colors.text, fontFamily: font.heavy, fontSize: 28, lineHeight: 36, textAlign: 'left' },
  heading: { color: colors.text, fontFamily: font.semibold, fontSize: 18, lineHeight: 26, textAlign: 'left' },
  body: { color: colors.text, fontFamily: font.regular, fontSize: 16, lineHeight: 25, textAlign: 'left' },
  muted: { color: colors.textMuted, fontFamily: font.regular, fontSize: 16, lineHeight: 25, textAlign: 'left' },
  label: { color: colors.textMuted, fontFamily: font.semibold, fontSize: 13, lineHeight: 19, textAlign: 'left' },
  caption: { color: colors.textMuted, fontFamily: font.regular, fontSize: 13, lineHeight: 19, textAlign: 'left' },
});

/** תנועה: עקומות חזקות (לעולם לא ease-in על ממשק), משכים קצרים. */
export const motion = {
  easeOut: Easing.bezier(0.23, 1, 0.32, 1),
  easeInOut: Easing.bezier(0.77, 0, 0.175, 1),
  press: 120,
  small: 200,
  enter: 260,
} as const;
