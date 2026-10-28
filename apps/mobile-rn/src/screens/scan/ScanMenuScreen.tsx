import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/types';
import { useApp } from '../../state/AppProvider';
import { border, colors, fonts, radii, spacing, type } from '../../theme';
import { Icon, type IconName } from '../../components/ui';
import { NeoTopBar } from '../../components/neo';
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
    backgroundColor: string;
    onPress: () => void;
  }[] = [
    {
      label: 'TAKE PHOTO',
      icon: 'camera-outline',
      backgroundColor: colors.mintCard,
      onPress: () => navigation.replace('Camera', { slot, source: 'camera' }),
    },
    {
      label: 'CHOOSE PHOTO',
      icon: 'image-outline',
      backgroundColor: colors.coralCard,
      onPress: () => navigation.replace('Camera', { slot, source: 'library' }),
    },
    {
      label: 'SEARCH FOOD',
      icon: 'magnify',
      backgroundColor: colors.butterCard,
      onPress: () => navigation.replace('FoodSearch', { slot }),
    },
    {
      label: 'SCAN BARCODE',
      icon: 'barcode-scan',
      backgroundColor: colors.skyAccent,
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
      />
      <View style={styles.sheet}>
        <NeoTopBar
          title="Add a meal"
          leftColor={colors.butterCard}
          rightColor={colors.coralButton}
          rightIcon="close"
          onBack={() => navigation.goBack()}
          onRight={() => navigation.goBack()}
        />

        <View style={styles.progressCard}>
          <View>
            <Text style={styles.progressLabel}>TODAY’S PROGRESS</Text>
            <Text style={styles.progressValue}>
              {Math.round(todayCalories).toLocaleString()}
              <Text style={styles.progressTarget}>
                {' '}
                / {state.target?.targetKcal.toLocaleString() ?? '—'} kcal
              </Text>
            </Text>
          </View>
          <View style={styles.progressIcon}>
            <Icon name="chart-donut" size={22} color={colors.ink} />
          </View>
          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${Math.min(
                    100,
                    state.target
                      ? (todayCalories / state.target.targetKcal) * 100
                      : 0,
                  )}%`,
                },
              ]}
            />
          </View>
        </View>

        <Text style={styles.title}>What did you eat?</Text>
        <View style={styles.grid}>
          {actions.map((action) => (
            <Pressable
              key={action.label}
              accessibilityRole="button"
              onPress={action.onPress}
              style={({ pressed }) => [
                styles.action,
                { backgroundColor: action.backgroundColor },
                pressed && styles.pressed,
              ]}
            >
              <View style={styles.actionIcon}>
                <Icon name={action.icon} size={26} color={colors.ink} />
              </View>
              <Text style={styles.actionLabel}>{action.label}</Text>
            </Pressable>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: colors.lavenderBackdrop,
    justifyContent: 'flex-end',
  },
  scrim: { flex: 1 },
  sheet: {
    backgroundColor: colors.peachCanvas,
    borderTopLeftRadius: radii.lg,
    borderTopRightRadius: radii.lg,
    borderWidth: border.standard,
    borderColor: colors.ink,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xs,
    paddingBottom: spacing.xxl,
  },
  progressCard: {
    position: 'relative',
    overflow: 'hidden',
    marginTop: spacing.md,
    borderRadius: radii.md,
    borderWidth: border.standard,
    borderColor: colors.ink,
    backgroundColor: colors.violetCard,
    padding: spacing.md,
  },
  progressLabel: { ...type.caption, fontFamily: fonts.bold },
  progressValue: { ...type.metric, marginTop: spacing.xxs },
  progressTarget: { ...type.body },
  progressIcon: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    width: 44,
    height: 44,
    borderRadius: radii.pill,
    borderWidth: border.standard,
    borderColor: colors.ink,
    backgroundColor: colors.chartBlue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressTrack: {
    height: 12,
    borderRadius: radii.pill,
    borderWidth: border.standard,
    borderColor: colors.ink,
    backgroundColor: colors.white,
    overflow: 'hidden',
    marginTop: spacing.md,
  },
  progressFill: { height: '100%', backgroundColor: colors.skyAccent },
  title: {
    ...type.headline,
    textAlign: 'center',
    marginTop: spacing.xl,
    marginBottom: spacing.md,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  action: {
    width: '47%',
    flexGrow: 1,
    minHeight: 112,
    borderRadius: radii.md,
    borderWidth: border.standard,
    borderColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    padding: spacing.sm,
  },
  actionIcon: {
    width: 46,
    height: 46,
    borderRadius: radii.pill,
    borderWidth: border.standard,
    borderColor: colors.ink,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionLabel: { ...type.body, fontFamily: fonts.bold, textAlign: 'center' },
  pressed: { opacity: 0.7 },
});
