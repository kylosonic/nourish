import React, { type ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, fonts, radii, shadow, spacing, type } from '../theme';

export type IconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

export function Screen({
  children,
  style,
  scroll = false,
  contentStyle,
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  scroll?: boolean;
  contentStyle?: StyleProp<ViewStyle>;
}) {
  if (scroll) {
    return (
      <SafeAreaView style={[styles.screen, style]} edges={['top', 'left', 'right']}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.scrollContent, contentStyle]}
          keyboardShouldPersistTaps="handled"
        >
          {children}
        </ScrollView>
      </SafeAreaView>
    );
  }
  return (
    <SafeAreaView style={[styles.screen, style]} edges={['top', 'left', 'right']}>
      <View style={[styles.content, contentStyle]}>{children}</View>
    </SafeAreaView>
  );
}

export function Icon({
  name,
  size = 22,
  color = colors.onSurfaceVariant,
}: {
  name: IconName;
  size?: number;
  color?: string;
}) {
  return <MaterialCommunityIcons name={name} size={size} color={color} />;
}

export function IconButton({
  name,
  onPress,
  accessibilityLabel,
  color = colors.primary,
  size = 24,
  style,
}: {
  name: IconName;
  onPress?: () => void;
  accessibilityLabel: string;
  color?: string;
  size?: number;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      hitSlop={12}
      style={({ pressed }) => [
        styles.iconButton,
        style,
        pressed && styles.pressed,
      ]}
    >
      <Icon name={name} size={size} color={color} />
    </Pressable>
  );
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  icon,
  style,
}: {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger';
  disabled?: boolean;
  loading?: boolean;
  icon?: IconName;
  style?: StyleProp<ViewStyle>;
}) {
  const visual = buttonVisual[variant];
  const isDisabled = disabled || loading;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled }}
      disabled={isDisabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        visual.container,
        isDisabled && visual.disabled,
        pressed && !isDisabled && styles.pressed,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={visual.text.color} />
      ) : (
        <>
          <Text style={[styles.buttonText, visual.text]}>{label}</Text>
          {icon ? <Icon name={icon} size={20} color={visual.text.color} /> : null}
        </>
      )}
    </Pressable>
  );
}

const buttonVisual = {
  primary: {
    container: { backgroundColor: colors.primary },
    text: { color: colors.onPrimary },
    disabled: { opacity: 0.48 },
  },
  secondary: {
    container: { backgroundColor: colors.surfaceHigh },
    text: { color: colors.onSurface },
    disabled: { opacity: 0.48 },
  },
  outline: {
    container: {
      backgroundColor: 'transparent',
      borderWidth: 1,
      borderColor: colors.onSurface,
    },
    text: { color: colors.onSurface },
    disabled: { opacity: 0.48 },
  },
  danger: {
    container: { backgroundColor: colors.coralSoft },
    text: { color: colors.error },
    disabled: { opacity: 0.48 },
  },
} as const;

export function Header({
  onBack,
  onClose,
  title,
  right,
  wordmark = true,
}: {
  onBack?: () => void;
  onClose?: () => void;
  title?: string;
  right?: ReactNode;
  wordmark?: boolean;
}) {
  return (
    <View style={styles.header}>
      <View style={styles.headerSlot}>
        {onBack ? (
          <IconButton name="arrow-left" accessibilityLabel="Go back" onPress={onBack} />
        ) : onClose ? (
          <IconButton
            name="close"
            accessibilityLabel="Close"
            onPress={onClose}
            color={colors.onSurfaceVariant}
          />
        ) : null}
      </View>
      <View style={styles.headerCenter}>
        {wordmark ? (
          <Text style={styles.wordmark}>Nourish</Text>
        ) : (
          <Text style={styles.headerTitle}>{title}</Text>
        )}
      </View>
      <View style={[styles.headerSlot, styles.headerRight]}>{right}</View>
    </View>
  );
}

export function Card({
  children,
  style,
  padded = true,
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  padded?: boolean;
}) {
  return <View style={[styles.card, padded && styles.cardPadded, style]}>{children}</View>;
}

export function SectionLabel({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <Text style={[type.label, styles.sectionLabel, style as never]}>{children}</Text>;
}

export function ProgressBar({
  value,
  color = colors.primaryContainer,
  trackColor = colors.surfaceHighest,
  height = 8,
  style,
}: {
  value: number;
  color?: string;
  trackColor?: string;
  height?: number;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={[styles.progressTrack, { height, backgroundColor: trackColor }, style]}>
      <View
        style={[
          styles.progressFill,
          {
            width: `${Math.max(0, Math.min(100, value))}%`,
            backgroundColor: color,
          },
        ]}
      />
    </View>
  );
}

export function Field({
  label,
  suffix,
  style,
  error,
  ...props
}: TextInputProps & {
  label: string;
  suffix?: string;
  style?: StyleProp<ViewStyle>;
  error?: string;
}) {
  return (
    <View style={[styles.fieldWrap, style]}>
      <Text style={[type.label, error && { color: colors.error }]}>{label.toUpperCase()}</Text>
      <View style={[styles.field, error && styles.fieldError]}>
        <TextInput
          {...props}
          placeholderTextColor={colors.outline}
          style={styles.fieldInput}
          selectionColor={colors.primary}
        />
        {suffix ? <Text style={styles.fieldSuffix}>{suffix}</Text> : null}
      </View>
      {error ? <Text style={styles.fieldErrorText}>{error}</Text> : null}
    </View>
  );
}

export function OptionCard({
  title,
  detail,
  selected,
  icon,
  onPress,
  trailing,
  compact = false,
}: {
  title: string;
  detail?: string;
  selected: boolean;
  icon?: IconName;
  onPress: () => void;
  trailing?: ReactNode;
  compact?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.option,
        compact && styles.optionCompact,
        selected && styles.optionSelected,
        pressed && styles.pressed,
      ]}
    >
      {icon ? (
        <View style={[styles.optionIcon, selected && styles.optionIconSelected]}>
          <Icon name={icon} size={23} color={selected ? colors.primary : colors.onSurfaceVariant} />
        </View>
      ) : null}
      <View style={styles.optionCopy}>
        <Text style={[type.body, styles.optionTitle]}>{title}</Text>
        {detail ? <Text style={styles.optionDetail}>{detail}</Text> : null}
      </View>
      {trailing ||
        (selected ? <Icon name="check-circle" size={22} color={colors.primary} /> : null)}
    </Pressable>
  );
}

export function Radio({
  selected,
  onPress,
  label,
  sublabel,
}: {
  selected: boolean;
  onPress: () => void;
  label: string;
  sublabel?: string;
}) {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.radioRow,
        selected && styles.radioRowSelected,
        pressed && styles.pressed,
      ]}
    >
      <View style={styles.optionCopy}>
        <Text style={[type.body, { fontFamily: fonts.semibold }]}>{label}</Text>
        {sublabel ? <Text style={styles.optionDetail}>{sublabel}</Text> : null}
      </View>
      <View style={[styles.radioOuter, selected && styles.radioOuterSelected]}>
        {selected ? <View style={styles.radioInner} /> : null}
      </View>
    </Pressable>
  );
}

export function Chip({
  label,
  selected = false,
  onPress,
  tone = 'neutral',
}: {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  tone?: 'neutral' | 'green' | 'amber' | 'coral';
}) {
  const tones = {
    neutral: { bg: colors.surfaceLow, text: colors.onSurfaceVariant },
    green: { bg: colors.primarySoft, text: colors.primary },
    amber: { bg: colors.amberSoft, text: '#855300' },
    coral: { bg: colors.coralSoft, text: colors.error },
  }[tone];
  return (
    <Pressable
      disabled={!onPress}
      onPress={onPress}
      style={[
        styles.chip,
        { backgroundColor: selected ? colors.primary : tones.bg },
      ]}
    >
      <Text style={[type.label, { color: selected ? colors.white : tones.text, letterSpacing: 0.2 }]}>
        {label}
      </Text>
    </Pressable>
  );
}

export function EmptyState({
  icon,
  title,
  detail,
  action,
}: {
  icon: IconName;
  title: string;
  detail: string;
  action?: ReactNode;
}) {
  return (
    <Card style={styles.empty}>
      <View style={styles.emptyIcon}>
        <Icon name={icon} size={30} color={colors.primary} />
      </View>
      <Text style={[type.title, { textAlign: 'center' }]}>{title}</Text>
      <Text style={[type.body, styles.emptyDetail]}>{detail}</Text>
      {action}
    </Card>
  );
}

export function Banner({
  tone = 'info',
  icon,
  title,
  message,
  action,
}: {
  tone?: 'info' | 'success' | 'warning' | 'error';
  icon: IconName;
  title: string;
  message: string;
  action?: ReactNode;
}) {
  const colorsByTone = {
    info: { bg: colors.surfaceLow, fg: colors.primary },
    success: { bg: colors.primarySoft, fg: colors.primary },
    warning: { bg: colors.amberSoft, fg: '#855300' },
    error: { bg: colors.coralSoft, fg: colors.error },
  }[tone];
  return (
    <View style={[styles.banner, { backgroundColor: colorsByTone.bg }]}>
      <Icon name={icon} size={21} color={colorsByTone.fg} />
      <View style={{ flex: 1 }}>
        <Text style={[type.body, { fontFamily: fonts.semibold, color: colorsByTone.fg }]}>
          {title}
        </Text>
        <Text style={[type.bodySmall, { color: colorsByTone.fg, marginTop: 2 }]}>
          {message}
        </Text>
        {action}
      </View>
    </View>
  );
}

export const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.surface },
  content: { flex: 1 },
  scrollContent: { paddingBottom: spacing.xxl },
  iconButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.pill,
  },
  pressed: { opacity: 0.68, transform: [{ scale: 0.985 }] },
  button: {
    height: 56,
    borderRadius: radii.md,
    paddingHorizontal: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  buttonText: {
    fontFamily: fonts.semibold,
    fontSize: 16,
    lineHeight: 22,
    letterSpacing: 0.3,
  },
  header: {
    height: 68,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  headerSlot: { width: 68, justifyContent: 'center' },
  headerRight: { alignItems: 'flex-end' },
  headerCenter: { flex: 1, alignItems: 'center' },
  wordmark: {
    fontFamily: fonts.bold,
    fontSize: 30,
    lineHeight: 38,
    letterSpacing: -1.3,
    color: colors.primary,
  },
  headerTitle: {
    fontFamily: fonts.semibold,
    fontSize: 22,
    color: colors.primary,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.surfaceHigh,
    ...shadow,
  },
  cardPadded: { padding: spacing.lg },
  sectionLabel: { marginBottom: spacing.sm },
  progressTrack: {
    width: '100%',
    borderRadius: radii.pill,
    overflow: 'hidden',
  },
  progressFill: { height: '100%', borderRadius: radii.pill },
  fieldWrap: { gap: spacing.xs },
  field: {
    minHeight: 56,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    backgroundColor: colors.surfaceBright,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
  },
  fieldError: { borderColor: colors.error },
  fieldInput: {
    flex: 1,
    fontSize: 17,
    fontFamily: fonts.regular,
    color: colors.onSurface,
    paddingVertical: 12,
    outlineStyle: 'none' as never,
  },
  fieldSuffix: { ...type.bodySmall, color: colors.onSurfaceVariant },
  fieldErrorText: { ...type.caption, color: colors.error },
  option: {
    minHeight: 76,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.surfaceHighest,
    backgroundColor: colors.white,
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    gap: spacing.md,
  },
  optionCompact: { minHeight: 64 },
  optionSelected: {
    borderWidth: 1.5,
    borderColor: colors.primary,
    backgroundColor: '#F6FBF8',
  },
  optionIcon: {
    width: 42,
    height: 42,
    borderRadius: radii.md,
    backgroundColor: colors.surfaceLow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionIconSelected: { backgroundColor: colors.primarySoft },
  optionCopy: { flex: 1, gap: 2 },
  optionTitle: { fontFamily: fonts.semibold },
  optionDetail: { ...type.bodySmall, color: colors.onSurfaceVariant },
  radioRow: {
    minHeight: 72,
    borderWidth: 1,
    borderColor: colors.surfaceHighest,
    borderRadius: radii.md,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
  },
  radioRowSelected: { borderWidth: 1.5, borderColor: colors.primary },
  radioOuter: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.outline,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOuterSelected: { borderColor: colors.primary },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.primary,
  },
  chip: {
    borderRadius: radii.pill,
    paddingHorizontal: spacing.md,
    minHeight: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  empty: { alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.xxl },
  emptyIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  emptyDetail: {
    textAlign: 'center',
    color: colors.onSurfaceVariant,
    maxWidth: 280,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    borderRadius: radii.md,
    padding: spacing.md,
  },
});
