import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { colors, fonts, radii, spacing } from '../theme';
import { Icon } from './ui';

export function BottomNav({
  state,
  navigation,
  onScan,
}: Pick<BottomTabBarProps, 'state' | 'navigation'> & { onScan: () => void }) {
  const insets = useSafeAreaInsets();
  const activeName = state.routes[state.index]?.name;
  const navigate = (name: string) => navigation.navigate(name);

  return (
    <View style={[styles.shell, { paddingBottom: Math.max(8, insets.bottom) }]}>
      <Pressable
        accessibilityRole="tab"
        accessibilityState={{ selected: activeName === 'Home' }}
        onPress={() => navigate('Home')}
        style={styles.item}
      >
        <Icon
          name={activeName === 'Home' ? 'home' : 'home-outline'}
          color={activeName === 'Home' ? colors.primary : colors.onSurfaceVariant}
          size={23}
        />
        <Text style={[styles.label, activeName === 'Home' && styles.activeLabel]}>Home</Text>
      </Pressable>
      <Pressable
        accessibilityRole="tab"
        accessibilityState={{ selected: activeName === 'Progress' }}
        onPress={() => navigate('Progress')}
        style={styles.item}
      >
        <Icon
          name="chart-line"
          color={activeName === 'Progress' ? colors.primary : colors.onSurfaceVariant}
          size={23}
        />
        <Text style={[styles.label, activeName === 'Progress' && styles.activeLabel]}>Progress</Text>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Add a meal"
        onPress={onScan}
        style={styles.scanWrap}
      >
        <View style={styles.scanButton}>
          <Icon name="plus" color={colors.white} size={29} />
        </View>
        <Text style={styles.scanLabel}>Scan</Text>
      </Pressable>
      <Pressable
        accessibilityRole="tab"
        accessibilityState={{ selected: activeName === 'Insights' }}
        onPress={() => navigate('Insights')}
        style={styles.item}
      >
        <Icon
          name={activeName === 'Insights' ? 'lightbulb' : 'lightbulb-outline'}
          color={activeName === 'Insights' ? colors.primary : colors.onSurfaceVariant}
          size={23}
        />
        <Text style={[styles.label, activeName === 'Insights' && styles.activeLabel]}>Insights</Text>
      </Pressable>
      <Pressable
        accessibilityRole="tab"
        accessibilityState={{ selected: activeName === 'Profile' }}
        onPress={() => navigate('Profile')}
        style={styles.item}
      >
        <Icon
          name={activeName === 'Profile' ? 'account' : 'account-outline'}
          color={activeName === 'Profile' ? colors.primary : colors.onSurfaceVariant}
          size={23}
        />
        <Text style={[styles.label, activeName === 'Profile' && styles.activeLabel]}>Profile</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    minHeight: 74,
    backgroundColor: 'rgba(252,249,248,0.97)',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.surfaceHigh,
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: spacing.md,
    paddingTop: 8,
  },
  item: {
    flex: 1,
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 3,
    borderRadius: radii.md,
    paddingVertical: 4,
  },
  label: {
    fontFamily: fonts.regular,
    fontSize: 10,
    color: colors.onSurfaceVariant,
  },
  activeLabel: { color: colors.primary, fontFamily: fonts.semibold },
  scanWrap: {
    width: 74,
    alignItems: 'center',
    marginTop: -27,
    gap: 4,
  },
  scanButton: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: colors.surface,
  },
  scanLabel: {
    fontFamily: fonts.regular,
    fontSize: 10,
    color: colors.onSurfaceVariant,
  },
});
