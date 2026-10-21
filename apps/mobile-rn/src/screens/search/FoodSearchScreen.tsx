import React, { useMemo, useState } from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/types';
import { useApp } from '../../state/AppProvider';
import { colors, fonts, radii, spacing, type } from '../../theme';
import { Button, Chip, Icon } from '../../components/ui';
import { imageForFood } from '../../data/images';
import { nutritionFor } from '../../domain/nutrition';
import { mealSlotForHour } from '../../domain/recommendations';
import { newId } from '../../utils/date';
import * as Haptics from 'expo-haptics';

type Props = NativeStackScreenProps<RootStackParamList, 'FoodSearch'>;

const categories = ['All', 'Ethiopian', 'Breakfast', 'Lunch', 'Dinner', 'Snacks'];
const commonOrder = ['injera', 'shiro_wot', 'beef_tibs', 'misir_wot'];

const normalize = (value: string) =>
  value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[’']/g, '')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();

export function FoodSearchScreen({ navigation, route }: Props) {
  const { state, addDraftMeal } = useApp();
  const [query, setQuery] = useState(route.params?.candidates?.[0]?.displayName ?? '');
  const [category, setCategory] = useState('All');
  const candidateMode = route.params?.mode === 'candidate';
  const slot = route.params?.slot || mealSlotForHour();

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

  const choose = (foodId: string) => {
    const food = state.catalog.find((candidate) => candidate.id === foodId);
    if (!food) return;
    const nutrition = nutritionFor(food.per100g, food.defaultPortion.grams);
    const item = {
      id: newId('item'),
      foodId: food.id,
      foodName: food.canonicalName,
      category: food.category,
      portionUnit: food.defaultPortion.unit,
      portionQuantity: food.defaultPortion.quantity,
      grams: food.defaultPortion.grams,
      nutrition,
    };
    if (candidateMode) {
      navigation.replace('Result', {
        analysisId: route.params?.analysisId || newId('manual'),
        slot,
        imageUri: route.params?.imageUri,
        items: [item],
        totals: nutrition,
        confidenceState: 'High',
        overallConfidence: 1,
      });
      return;
    }
    addDraftMeal(slot, [{ food, unit: food.defaultPortion.unit, quantity: food.defaultPortion.quantity }], 'search');
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    navigation.reset({
      index: 0,
      routes: [{ name: 'MainTabs', params: { screen: 'Home' } }],
    });
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <Pressable
          accessibilityLabel="Go back"
          onPress={() => navigation.goBack()}
          style={styles.back}
        >
          <Icon name="arrow-left" size={24} color={colors.onSurfaceVariant} />
        </Pressable>
        <Text style={styles.title}>Search Foods</Text>
        <View style={{ width: 40 }} />
      </View>
      <View style={styles.searchRow}>
        <View style={styles.searchBox}>
          <Icon name="magnify" size={21} color={colors.onSurfaceVariant} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search food in English or አማርኛ"
            placeholderTextColor={colors.outline}
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
                <View key={food.id} style={styles.foodCard}>
                  <Image source={imageForFood(food)} style={styles.foodImage} />
                  <View style={styles.foodCopy}>
                    <Text style={styles.foodName}>{food.canonicalName}</Text>
                    <Text style={styles.foodPortion}>
                      {food.defaultPortion.quantity} {food.defaultPortion.unit.replace(/([A-Z])/g, ' $1')} (
                      {Math.round(food.defaultPortion.grams)}g) • {Math.round(kcal)} kcal
                    </Text>
                    {food.isSeed ? (
                      <Text style={styles.provisional}>BOOTSTRAP VALUE</Text>
                    ) : (
                      <Text style={styles.verified}>FCT 2025</Text>
                    )}
                  </View>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Add ${food.canonicalName}`}
                    onPress={() => choose(food.id)}
                    style={styles.add}
                  >
                    <Icon name="plus" size={20} color={colors.primary} />
                  </Pressable>
                </View>
              );
            })}
          </View>
        ) : (
          <View style={styles.empty}>
            <View style={styles.emptyIcon}>
              <Icon name="silverware-fork-knife" size={32} color={colors.primary} />
            </View>
            <Text style={styles.emptyTitle}>No matching food</Text>
            <Text style={styles.emptyCopy}>
              Try another spelling or describe the meal so the analysis service can suggest a match.
            </Text>
            <Button
              label="DESCRIBE MEAL"
              variant="secondary"
              onPress={() => navigation.navigate('TextLog', { slot })}
              style={{ alignSelf: 'stretch', marginTop: spacing.sm }}
            />
          </View>
        )}
        <View style={styles.tip}>
          <Icon name="information-outline" size={18} color={colors.primary} />
          <Text style={styles.tipText}>
            Search matches English names, Amharic names, and common spelling variants. Cached foods
            remain available offline.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.surface },
  header: {
    height: 64,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  back: { width: 40, height: 40, justifyContent: 'center' },
  title: { ...type.title, flex: 1, textAlign: 'center', fontSize: 22 },
  searchRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.xl,
    marginTop: spacing.xs,
  },
  searchBox: {
    flex: 1,
    height: 48,
    borderRadius: radii.pill,
    backgroundColor: colors.surfaceHigh,
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
    borderRadius: 24,
    backgroundColor: colors.surfaceHigh,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipsScroller: { flexGrow: 0 },
  chips: { paddingHorizontal: spacing.xl, paddingVertical: spacing.md, gap: spacing.xs },
  content: { paddingHorizontal: spacing.xl, paddingBottom: spacing.xxl },
  sectionTitle: { ...type.title, marginTop: spacing.lg, marginBottom: spacing.md },
  foodList: { gap: spacing.sm },
  foodCard: {
    minHeight: 116,
    borderRadius: radii.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.surfaceHighest,
    backgroundColor: colors.white,
    padding: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  foodImage: { width: 88, height: 96, borderRadius: radii.sm },
  foodCopy: { flex: 1 },
  foodName: { ...type.body, fontFamily: fonts.semibold },
  foodPortion: { ...type.caption, marginTop: 2 },
  provisional: { ...type.caption, fontSize: 9, color: '#855300', marginTop: spacing.xs },
  verified: { ...type.caption, fontSize: 9, color: colors.primary, marginTop: spacing.xs },
  add: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  empty: { alignItems: 'center', padding: spacing.xl },
  emptyIcon: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: { ...type.title, marginTop: spacing.md },
  emptyCopy: { ...type.body, color: colors.onSurfaceVariant, textAlign: 'center', marginTop: spacing.xs },
  tip: {
    flexDirection: 'row',
    gap: spacing.sm,
    borderRadius: radii.md,
    backgroundColor: colors.primarySoft,
    padding: spacing.md,
    marginTop: spacing.lg,
  },
  tipText: { ...type.bodySmall, color: colors.onSurfaceVariant, flex: 1 },
});
