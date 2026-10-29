import React, { useCallback } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { border, colors, radii } from '../theme';
import { NeoFloatingTabBar, type NeoTabItem } from './neo';
import { Icon } from './ui';

const items: NeoTabItem[] = [
  { key: 'Home', label: 'Home', icon: 'home-outline', activeIcon: 'home' },
  {
    key: 'Progress',
    label: 'Progress',
    icon: 'chart-line',
    activeIcon: 'chart-line',
  },
  {
    key: 'Insights',
    label: 'Insights',
    icon: 'lightbulb-outline',
    activeIcon: 'lightbulb',
  },
  {
    key: 'Profile',
    label: 'Profile',
    icon: 'account-outline',
    activeIcon: 'account',
  },
];

export function BottomNav({
  state,
  navigation,
  onScan,
  reducedMotion,
}: Pick<BottomTabBarProps, 'state' | 'navigation'> & {
  onScan: () => void;
  reducedMotion: boolean;
}) {
  const insets = useSafeAreaInsets();
  const activeName = state.routes[state.index]?.name;
  const activeIndex = Math.max(
    0,
    items.findIndex((item) => item.key === activeName),
  );

  const selectTab = useCallback(
    (index: number) => {
      if (Platform.OS !== 'web') void Haptics.selectionAsync();
      const item = items[index];
      if (item) navigation.navigate(item.key as never);
    },
    [navigation],
  );

  return (
    <View
      pointerEvents="box-none"
      style={[
        styles.container,
        { bottom: Math.max(20, insets.bottom + 12) },
      ]}
    >
      <View style={styles.inner}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Scan a meal"
          onPress={() => {
            if (Platform.OS !== 'web') void Haptics.selectionAsync();
            onScan();
          }}
          style={({ pressed }) => [styles.scanButton, pressed && styles.pressed]}
        >
          <Icon name="line-scan" size={25} color={colors.ink} />
        </Pressable>
        <NeoFloatingTabBar
          items={items}
          activeIndex={activeIndex}
          onSelect={selectTab}
          reducedMotion={reducedMotion}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: 20,
    zIndex: 20,
  },
  inner: {
    width: '100%',
    maxWidth: 560,
  },
  scanButton: {
    position: 'absolute',
    right: 4,
    bottom: 78,
    zIndex: 2,
    width: 56,
    height: 56,
    borderRadius: radii.pill,
    borderWidth: border.standard,
    borderColor: colors.ink,
    backgroundColor: colors.butterCard,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { opacity: 0.72 },
});
