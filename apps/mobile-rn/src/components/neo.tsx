import React, { useEffect, useState, type ReactNode } from 'react';
import {
  Animated,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
  type LayoutChangeEvent,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle, Path, Polyline } from 'react-native-svg';
import { border, colors, fonts, radii, spacing, type } from '../theme';
import { Icon, type IconName } from './ui';

const ENABLE_MOTION = Platform.OS !== 'web';

export type NeoCanvas = 'peach' | 'lime' | 'pink' | 'lavender';

const canvas = {
  peach: colors.peachCanvas,
  lime: colors.limeCanvas,
  pink: colors.pinkCanvas,
  lavender: colors.lavenderBackdrop,
} as const;

export function NeoScreenWrapper({
  children,
  tone = 'peach',
  scroll = false,
  style,
  contentStyle,
}: {
  children: ReactNode;
  tone?: NeoCanvas;
  scroll?: boolean;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
}) {
  const body = scroll ? (
    <ScrollView
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={[styles.scrollContent, contentStyle]}
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.content, contentStyle]}>{children}</View>
  );

  return (
    <SafeAreaView
      edges={['top', 'left', 'right']}
      style={[styles.screen, { backgroundColor: canvas[tone] }, style]}
    >
      <StatusBar style="dark" />
      {body}
    </SafeAreaView>
  );
}

export function NeoTopBar({
  title,
  onBack,
  onRight,
  rightIcon = 'dots-horizontal',
  rightLabel = 'More options',
  leftColor = colors.coralButton,
  rightColor = colors.pinkAccent,
}: {
  title: string;
  onBack?: () => void;
  onRight?: () => void;
  rightIcon?: IconName;
  rightLabel?: string;
  leftColor?: string;
  rightColor?: string;
}) {
  return (
    <View style={styles.topBar}>
      {onBack ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Go back"
          onPress={onBack}
          style={[styles.topBarButton, { backgroundColor: leftColor }]}
        >
          <Icon name="arrow-left" size={22} color={colors.ink} />
        </Pressable>
      ) : (
        <View style={styles.topBarPlaceholder} />
      )}
      <Text style={styles.topBarTitle}>{title}</Text>
      {onRight ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={rightLabel}
          onPress={onRight}
          style={[styles.topBarButton, { backgroundColor: rightColor }]}
        >
          <Icon name={rightIcon} size={22} color={colors.ink} />
        </Pressable>
      ) : (
        <View style={styles.topBarPlaceholder} />
      )}
    </View>
  );
}

export function NeoFilterRow({
  items,
  selected,
  onSelect,
  actionIcon = 'plus',
  onAction,
  actionLabel = 'Add',
}: {
  items: string[];
  selected: string;
  onSelect: (value: string) => void;
  actionIcon?: IconName;
  onAction?: () => void;
  actionLabel?: string;
}) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.filterContent}
    >
      {onAction ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={actionLabel}
          onPress={onAction}
          style={styles.filterAction}
        >
          <Icon name={actionIcon} size={20} color={colors.ink} />
        </Pressable>
      ) : null}
      {items.map((item) => {
        const active = item === selected;
        return (
          <Pressable
            key={item}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            aria-selected={active}
            onPress={() => onSelect(item)}
            style={[styles.filterPill, active && styles.filterPillActive]}
          >
            <Text style={[styles.filterText, active && styles.filterTextActive]}>
              {item}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

export function NeoFoodMascot({ size = 118 }: { size?: number }) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      accessibilityLabel="Smiling injera plate"
    >
      <Path
        d="M92 12 97 22l10 5-10 5-5 10-5-10-10-5 10-5 5-10Z"
        fill={colors.white}
        stroke={colors.ink}
        strokeWidth={border.standard}
      />
      <Circle
        cx="57"
        cy="66"
        r="43"
        fill={colors.white}
        stroke={colors.ink}
        strokeWidth={border.standard}
      />
      <Circle
        cx="57"
        cy="66"
        r="34"
        fill={colors.splitPeach}
        stroke={colors.ink}
        strokeWidth={border.standard}
      />
      <Circle cx="45" cy="61" r="3.5" fill={colors.ink} />
      <Circle cx="69" cy="61" r="3.5" fill={colors.ink} />
      <Path
        d="M44 76c6 8 20 8 27 0"
        fill="none"
        stroke={colors.ink}
        strokeWidth={border.standard}
        strokeLinecap="round"
      />
      <Path
        d="M73 40c8-7 17-6 22 1-8 6-16 7-22-1Z"
        fill={colors.activeLime}
        stroke={colors.ink}
        strokeWidth={border.standard}
      />
      <Path
        d="M78 42c3-4 7-6 11-7"
        fill="none"
        stroke={colors.ink}
        strokeWidth={border.thin}
      />
      <Path
        d="M20 96c0-8 7-14 15-14M94 96c0-8-7-14-15-14"
        fill="none"
        stroke={colors.ink}
        strokeWidth={border.standard}
        strokeLinecap="round"
      />
    </Svg>
  );
}

export function NeoFeatureCard({
  title,
  value,
  caption,
  backgroundColor = colors.mintCard,
  art,
}: {
  title: string;
  value: string;
  caption: string;
  backgroundColor?: string;
  art?: ReactNode;
}) {
  return (
    <View style={[styles.featureCard, { backgroundColor }]}>
      <View style={styles.featureCopy}>
        <Text style={styles.featureTitle} numberOfLines={2}>
          {title}
        </Text>
        <View style={styles.featureSpacer} />
        <Text style={styles.featureValue} numberOfLines={1} adjustsFontSizeToFit>
          {value}
        </Text>
        <Text style={styles.featureCaption}>{caption}</Text>
      </View>
      <View pointerEvents="none" style={styles.featureArt}>
        {art ?? <NeoFoodMascot />}
      </View>
    </View>
  );
}

export type NeoChartDatum = {
  label: string;
  value: number;
  displayValue: string;
};

export function NeoPillBarChart({
  label,
  total,
  data,
  selectedIndex,
  onSelect,
}: {
  label: string;
  total: string;
  data: NeoChartDatum[];
  selectedIndex?: number;
  onSelect?: (index: number) => void;
}) {
  const [internalIndex, setInternalIndex] = useState(
    Math.max(0, data.length - 1),
  );
  const activeIndex = Math.min(
    data.length - 1,
    selectedIndex ?? internalIndex,
  );
  const maxValue = Math.max(1, ...data.map((item) => item.value));
  const choose = (index: number) => {
    setInternalIndex(index);
    onSelect?.(index);
  };

  return (
    <View style={styles.chartCard}>
      <View style={styles.chartHeader}>
        <View>
          <Text style={styles.chartLabel}>{label}</Text>
          <Text style={styles.chartTotal}>{total}</Text>
        </View>
        <View style={styles.chartActions}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Previous day"
            disabled={activeIndex === 0}
            onPress={() => choose(Math.max(0, activeIndex - 1))}
            style={[styles.chartButton, activeIndex === 0 && styles.disabled]}
          >
            <Icon name="chevron-left" size={22} color={colors.ink} />
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Next day"
            disabled={activeIndex === data.length - 1}
            onPress={() => choose(Math.min(data.length - 1, activeIndex + 1))}
            style={[
              styles.chartButton,
              activeIndex === data.length - 1 && styles.disabled,
            ]}
          >
            <Icon name="chevron-right" size={22} color={colors.ink} />
          </Pressable>
        </View>
      </View>

      <View style={styles.chartBars}>
        {data.map((item, index) => {
          const selected = index === activeIndex;
          const fillHeight = Math.max(
            6,
            Math.round((item.value / maxValue) * 158),
          );
          return (
            <Pressable
              key={`${item.label}-${index}`}
              accessibilityRole="button"
              accessibilityLabel={`${item.label}: ${item.displayValue}`}
              accessibilityState={{ selected }}
              onPress={() => choose(index)}
              style={styles.chartColumn}
            >
              <View style={styles.tooltipSpace}>
                {selected ? (
                  <View style={styles.tooltip}>
                    <Text style={styles.tooltipText}>{item.displayValue}</Text>
                  </View>
                ) : null}
              </View>
              <View style={styles.barTrack}>
                <View
                  style={[
                    styles.barFill,
                    {
                      height: fillHeight,
                      backgroundColor: selected
                        ? colors.selectedCoral
                        : colors.skyAccent,
                    },
                  ]}
                />
              </View>
              <Text style={styles.chartWeekday}>{item.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export function NeoSplitMetricRow({
  left,
  right,
}: {
  left: { label: string; value: string; trend?: string };
  right: { label: string; value: string; trend?: string };
}) {
  return (
    <View style={styles.splitRow}>
      <SplitMetric
        label={left.label}
        value={left.value}
        trend={left.trend}
        backgroundColor={colors.splitPeach}
      />
      <SplitMetric
        label={right.label}
        value={right.value}
        trend={right.trend}
        backgroundColor={colors.splitPink}
      />
    </View>
  );
}

function SplitMetric({
  label,
  value,
  trend,
  backgroundColor,
}: {
  label: string;
  value: string;
  trend?: string;
  backgroundColor: string;
}) {
  return (
    <View style={[styles.splitCard, { backgroundColor }]}>
      <Svg width="72" height="30" viewBox="0 0 72 30">
        <Polyline
          points="2,24 15,20 27,21 41,12 55,15 70,4"
          fill="none"
          stroke={colors.ink}
          strokeWidth={border.standard}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <Path d="m62 4 8 0 0 8" fill="none" stroke={colors.ink} strokeWidth={border.standard} />
      </Svg>
      <View>
        <Text style={styles.splitLabel}>{label}</Text>
        <Text style={styles.splitValue}>{value}</Text>
        {trend ? <Text style={styles.splitTrend}>{trend}</Text> : null}
      </View>
    </View>
  );
}

export type NeoTabItem = {
  key: string;
  label: string;
  icon: IconName;
  activeIcon: IconName;
};

export function NeoFloatingTabBar({
  items,
  activeIndex,
  onSelect,
}: {
  items: NeoTabItem[];
  activeIndex: number;
  onSelect: (index: number) => void;
}) {
  const { width: windowWidth } = useWindowDimensions();
  const compact = windowWidth < 360;
  const [itemLayouts, setItemLayouts] = useState<
    Record<number, { x: number; width: number }>
  >({});
  const [indicatorX] = useState(() => new Animated.Value(0));
  const activeLayout = itemLayouts[activeIndex];

  useEffect(() => {
    if (!activeLayout || activeLayout.width <= 0) return;
    Animated.spring(indicatorX, {
      toValue: activeLayout.x,
      stiffness: 260,
      damping: 26,
      mass: 0.8,
      useNativeDriver: ENABLE_MOTION,
    }).start();
  }, [activeLayout, indicatorX]);

  return (
    <View style={styles.tabBar}>
      <Animated.View
        testID="neo-tab-indicator"
        pointerEvents="none"
        style={[
          styles.activeTab,
          {
            width: activeLayout?.width ?? 0,
            transform: [{ translateX: indicatorX }],
          },
        ]}
      />
      {items.map((item, index) => {
        const selected = index === activeIndex;
        return (
          <Pressable
            key={item.key}
            accessibilityRole="tab"
            accessibilityLabel={item.label}
            accessibilityState={{ selected }}
            aria-selected={selected}
            onPress={() => onSelect(index)}
            onLayout={
              (event: LayoutChangeEvent) => {
                const { x, width } = event.nativeEvent.layout;
                setItemLayouts((current) => {
                  const previous = current[index];
                  if (
                    previous &&
                    previous.x === x &&
                    previous.width === width
                  ) {
                    return current;
                  }
                  return { ...current, [index]: { x, width } };
                });
              }
            }
            style={({ pressed }) => [
              styles.tabItem,
              selected
                ? [
                    styles.tabItemExpanded,
                    compact && styles.tabItemExpandedCompact,
                  ]
                : styles.tabItemInactive,
              pressed && styles.pressed,
            ]}
          >
            {selected ? (
              <>
                <Icon name={item.activeIcon} size={20} color={colors.ink} />
                <Text
                  style={styles.activeTabLabel}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.78}
                >
                  {item.label}
                </Text>
              </>
            ) : (
              <View style={styles.inactiveIcon}>
                <Icon name={item.icon} size={21} color={colors.white} />
              </View>
            )}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: {
    flex: 1,
    width: '100%',
    maxWidth: 560,
    alignSelf: 'center',
    paddingHorizontal: spacing.lg,
  },
  scrollContent: {
    width: '100%',
    maxWidth: 560,
    alignSelf: 'center',
    paddingHorizontal: spacing.lg,
    paddingBottom: 116,
  },
  topBar: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  topBarButton: {
    width: 44,
    height: 44,
    borderRadius: radii.pill,
    borderWidth: border.standard,
    borderColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topBarPlaceholder: { width: 44, height: 44 },
  topBarTitle: {
    ...type.bodyLarge,
    flex: 1,
    textAlign: 'center',
    fontFamily: fonts.bold,
  },
  filterContent: {
    gap: 10,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  filterAction: {
    width: 44,
    height: 44,
    borderRadius: radii.pill,
    borderWidth: border.standard,
    borderColor: colors.ink,
    backgroundColor: colors.butterCard,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterPill: {
    minHeight: 44,
    borderRadius: radii.pill,
    borderWidth: border.standard,
    borderColor: colors.ink,
    backgroundColor: colors.white,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    justifyContent: 'center',
  },
  filterPillActive: { backgroundColor: colors.activeLime },
  filterText: {
    ...type.body,
    color: colors.ink,
  },
  filterTextActive: { fontFamily: fonts.bold },
  featureCard: {
    minHeight: 186,
    borderRadius: radii.lg,
    borderWidth: border.standard,
    borderColor: colors.ink,
    padding: spacing.lg,
    overflow: 'hidden',
    flexDirection: 'row',
  },
  featureCopy: {
    width: '60%',
    zIndex: 1,
  },
  featureTitle: {
    ...type.cardTitle,
    maxWidth: 190,
  },
  featureSpacer: { height: spacing.xl },
  featureValue: {
    ...type.metric,
    marginTop: 'auto',
  },
  featureCaption: {
    ...type.caption,
    maxWidth: 180,
    marginTop: spacing.xxs,
  },
  featureArt: {
    position: 'absolute',
    right: -10,
    bottom: -8,
    width: '43%',
    alignItems: 'flex-end',
  },
  chartCard: {
    borderRadius: radii.lg,
    borderWidth: border.standard,
    borderColor: colors.ink,
    backgroundColor: colors.violetCard,
    padding: spacing.lg,
  },
  chartHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  chartLabel: {
    ...type.label,
    color: colors.ink,
  },
  chartTotal: {
    ...type.metric,
    color: colors.ink,
  },
  chartActions: { flexDirection: 'row', gap: spacing.xs },
  chartButton: {
    width: 44,
    height: 44,
    borderRadius: radii.pill,
    borderWidth: border.standard,
    borderColor: colors.ink,
    backgroundColor: colors.chartBlue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chartBars: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: spacing.lg,
  },
  chartColumn: {
    alignItems: 'center',
    width: 48,
    minHeight: 222,
    justifyContent: 'flex-end',
  },
  tooltipSpace: {
    height: 32,
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginBottom: 8,
  },
  tooltip: {
    borderRadius: radii.pill,
    backgroundColor: colors.charcoal,
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.xxs,
  },
  tooltipText: {
    ...type.caption,
    color: colors.white,
    fontFamily: fonts.bold,
  },
  barTrack: {
    width: 44,
    height: 180,
    borderRadius: radii.pill,
    borderWidth: border.standard,
    borderColor: colors.ink,
    backgroundColor: colors.white,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  barFill: {
    width: '100%',
    borderRadius: radii.pill,
  },
  chartWeekday: {
    ...type.caption,
    color: colors.ink,
    fontFamily: fonts.semibold,
    marginTop: spacing.xs,
  },
  splitRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  splitCard: {
    flex: 1,
    minWidth: 0,
    minHeight: 142,
    borderRadius: radii.md,
    borderWidth: border.standard,
    borderColor: colors.ink,
    padding: spacing.md,
    justifyContent: 'space-between',
  },
  splitLabel: {
    ...type.body,
    fontFamily: fonts.bold,
  },
  splitValue: {
    ...type.cardTitle,
    marginTop: spacing.xxs,
  },
  splitTrend: {
    ...type.caption,
    marginTop: 2,
  },
  tabBar: {
    height: 68,
    borderRadius: radii.pill,
    borderWidth: border.standard,
    borderColor: colors.ink,
    backgroundColor: colors.charcoal,
    padding: spacing.xs,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.xs,
    overflow: 'hidden',
  },
  activeTab: {
    position: 'absolute',
    top: spacing.xs,
    bottom: spacing.xs,
    left: 0,
    borderRadius: radii.pill,
    borderWidth: border.standard,
    borderColor: colors.ink,
    backgroundColor: colors.white,
  },
  tabItem: {
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: radii.pill,
    zIndex: 1,
  },
  tabItemExpanded: {
    flexShrink: 0,
    minWidth: 0,
    paddingHorizontal: spacing.lg,
  },
  tabItemExpandedCompact: { paddingHorizontal: spacing.sm },
  tabItemInactive: { width: 48, flexShrink: 0 },
  activeTabLabel: {
    ...type.body,
    fontFamily: fonts.bold,
    color: colors.ink,
    flexShrink: 1,
  },
  inactiveIcon: {
    width: 48,
    height: 48,
    borderRadius: radii.pill,
    backgroundColor: colors.mutedGray,
    borderWidth: border.standard,
    borderColor: colors.mutedGray,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { opacity: 0.7 },
  disabled: { opacity: 0.38 },
});
