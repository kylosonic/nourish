import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Image,
  Linking,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import type { MainTabParamList, RootStackParamList } from '../../navigation/types';
import { useApp, useTodayTotals, dayWater } from '../../state/AppProvider';
import {
  border,
  colors,
  fonts,
  radii,
  spacing,
  type,
} from '../../theme';
import {
  NeoFeatureCard,
  NeoFilterRow,
  NeoFoodMascot,
  NeoScreenWrapper,
} from '../../components/neo';
import { Icon } from '../../components/ui';
import { greetingFor, localDateKey } from '../../utils/date';
import { imageForFood } from '../../data/images';
import type { MealSlot } from '../../types';
import { fetchReleaseMetadata } from '../../data/api';
import { isNewerVersion } from '../../utils/version';
import { releaseDownloadUrl } from '../../data/release';
import { APP_VERSION } from '../../data/appInfo';

type TabNavigation = BottomTabNavigationProp<MainTabParamList>;
type RootNavigation = NativeStackNavigationProp<RootStackParamList>;
type MealFilter = 'All' | 'Breakfast' | 'Lunch' | 'Dinner';

export function HomeScreen() {
  const navigation = useNavigation<TabNavigation>();
  const rootNavigation = navigation.getParent<RootNavigation>();
  const { state, addWater, removeWater, syncCatalog } = useApp();
  const consumed = useTodayTotals();
  const today = localDateKey();
  const waterMl = dayWater(state, today);
  const [mealFilter, setMealFilter] = useState<MealFilter>('All');
  const [updateUrl, setUpdateUrl] = useState<string | null>(null);

  useEffect(() => {
    void syncCatalog();
    void fetchReleaseMetadata().then((metadata) => {
      if (
        Platform.OS === 'android' &&
        metadata &&
        isNewerVersion(metadata.version, APP_VERSION)
      ) {
        setUpdateUrl(releaseDownloadUrl(metadata));
      }
    });
  }, [syncCatalog]);

  const slotRows = useMemo(
    () =>
      (['breakfast', 'lunch', 'dinner', 'snack'] as MealSlot[])
        .map((slot) => {
          const meals = state.meals.filter(
            (meal) => meal.dateKey === today && meal.slot === slot,
          );
          const items = meals.flatMap((meal) => meal.items);
          const kcal = Math.round(
            items.reduce((sum, item) => sum + item.nutrition.kcal, 0),
          );
          return { slot, items, kcal };
        })
        .filter((row) => row.slot !== 'snack' || row.items.length > 0),
    [state.meals, today],
  );

  if (!state.target) {
    return (
      <NeoScreenWrapper tone="peach">
        <View style={styles.missingTarget}>
          <View style={styles.missingMascot}>
            <NeoFoodMascot size={136} />
          </View>
          <Text style={styles.missingTitle}>Set up your daily target</Text>
          <Text style={styles.missingCopy}>
            Finish personalization once and your nutrition plan will appear here.
          </Text>
        </View>
      </NeoScreenWrapper>
    );
  }

  const target = state.target;
  const caloriesLeft = Math.max(0, target.targetKcal - consumed.kcal);
  const proteinLeft = Math.max(0, target.proteinG - consumed.proteinG);
  const carbsLeft = Math.max(0, target.carbsG - consumed.carbsG);
  const fatLeft = Math.max(0, target.fatG - consumed.fatG);
  const openScan = (slot?: MealSlot) =>
    rootNavigation?.navigate('ScanMenu', { slot });
  const visibleRows =
    mealFilter === 'All'
      ? slotRows
      : slotRows.filter(
          (row) => row.slot.toLowerCase() === mealFilter.toLowerCase(),
        );

  return (
    <NeoScreenWrapper tone="peach" scroll contentStyle={styles.scroll}>
      {updateUrl ? (
        <Pressable
          accessibilityRole="button"
          onPress={() => void Linking.openURL(updateUrl)}
          style={styles.updateBanner}
        >
          <View style={styles.updateIcon}>
            <Icon name="download" size={20} color={colors.ink} />
          </View>
          <Text style={styles.updateText}>A new Nourish build is ready.</Text>
          <Icon name="arrow-right" size={21} color={colors.ink} />
        </Pressable>
      ) : null}

      <View style={styles.header}>
        <View style={styles.headerCopy}>
          <Text style={styles.greeting}>{greetingFor().toUpperCase()}</Text>
          <Text style={styles.display}>Fuel your{'\n'}day.</Text>
          <Text style={styles.subtitle}>
            {caloriesLeft.toLocaleString()} kcal left in today’s plan.
          </Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Open profile"
          onPress={() => navigation.navigate('Profile')}
          style={styles.avatar}
        >
          <Icon name="account" size={26} color={colors.ink} />
        </Pressable>
      </View>

      <NeoFilterRow
        items={['All', 'Breakfast', 'Lunch', 'Dinner']}
        selected={mealFilter}
        onSelect={(value) => setMealFilter(value as MealFilter)}
        actionIcon="bell-outline"
        actionLabel="Notification settings"
        onAction={() => {
          Alert.alert(
            'Hydration reminders',
            state.settings.remindersEnabled
              ? 'Reminders are on. Change them in Settings.'
              : 'Reminders are off. Turn them on in Settings.',
            [
              { text: 'Not now', style: 'cancel' },
              {
                text: 'Open settings',
                onPress: () => rootNavigation?.navigate('Settings'),
              },
            ],
          );
        }}
      />

      <View style={styles.feed}>
        <NeoFeatureCard
          title={'DAILY\nCALORIES'}
          value={caloriesLeft.toLocaleString()}
          caption={`${Math.round(consumed.kcal).toLocaleString()} logged of ${target.targetKcal.toLocaleString()} kcal`}
          backgroundColor={colors.mintCard}
          art={<NeoFoodMascot size={122} />}
        />
        <NeoFeatureCard
          title={'PROTEIN\nTO GO'}
          value={`${Math.round(proteinLeft)}g`}
          caption={`${Math.round(carbsLeft)}g carbs · ${Math.round(fatLeft)}g fat\nremaining today`}
          backgroundColor={colors.coralCard}
          art={<NeoFoodMascot size={112} />}
        />
      </View>

      <Pressable
        accessibilityRole="button"
        onPress={() => rootNavigation?.navigate('Recommendations')}
        style={({ pressed }) => [styles.ideaCard, pressed && styles.pressed]}
      >
        <View style={styles.ideaIcon}>
          <Icon name="silverware-fork-knife" size={21} color={colors.ink} />
        </View>
        <View style={styles.ideaCopy}>
          <Text style={styles.ideaTitle}>Need a meal idea?</Text>
          <Text style={styles.ideaCaption}>See foods that fit today’s budget.</Text>
        </View>
        <Icon name="arrow-right" size={22} color={colors.ink} />
      </Pressable>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Today’s meals</Text>
        <Pressable
          accessibilityRole="button"
          onPress={() => rootNavigation?.navigate('History')}
          style={styles.sectionAction}
        >
          <Text style={styles.sectionActionText}>SEE ALL</Text>
        </Pressable>
      </View>

      <View style={styles.mealList}>
        {visibleRows.map((row) => {
          const firstItem = row.items[0];
          const food = state.catalog.find(
            (candidate) => candidate.id === firstItem?.foodId,
          );
          return (
            <Pressable
              key={row.slot}
              accessibilityRole="button"
              onPress={() =>
                row.items.length > 0
                  ? rootNavigation?.navigate('History')
                  : openScan(row.slot)
              }
              style={({ pressed }) => [
                styles.mealRow,
                row.items.length === 0 && styles.mealRowEmpty,
                pressed && styles.pressed,
              ]}
            >
              {row.items.length > 0 ? (
                <Image source={imageForFood(food)} style={styles.mealImage} />
              ) : (
                <View style={styles.mealPlaceholder}>
                  <Icon name="plus" size={23} color={colors.ink} />
                </View>
              )}
              <View style={styles.mealCopy}>
                <Text style={styles.mealSlot}>
                  {row.slot.charAt(0).toUpperCase() + row.slot.slice(1)}
                </Text>
                <Text style={styles.mealName} numberOfLines={2}>
                  {row.items.length > 0
                    ? row.items.map((item) => item.foodName).join(' + ')
                    : 'Not logged'}
                </Text>
              </View>
              {row.items.length > 0 ? (
                <View style={styles.mealKcal}>
                  <Text style={styles.kcalValue}>{row.kcal.toLocaleString()}</Text>
                  <Text style={styles.kcalLabel}>kcal</Text>
                </View>
              ) : (
                <Icon name="chevron-right" size={20} color={colors.ink} />
              )}
            </Pressable>
          );
        })}
      </View>

      <View style={styles.hydration}>
        <View style={styles.hydrationTop}>
          <View>
            <Text style={styles.hydrationTitle}>Hydration</Text>
            <Text style={styles.hydrationValue}>
              {(waterMl / 1000).toFixed(2)}
              <Text style={styles.hydrationTotal}>
                {' '}
                / {(state.settings.waterTargetMl / 1000).toFixed(1)} L
              </Text>
            </Text>
          </View>
          <View style={styles.waterIcon}>
            <Icon name="water-outline" size={26} color={colors.ink} />
          </View>
        </View>
        <View style={styles.waterTrack}>
          <View
            style={[
              styles.waterFill,
              {
                width: `${Math.max(
                  0,
                  Math.min(
                    100,
                    (waterMl / state.settings.waterTargetMl) * 100,
                  ),
                )}%`,
              },
            ]}
          />
        </View>
        <View style={styles.hydrationActions}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Remove 250 millilitres of water"
            onPress={() => removeWater(250)}
            disabled={waterMl <= 0}
            style={[styles.waterButton, waterMl <= 0 && styles.disabled]}
          >
            <Icon name="minus" size={20} color={colors.ink} />
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Add 250 millilitres of water"
            onPress={() => addWater(250)}
            style={styles.addWater}
          >
            <Icon name="plus" size={18} color={colors.inverseInk} />
            <Text style={styles.addWaterText}>Add 250 ml</Text>
          </Pressable>
        </View>
      </View>
    </NeoScreenWrapper>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingTop: spacing.sm },
  header: {
    minHeight: 136,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  headerCopy: { flex: 1 },
  greeting: {
    ...type.caption,
    fontFamily: fonts.bold,
    letterSpacing: 1,
    marginBottom: spacing.xs,
  },
  display: {
    ...type.display,
    textTransform: 'uppercase',
  },
  subtitle: {
    ...type.body,
    maxWidth: 250,
    marginTop: spacing.sm,
    color: colors.secondaryInk,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: radii.pill,
    borderWidth: border.standard,
    borderColor: colors.ink,
    backgroundColor: colors.pinkAccent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  updateBanner: {
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderRadius: radii.pill,
    borderWidth: border.standard,
    borderColor: colors.ink,
    backgroundColor: colors.butterCard,
    paddingHorizontal: spacing.sm,
    marginBottom: spacing.sm,
  },
  updateIcon: {
    width: 38,
    height: 38,
    borderRadius: radii.pill,
    borderWidth: border.standard,
    borderColor: colors.ink,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  updateText: { ...type.body, flex: 1, fontFamily: fonts.bold },
  feed: { gap: spacing.md, marginTop: spacing.xs },
  ideaCard: {
    minHeight: 84,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: border.standard,
    borderColor: colors.ink,
    borderRadius: radii.lg,
    backgroundColor: colors.skyAccent,
    padding: spacing.sm,
    marginTop: spacing.md,
  },
  ideaIcon: {
    width: 46,
    height: 46,
    borderRadius: radii.pill,
    borderWidth: border.standard,
    borderColor: colors.ink,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ideaCopy: { flex: 1 },
  ideaTitle: { ...type.cardTitle },
  ideaCaption: { ...type.caption, marginTop: 2 },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.xl,
    marginBottom: spacing.sm,
  },
  sectionTitle: { ...type.display },
  sectionAction: {
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
  },
  sectionActionText: {
    ...type.body,
    fontFamily: fonts.bold,
    textDecorationLine: 'underline',
  },
  mealList: { gap: spacing.sm },
  mealRow: {
    minHeight: 92,
    borderRadius: radii.md,
    borderWidth: border.standard,
    borderColor: colors.ink,
    backgroundColor: colors.white,
    padding: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  mealRowEmpty: { backgroundColor: colors.pinkCanvas },
  mealImage: {
    width: 64,
    height: 64,
    borderRadius: radii.sm,
    borderWidth: border.standard,
    borderColor: colors.ink,
  },
  mealPlaceholder: {
    width: 64,
    height: 64,
    borderRadius: radii.sm,
    borderWidth: border.standard,
    borderColor: colors.ink,
    backgroundColor: colors.butterCard,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mealCopy: { flex: 1 },
  mealSlot: { ...type.cardTitle },
  mealName: { ...type.body, color: colors.secondaryInk, marginTop: 2 },
  mealKcal: { alignItems: 'flex-end', paddingRight: spacing.xxs },
  kcalValue: { ...type.metricSmall, fontSize: 24 },
  kcalLabel: { ...type.caption },
  hydration: {
    borderWidth: border.standard,
    borderColor: colors.ink,
    borderRadius: radii.lg,
    backgroundColor: colors.violetCard,
    padding: spacing.lg,
    marginTop: spacing.xl,
  },
  hydrationTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  hydrationTitle: { ...type.cardTitle },
  hydrationValue: { ...type.metric, marginTop: spacing.xs },
  hydrationTotal: { ...type.body },
  waterIcon: {
    width: 48,
    height: 48,
    borderRadius: radii.pill,
    borderWidth: border.standard,
    borderColor: colors.ink,
    backgroundColor: colors.skyAccent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  waterTrack: {
    height: 16,
    borderRadius: radii.pill,
    borderWidth: border.standard,
    borderColor: colors.ink,
    backgroundColor: colors.white,
    overflow: 'hidden',
    marginTop: spacing.lg,
  },
  waterFill: { height: '100%', backgroundColor: colors.activeLime },
  hydrationActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  waterButton: {
    width: 48,
    height: 48,
    borderRadius: radii.pill,
    borderWidth: border.standard,
    borderColor: colors.ink,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addWater: {
    flex: 1,
    minHeight: 48,
    borderRadius: radii.pill,
    borderWidth: border.standard,
    borderColor: colors.ink,
    backgroundColor: colors.charcoal,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  addWaterText: {
    ...type.body,
    fontFamily: fonts.bold,
    color: colors.inverseInk,
  },
  missingTarget: {
    flex: 1,
    padding: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
  missingMascot: {
    width: 156,
    height: 156,
    borderRadius: radii.lg,
    borderWidth: border.standard,
    borderColor: colors.ink,
    backgroundColor: colors.mintCard,
    alignItems: 'center',
    justifyContent: 'center',
  },
  missingTitle: { ...type.headline, textAlign: 'center' },
  missingCopy: {
    ...type.body,
    maxWidth: 300,
    textAlign: 'center',
    color: colors.secondaryInk,
  },
  pressed: { opacity: 0.72 },
  disabled: { opacity: 0.4 },
});
