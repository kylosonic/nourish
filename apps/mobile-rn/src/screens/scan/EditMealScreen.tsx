import React, { useMemo, useState } from 'react';
import {
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/types';
import { useApp } from '../../state/AppProvider';
import { border, colors, fonts, radii, spacing, type } from '../../theme';
import { Button, Card, Chip, Icon } from '../../components/ui';
import { NeoScreenWrapper, NeoTopBar } from '../../components/neo';
import {
  clampPortionQuantity,
  nutritionFor,
  portionStep,
  portionToGrams,
} from '../../domain/nutrition';
import type { Food, MealItem, Nutrition, PortionUnit } from '../../types';
import { newId } from '../../utils/date';
import { imageForFood } from '../../data/images';
import { clearPendingAnalysisInput } from '../../state/analysisSession';

type Props = NativeStackScreenProps<RootStackParamList, 'EditMeal'>;

interface Draft {
  base: MealItem;
  unit: PortionUnit;
  quantity: number;
  grams: number;
  nutrition: Nutrition;
}

export function EditMealScreen({ navigation, route }: Props) {
  const { state, addResolvedMeal } = useApp();
  const [drafts, setDrafts] = useState<Draft[]>(
    route.params.items.map((item) => ({
      base: item,
      unit: item.portionUnit,
      quantity: item.portionQuantity,
      grams: item.grams,
      nutrition: item.nutrition,
    })),
  );
  const [pickerOpen, setPickerOpen] = useState(false);
  const [query, setQuery] = useState('');

  const totals = useMemo(
    () =>
      drafts.reduce(
        (sum, draft) => ({
          kcal: sum.kcal + draft.nutrition.kcal,
          proteinG: sum.proteinG + draft.nutrition.proteinG,
          carbsG: sum.carbsG + draft.nutrition.carbsG,
          fatG: sum.fatG + draft.nutrition.fatG,
        }),
        { kcal: 0, proteinG: 0, carbsG: 0, fatG: 0 },
      ),
    [drafts],
  );

  const recalc = (draft: Draft, unit: PortionUnit, quantity: number): Draft => {
    const food = state.catalog.find((candidate) => candidate.id === draft.base.foodId);
    const nextQuantity = clampPortionQuantity(unit, quantity);
    if (!food) {
      const ratio = nextQuantity / Math.max(0.5, draft.quantity);
      return {
        ...draft,
        unit,
        quantity: nextQuantity,
        grams: draft.grams * ratio,
        nutrition: scaleNutrition(draft.nutrition, ratio),
      };
    }
    const grams = portionToGrams(food, unit, nextQuantity);
    return {
      ...draft,
      unit,
      quantity: nextQuantity,
      grams,
      nutrition: nutritionFor(food.per100g, grams),
    };
  };

  const addFood = (food: Food) => {
    const grams = food.defaultPortion.grams;
    const nutrition = nutritionFor(food.per100g, grams);
    setDrafts((current) => [
      ...current,
      {
        base: {
          id: newId('item'),
          foodId: food.id,
          foodName: food.canonicalName,
          category: food.category,
          portionUnit: food.defaultPortion.unit,
          portionQuantity: food.defaultPortion.quantity,
          grams,
          nutrition,
        },
        unit: food.defaultPortion.unit,
        quantity: food.defaultPortion.quantity,
        grams,
        nutrition,
      },
    ]);
    setPickerOpen(false);
    setQuery('');
  };

  const save = () => {
    if (drafts.length === 0) return;
    const items = drafts.map<MealItem>((draft) => ({
      ...draft.base,
      portionUnit: draft.unit,
      portionQuantity: draft.quantity,
      grams: draft.grams,
      nutrition: draft.nutrition,
    }));
    addResolvedMeal(
      route.params.slot || 'dinner',
      items,
      'photo',
      route.params.analysisId,
      route.params.imageUri,
    );
    clearPendingAnalysisInput();
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    navigation.reset({
      index: 0,
      routes: [{ name: 'MainTabs', params: { screen: 'Home' } }],
    });
  };

  const filtered = state.catalog
    .filter((food) => food.canonicalName.toLowerCase().includes(query.toLowerCase()))
    .slice(0, 30);

  return (
    <NeoScreenWrapper tone="peach">
      <NeoTopBar
        title="Edit meal"
        leftColor={colors.butterCard}
        rightColor={colors.coralButton}
        onBack={() => navigation.goBack()}
      />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <Card style={styles.summary}>
          <Text style={type.label}>LIVE TOTAL</Text>
          <View style={styles.totalRow}>
            <Text style={styles.totalValue}>~{Math.round(totals.kcal)}</Text>
            <Text style={styles.totalUnit}>kcal</Text>
          </View>
          <Text style={styles.macroLine}>
            {Math.round(totals.proteinG)}g protein · {Math.round(totals.carbsG)}g carbs ·{' '}
            {Math.round(totals.fatG)}g fat
          </Text>
          <Text style={styles.estimate}>
            Nutrition updates as portions change.
          </Text>
        </Card>
        <View style={styles.list}>
          {drafts.map((draft, index) => {
            const food = state.catalog.find((candidate) => candidate.id === draft.base.foodId);
            const units = food?.portions.map((portion) => portion.unit) || [draft.unit];
            return (
              <Card key={draft.base.id} style={styles.item}>
                <View style={styles.itemTop}>
                  <Image source={imageForFood(food)} style={styles.itemImage} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.itemName}>{draft.base.foodName}</Text>
                    <Text style={styles.itemMeta}>
                      {Math.round(draft.grams)}g · ~{Math.round(draft.nutrition.kcal)} kcal
                    </Text>
                  </View>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Remove ${draft.base.foodName}`}
                    onPress={() =>
                      setDrafts((current) => current.filter((_, itemIndex) => itemIndex !== index))
                    }
                    style={styles.remove}
                  >
                    <Icon name="trash-can-outline" size={20} color={colors.error} />
                  </Pressable>
                </View>
                <View style={styles.amountRow}>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Decrease ${draft.base.foodName} portion`}
                    onPress={() =>
                      setDrafts((current) =>
                        current.map((item, itemIndex) =>
                          itemIndex === index
                            ? recalc(
                                item,
                                item.unit,
                                item.quantity - portionStep(item.unit),
                              )
                            : item,
                        ),
                      )
                    }
                    style={styles.step}
                  >
                    <Icon name="minus" size={19} color={colors.onSurfaceVariant} />
                  </Pressable>
                  <Text style={styles.amount}>{draft.quantity}</Text>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Increase ${draft.base.foodName} portion`}
                    onPress={() =>
                      setDrafts((current) =>
                        current.map((item, itemIndex) =>
                          itemIndex === index
                            ? recalc(
                                item,
                                item.unit,
                                item.quantity + portionStep(item.unit),
                              )
                            : item,
                        ),
                      )
                    }
                    style={styles.step}
                  >
                    <Icon name="plus" size={19} color={colors.onSurfaceVariant} />
                  </Pressable>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.units}>
                    {units.map((unit) => (
                      <Chip
                        key={unit}
                        label={unit.replace(/([A-Z])/g, ' $1')}
                        selected={unit === draft.unit}
                        onPress={() =>
                          setDrafts((current) =>
                            current.map((item, itemIndex) =>
                              itemIndex === index ? recalc(item, unit, item.quantity) : item,
                            ),
                          )
                        }
                      />
                    ))}
                  </ScrollView>
                </View>
              </Card>
            );
          })}
        </View>
        <Button
          label="ADD ANOTHER FOOD"
          variant="secondary"
          icon="plus"
          onPress={() => setPickerOpen(true)}
          style={{ marginTop: spacing.md }}
        />
      </ScrollView>
      <View style={styles.footer}>
        <Button label="SAVE CUSTOMIZED MEAL" disabled={drafts.length === 0} onPress={save} />
      </View>
      <Modal visible={pickerOpen} transparent animationType="slide" onRequestClose={() => setPickerOpen(false)}>
        <View style={styles.modal}>
          <Pressable style={styles.modalScrim} onPress={() => setPickerOpen(false)} />
          <View style={styles.picker}>
            <View style={styles.handle} />
            <Text style={styles.title}>Add a food</Text>
            <View style={styles.search}>
              <Icon name="magnify" size={20} color={colors.onSurfaceVariant} />
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder="Search cached foods"
                placeholderTextColor={colors.outline}
                style={styles.searchInput}
                autoFocus
              />
            </View>
            <ScrollView style={{ maxHeight: 380 }} contentContainerStyle={{ gap: spacing.xs }}>
              {filtered.map((food) => (
                <Pressable
                  key={food.id}
                  accessibilityRole="button"
                  accessibilityLabel={`Add ${food.canonicalName}`}
                  onPress={() => addFood(food)}
                  style={styles.foodOption}
                >
                  <Image source={imageForFood(food)} style={styles.foodOptionImage} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.itemName}>{food.canonicalName}</Text>
                    <Text style={styles.itemMeta}>{food.category}</Text>
                  </View>
                  <Icon name="plus-circle" size={24} color={colors.primary} />
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </NeoScreenWrapper>
  );
}

function scaleNutrition(nutrition: Nutrition, ratio: number): Nutrition {
  return {
    kcal: nutrition.kcal * ratio,
    proteinG: nutrition.proteinG * ratio,
    carbsG: nutrition.carbsG * ratio,
    fatG: nutrition.fatG * ratio,
    fiberG: nutrition.fiberG ? nutrition.fiberG * ratio : undefined,
    sodiumMg: nutrition.sodiumMg ? nutrition.sodiumMg * ratio : undefined,
  };
}

const styles = StyleSheet.create({
  content: { paddingTop: spacing.sm, paddingBottom: 120 },
  title: {
    ...type.headline,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  summary: { backgroundColor: colors.violetCard },
  totalRow: { flexDirection: 'row', alignItems: 'flex-end', marginTop: spacing.xs },
  totalValue: { ...type.metric, fontSize: 42, lineHeight: 46 },
  totalUnit: { ...type.body, marginLeft: 5, marginBottom: 5 },
  macroLine: { ...type.bodySmall, marginTop: spacing.xs },
  estimate: { ...type.caption, marginTop: spacing.sm },
  list: { gap: spacing.sm, marginTop: spacing.lg },
  item: { padding: spacing.md },
  itemTop: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  itemImage: {
    width: 54,
    height: 54,
    borderRadius: radii.sm,
    borderWidth: border.standard,
    borderColor: colors.ink,
  },
  itemName: { ...type.body, fontFamily: fonts.semibold },
  itemMeta: { ...type.caption, marginTop: 2 },
  remove: {
    width: 44,
    height: 44,
    borderRadius: radii.pill,
    borderWidth: border.standard,
    borderColor: colors.ink,
    backgroundColor: colors.coralCard,
    alignItems: 'center',
    justifyContent: 'center',
  },
  amountRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginTop: spacing.md },
  step: {
    width: 44,
    height: 44,
    borderRadius: radii.pill,
    borderWidth: border.standard,
    borderColor: colors.ink,
    backgroundColor: colors.butterCard,
    alignItems: 'center',
    justifyContent: 'center',
  },
  amount: { minWidth: 30, textAlign: 'center', fontFamily: fonts.semibold, fontSize: 16 },
  units: { gap: spacing.xxs, paddingLeft: spacing.xs },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: spacing.xl,
    backgroundColor: colors.peachCanvas,
    borderTopWidth: border.standard,
    borderTopColor: colors.ink,
  },
  modal: { flex: 1, justifyContent: 'flex-end' },
  modalScrim: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: colors.lavenderBackdrop,
  },
  picker: {
    maxHeight: '82%',
    backgroundColor: colors.pinkCanvas,
    borderTopLeftRadius: radii.lg,
    borderTopRightRadius: radii.lg,
    borderWidth: border.standard,
    borderColor: colors.ink,
    padding: spacing.xl,
    gap: spacing.md,
  },
  handle: {
    width: 52,
    height: 6,
    borderRadius: radii.pill,
    backgroundColor: colors.ink,
    alignSelf: 'center',
  },
  search: {
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    borderWidth: border.standard,
    borderColor: colors.ink,
    backgroundColor: colors.white,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.md,
  },
  searchInput: { flex: 1, ...type.bodySmall, outlineStyle: 'none' as never },
  foodOption: {
    minHeight: 68,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.white,
    borderRadius: radii.md,
    borderWidth: border.standard,
    borderColor: colors.ink,
    padding: spacing.xs,
  },
  foodOptionImage: {
    width: 52,
    height: 52,
    borderRadius: radii.sm,
    borderWidth: border.standard,
    borderColor: colors.ink,
  },
});
