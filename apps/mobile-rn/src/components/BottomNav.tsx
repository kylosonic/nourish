import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import {
  AccessibilityInfo,
  Animated,
  Easing,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  type LayoutChangeEvent,
  type PointerEvent as RNPointerEvent,
} from 'react-native';
import { BlurView } from 'expo-blur';
import {
  GlassView,
  isLiquidGlassAvailable,
} from 'expo-glass-effect';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import Svg, {
  Circle,
  ClipPath,
  Defs,
  RadialGradient,
  Rect,
  Stop,
} from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { colors, fonts } from '../theme';
import { Icon, type IconName } from './ui';

const NAV_HEIGHT = 72;
const ITEM_HEIGHT = 58;
const HORIZONTAL_PADDING = 8;
const GAP = 2;
const DRAG_THRESHOLD = 5;
const USE_NATIVE_DRIVER = Platform.OS !== 'web';

type TabName = 'Home' | 'Progress' | 'Insights' | 'Profile';
type NavAction =
  | {
      kind: 'tab';
      tab: TabName;
      label: string;
      icon: IconName;
      activeIcon: IconName;
    }
  | {
      kind: 'scan';
      label: string;
      icon: IconName;
      activeIcon: IconName;
    };

const actions: NavAction[] = [
  { kind: 'tab', tab: 'Home', label: 'Home', icon: 'home-outline', activeIcon: 'home' },
  {
    kind: 'tab',
    tab: 'Progress',
    label: 'Progress',
    icon: 'chart-timeline-variant',
    activeIcon: 'chart-timeline-variant',
  },
  { kind: 'scan', label: 'Scan', icon: 'scan-helper', activeIcon: 'scan-helper' },
  {
    kind: 'tab',
    tab: 'Insights',
    label: 'Insights',
    icon: 'lightbulb-outline',
    activeIcon: 'lightbulb',
  },
  {
    kind: 'tab',
    tab: 'Profile',
    label: 'Profile',
    icon: 'account-outline',
    activeIcon: 'account',
  },
];

export function BottomNav({
  state,
  navigation,
  onScan,
}: Pick<BottomTabBarProps, 'state' | 'navigation'> & { onScan: () => void }) {
  const insets = useSafeAreaInsets();
  const activeName = state.routes[state.index]?.name;
  const activeIndex = Math.max(
    0,
    actions.findIndex((item) => item.kind === 'tab' && item.tab === activeName),
  );
  const navRef = useRef<React.ComponentRef<typeof View>>(null);
  const hasPositioned = useRef(false);
  const pointerStart = useRef<{ x: number; y: number } | null>(null);
  const pointerDragging = useRef(false);
  const suppressNextPress = useRef(false);
  const [navWidth, setNavWidth] = useState(0);
  const [navLeft, setNavLeft] = useState(0);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [scanActive, setScanActive] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [glow, setGlow] = useState({ active: false, x: 0, y: NAV_HEIGHT / 2 });
  const [indicatorX] = useState(
    () => new Animated.Value(HORIZONTAL_PADDING),
  );
  const [indicatorScale] = useState(() => new Animated.Value(1));
  const [indicatorGlint] = useState(() => new Animated.Value(0));
  const [engagedScale] = useState(() => new Animated.Value(1));
  const scanTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const canUseNativeGlass =
    Platform.OS === 'ios' && isLiquidGlassAvailable();

  const itemWidth =
    navWidth > 0
      ? (navWidth - HORIZONTAL_PADDING * 2 - GAP * (actions.length - 1)) /
        actions.length
      : 0;
  const itemStep = itemWidth + GAP;

  const indexX = useCallback(
    (index: number) => HORIZONTAL_PADDING + index * (itemWidth + GAP),
    [itemWidth],
  );

  const animateIndicator = useCallback(
    (index: number, animated = true) => {
      if (itemWidth <= 0) return;
      const toValue = indexX(index);
      if (!animated || reduceMotion) {
        indicatorX.setValue(toValue);
        indicatorScale.setValue(1);
        indicatorGlint.setValue(0);
        return;
      }

      indicatorX.stopAnimation();
      indicatorScale.stopAnimation();
      indicatorGlint.stopAnimation();
      indicatorScale.setValue(0.94);
      indicatorGlint.setValue(0);

      Animated.parallel([
        Animated.spring(indicatorX, {
          toValue,
          stiffness: 245,
          damping: 27,
          mass: 0.78,
          useNativeDriver: USE_NATIVE_DRIVER,
        }),
        Animated.spring(indicatorScale, {
          toValue: 1,
          stiffness: 300,
          damping: 24,
          mass: 0.72,
          useNativeDriver: USE_NATIVE_DRIVER,
        }),
        Animated.timing(indicatorGlint, {
          toValue: 1,
          duration: 420,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: USE_NATIVE_DRIVER,
        }),
      ]).start();
    },
    [
      indicatorGlint,
      indicatorScale,
      indicatorX,
      indexX,
      itemWidth,
      reduceMotion,
    ],
  );

  const animateEngaged = useCallback(
    (engaged: boolean) => {
      if (reduceMotion) {
        engagedScale.setValue(1);
        return;
      }
      Animated.timing(engagedScale, {
        toValue: engaged ? 1.03 : 1,
        duration: 180,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: USE_NATIVE_DRIVER,
      }).start();
    },
    [engagedScale, reduceMotion],
  );

  useEffect(() => {
    let mounted = true;
    void AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      if (mounted) setReduceMotion(enabled);
    });
    const subscription = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      setReduceMotion,
    );
    return () => {
      mounted = false;
      subscription.remove();
    };
  }, []);

  useEffect(() => {
    animateIndicator(activeIndex, hasPositioned.current);
    hasPositioned.current = itemWidth > 0;
  }, [activeIndex, animateIndicator, itemWidth]);

  useEffect(() => {
    return () => {
      if (scanTimer.current) clearTimeout(scanTimer.current);
    };
  }, []);

  const measureNav = useCallback(() => {
    navRef.current?.measureInWindow((x) => {
      setNavLeft(x);
    });
  }, []);

  const handleLayout = useCallback(
    (event: LayoutChangeEvent) => {
      setNavWidth(event.nativeEvent.layout.width);
      requestAnimationFrame(measureNav);
    },
    [measureNav],
  );

  const showGlowAt = useCallback(
    (index: number) => {
      if (itemWidth <= 0) return;
      setGlow({
        active: true,
        x: indexX(index) + itemWidth / 2,
        y: NAV_HEIGHT / 2,
      });
    },
    [indexX, itemWidth],
  );

  const triggerSelection = useCallback(() => {
    if (Platform.OS !== 'web') {
      void Haptics.selectionAsync();
    }
  }, []);

  const activateAction = useCallback(
    (index: number) => {
      const action = actions[Math.max(0, Math.min(actions.length - 1, index))];
      setDragIndex(null);
      animateIndicator(index);
      triggerSelection();

      if (action.kind === 'scan') {
        setScanActive(true);
        onScan();
        if (scanTimer.current) clearTimeout(scanTimer.current);
        scanTimer.current = setTimeout(() => {
          setScanActive(false);
          animateIndicator(activeIndex);
          scanTimer.current = null;
        }, 480);
      } else {
        setScanActive(false);
        navigation.navigate(action.tab);
      }
    },
    [activeIndex, animateIndicator, navigation, onScan, triggerSelection],
  );

  const indexFromX = useCallback(
    (x: number) => {
      if (itemStep <= 0) return 0;
      return Math.max(
        0,
        Math.min(
          actions.length - 1,
          Math.round((x - HORIZONTAL_PADDING) / itemStep),
        ),
      );
    },
    [itemStep],
  );

  const handlePointerDown = useCallback((event: RNPointerEvent) => {
    const { button, isPrimary, pageX, pageY, pointerType } = event.nativeEvent;
    if (!isPrimary || (pointerType === 'mouse' && button !== 0)) return;
    pointerStart.current = { x: pageX, y: pageY };
    pointerDragging.current = false;
  }, []);

  const handlePointerMove = useCallback(
    (event: RNPointerEvent) => {
      const start = pointerStart.current;
      if (!start || itemWidth <= 0) return;
      const { pageX, pageY } = event.nativeEvent;
      const dx = pageX - start.x;
      const dy = pageY - start.y;

      if (
        !pointerDragging.current &&
        Math.abs(dx) > DRAG_THRESHOLD &&
        Math.abs(dx) > Math.abs(dy)
      ) {
        pointerDragging.current = true;
        animateEngaged(true);
      }
      if (!pointerDragging.current) return;

      event.preventDefault();
      const localX = Math.max(
        HORIZONTAL_PADDING,
        Math.min(navWidth - HORIZONTAL_PADDING, pageX - navLeft),
      );
      const nextIndex = indexFromX(localX);
      const nextX = Math.max(
        HORIZONTAL_PADDING,
        Math.min(
          HORIZONTAL_PADDING + itemStep * (actions.length - 1),
          localX - itemWidth / 2,
        ),
      );
      indicatorX.setValue(nextX);
      if (!reduceMotion) indicatorScale.setValue(1.035);
      setDragIndex(nextIndex);
      setGlow({ active: true, x: localX, y: NAV_HEIGHT / 2 });
    },
    [
      animateEngaged,
      indexFromX,
      indicatorX,
      indicatorScale,
      itemStep,
      itemWidth,
      navLeft,
      navWidth,
      reduceMotion,
    ],
  );

  const finishPointerGesture = useCallback(
    (pageX: number, cancelled: boolean) => {
      const wasDragging = pointerDragging.current;
      pointerStart.current = null;
      pointerDragging.current = false;
      animateEngaged(false);
      setGlow((current) => ({ ...current, active: false }));

      if (!wasDragging) return;
      suppressNextPress.current = true;
      setTimeout(() => {
        suppressNextPress.current = false;
      }, 0);

      if (cancelled) {
        setDragIndex(null);
        animateIndicator(activeIndex);
        return;
      }
      activateAction(indexFromX(pageX - navLeft));
    },
    [
      activateAction,
      activeIndex,
      animateEngaged,
      animateIndicator,
      indexFromX,
      navLeft,
    ],
  );

  const handlePointerUp = useCallback(
    (event: RNPointerEvent) => {
      finishPointerGesture(event.nativeEvent.pageX, false);
    },
    [finishPointerGesture],
  );

  const handlePointerCancel = useCallback(
    (event: RNPointerEvent) => {
      finishPointerGesture(event.nativeEvent.pageX, true);
    },
    [finishPointerGesture],
  );

  const visualIndex = dragIndex ?? (scanActive ? 2 : activeIndex);

  return (
    <View
      pointerEvents="box-none"
      style={[
        styles.container,
        {
          height: NAV_HEIGHT + Math.max(8, insets.bottom) + 16,
          paddingBottom: Math.max(8, insets.bottom),
        },
      ]}
    >
      <Animated.View style={[styles.shell, { transform: [{ scale: engagedScale }] }]}>
        <View
          ref={navRef}
          onLayout={handleLayout}
          style={styles.glass}
          onPointerDownCapture={handlePointerDown}
          onPointerMoveCapture={handlePointerMove}
          onPointerUpCapture={handlePointerUp}
          onPointerCancelCapture={handlePointerCancel}
        >
          {canUseNativeGlass ? (
            <GlassView
              pointerEvents="none"
              glassEffectStyle={{ style: 'regular', animate: true }}
              tintColor="rgba(255,255,255,0.16)"
              colorScheme="light"
              style={StyleSheet.absoluteFill}
            />
          ) : (
            <BlurView
              pointerEvents="none"
              intensity={68}
              tint="light"
              blurMethod={
                Platform.OS === 'android'
                  ? 'dimezisBlurViewSdk31Plus'
                  : undefined
              }
              style={StyleSheet.absoluteFill}
            />
          )}
          <LinearGradient
            pointerEvents="none"
            colors={[
              'rgba(255,255,255,0.78)',
              'rgba(238,247,243,0.46)',
              'rgba(227,237,239,0.28)',
            ]}
            locations={[0, 0.56, 1]}
            start={{ x: 0.08, y: 0 }}
            end={{ x: 0.9, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          {glow.active && navWidth > 0 ? (
            <Svg
              pointerEvents="none"
              width={navWidth}
              height={NAV_HEIGHT}
              style={StyleSheet.absoluteFill}
            >
              <Defs>
                <RadialGradient id="navGlow" cx="50%" cy="50%" r="50%">
                  <Stop offset="0" stopColor="#CDE4FF" stopOpacity="0.52" />
                  <Stop offset="0.56" stopColor="#CDE4FF" stopOpacity="0.16" />
                  <Stop offset="1" stopColor="#CDE4FF" stopOpacity="0" />
                </RadialGradient>
                <ClipPath id="navClip">
                  <Rect
                    x="0"
                    y="0"
                    width={navWidth}
                    height={NAV_HEIGHT}
                    rx={NAV_HEIGHT / 2}
                  />
                </ClipPath>
              </Defs>
              <Circle
                cx={glow.x}
                cy={glow.y}
                r={128}
                fill="url(#navGlow)"
                clipPath="url(#navClip)"
              />
            </Svg>
          ) : null}
          <View pointerEvents="none" style={styles.topSpecular} />
          <View pointerEvents="none" style={styles.bottomInnerShadow} />

          <Animated.View
            pointerEvents="none"
            style={[
              styles.indicator,
              {
                width: itemWidth,
                transform: [
                  { translateX: indicatorX },
                  { scale: indicatorScale },
                ],
              },
            ]}
          >
            <View style={styles.indicatorFill}>
              {canUseNativeGlass ? (
                <GlassView
                  pointerEvents="none"
                  glassEffectStyle={{
                    style: 'clear',
                    animate: true,
                    animationDuration: 0.42,
                  }}
                  tintColor="rgba(255,255,255,0.22)"
                  colorScheme="light"
                  style={StyleSheet.absoluteFill}
                />
              ) : (
                <BlurView
                  pointerEvents="none"
                  intensity={42}
                  tint="light"
                  blurMethod={
                    Platform.OS === 'android'
                      ? 'dimezisBlurViewSdk31Plus'
                      : undefined
                  }
                  style={StyleSheet.absoluteFill}
                />
              )}
              <LinearGradient
                pointerEvents="none"
                colors={[
                  'rgba(255,255,255,0.64)',
                  'rgba(220,250,237,0.3)',
                  'rgba(235,244,255,0.2)',
                ]}
                locations={[0, 0.54, 1]}
                start={{ x: 0, y: 0.12 }}
                end={{ x: 1, y: 0.9 }}
                style={StyleSheet.absoluteFill}
              />
              <Animated.View
                style={[
                  styles.lensGlint,
                  {
                    transform: [
                      {
                        translateX: indicatorGlint.interpolate({
                          inputRange: [0, 1],
                          outputRange: [-itemWidth * 0.34, itemWidth * 0.34],
                        }),
                      },
                      { rotate: '12deg' },
                    ],
                  },
                ]}
              />
              <View style={styles.indicatorSpecular} />
              <View style={styles.indicatorLowerEdge} />
            </View>
          </Animated.View>

          <View style={styles.items}>
            {actions.map((action, index) => {
              const selected = visualIndex === index;
              return (
                <Pressable
                  key={action.label}
                  accessibilityRole={action.kind === 'tab' ? 'tab' : 'button'}
                  accessibilityLabel={
                    action.kind === 'scan' ? 'Scan a meal' : action.label
                  }
                  accessibilityState={
                    action.kind === 'tab' ? { selected } : undefined
                  }
                  aria-selected={
                    action.kind === 'tab' ? selected : undefined
                  }
                  hitSlop={4}
                  onPressIn={() => showGlowAt(index)}
                  onPressOut={() =>
                    setGlow((current) => ({ ...current, active: false }))
                  }
                  onPress={() => {
                    if (suppressNextPress.current) return;
                    activateAction(index);
                  }}
                  style={({ pressed }) => [
                    styles.item,
                    { width: itemWidth },
                    pressed && styles.itemPressed,
                  ]}
                >
                  <Icon
                    name={selected ? action.activeIcon : action.icon}
                    size={27}
                    color={selected ? colors.primary : '#47584F'}
                  />
                  <Text style={[styles.label, selected && styles.labelActive]}>
                    {action.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'flex-end',
    backgroundColor: 'transparent',
  },
  shell: {
    width: '100%',
    maxWidth: 560,
    borderRadius: NAV_HEIGHT / 2,
    borderCurve: 'continuous',
    shadowColor: '#203D31',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.18,
    shadowRadius: 26,
    elevation: 16,
  },
  glass: {
    height: NAV_HEIGHT,
    borderRadius: NAV_HEIGHT / 2,
    borderCurve: 'continuous',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.9)',
    backgroundColor: 'rgba(232,240,237,0.42)',
    overflow: 'hidden',
    userSelect: 'none',
  },
  topSpecular: {
    position: 'absolute',
    top: 1,
    left: 44,
    right: 44,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.98)',
  },
  bottomInnerShadow: {
    position: 'absolute',
    left: 34,
    right: 34,
    bottom: 1,
    height: 1,
    backgroundColor: 'rgba(0,91,62,0.14)',
  },
  indicator: {
    position: 'absolute',
    left: 0,
    top: 7,
    height: ITEM_HEIGHT,
    borderRadius: ITEM_HEIGHT / 2,
    borderCurve: 'continuous',
    zIndex: 1,
    shadowColor: '#315849',
    shadowOffset: { width: 0, height: 7 },
    shadowOpacity: 0.18,
    shadowRadius: 13,
    elevation: 6,
  },
  indicatorFill: {
    flex: 1,
    borderRadius: ITEM_HEIGHT / 2,
    borderCurve: 'continuous',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.92)',
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  lensGlint: {
    position: 'absolute',
    top: 5,
    bottom: 5,
    left: '50%',
    width: 15,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.34)',
    opacity: 0.75,
  },
  indicatorSpecular: {
    position: 'absolute',
    top: 2,
    left: 16,
    right: 16,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.96)',
  },
  indicatorLowerEdge: {
    position: 'absolute',
    left: 18,
    right: 18,
    bottom: 1,
    height: 1,
    backgroundColor: 'rgba(0,108,73,0.16)',
  },
  items: {
    zIndex: 2,
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: GAP,
    paddingHorizontal: HORIZONTAL_PADDING,
  },
  item: {
    height: ITEM_HEIGHT,
    borderRadius: ITEM_HEIGHT / 2,
    borderCurve: 'continuous',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  itemPressed: {
    opacity: 0.76,
    transform: [{ scale: 0.94 }],
  },
  label: {
    fontFamily: fonts.semibold,
    fontSize: 10,
    lineHeight: 12,
    letterSpacing: 0.08,
    color: '#53635B',
  },
  labelActive: {
    color: colors.primary,
    transform: [{ translateY: -1 }],
  },
});
