import Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps, ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, radius, space, type } from '../theme';

export type IconName = ComponentProps<typeof Ionicons>['name'];

export function Screen({ children, scroll = true }: { children: ReactNode; scroll?: boolean }) {
  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      {scroll ? (
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {children}
        </ScrollView>
      ) : (
        <View style={[styles.scrollContent, { flex: 1 }]}>{children}</View>
      )}
    </SafeAreaView>
  );
}

export function ScreenTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <View style={{ marginBottom: space.lg, gap: 2 }}>
      <Text style={type.title}>{title}</Text>
      {subtitle ? <Text style={type.muted}>{subtitle}</Text> : null}
    </View>
  );
}

export function Card({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function SectionLabel({ children }: { children: ReactNode }) {
  return <Text style={[type.caption, styles.sectionLabel]}>{children}</Text>;
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

export function Button({ label, onPress, icon, variant = 'primary', disabled, size = 'md', style }: ButtonProps) {
  const palette = {
    primary: { bg: colors.primary, fg: colors.onPrimary, border: colors.primary },
    secondary: { bg: colors.surfaceRaised, fg: colors.text, border: colors.border },
    ghost: { bg: 'transparent', fg: colors.primary, border: 'transparent' },
    warning: { bg: colors.warningSoft, fg: colors.warning, border: 'rgba(242,167,102,0.35)' },
  }[variant];
  const height = size === 'lg' ? 60 : size === 'md' ? 48 : 36;
  const font = size === 'lg' ? 18 : size === 'md' ? 16 : 14;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        { height, backgroundColor: palette.bg, borderColor: palette.border, opacity: disabled ? 0.4 : pressed ? 0.85 : 1 },
        pressed && !disabled && { transform: [{ scale: 0.98 }] },
        style,
      ]}
    >
      {icon ? <Ionicons name={icon} size={font + 4} color={palette.fg} /> : null}
      <Text style={{ color: palette.fg, fontSize: font, fontWeight: '700' }}>{label}</Text>
    </Pressable>
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
      <Text style={[type.body, { color: c.fg, flex: 1, fontWeight: '600' }]}>{text}</Text>
    </View>
  );
}

export function Row({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[{ flexDirection: 'row', alignItems: 'center', gap: space.md }, style]}>{children}</View>;
}

export function Divider() {
  return <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: colors.border, marginVertical: space.md }} />;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  scrollContent: { padding: space.lg, paddingBottom: space.xxl, gap: space.md },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: space.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  sectionLabel: { marginTop: space.md, marginBottom: -space.xs, letterSpacing: 0.4 },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.sm,
    borderRadius: radius.pill,
    paddingHorizontal: space.xl,
    borderWidth: 1,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    padding: space.md,
    paddingHorizontal: space.lg,
    borderRadius: radius.md,
  },
});
