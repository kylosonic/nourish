import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Image,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import type { MainTabParamList, RootStackParamList } from '../../navigation/types';
import { useApp, useTodayTotals, dayWater } from '../../state/AppProvider';
import { colors, fonts, radii, shadow, spacing, type } from '../../theme';
import { CalorieRing, MacroPills } from '../../components/nutrition';
import { Card, Icon, IconButton, ProgressBar } from '../../components/ui';
import { greetingFor, localDateKey } from '../../utils/date';
import { imageForFood } from '../../data/images';
import type { MealSlot } from '../../types';
import { fetchReleaseMetadata } from '../../data/api';
import { isNewerVersion } from '../../utils/version';
import { releaseDownloadUrl } from '../../data/release';

type TabNavigation = BottomTabNavigationProp<MainTabParamList>;
type RootNavigation = NativeStackNavigationProp<RootStackParamList>;

export function HomeScreen() {
  const navigation = useNavigation<TabNavigation>();
  const rootNavigation = navigation.getParent<RootNavigation>();
  const {
    state,
    addWater,
    removeWater,
    syncCatalog,
  } = useApp();
  const consumed = useTodayTotals();
  const today = localDateKey();
  const waterMl = dayWater(state, today);
  const [updateUrl, setUpdateUrl] = useState<string | null>(null);

  useEffect(() => {
    void syncCatalog();
    void fetchReleaseMetadata().then((metadata) => {
      if (
        Platform.OS === 'android' &&
        metadata &&
        isNewerVersion(metadata.version, '1.0.0')
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
      <SafeAreaView style={styles.safe}>
        <View style={styles.missingTarget}>
          <Icon name="target" size={42} color={colors.primary} />
          <Text style={styles.missingTitle}>Your target isn’t set up yet</Text>
          <Text style={styles.missingCopy}>
            Complete the short personalization flow to calculate your daily nutrition target.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const openScan = (slot?: MealSlot) => rootNavigation?.navigate('ScanMenu', { slot });

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Open profile"
          onPress={() => navigation.navigate('Profile')}
          style={styles.avatar}
        >
          <Icon name="account" size={25} color={colors.primary} />
        </Pressable>
        <View style={styles.headerCopy}>
          <Text style={styles.greeting}>{greetingFor().toUpperCase()}</Text>
          <Text style={styles.wordmark}>Nourish</Text>
        </View>
        <IconButton
          accessibilityLabel="Notification settings"
          name="bell-outline"
          onPress={() =>
            Alert.alert(
              'Notifications',
              state.settings.remindersEnabled
                ? 'Hydration reminders are enabled. You can change them in Settings.'
                : 'Hydration reminders are off. You can enable them in Settings.',
              [
                { text: 'Not now', style: 'cancel' },
                { text: 'Open Settings', onPress: () => rootNavigation?.navigate('Settings') },
              ],
            )
          }
        />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {updateUrl ? (
          <Pressable
            onPress={() => void Linking.openURL(updateUrl)}
            style={styles.updateBanner}
          >
            <Icon name="download" size={20} color={colors.primary} />
            <Text style={styles.updateText}>A new version of Nourish is available.</Text>
            <Icon name="chevron-right" size={20} color={colors.primary} />
          </Pressable>
        ) : null}

        <Card style={styles.ringCard}>
          <CalorieRing consumed={consumed.kcal} target={state.target.targetKcal} />
          <MacroPills consumed={consumed} target={state.target} />
        </Card>

        <Pressable
          onPress={() => rootNavigation?.navigate('Recommendations')}
          style={({ pressed }) => [styles.recommendation, pressed && { opacity: 0.75 }]}
        >
          <View style={styles.recommendationIcon}>
            <Icon name="silverware-fork-knife" size={20} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.recommendationTitle}>What can I eat?</Text>
            <Text style={styles.recommendationCopy}>
              Foods that fit your budget.
            </Text>
          </View>
          <Icon name="arrow-right" size={20} color={colors.primary} />
        </Pressable>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>TODAY’S MEALS</Text>
          <Pressable onPress={() => rootNavigation?.navigate('History')}>
            <Text style={styles.seeAll}>SEE ALL</Text>
          </Pressable>
        </View>

        <View style={styles.mealGroup}>
          {slotRows.map((row) => {
            const firstItem = row.items[0];
            const food = state.catalog.find((candidate) => candidate.id === firstItem?.foodId);
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
                  pressed && { opacity: 0.72 },
                ]}
              >
                {row.items.length > 0 ? (
                  <Image source={imageForFood(food)} style={styles.mealImage} />
                ) : (
                  <View style={styles.mealPlaceholder}>
                    <Icon name="plus" size={24} color={colors.onSurfaceVariant} />
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
                ) : null}
              </Pressable>
            );
          })}
        </View>

        <Card style={styles.hydration}>
          <View style={styles.hydrationTop}>
            <View>
              <Text style={styles.hydrationTitle}>Hydration</Text>
              <Text style={styles.hydrationValue}>
                {(waterMl / 1000).toFixed(2)} <Text style={styles.hydrationTotal}>/ {(state.settings.waterTargetMl / 1000).toFixed(1)} L</Text>
              </Text>
            </View>
            <View style={styles.waterIcon}>
              <Icon name="water-outline" size={27} color={colors.white} />
            </View>
          </View>
          <ProgressBar
            value={(waterMl / state.settings.waterTargetMl) * 100}
            color={colors.white}
            trackColor="rgba(255,255,255,0.16)"
            height={8}
          />
          <View style={styles.hydrationActions}>
            <Pressable
              onPress={() => {
                removeWater(250);
              }}
              disabled={waterMl <= 0}
              style={[styles.waterButton, waterMl <= 0 && { opacity: 0.45 }]}
            >
              <Icon name="minus" size={20} color={colors.white} />
            </Pressable>
            <Pressable onPress={() => addWater(250)} style={styles.addWater}>
              <Icon name="plus" size={18} color={colors.primary} />
              <Text style={styles.addWaterText}>Add 250ml</Text>
            </Pressable>
          </View>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.surface },
  header: {
    height: 72,
    paddingHorizontal: spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.surfaceHigh,
    borderWidth: 2,
    borderColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCopy: { flex: 1, marginLeft: spacing.sm },
  greeting: { ...type.label, fontSize: 10, letterSpacing: 0.8 },
  wordmark: {
    fontFamily: fonts.bold,
    fontSize: 24,
    lineHeight: 29,
    letterSpacing: -0.7,
    color: colors.primary,
  },
  scroll: { paddingHorizontal: spacing.xl, paddingBottom: spacing.xxl },
  updateBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderRadius: radii.md,
    backgroundColor: colors.primarySoft,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  updateText: { ...type.bodySmall, color: colors.primary, fontFamily: fonts.semibold, flex: 1 },
  ringCard: {
    alignItems: 'center',
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
    borderRadius: radii.xl,
  },
  recommendation: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginVertical: spacing.md,
    padding: spacing.md,
    borderRadius: radii.md,
    backgroundColor: colors.primarySoft,
  },
  recommendationIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recommendationTitle: { ...type.bodySmall, fontFamily: fonts.semibold },
  recommendationCopy: { ...type.caption, color: colors.onSurfaceVariant },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
  sectionTitle: { ...type.title, fontSize: 24 },
  seeAll: { ...type.label, color: colors.primary },
  mealGroup: {
    backgroundColor: colors.white,
    borderRadius: radii.xl,
    padding: spacing.sm,
    gap: spacing.xs,
    ...shadow,
  },
  mealRow: {
    minHeight: 86,
    borderRadius: radii.md,
    backgroundColor: colors.surfaceLow,
    padding: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  mealRowEmpty: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.outlineVariant,
  },
  mealImage: { width: 66, height: 62, borderRadius: radii.sm },
  mealPlaceholder: {
    width: 66,
    height: 62,
    borderRadius: radii.sm,
    backgroundColor: colors.surfaceHigh,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mealCopy: { flex: 1 },
  mealSlot: { ...type.body, fontFamily: fonts.semibold },
  mealName: { ...type.bodySmall, color: colors.onSurfaceVariant, marginTop: 2 },
  mealKcal: { alignItems: 'flex-end', paddingRight: 4 },
  kcalValue: { fontFamily: fonts.semibold, fontSize: 24, color: colors.primary },
  kcalLabel: { ...type.caption, color: colors.onSurface },
  hydration: {
    marginTop: spacing.xl,
    backgroundColor: colors.primary,
    borderColor: colors.primary,
    borderRadius: radii.xl,
    padding: spacing.lg,
  },
  hydrationTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.xl },
  hydrationTitle: { fontFamily: fonts.semibold, fontSize: 22, color: colors.white },
  hydrationValue: { fontFamily: fonts.bold, fontSize: 32, color: colors.white, marginTop: spacing.xs },
  hydrationTotal: { fontFamily: fonts.regular, fontSize: 16 },
  waterIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  hydrationActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  waterButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addWater: {
    flex: 1,
    height: 44,
    borderRadius: radii.pill,
    backgroundColor: colors.white,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  addWaterText: { fontFamily: fonts.semibold, fontSize: 14, color: colors.primary },
  missingTarget: {
    flex: 1,
    padding: spacing.xxl,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  missingTitle: { ...type.title, textAlign: 'center' },
  missingCopy: { ...type.body, color: colors.onSurfaceVariant, textAlign: 'center' },
});
