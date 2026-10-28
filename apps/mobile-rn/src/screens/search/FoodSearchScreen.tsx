import React, { useMemo, useState } from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/types';
import { useApp } from '../../state/AppProvider';
import { border, colors, fonts, radii, spacing, type } from '../../theme';
import { Button, Chip, Icon } from '../../components/ui';
import { NeoScreenWrapper, NeoTopBar } from '../../components/neo';
import { imageForFood } from '../../data/images';
import { nutritionFor } from '../../domain/nutrition';
import { mealSlotForHour } from '../../domain/recommendations';
import { newId } from '../../utils/date';
import * as Haptics from 'expo-haptics';
import type { Food, MealItem } from '../../types';

type Props = NativeStackScreenProps<RootStackParamList, 'FoodSearch'>;

const categories = ['All', 'Ethiopian', 'Breakfast', 'Lunch', 'Dinner', 'Snacks'];
const commonOrder = ['injera', 'shiro_wot', 'beef_tibs', 'misir_wot'];
const gramPresets = [50, 75, 100, 150, 200, 250, 300, 400];
const maxGrams = 2000;

const normalize = (value: string) =>
  value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[’']/g, '')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();

export function FoodSearchScreen({ navigation, route }: Props) {
  const { state, addResolvedMeal } = useApp();
  const [query, setQuery] = useState(route.params?.candidates?.[0]?.displayName ?? '');
  const [category, setCategory] = useState('All');
  const [selectedFood, setSelectedFood] = useState<Food | null>(null);
  const [gramsInput, setGramsInput] = useState('');
  const candidateMode = route.params?.mode === 'candidate';
  const slot = route.params?.slot || mealSlotForHour();
  const parsedGrams = Number(gramsInput);
  const gramsValid =
    Number.isFinite(parsedGrams) && parsedGrams >= 1 && parsedGrams <= maxGrams;
  const selectedNutrition =
    selectedFood && gramsValid
      ? nutritionFor(selectedFood.per100g, parsedGrams)
      : null;

  const results = useMemo(() => {
    const needle = normalize(query);
    return state.catalog
      .filter((food) => category === 'All' || food.category === category)
      .filter((food) => {
        if (!needle) return true;
        return [food.canonicalName, ...food.aliases].some((value) =>
          normalize(value).includes(needle),
        );
      })
      .sort((a, b) => {
        if (!needle) {
          const aIndex = commonOrder.indexOf(a.id);
          const bIndex = commonOrder.indexOf(b.id);
          if (aIndex !== -1 || bIndex !== -1) {
            return (aIndex === -1 ? 999 : aIndex) - (bIndex === -1 ? 999 : bIndex);
          }
        }
        return a.canonicalName.localeCompare(b.canonicalName);
      })
      .slice(0, 40);
  }, [category, query, state.catalog]);

  const openFood = (food: Food) => {
    setSelectedFood(food);
    setGramsInput(String(Math.round(food.defaultPortion.grams)));
  };

  const closeFood = () => {
    setSelectedFood(null);
    setGramsInput('');
  };

  const addSelectedFood = () => {
    if (!selectedFood || !selectedNutrition || !gramsValid) return;
    const item: MealItem = {
      id: newId('item'),
      foodId: selectedFood.id,
      foodName: selectedFood.canonicalName,
      category: selectedFood.category,
      portionUnit: 'gram',
      portionQuantity: parsedGrams,
      grams: parsedGrams,
      nutrition: selectedNutrition,
    };

    if (candidateMode) {
      closeFood();
      navigation.replace('Result', {
        analysisId: route.params?.analysisId || newId('manual'),
        slot,
        imageUri: route.params?.imageUri,
        items: [item],
        totals: selectedNutrition,
        confidenceState: 'High',
        overallConfidence: 1,
      });
      return;
    }

    addResolvedMeal(slot, [item], 'search');
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    closeFood();
    navigation.reset({
      index: 0,
      routes: [{ name: 'MainTabs', params: { screen: 'Home' } }],
    });
  };

  return (
    <NeoScreenWrapper tone="lavender">
      <NeoTopBar
        title="Search foods"
        leftColor={colors.butterCard}
        rightColor={colors.coralButton}
        onBack={() => navigation.goBack()}
      />
      <View style={styles.searchRow}>
        <View style={styles.searchBox}>
          <Icon name="magnify" size={21} color={colors.onSurfaceVariant} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search food in English or አማርኛ"
            placeholderTextColor={colors.secondaryInk}
            style={styles.searchInput}
            selectionColor={colors.primary}
            autoFocus={candidateMode}
          />
          {query ? (
            <Pressable accessibilityLabel="Clear search" onPress={() => setQuery('')}>
              <Icon name="close-circle" size={20} color={colors.outline} />
            </Pressable>
          ) : null}
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Scan a barcode"
          onPress={() => navigation.navigate('Barcode', { slot })}
          style={styles.barcode}
        >
          <Icon name="barcode-scan" size={24} color={colors.onSurfaceVariant} />
        </Pressable>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.chipsScroller}
        contentContainerStyle={styles.chips}
      >
        {categories.map((item) => (
          <Chip
            key={item}
            label={item}
            selected={category === item}
            onPress={() => setCategory(item)}
          />
        ))}
      </ScrollView>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.sectionTitle}>Common Local Foods</Text>
        {results.length > 0 ? (
          <View style={styles.foodList}>
            {results.map((food) => {
              const kcal = nutritionFor(food.per100g, food.defaultPortion.grams).kcal;
              return (
                <Pressable
                  key={food.id}
                  accessibilityRole="button"
                  accessibilityLabel={`Set grams for ${food.canonicalName}`}
                  onPress={() => openFood(food)}
                  style={({ pressed }) => [styles.foodCard, pressed && styles.pressed]}
                >
                  <Image source={imageForFood(food)} style={styles.foodImage} />
                  <View style={styles.foodCopy}>
                    <Text style={styles.foodName}>{food.canonicalName}</Text>
                    <Text style={styles.foodPortion}>
                      Suggested: {Math.round(food.defaultPortion.grams)}g ·{' '}
                      {Math.round(kcal)} kcal
                    </Text>
                    <Text style={food.isSeed ? styles.provisional : styles.verified}>
                      {food.isSeed ? 'BOOTSTRAP VALUE' : 'FCT 2025'}
                    </Text>
                  </View>
                  <View style={styles.add}>
                    <Icon name="plus" size={20} color={colors.primary} />
                  </View>
                </Pressable>
              );
            })}
          </View>
        ) : (
          <View style={styles.empty}>
            <View style={styles.emptyIcon}>
              <Icon name="silverware-fork-knife" size={32} color={colors.primary} />
            </View>
            <Text style={styles.emptyTitle}>No matching food</Text>
            <Text style={styles.emptyCopy}>Try another spelling.</Text>
          </View>
        )}
        <View style={styles.tip}>
          <Icon name="scale-bathroom" size={18} color={colors.primary} />
          <Text style={styles.tipText}>Tap any food to enter its exact grams.</Text>
        </View>
      </ScrollView>

      <Modal
        visible={selectedFood !== null}
        transparent
        animationType="slide"
        onRequestClose={closeFood}
      >
        <KeyboardAvoidingView
          style={styles.modalRoot}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <Pressable style={styles.scrim} onPress={closeFood} />
          <View style={styles.sheet}>
            <View style={styles.handle} />
            {selectedFood ? (
              <>
                <View style={styles.sheetHeader}>
                  <Image source={imageForFood(selectedFood)} style={styles.sheetImage} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.sheetTitle}>{selectedFood.canonicalName}</Text>
                    <Text style={styles.sheetSubtitle}>
                      {selectedFood.per100g.kcal} kcal per 100g
                    </Text>
                  </View>
                  <Pressable
                    accessibilityLabel="Close portion editor"
                    onPress={closeFood}
                    style={styles.close}
                  >
                    <Icon name="close" size={22} color={colors.onSurfaceVariant} />
                  </Pressable>
                </View>

                <Text style={[type.label, styles.amountLabel]}>AMOUNT</Text>
                <View style={styles.gramsField}>
                  <TextInput
                    accessibilityLabel="Amount in grams"
                    value={gramsInput}
                    onChangeText={(value) =>
                      setGramsInput(value.replace(/[^0-9]/g, '').slice(0, 4))
                    }
                    keyboardType="number-pad"
                    selectTextOnFocus
                    style={styles.gramsInput}
                    selectionColor={colors.primary}
                    autoFocus
                  />
                  <Text style={styles.gramsSuffix}>grams</Text>
                </View>
                <Text style={styles.rangeHint}>Enter 1–2,000 grams.</Text>

                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.presetRow}
                >
                  {Array.from(new Set([...gramPresets, Math.round(selectedFood.defaultPortion.grams)])).map(
                    (preset) => (
                      <Chip
                        key={preset}
                        label={`${preset}g`}
                        selected={gramsInput === String(preset)}
                        onPress={() => setGramsInput(String(preset))}
                      />
                    ),
                  )}
                </ScrollView>

                <View style={styles.preview}>
                  <View>
                    <Text style={type.label}>CALCULATED</Text>
                    <Text style={styles.previewKcal}>
                      {selectedNutrition ? `${Math.round(selectedNutrition.kcal)} kcal` : '—'}
                    </Text>
                  </View>
                  <View style={styles.previewMacros}>
                    <Text style={styles.previewMacro}>
                      P {selectedNutrition ? Math.round(selectedNutrition.proteinG) : 0}g
                    </Text>
                    <Text style={styles.previewMacro}>
                      C {selectedNutrition ? Math.round(selectedNutrition.carbsG) : 0}g
                    </Text>
                    <Text style={styles.previewMacro}>
                      F {selectedNutrition ? Math.round(selectedNutrition.fatG) : 0}g
                    </Text>
                  </View>
                </View>

                <Button
                  label={
                    candidateMode
                      ? `USE ${gramsValid ? Math.round(parsedGrams) : '—'} G`
                      : `ADD ${gramsValid ? Math.round(parsedGrams) : '—'} G`
                  }
                  disabled={!gramsValid}
                  onPress={addSelectedFood}
                  style={{ marginTop: spacing.lg }}
                />
              </>
            ) : null}
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </NeoScreenWrapper>
  );
}

const styles = StyleSheet.create({
  searchRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  searchBox: {
    flex: 1,
    height: 48,
    borderRadius: radii.pill,
    borderWidth: border.standard,
    borderColor: colors.ink,
    backgroundColor: colors.white,
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  searchInput: {
    flex: 1,
    ...type.bodySmall,
    fontSize: 15,
    outlineStyle: 'none' as never,
  },
  barcode: {
    width: 48,
    height: 48,
    borderRadius: radii.pill,
    borderWidth: border.standard,
    borderColor: colors.ink,
    backgroundColor: colors.butterCard,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipsScroller: { flexGrow: 0 },
  chips: { paddingVertical: spacing.md, gap: spacing.xs },
  content: { paddingBottom: 96 },
  sectionTitle: { ...type.title, marginTop: spacing.lg, marginBottom: spacing.md },
  foodList: { gap: spacing.sm },
  foodCard: {
    minHeight: 108,
    borderRadius: radii.md,
    borderWidth: border.standard,
    borderColor: colors.ink,
    backgroundColor: colors.white,
    padding: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  pressed: { opacity: 0.72, transform: [{ scale: 0.992 }] },
  foodImage: {
    width: 82,
    height: 88,
    borderRadius: radii.sm,
    borderWidth: border.standard,
    borderColor: colors.ink,
  },
  foodCopy: { flex: 1 },
  foodName: { ...type.body, fontFamily: fonts.semibold },
  foodPortion: { ...type.caption, marginTop: 2 },
  provisional: { ...type.caption, color: colors.ink, marginTop: spacing.xs },
  verified: { ...type.caption, color: colors.ink, marginTop: spacing.xs },
  add: {
    width: 36,
    height: 36,
    borderRadius: radii.pill,
    borderWidth: border.standard,
    borderColor: colors.ink,
    backgroundColor: colors.activeLime,
    alignItems: 'center',
    justifyContent: 'center',
  },
  empty: { alignItems: 'center', padding: spacing.xl },
  emptyIcon: {
    width: 68,
    height: 68,
    borderRadius: radii.pill,
    borderWidth: border.standard,
    borderColor: colors.ink,
    backgroundColor: colors.butterCard,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: { ...type.title, marginTop: spacing.md },
  emptyCopy: {
    ...type.body,
    color: colors.onSurfaceVariant,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  tip: {
    flexDirection: 'row',
    gap: spacing.sm,
    borderRadius: radii.lg,
    borderWidth: border.standard,
    borderColor: colors.ink,
    backgroundColor: colors.mintCard,
    padding: spacing.md,
    marginTop: spacing.lg,
  },
  tipText: { ...type.bodySmall, color: colors.onSurfaceVariant, flex: 1 },
  modalRoot: { flex: 1, justifyContent: 'flex-end' },
  scrim: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: colors.lavenderBackdrop,
  },
  sheet: {
    backgroundColor: colors.pinkCanvas,
    borderTopLeftRadius: radii.lg,
    borderTopRightRadius: radii.lg,
    borderWidth: border.standard,
    borderColor: colors.ink,
    padding: spacing.xl,
    paddingBottom: spacing.xxl,
  },
  handle: {
    width: 46,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.outlineVariant,
    alignSelf: 'center',
    marginBottom: spacing.lg,
  },
  sheetHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  sheetImage: {
    width: 62,
    height: 62,
    borderRadius: radii.md,
    borderWidth: border.standard,
    borderColor: colors.ink,
  },
  sheetTitle: { ...type.title, fontSize: 22 },
  sheetSubtitle: { ...type.bodySmall, color: colors.onSurfaceVariant, marginTop: 2 },
  close: {
    height: 44,
    width: 44,
    borderRadius: radii.pill,
    borderWidth: border.standard,
    borderColor: colors.ink,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  amountLabel: { marginTop: spacing.xl },
  gramsField: {
    height: 66,
    marginTop: spacing.xs,
    borderRadius: radii.md,
    borderWidth: border.standard,
    borderColor: colors.ink,
    backgroundColor: colors.white,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  gramsInput: {
    flex: 1,
    fontFamily: fonts.bold,
    fontSize: 34,
    color: colors.onSurface,
    outlineStyle: 'none' as never,
  },
  gramsSuffix: { ...type.body, color: colors.onSurfaceVariant },
  rangeHint: { ...type.caption, marginTop: spacing.xs },
  presetRow: { gap: spacing.xs, paddingTop: spacing.md },
  preview: {
    marginTop: spacing.lg,
    borderRadius: radii.md,
    borderWidth: border.standard,
    borderColor: colors.ink,
    backgroundColor: colors.mintCard,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  previewKcal: { ...type.metricSmall, fontSize: 24, marginTop: 2 },
  previewMacros: { alignItems: 'flex-end', gap: 2 },
  previewMacro: { ...type.bodySmall, color: colors.onSurfaceVariant, fontFamily: fonts.semibold },
});
