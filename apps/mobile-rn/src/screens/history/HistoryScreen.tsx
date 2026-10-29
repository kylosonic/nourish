import React, { useMemo, useState } from 'react';
import {
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/types';
import { useApp } from '../../state/AppProvider';
import { border, colors, fonts, radii, spacing, type } from '../../theme';
import {
  NeoFeatureCard,
  NeoFilterRow,
  NeoFoodMascot,
  NeoScreenWrapper,
  NeoSplitMetricRow,
  NeoTopBar,
} from '../../components/neo';
import { Button, Chip, Icon } from '../../components/ui';
import {
  dayNumber,
  dateStrip,
  formatTime,
  localDateKey,
  weekdayShort,
} from '../../utils/date';
import { imageForFood } from '../../data/images';
import type { Meal } from '../../types';
import { showAlert } from '../../utils/dialog';

type Props = NativeStackScreenProps<RootStackParamList, 'History'>;
type LogRange = 'All' | 'Year' | 'Month';

function totalsForMeals(meals: Meal[]) {
  const items = meals.flatMap((meal) => meal.items);
  return items.reduce(
    (total, item) => ({
      kcal: total.kcal + item.nutrition.kcal,
      proteinG: total.proteinG + item.nutrition.proteinG,
      carbsG: total.carbsG + item.nutrition.carbsG,
      fatG: total.fatG + item.nutrition.fatG,
    }),
    { kcal: 0, proteinG: 0, carbsG: 0, fatG: 0 },
  );
}

export function HistoryScreen({ navigation }: Props) {
  const { state, deleteMeal } = useApp();
  const [selectedDate, setSelectedDate] = useState(localDateKey());
  const [range, setRange] = useState<LogRange>('All');
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const dates = useMemo(() => dateStrip(selectedDate, 3, 3), [selectedDate]);
  const meals = useMemo(() => {
    const matching = state.meals.filter((meal) => {
      if (range === 'All') return meal.dateKey === selectedDate;
      if (range === 'Month') {
        return meal.dateKey.startsWith(selectedDate.slice(0, 7));
      }
      return meal.dateKey.startsWith(selectedDate.slice(0, 4));
    });
    return [...matching].sort((a, b) =>
      b.loggedAt.localeCompare(a.loggedAt),
    );
  }, [range, selectedDate, state.meals]);
  const total = totalsForMeals(meals);
  const periodLabel =
    range === 'All'
      ? selectedDate
      : range === 'Month'
        ? selectedDate.slice(0, 7)
        : selectedDate.slice(0, 4);

  const openMeal = (mealId: string) => {
    const meal = state.meals.find((candidate) => candidate.id === mealId);
    if (!meal) return;
    showAlert(
      meal.items.map((item) => item.foodName).join(' + '),
      meal.items
        .map(
          (item) =>
            `${item.foodName} · ${Math.round(item.grams)}g · ${item.nutrition.kcal} kcal`,
        )
        .join('\n'),
      [
        { text: 'Close', style: 'cancel' },
        {
          text: 'Edit meal',
          onPress: () =>
            navigation.navigate('EditMeal', {
              mealId: meal.id,
              slot: meal.slot,
              items: meal.items,
            }),
        },
        {
          text: 'Delete meal',
          style: 'destructive',
          onPress: () =>
            showAlert(
              'Delete this meal?',
              'A tombstone is queued so the removal also syncs.',
              [
                { text: 'Keep', style: 'cancel' },
                {
                  text: 'Delete',
                  style: 'destructive',
                  onPress: () => deleteMeal(meal.id),
                },
              ],
            ),
        },
      ],
    );
  };

  return (
    <NeoScreenWrapper tone="pink" scroll contentStyle={styles.content}>
      <NeoTopBar
        title="Meal log"
        leftColor={colors.butterCard}
        rightColor={colors.coralButton}
        onBack={() => navigation.goBack()}
        rightIcon="calendar-month-outline"
        rightLabel="Choose a date"
        onRight={() => setDatePickerOpen(true)}
      />

      <Text style={styles.title}>Your meals.</Text>
      <Text style={styles.subcopy}>A clear record of what you ate.</Text>

      <NeoFilterRow
        items={['All', 'Year', 'Month']}
        selected={range}
        onSelect={(value) => setRange(value as LogRange)}
      />
      <Text style={styles.period}>{periodLabel}</Text>

      {range === 'All' ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.dateStrip}
        >
          {dates.map((dateKey) => {
            const active = dateKey === selectedDate;
            return (
              <Pressable
                key={dateKey}
                accessibilityRole="button"
                accessibilityLabel={`Show ${weekdayShort(dateKey)} ${dateKey}`}
                accessibilityState={{ selected: active }}
                onPress={() => setSelectedDate(dateKey)}
                style={[styles.dateCard, active && styles.dateCardActive]}
              >
                <Text style={styles.dateWeekday}>{weekdayShort(dateKey)}</Text>
                <Text style={styles.dateDay}>{dayNumber(dateKey)}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
      ) : null}

      <NeoFeatureCard
        title={`${range.toUpperCase()}\nTOTAL`}
        value={`${Math.round(total.kcal).toLocaleString()}`}
        caption={`${Math.round(total.proteinG)}g protein · ${Math.round(total.carbsG)}g carbs · ${Math.round(total.fatG)}g fat`}
        backgroundColor={colors.mintCard}
        art={<NeoFoodMascot size={112} />}
      />

      <NeoSplitMetricRow
        left={{
          label: 'PROTEIN',
          value: `${Math.round(total.proteinG)}g`,
          trend: `${targetProgress(total.proteinG, state.target?.proteinG)}% of goal`,
        }}
        right={{
          label: 'CARBS',
          value: `${Math.round(total.carbsG)}g`,
          trend: `${targetProgress(total.carbsG, state.target?.carbsG)}% of goal`,
        }}
      />

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Logged meals</Text>
        <View style={styles.countBadge}>
          <Text style={styles.countText}>{meals.length}</Text>
        </View>
      </View>

      {meals.length === 0 ? (
        <View style={styles.empty}>
          <Sparkle style={styles.sparkleTop} size={32} />
          <Sparkle style={styles.sparkleLeft} size={22} />
          <Sparkle style={styles.sparkleRight} size={26} />
          <NeoFoodMascot size={154} />
          <Text style={styles.emptyTitle}>Nothing here yet</Text>
          <Text style={styles.emptyCopy}>
            Add a meal and your nutrition will appear here.
          </Text>
        </View>
      ) : (
        <View style={styles.mealList}>
          {meals.map((meal) => {
            const food = state.catalog.find(
              (candidate) => candidate.id === meal.items[0]?.foodId,
            );
            const mealTotal = meal.items.reduce(
              (sum, item) => sum + item.nutrition.kcal,
              0,
            );
            const protein = meal.items.reduce(
              (sum, item) => sum + item.nutrition.proteinG,
              0,
            );
            const carbs = meal.items.reduce(
              (sum, item) => sum + item.nutrition.carbsG,
              0,
            );
            const fat = meal.items.reduce(
              (sum, item) => sum + item.nutrition.fatG,
              0,
            );
            return (
              <Pressable
                key={meal.id}
                accessibilityRole="button"
                onPress={() => openMeal(meal.id)}
                style={({ pressed }) => [
                  styles.mealCard,
                  pressed && styles.pressed,
                ]}
              >
                <Image source={imageForFood(food)} style={styles.mealImage} />
                <View style={styles.mealCopy}>
                  <Text style={styles.mealMeta}>
                    {meal.slot.toUpperCase()} · {formatTime(meal.loggedAt)}
                  </Text>
                  <Text style={styles.mealTitle} numberOfLines={2}>
                    {meal.items.map((item) => item.foodName).join(' with ')}
                  </Text>
                  <View style={styles.macroChips}>
                    <Chip label={`P ${Math.round(protein)}g`} />
                    <Chip label={`C ${Math.round(carbs)}g`} />
                    <Chip label={`F ${Math.round(fat)}g`} />
                  </View>
                </View>
                <View style={styles.mealKcal}>
                  <Text style={styles.mealKcalValue}>
                    {Math.round(mealTotal)}
                  </Text>
                  <Text style={styles.mealKcalLabel}>kcal</Text>
                </View>
              </Pressable>
            );
          })}
        </View>
      )}

      <Button
        label="ADD MORE"
        icon="plus"
        onPress={() => navigation.navigate('ScanMenu')}
        style={styles.addButton}
      />

      <Modal
        visible={datePickerOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setDatePickerOpen(false)}
      >
        <Pressable
          accessibilityLabel="Close date picker"
          style={styles.modalScrim}
          onPress={() => setDatePickerOpen(false)}
        >
          <Pressable style={styles.datePicker} onPress={() => undefined}>
            <View style={styles.pickerHandle} />
            <Text style={styles.pickerTitle}>Choose a date</Text>
            <ScrollView
              style={styles.pickerList}
              contentContainerStyle={styles.pickerListContent}
            >
              {Array.from({ length: 14 }, (_, index) => {
                const key = dateStrip(localDateKey(), index, 0)[0];
                return (
                  <Pressable
                    key={key}
                    accessibilityRole="button"
                    accessibilityState={{ selected: key === selectedDate }}
                    onPress={() => {
                      setSelectedDate(key);
                      setDatePickerOpen(false);
                    }}
                    style={[
                      styles.dateOption,
                      key === selectedDate && styles.dateOptionSelected,
                    ]}
                  >
                    <Text style={styles.dateOptionText}>
                      {weekdayShort(key)}, {key}
                    </Text>
                    {key === selectedDate ? (
                      <Icon name="check" size={20} color={colors.ink} />
                    ) : null}
                  </Pressable>
                );
              })}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </NeoScreenWrapper>
  );
}

function targetProgress(value: number, target?: number) {
  if (!target) return 0;
  return Math.round((value / target) * 100);
}

function Sparkle({
  size,
  style,
}: {
  size: number;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={[styles.sparkle, style]}>
      <Svg width={size} height={size} viewBox="0 0 32 32">
        <Path
          d="M16 2c1.4 8.1 5.9 12.6 14 14-8.1 1.4-12.6 5.9-14 14C14.6 21.9 10.1 17.4 2 16 10.1 14.6 14.6 10.1 16 2Z"
          fill={colors.white}
          stroke={colors.ink}
          strokeWidth={border.standard}
          strokeLinejoin="round"
        />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { paddingTop: spacing.xs },
  title: { ...type.headline, marginTop: spacing.lg },
  subcopy: { ...type.body, color: colors.secondaryInk, marginTop: spacing.xs },
  period: {
    ...type.caption,
    fontFamily: fonts.bold,
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
  },
  dateStrip: {
    gap: spacing.xs,
    paddingBottom: spacing.md,
  },
  dateCard: {
    width: 58,
    height: 70,
    borderRadius: radii.pill,
    borderWidth: border.standard,
    borderColor: colors.ink,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateCardActive: { backgroundColor: colors.activeLime },
  dateWeekday: { ...type.caption, fontFamily: fonts.bold },
  dateDay: { ...type.cardTitle, marginTop: 2 },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.xl,
    marginBottom: spacing.sm,
  },
  sectionTitle: { ...type.headline },
  countBadge: {
    minWidth: 38,
    height: 38,
    borderRadius: radii.pill,
    borderWidth: border.standard,
    borderColor: colors.ink,
    backgroundColor: colors.butterCard,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countText: { ...type.bodyLarge, fontFamily: fonts.bold },
  empty: {
    minHeight: 264,
    borderRadius: radii.lg,
    borderWidth: border.standard,
    borderColor: colors.ink,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    overflow: 'hidden',
  },
  emptyTitle: { ...type.cardTitle, marginTop: spacing.xs },
  emptyCopy: {
    ...type.body,
    color: colors.secondaryInk,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  sparkle: {
    position: 'absolute',
    width: 32,
    height: 32,
  },
  sparkleTop: { top: 26, right: '28%' },
  sparkleLeft: { left: 40, top: 112 },
  sparkleRight: { right: 42, bottom: 74 },
  mealList: { gap: spacing.sm },
  mealCard: {
    minHeight: 122,
    borderRadius: radii.lg,
    borderWidth: border.standard,
    borderColor: colors.ink,
    backgroundColor: colors.white,
    padding: spacing.sm,
    flexDirection: 'row',
    gap: spacing.sm,
  },
  mealImage: {
    width: 88,
    height: 88,
    borderRadius: radii.md,
    borderWidth: border.standard,
    borderColor: colors.ink,
  },
  mealCopy: { flex: 1, paddingTop: 2 },
  mealMeta: {
    ...type.caption,
    fontFamily: fonts.bold,
    letterSpacing: 0.5,
  },
  mealTitle: { ...type.body, fontFamily: fonts.bold, marginTop: 2 },
  macroChips: {
    flexDirection: 'row',
    gap: 4,
    flexWrap: 'wrap',
    marginTop: spacing.xs,
  },
  mealKcal: { alignItems: 'flex-end' },
  mealKcalValue: { ...type.cardTitle },
  mealKcalLabel: { ...type.caption },
  addButton: { marginTop: spacing.xl },
  modalScrim: {
    flex: 1,
    backgroundColor: colors.lavenderBackdrop,
    justifyContent: 'flex-end',
  },
  datePicker: {
    backgroundColor: colors.pinkCanvas,
    borderTopLeftRadius: radii.lg,
    borderTopRightRadius: radii.lg,
    borderWidth: border.standard,
    borderColor: colors.ink,
    padding: spacing.xl,
  },
  pickerHandle: {
    width: 52,
    height: 6,
    borderRadius: radii.pill,
    backgroundColor: colors.ink,
    alignSelf: 'center',
    marginBottom: spacing.md,
  },
  pickerTitle: { ...type.headline, marginBottom: spacing.md },
  pickerList: { maxHeight: 360 },
  pickerListContent: { gap: spacing.xs },
  dateOption: {
    minHeight: 52,
    paddingHorizontal: spacing.md,
    borderRadius: radii.pill,
    borderWidth: border.standard,
    borderColor: colors.ink,
    backgroundColor: colors.white,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dateOptionSelected: { backgroundColor: colors.activeLime },
  dateOptionText: { ...type.body, fontFamily: fonts.bold },
  pressed: { opacity: 0.72 },
});
