import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import {
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

const NAV_HEIGHT = 76;
const ITEM_HEIGHT = 60;
const HORIZONTAL_PADDING = 10;
const GAP = 6;
const DRAG_THRESHOLD = 6;

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
  const [glow, setGlow] = useState({ active: false, x: 0, y: NAV_HEIGHT / 2 });
  const [indicatorX] = useState(
    () => new Animated.Value(HORIZONTAL_PADDING),
  );
  const [engagedScale] = useState(() => new Animated.Value(1));

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
      if (!animated) {
        indicatorX.setValue(toValue);
        return;
      }
      Animated.timing(indicatorX, {
        toValue,
        duration: 360,
        easing: Easing.bezier(0.22, 1, 0.36, 1),
        useNativeDriver: false,
      }).start();
    },
    [indicatorX, indexX, itemWidth],
  );

  const animateEngaged = useCallback(
    (engaged: boolean) => {
      Animated.timing(engagedScale, {
        toValue: engaged ? 1.03 : 1,
        duration: 180,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }).start();
    },
    [engagedScale],
  );

  useEffect(() => {
    animateIndicator(activeIndex, hasPositioned.current);
    hasPositioned.current = itemWidth > 0;
  }, [activeIndex, animateIndicator, itemWidth]);

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
        setTimeout(() => {
          setScanActive(false);
          animateIndicator(activeIndex);
        }, 360);
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
      setDragIndex(nextIndex);
      setGlow({ active: true, x: localX, y: NAV_HEIGHT / 2 });
    },
    [
      animateEngaged,
      indexFromX,
      indicatorX,
      itemStep,
      itemWidth,
      navLeft,
      navWidth,
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
      style={[styles.container, { paddingBottom: Math.max(8, insets.bottom) }]}
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
          <BlurView
            intensity={82}
            tint="light"
            experimentalBlurMethod={
              Platform.OS === 'android' ? 'dimezisBlurView' : 'none'
            }
            style={StyleSheet.absoluteFill}
          />
          <LinearGradient
            colors={[
              'rgba(255,255,255,0.72)',
              'rgba(238,247,243,0.48)',
              'rgba(255,255,255,0.28)',
            ]}
            locations={[0, 0.52, 1]}
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
                transform: [{ translateX: indicatorX }],
              },
            ]}
          >
            <View style={styles.indicatorFill}>
              <LinearGradient
                colors={[
                  'rgba(255,255,255,0.54)',
                  'rgba(223,247,236,0.34)',
                  'rgba(255,255,255,0.18)',
                ]}
                style={StyleSheet.absoluteFill}
              />
              <View style={styles.indicatorSpecular} />
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
    height: 108,
    paddingHorizontal: 8,
    justifyContent: 'flex-end',
    backgroundColor: 'transparent',
  },
  shell: {
    borderRadius: NAV_HEIGHT / 2,
    shadowColor: '#26483A',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.2,
    shadowRadius: 30,
    elevation: 18,
  },
  glass: {
    height: NAV_HEIGHT,
    borderRadius: NAV_HEIGHT / 2,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.82)',
    backgroundColor: 'rgba(234,240,237,0.5)',
    overflow: 'hidden',
    userSelect: 'none',
  },
  topSpecular: {
    position: 'absolute',
    top: 1,
    left: 30,
    right: 30,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.96)',
  },
  bottomInnerShadow: {
    position: 'absolute',
    left: 22,
    right: 22,
    bottom: 1,
    height: 1,
    backgroundColor: 'rgba(0,91,62,0.12)',
  },
  indicator: {
    position: 'absolute',
    left: 0,
    top: 8,
    height: ITEM_HEIGHT,
    borderRadius: ITEM_HEIGHT / 2,
    zIndex: 1,
    shadowColor: '#5A7469',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 14,
    elevation: 5,
  },
  indicatorFill: {
    flex: 1,
    borderRadius: ITEM_HEIGHT / 2,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.86)',
    backgroundColor: 'rgba(255,255,255,0.22)',
  },
  indicatorSpecular: {
    position: 'absolute',
    top: 1,
    left: 14,
    right: 14,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.92)',
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
    alignItems: 'center',
    justifyContent: 'center',
    gap: 1,
  },
  itemPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.97 }],
  },
  label: {
    fontFamily: fonts.semibold,
    fontSize: 10,
    lineHeight: 13,
    letterSpacing: 0.02,
    color: '#47584F',
    textShadowColor: 'rgba(15,18,24,0.24)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 7,
  },
  labelActive: {
    color: colors.primary,
  },
});
