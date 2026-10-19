import Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps, ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withTiming } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, font, motion, radius, space, type } from '../theme';

export type IconName = ComponentProps<typeof Ionicons>['name'];

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/**
 * Pressable עם משוב לחיצה: כיווץ ל-0.97 ב-120ms כבר ב-press-in (לא כשהלחיצה מסתיימת).
 * רץ על ה-UI thread דרך shared value — בלי רינדור של React.
 */
export function PressableScale({ style, disabled, onPressIn, onPressOut, children, ...rest }: Omit<PressableProps, 'style'> & { style?: StyleProp<ViewStyle> }) {
  const scale = useSharedValue(1);
  const reduced = useReducedMotion();
  const animated = useAnimatedStyle(() => ({ transform: [{ scale: scale.get() }] }));
  return (
    <AnimatedPressable
      {...rest}
      disabled={disabled}
      pressRetentionOffset={{ top: 16, bottom: 16, left: 16, right: 16 }}
      onPressIn={(e) => {
        if (!reduced) scale.set(withTiming(0.97, { duration: motion.press, easing: motion.easeOut }));
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        scale.set(withTiming(1, { duration: motion.small, easing: motion.easeOut }));
        onPressOut?.(e);
      }}
      style={[style, animated]}
    >
      {children}
    </AnimatedPressable>
  );
}

export function Screen({ children, scroll = true }: { children: ReactNode; scroll?: boolean }) {
  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      {scroll ? (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {children}
        </ScrollView>
      ) : (
        <View style={[styles.content, { flex: 1 }]}>{children}</View>
      )}
    </SafeAreaView>
  );
}

export function ScreenTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <View style={styles.titleBlock}>
      <Text style={type.title}>{title}</Text>
      {subtitle ? <Text style={type.muted}>{subtitle}</Text> : null}
    </View>
  );
}

export function Card({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function SectionLabel({ children }: { children: ReactNode }) {
  return <Text style={[type.label, styles.sectionLabel]}>{children}</Text>;
}

type ButtonProps = {
  label: string;
  onPress: () => void;
  icon?: IconName;
  variant?: 'primary' | 'secondary' | 'ghost' | 'warning';
  disabled?: boolean;
  size?: 'lg' | 'md' | 'sm';
  style?: StyleProp<ViewStyle>;
};

const BUTTON_PALETTE = {
  primary: { bg: colors.primary, fg: colors.onPrimary, border: colors.primary },
  secondary: { bg: colors.surfaceRaised, fg: colors.text, border: colors.borderStrong },
  ghost: { bg: 'transparent', fg: colors.primary, border: 'transparent' },
  warning: { bg: colors.warningSoft, fg: colors.warning, border: colors.warningLine },
} as const;

export function Button({ label, onPress, icon, variant = 'primary', disabled, size = 'md', style }: ButtonProps) {
  const palette = BUTTON_PALETTE[variant];
  const height = size === 'lg' ? 60 : size === 'md' ? 50 : 44;
  const fontSize = size === 'lg' ? 18 : 16;
  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={[styles.button, { height, backgroundColor: palette.bg, borderColor: palette.border, opacity: disabled ? 0.4 : 1 }, style]}
    >
      {icon ? <Ionicons name={icon} size={fontSize + 4} color={palette.fg} /> : null}
      <Text style={{ color: palette.fg, fontSize, fontFamily: font.semibold }}>{label}</Text>
    </PressableScale>
  );
}

export function Banner({ text, tone = 'warning', icon }: { text: string; tone?: 'warning' | 'danger' | 'info'; icon?: IconName }) {
  const c =
    tone === 'warning'
      ? { bg: colors.warningSoft, fg: colors.warning }
      : tone === 'danger'
        ? { bg: colors.dangerSoft, fg: colors.danger }
        : { bg: colors.primarySoft, fg: colors.primary };
  return (
    <View style={[styles.banner, { backgroundColor: c.bg }]} accessibilityRole="alert">
      {icon ? <Ionicons name={icon} size={20} color={c.fg} /> : null}
      <Text style={[type.body, { color: c.fg, flex: 1, fontFamily: font.semibold }]}>{text}</Text>
    </View>
  );
}

export function Divider() {
  return <View style={styles.divider} />;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { paddingHorizontal: space.lg + 4, paddingTop: space.lg, paddingBottom: space.xxxl, gap: space.md },
  titleBlock: { marginBottom: space.md, gap: 2 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: space.lg + 4,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  sectionLabel: { marginTop: space.lg, marginBottom: -space.xs },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.sm,
    borderRadius: radius.md,
    paddingHorizontal: space.xl,
    borderWidth: 1,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    paddingVertical: space.md,
    paddingHorizontal: space.lg,
    borderRadius: radius.md,
  },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.border, marginVertical: space.md },
});
