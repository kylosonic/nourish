import React, { useMemo, useState } from 'react';
import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/types';
import { useApp, useTodayTotals } from '../../state/AppProvider';
import { border, colors, fonts, radii, spacing, type } from '../../theme';
import { Card, Chip, EmptyState, Icon } from '../../components/ui';
import { NeoScreenWrapper, NeoTopBar } from '../../components/neo';
import { mealSlotForHour, recommendFoods } from '../../domain/recommendations';
import { imageForFood } from '../../data/images';
import { localDateKey } from '../../utils/date';
import type { MealSlot } from '../../types';

type Props = NativeStackScreenProps<RootStackParamList, 'Recommendations'>;

export function RecommendationsScreen({ navigation }: Props) {
  const { state, addDraftMeal } = useApp();
  const consumed = useTodayTotals();
  const [slot, setSlot] = useState<MealSlot>(mealSlotForHour());
  const target = state.target;
  const remainingKcal = target ? target.targetKcal - consumed.kcal : 0;
  const proteinNeed = target ? Math.max(0, target.proteinG - consumed.proteinG) : 0;
  const suggestions = useMemo(
    () =>
      target
        ? recommendFoods({
            catalog: state.catalog,
            meals: state.meals.filter((meal) => meal.dateKey >= localDateKey()),
            remainingKcal: Math.max(0, remainingKcal),
            proteinNeedG: proteinNeed,
            preference: state.onboarding.foodPreference,
            slot,
          })
        : [],
    [
      proteinNeed,
      remainingKcal,
      slot,
      state.catalog,
      state.meals,
      state.onboarding.foodPreference,
      target,
    ],
  );

  const addSuggestion = (foodId: string) => {
    const food = state.catalog.find((candidate) => candidate.id === foodId);
    if (!food) return;
    addDraftMeal(
      slot,
      [{ food, unit: food.defaultPortion.unit, quantity: food.defaultPortion.quantity }],
      'search',
    );
    navigation.reset({
      index: 0,
      routes: [{ name: 'MainTabs', params: { screen: 'Home' } }],
    });
  };

  return (
    <NeoScreenWrapper tone="peach" scroll contentStyle={styles.content}>
      <NeoTopBar
        title="Meal ideas"
        leftColor={colors.butterCard}
        rightColor={colors.coralButton}
        onBack={() => navigation.goBack()}
      />
        <Text style={styles.title}>What can I eat?</Text>
        <Text style={styles.subcopy}>
          Foods ranked for your remaining budget.
        </Text>
        <View style={styles.budgetCard}>
          <View style={styles.budgetItem}>
            <Text style={styles.budgetLabel}>CALORIES LEFT</Text>
            <Text style={styles.budgetValue}>{Math.max(0, Math.round(remainingKcal))}</Text>
          </View>
          <View style={styles.budgetDivider} />
          <View style={styles.budgetItem}>
            <Text style={styles.budgetLabel}>PROTEIN NEED</Text>
            <Text style={styles.budgetValue}>{Math.round(proteinNeed)}g</Text>
          </View>
        </View>
        <Text style={styles.planningLabel}>PLANNING</Text>
        <View style={styles.slotRow}>
          {(['breakfast', 'lunch', 'dinner', 'snack'] as MealSlot[]).map((candidate) => (
            <Chip
              key={candidate}
              label={candidate.charAt(0).toUpperCase() + candidate.slice(1)}
              selected={candidate === slot}
              onPress={() => setSlot(candidate)}
            />
          ))}
        </View>
        {remainingKcal <= 0 ? (
          <EmptyState
            icon="food-off-outline"
            title="No calorie budget remains"
            detail={
              target?.targetKcal === target?.floorKcal
                ? 'Your target is at the configured safety floor. This screen will not suggest eating less; use your own judgment and professional guidance if needed.'
                : 'Your logged meals have reached today’s target. There are no suggestions that fit without changing the plan.'
            }
          />
        ) : suggestions.length === 0 ? (
          <EmptyState
            icon="silverware-clean"
            title="Nothing fits this budget"
            detail={`No cached food fits within ${Math.max(0, Math.round(remainingKcal))} kcal at its default portion. Try a smaller portion by editing a food after adding it.`}
          />
        ) : (
          <>
            <View style={styles.resultsHeader}>
              <Text style={styles.sectionTitle}>Good fits</Text>
              <Text style={styles.resultCount}>
                {suggestions.reduce((sum, suggestion) => sum + Math.round(suggestion.nutrition.kcal), 0)} kcal total
              </Text>
            </View>
            <View style={styles.list}>
              {suggestions.map((suggestion, index) => (
                <Card key={suggestion.food.id} style={styles.foodCard}>
                  <Image source={imageForFood(suggestion.food)} style={styles.foodImage} />
                  <View style={styles.foodCopy}>
                    <View style={styles.nameLine}>
                      <Text style={styles.foodName}>{suggestion.food.canonicalName}</Text>
                      {index === 0 ? <Text style={styles.bestFit}>BEST FIT</Text> : null}
                    </View>
                    <Text style={styles.foodMeta}>
                      {suggestion.food.defaultPortion.quantity}{' '}
                      {suggestion.food.defaultPortion.unit.replace(/([A-Z])/g, ' $1')} ·{' '}
                      {Math.round(suggestion.nutrition.kcal)} kcal ·{' '}
                      {Math.round(suggestion.nutrition.proteinG)}g protein
                    </Text>
                    <View style={styles.tags}>
                      {suggestion.local ? <Text style={styles.localTag}>LOCAL FAVORITE</Text> : null}
                      {suggestion.matchesSlot ? <Text style={styles.slotTag}>MEAL FIT</Text> : null}
                    </View>
                  </View>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Add ${suggestion.food.canonicalName}`}
                    onPress={() => addSuggestion(suggestion.food.id)}
                    style={styles.add}
                  >
                    <Icon name="plus" size={21} color={colors.primary} />
                  </Pressable>
                </Card>
              ))}
            </View>
            <Text style={styles.note}>
              Suggestions prioritize foods that fit and provide protein. They are not a medical
              recommendation. You can adjust the portion before or after logging.
            </Text>
          </>
        )}
    </NeoScreenWrapper>
  );
}

const styles = StyleSheet.create({
  content: { paddingTop: spacing.xs },
  title: { ...type.headline },
  subcopy: { ...type.body, color: colors.onSurfaceVariant, marginTop: spacing.xs },
  budgetCard: {
    marginTop: spacing.xl,
    borderRadius: radii.xl,
    borderWidth: border.standard,
    borderColor: colors.ink,
    backgroundColor: colors.violetCard,
    flexDirection: 'row',
    padding: spacing.xl,
  },
  budgetItem: { flex: 1 },
  budgetDivider: { width: border.standard, backgroundColor: colors.ink, marginHorizontal: spacing.lg },
  budgetLabel: { ...type.caption, fontFamily: fonts.bold, color: colors.ink },
  budgetValue: { ...type.metric, fontSize: 40, marginTop: 4 },
  planningLabel: { ...type.label, marginTop: spacing.xl, marginBottom: spacing.sm },
  slotRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  resultsHeader: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginTop: spacing.xl, marginBottom: spacing.md },
  sectionTitle: { ...type.title },
  resultCount: { ...type.bodySmall, color: colors.onSurfaceVariant },
  list: { gap: spacing.sm },
  foodCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.sm },
  foodImage: { width: 86, height: 86, borderRadius: radii.sm },
  foodCopy: { flex: 1 },
  nameLine: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, flexWrap: 'wrap' },
  foodName: { ...type.body, fontFamily: fonts.semibold },
  bestFit: {
    ...type.label,
    fontSize: 8,
    color: colors.ink,
    backgroundColor: colors.primarySoft,
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 3,
  },
  foodMeta: { ...type.caption, marginTop: 2 },
  tags: { flexDirection: 'row', gap: 5, marginTop: 6 },
  localTag: { ...type.caption, fontFamily: fonts.bold, color: colors.ink },
  slotTag: { ...type.caption, fontFamily: fonts.bold, color: colors.ink },
  add: {
    width: 44,
    height: 44,
    borderRadius: radii.pill,
    borderWidth: border.standard,
    borderColor: colors.ink,
    backgroundColor: colors.butterCard,
    alignItems: 'center',
    justifyContent: 'center',
  },
  note: { ...type.caption, textAlign: 'center', marginTop: spacing.lg, lineHeight: 17 },
});
