import React from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { colors, fonts, spacing } from '../theme';
import { Icon, type IconName } from './ui';

const items: {
  tab: 'Home' | 'Progress' | 'Insights' | 'Profile';
  label: string;
  icon: IconName;
  activeIcon: IconName;
}[] = [
  { tab: 'Home', label: 'Home', icon: 'home-outline', activeIcon: 'home' },
  { tab: 'Progress', label: 'Progress', icon: 'chart-line', activeIcon: 'chart-line' },
  { tab: 'Insights', label: 'Insights', icon: 'lightbulb-outline', activeIcon: 'lightbulb' },
  { tab: 'Profile', label: 'Profile', icon: 'account-outline', activeIcon: 'account' },
];

export function BottomNav({
  state,
  navigation,
  onScan,
}: Pick<BottomTabBarProps, 'state' | 'navigation'> & { onScan: () => void }) {
  const insets = useSafeAreaInsets();
  const activeName = state.routes[state.index]?.name;
  const navigate = (name: string) => navigation.navigate(name);

  return (
    <View
      pointerEvents="box-none"
      style={[styles.container, { paddingBottom: Math.max(8, insets.bottom) }]}
    >
      <View style={styles.lensShadow}>
        <View style={styles.glass}>
          <BlurView
            intensity={78}
            tint="light"
            experimentalBlurMethod={Platform.OS === 'android' ? 'dimezisBlurView' : 'none'}
            style={StyleSheet.absoluteFill}
          />
          <LinearGradient
            colors={[
              'rgba(255,255,255,0.82)',
              'rgba(245,252,248,0.52)',
              'rgba(255,255,255,0.34)',
            ]}
            start={{ x: 0.08, y: 0 }}
            end={{ x: 0.9, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.glassHighlight} />
          <View style={styles.glassLowlight} />
          <View style={styles.items}>
            {items.slice(0, 2).map((item) => (
              <NavItem
                key={item.tab}
                item={item}
                active={activeName === item.tab}
                onPress={() => navigate(item.tab)}
              />
            ))}
            <View style={styles.scanSlot}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Scan a meal"
                onPress={onScan}
                style={({ pressed }) => [styles.scanButton, pressed && styles.pressed]}
              >
                <LinearGradient
                  colors={['#00885C', '#006C49']}
                  start={{ x: 0.1, y: 0 }}
                  end={{ x: 0.9, y: 1 }}
                  style={StyleSheet.absoluteFill}
                />
                <View style={styles.scanGlint} />
                <Icon name="scan-helper" size={27} color={colors.white} />
              </Pressable>
              <Text style={styles.scanLabel}>Scan</Text>
            </View>
            {items.slice(2).map((item) => (
              <NavItem
                key={item.tab}
                item={item}
                active={activeName === item.tab}
                onPress={() => navigate(item.tab)}
              />
            ))}
          </View>
        </View>
      </View>
    </View>
  );
}

function NavItem({
  item,
  active,
  onPress,
}: {
  item: (typeof items)[number];
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityState={{ selected: active }}
      onPress={onPress}
      style={({ pressed }) => [styles.item, pressed && styles.pressed]}
    >
      {active ? (
        <View style={styles.activePill}>
          <LinearGradient
            colors={['rgba(255,255,255,0.88)', 'rgba(223,247,236,0.74)']}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.activeHighlight} />
        </View>
      ) : null}
      <Icon
        name={active ? item.activeIcon : item.icon}
        color={active ? colors.primary : '#46544C'}
        size={22}
      />
      <Text style={[styles.label, active && styles.activeLabel]}>{item.label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 108,
    paddingHorizontal: spacing.sm,
    justifyContent: 'flex-end',
    backgroundColor: 'transparent',
  },
  lensShadow: {
    borderRadius: 32,
    shadowColor: '#143A2A',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 16,
  },
  glass: {
    height: 72,
    borderRadius: 32,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.76)',
    overflow: 'hidden',
    backgroundColor: 'rgba(248,252,249,0.52)',
  },
  glassHighlight: {
    position: 'absolute',
    top: 1,
    left: 24,
    right: 24,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.95)',
  },
  glassLowlight: {
    position: 'absolute',
    left: 20,
    right: 20,
    bottom: 1,
    height: 1,
    backgroundColor: 'rgba(0,108,73,0.10)',
  },
  items: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 7,
  },
  item: {
    flex: 1,
    height: 56,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    overflow: 'hidden',
  },
  activePill: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.92)',
    overflow: 'hidden',
  },
  activeHighlight: {
    position: 'absolute',
    left: 12,
    right: 12,
    top: 1,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.95)',
  },
  label: {
    fontFamily: fonts.regular,
    fontSize: 9,
    color: '#46544C',
  },
  activeLabel: { color: colors.primary, fontFamily: fonts.semibold },
  scanSlot: {
    width: 72,
    height: 72,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -18,
    gap: 2,
  },
  scanButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.78)',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.34,
    shadowRadius: 12,
    elevation: 9,
  },
  scanGlint: {
    position: 'absolute',
    left: 12,
    right: 12,
    top: 2,
    height: 1.5,
    borderRadius: 1,
    backgroundColor: 'rgba(255,255,255,0.72)',
  },
  scanLabel: {
    fontFamily: fonts.semibold,
    fontSize: 9,
    color: colors.primary,
  },
  pressed: { opacity: 0.72, transform: [{ scale: 0.97 }] },
});
