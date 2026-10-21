import React, { useMemo, useState } from 'react';
import {
  Alert,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/types';
import { useApp } from '../../state/AppProvider';
import { colors, fonts, radii, spacing, type } from '../../theme';
import { Card, Chip, Icon, IconButton } from '../../components/ui';
import {
  dayNumber,
  dateStrip,
  formatTime,
  localDateKey,
  weekdayShort,
} from '../../utils/date';
import { imageForFood } from '../../data/images';
import { totalsForDate } from '../../domain/nutrition';

type Props = NativeStackScreenProps<RootStackParamList, 'History'>;

export function HistoryScreen({ navigation }: Props) {
  const { state, deleteMeal } = useApp();
  const [selectedDate, setSelectedDate] = useState(localDateKey());
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const dates = useMemo(() => dateStrip(selectedDate), [selectedDate]);
  const meals = state.meals
    .filter((meal) => meal.dateKey === selectedDate)
    .sort((a, b) => b.loggedAt.localeCompare(a.loggedAt));
  const nutrition = totalsForDate(state.meals, selectedDate);
  const target = state.target;

  const openMeal = (mealId: string) => {
    const meal = state.meals.find((candidate) => candidate.id === mealId);
    if (!meal) return;
    Alert.alert(
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
          text: 'Delete meal',
          style: 'destructive',
          onPress: () =>
            Alert.alert('Delete this meal?', 'A tombstone is queued so the removal also syncs.', [
              { text: 'Keep', style: 'cancel' },
              { text: 'Delete', style: 'destructive', onPress: () => deleteMeal(meal.id) },
            ]),
        },
      ],
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Back to home"
          onPress={() => navigation.goBack()}
          style={styles.avatar}
        >
          <Icon name="account" size={24} color={colors.primary} />
        </Pressable>
        <Text style={styles.wordmark}>Nourish</Text>
        <IconButton
          name="calendar-month-outline"
          accessibilityLabel="Choose a date"
          color={colors.onSurface}
          onPress={() => setDatePickerOpen(true)}
        />
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.dateStrip}
        contentContainerStyle={styles.dateStripContent}
      >
        {dates.map((dateKey) => {
          const active = dateKey === selectedDate;
          const today = dateKey === localDateKey();
          return (
            <Pressable
              key={dateKey}
              accessibilityRole="button"
              accessibilityLabel={`Show ${weekdayShort(dateKey)} ${dateKey}`}
              accessibilityState={{ selected: active }}
              onPress={() => setSelectedDate(dateKey)}
              style={[styles.dateCard, active && styles.dateCardActive]}
            >
              <Text style={[styles.dateWeekday, active && styles.dateTextActive]}>
                {weekdayShort(dateKey)}
              </Text>
              <Text style={[styles.dateDay, active && styles.dateTextActive]}>
                {dayNumber(dateKey)}
              </Text>
              {today && !active ? <View style={styles.todayDot} /> : null}
            </Pressable>
          );
        })}
      </ScrollView>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <Text style={styles.pageTitle}>Daily Summary</Text>
        <Card style={styles.calorieCard}>
          <View style={styles.cardHeading}>
            <View>
              <Text style={type.label}>CALORIES</Text>
              <View style={styles.calorieValueRow}>
                <Text style={styles.calorieValue}>{Math.round(nutrition.kcal).toLocaleString()}</Text>
                <Text style={styles.calorieUnit}>kcal</Text>
              </View>
            </View>
            <View style={styles.flame}><Icon name="fire" size={19} color={colors.primary} /></View>
          </View>
          <View style={styles.progressLine}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${Math.min(
                    100,
                    target ? (nutrition.kcal / target.targetKcal) * 100 : 0,
                  )}%`,
                },
              ]}
            />
          </View>
          <Text style={styles.ofTarget}>
            OF {target?.targetKcal.toLocaleString() ?? '—'}
          </Text>
        </Card>
        <View style={styles.macroCards}>
          <MacroCard label="PROTEIN" value={nutrition.proteinG} color={colors.primaryContainer} />
          <MacroCard label="CARBS" value={nutrition.carbsG} color={colors.amber} />
          <MacroCard label="FAT" value={nutrition.fatG} color={colors.coral} />
        </View>
        <View style={styles.mealsHeading}>
          <Text style={styles.pageTitle}>Today’s Meals</Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => navigation.navigate('ScanMenu')}
            style={styles.logButton}
          >
            <Icon name="plus" size={18} color={colors.white} />
            <Text style={styles.logButtonText}>LOG MEAL</Text>
          </Pressable>
        </View>
        {meals.length === 0 ? (
          <Card style={styles.empty}>
            <Icon name="silverware-fork-knife" size={30} color={colors.primary} />
            <Text style={styles.emptyTitle}>Nothing logged for this day</Text>
            <Text style={styles.emptyCopy}>
              Meals you confirm will appear here with the nutrition values recorded at the time.
            </Text>
          </Card>
        ) : (
          <View style={{ gap: spacing.sm }}>
            {meals.map((meal) => {
              const food = state.catalog.find((candidate) => candidate.id === meal.items[0]?.foodId);
              const total = meal.items.reduce((sum, item) => sum + item.nutrition.kcal, 0);
              const protein = meal.items.reduce((sum, item) => sum + item.nutrition.proteinG, 0);
              const carbs = meal.items.reduce((sum, item) => sum + item.nutrition.carbsG, 0);
              const fat = meal.items.reduce((sum, item) => sum + item.nutrition.fatG, 0);
              return (
                <Pressable key={meal.id} onPress={() => openMeal(meal.id)} style={styles.mealCard}>
                  <Image source={imageForFood(food)} style={styles.mealImage} />
                  <View style={styles.mealCopy}>
                    <Text style={styles.mealMeta}>
                      {meal.slot.toUpperCase()} · {formatTime(meal.loggedAt)}
                    </Text>
                    <Text style={styles.mealTitle}>
                      {meal.items.map((item) => item.foodName).join(' with ')}
                    </Text>
                    <View style={styles.macroChips}>
                      <Chip label={`P: ${Math.round(protein)}g`} />
                      <Chip label={`C: ${Math.round(carbs)}g`} />
                      <Chip label={`F: ${Math.round(fat)}g`} />
                    </View>
                  </View>
                  <Text style={styles.mealKcal}>{Math.round(total)}</Text>
                </Pressable>
              );
            })}
          </View>
        )}
      </ScrollView>

      <Modal
        visible={datePickerOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setDatePickerOpen(false)}
      >
        <Pressable style={styles.modalScrim} onPress={() => setDatePickerOpen(false)}>
          <Pressable style={styles.datePicker} onPress={() => undefined}>
            <View style={styles.pickerHandle} />
            <Text style={styles.pageTitle}>Choose a date</Text>
            <Text style={styles.emptyCopy}>The last 14 days</Text>
            <ScrollView style={{ maxHeight: 360 }} contentContainerStyle={{ gap: spacing.xs }}>
              {Array.from({ length: 14 }, (_, index) => {
                const key = dateStrip(localDateKey(), index, 0)[0];
                return (
                  <Pressable
                    key={key}
                    onPress={() => {
                      setSelectedDate(key);
                      setDatePickerOpen(false);
                    }}
                    style={styles.dateOption}
                  >
                    <Text style={styles.dateOptionText}>
                      {weekdayShort(key)}, {key}
                    </Text>
                    {key === selectedDate ? (
                      <Icon name="check" size={20} color={colors.primary} />
                    ) : null}
                  </Pressable>
                );
              })}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

function MacroCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <Card style={styles.macroCard}>
      <Text style={type.label}>{label}</Text>
      <Text style={styles.macroValue}>{Math.round(value)}g</Text>
      <View style={[styles.macroBar, { backgroundColor: color }]} />
    </Card>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.surface },
  header: {
    height: 66,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.surfaceHighest,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  wordmark: { flex: 1, textAlign: 'center', fontFamily: fonts.bold, fontSize: 27, color: colors.primary },
  dateStrip: { flexGrow: 0 },
  dateStripContent: { paddingHorizontal: spacing.md, paddingVertical: spacing.md, gap: spacing.xs },
  dateCard: {
    width: 58,
    height: 72,
    borderRadius: radii.md,
    backgroundColor: colors.surfaceHigh,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  dateCardActive: { backgroundColor: colors.primaryContainer, borderColor: colors.primary },
  dateWeekday: { ...type.label, color: colors.outline },
  dateDay: { fontFamily: fonts.semibold, fontSize: 23, color: colors.outline },
  dateTextActive: { color: colors.white },
  todayDot: {
    position: 'absolute',
    bottom: 8,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.primary,
  },
  content: { padding: spacing.xl, paddingTop: spacing.sm, paddingBottom: spacing.section },
  pageTitle: { ...type.title, marginBottom: spacing.md },
  calorieCard: { padding: spacing.lg },
  cardHeading: { flexDirection: 'row', justifyContent: 'space-between' },
  calorieValueRow: { flexDirection: 'row', alignItems: 'flex-end', marginTop: spacing.xs },
  calorieValue: { fontFamily: fonts.bold, fontSize: 38, letterSpacing: -1.5, color: colors.onSurface },
  calorieUnit: { ...type.bodySmall, marginBottom: 5, marginLeft: 3 },
  flame: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: colors.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressLine: {
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.surfaceLow,
    marginTop: spacing.md,
    overflow: 'hidden',
  },
  progressFill: { height: '100%', backgroundColor: colors.primaryContainer, borderRadius: 4 },
  ofTarget: { ...type.label, textAlign: 'right', marginTop: spacing.xs },
  macroCards: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.md },
  macroCard: { width: '48%', flexGrow: 0, padding: spacing.md, minHeight: 112 },
  macroValue: { fontFamily: fonts.bold, fontSize: 27, marginVertical: spacing.xs },
  macroBar: { width: '72%', height: 5, borderRadius: 3 },
  mealsHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: spacing.xl },
  logButton: {
    height: 38,
    borderRadius: radii.sm,
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  logButtonText: { ...type.label, color: colors.white },
  mealCard: {
    minHeight: 120,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.surfaceHighest,
    backgroundColor: colors.white,
    padding: spacing.sm,
    flexDirection: 'row',
    gap: spacing.sm,
  },
  mealImage: { width: 92, height: 92, borderRadius: radii.sm },
  mealCopy: { flex: 1, paddingTop: 2 },
  mealMeta: { ...type.caption, fontFamily: fonts.semibold, letterSpacing: 0.5 },
  mealTitle: { ...type.body, fontFamily: fonts.semibold, marginTop: 2 },
  macroChips: { flexDirection: 'row', gap: 4, flexWrap: 'wrap', marginTop: spacing.xs },
  mealKcal: { fontFamily: fonts.regular, fontSize: 25, color: colors.onSurface },
  empty: { alignItems: 'center', gap: spacing.sm },
  emptyTitle: { ...type.body, fontFamily: fonts.semibold },
  emptyCopy: { ...type.bodySmall, color: colors.onSurfaceVariant, textAlign: 'center', maxWidth: 280 },
  modalScrim: { flex: 1, backgroundColor: colors.scrim, justifyContent: 'flex-end' },
  datePicker: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    padding: spacing.xl,
    gap: spacing.xs,
  },
  pickerHandle: {
    width: 46,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.outlineVariant,
    alignSelf: 'center',
    marginBottom: spacing.md,
  },
  dateOption: {
    minHeight: 50,
    paddingHorizontal: spacing.md,
    borderRadius: radii.md,
    backgroundColor: colors.white,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dateOptionText: { ...type.body },
});
