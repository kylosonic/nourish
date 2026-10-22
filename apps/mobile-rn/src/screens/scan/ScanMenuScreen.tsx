import React from 'react';
import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/types';
import { useApp } from '../../state/AppProvider';
import { colors, fonts, radii, spacing, type } from '../../theme';
import { Icon, type IconName } from '../../components/ui';
import { images } from '../../data/images';
import { localDateKey } from '../../utils/date';

type Props = NativeStackScreenProps<RootStackParamList, 'ScanMenu'>;

export function ScanMenuScreen({ navigation, route }: Props) {
  const { state } = useApp();
  const slot = route.params?.slot;
  const todayCalories = state.meals
    .filter((meal) => meal.dateKey === localDateKey())
    .flatMap((meal) => meal.items)
    .reduce((sum, item) => sum + item.nutrition.kcal, 0);

  const actions: {
    label: string;
    icon: IconName;
    tint: string;
    onPress: () => void;
  }[] = [
    {
      label: 'TAKE PHOTO',
      icon: 'camera-outline',
      tint: colors.primary,
      onPress: () => navigation.replace('Camera', { slot, source: 'camera' }),
    },
    {
      label: 'CHOOSE PHOTO',
      icon: 'image-outline',
      tint: colors.primary,
      onPress: () => navigation.replace('Camera', { slot, source: 'library' }),
    },
    {
      label: 'SEARCH FOOD',
      icon: 'magnify',
      tint: colors.onSurfaceVariant,
      onPress: () => navigation.replace('FoodSearch', { slot }),
    },
    {
      label: 'SCAN BARCODE',
      icon: 'barcode-scan',
      tint: colors.amber,
      onPress: () => navigation.replace('Barcode', { slot }),
    },
  ];

  return (
    <View style={styles.page}>
      <Pressable
        accessibilityLabel="Close scan menu"
        accessibilityRole="button"
        style={styles.scrim}
        onPress={() => navigation.goBack()}
      >
        <Image source={images.scanMenu} style={styles.scanBackdrop} />
      </Pressable>
      <View style={styles.sheet}>
        <View style={styles.handle} />
        <View style={styles.topRow}>
          <Text style={styles.wordmark}>Nourish</Text>
          <Pressable
            accessibilityLabel="Close"
            onPress={() => navigation.goBack()}
            style={styles.close}
          >
            <Icon name="close" size={24} color={colors.onSurfaceVariant} />
          </Pressable>
        </View>
        <View style={styles.progressRow}>
          <Text style={styles.progressLabel}>TODAY’S PROGRESS</Text>
          <Text style={styles.progressValue}>
            {Math.round(todayCalories).toLocaleString()} / {state.target?.targetKcal.toLocaleString() ?? '—'} kcal
          </Text>
        </View>
        <View style={styles.progressTrack}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${Math.min(
                  100,
                  state.target ? (todayCalories / state.target.targetKcal) * 100 : 0,
                )}%`,
              },
            ]}
          />
        </View>
        <Text style={styles.title}>What did you eat?</Text>
        <View style={styles.grid}>
          {[actions.slice(0, 2), actions.slice(2, 4)].map(
            (row, rowIndex) => (
              <View key={rowIndex} style={styles.actionRow}>
                {row.map((action) => (
                  <Pressable
                    key={action.label}
                    accessibilityRole="button"
                    onPress={action.onPress}
                    style={({ pressed }) => [styles.action, pressed && { opacity: 0.62 }]}
                  >
                    <Icon name={action.icon} size={27} color={action.tint} />
                    <Text style={styles.actionLabel}>{action.label}</Text>
                  </Pressable>
                ))}
              </View>
            ),
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: 'transparent', justifyContent: 'flex-end' },
  scrim: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: 'rgba(20,20,20,0.66)',
  },
  scanBackdrop: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    opacity: 0.22,
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radii.xxl,
    borderTopRightRadius: radii.xxl,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xxl,
  },
  handle: {
    width: 48,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.outlineVariant,
    alignSelf: 'center',
    marginBottom: spacing.md,
  },
  topRow: { flexDirection: 'row', alignItems: 'center' },
  wordmark: { flex: 1, fontFamily: fonts.bold, fontSize: 25, color: colors.primary },
  close: { padding: spacing.xs },
  progressRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.md },
  progressLabel: { ...type.label, fontSize: 10 },
  progressValue: { ...type.bodySmall, fontFamily: fonts.semibold },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.surfaceHighest,
    overflow: 'hidden',
    marginTop: spacing.xs,
  },
  progressFill: { height: '100%', backgroundColor: colors.primaryContainer },
  title: { ...type.title, textAlign: 'center', marginTop: spacing.xl, marginBottom: spacing.lg },
  grid: { gap: spacing.xs },
  actionRow: { flexDirection: 'row', gap: spacing.xs },
  action: {
    flex: 1,
    minHeight: 92,
    borderRadius: radii.md,
    backgroundColor: colors.surfaceHigh,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  actionLabel: { ...type.label, fontSize: 10, color: colors.onSurfaceVariant },
});
