import { StyleSheet, type TextStyle } from 'react-native';

export const colors = {
  bg: '#0E1517',
  surface: '#162124',
  surfaceRaised: '#1C2A2E',
  border: '#24353A',
  text: '#E8F1F0',
  textMuted: '#93A7A9',
  textFaint: '#5D7275',
  primary: '#6FD6C9', // טורקיז/מנטה רך
  primarySoft: 'rgba(111, 214, 201, 0.14)',
  onPrimary: '#06201D',
  success: '#5CCB8F',
  successSoft: 'rgba(92, 203, 143, 0.14)',
  warning: '#F2A766', // כתום עדין, לא אדום מאשים
  warningSoft: 'rgba(242, 167, 102, 0.13)',
  danger: '#E88A7A',
  dangerSoft: 'rgba(232, 138, 122, 0.12)',
} as const;

export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 } as const;
export const radius = { sm: 10, md: 16, lg: 22, pill: 999 } as const;

/** ספרות טבולריות — מספרים לא "קופצים" בזמן ספירה. */
export const tabular: TextStyle = { fontVariant: ['tabular-nums'] };

export const type = StyleSheet.create({
  display: { color: colors.text, fontSize: 64, fontWeight: '700', letterSpacing: -1, ...tabular },
  hero: { color: colors.text, fontSize: 44, fontWeight: '700', ...tabular },
  title: { color: colors.text, fontSize: 24, fontWeight: '700', textAlign: 'left' },
  heading: { color: colors.text, fontSize: 17, fontWeight: '600', textAlign: 'left' },
  body: { color: colors.text, fontSize: 15, lineHeight: 22, textAlign: 'left' },
  muted: { color: colors.textMuted, fontSize: 14, lineHeight: 20, textAlign: 'left' },
  caption: { color: colors.textMuted, fontSize: 12, textAlign: 'left' },
});
