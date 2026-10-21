import React, { useMemo } from 'react';
import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/types';
import { colors, fonts, radii, spacing, type } from '../../theme';
import { Button, Card, Icon } from '../../components/ui';
import { MacroSummary } from '../../components/nutrition';
import { images } from '../../data/images';
import { useApp } from '../../state/AppProvider';
import { clearPendingAnalysisInput } from '../../state/analysisSession';
import { mealSlotForHour } from '../../domain/recommendations';

type Props = NativeStackScreenProps<RootStackParamList, 'Result'>;

export function ResultScreen({ navigation, route }: Props) {
  const { state, addResolvedMeal } = useApp();
  const { items, confidenceState, overallConfidence, slot, imageUri, analysisId } = route.params;
  const nutrition = useMemo(
    () =>
      items.reduce(
        (sum, item) => ({
          kcal: sum.kcal + item.nutrition.kcal,
          proteinG: sum.proteinG + item.nutrition.proteinG,
          carbsG: sum.carbsG + item.nutrition.carbsG,
          fatG: sum.fatG + item.nutrition.fatG,
        }),
        { kcal: 0, proteinG: 0, carbsG: 0, fatG: 0 },
      ),
    [items],
  );

  const discard = () => {
    Alert.alert('Discard this analysis?', 'Nothing will be added to your daily log.', [
      { text: 'Keep reviewing', style: 'cancel' },
      {
        text: 'Discard',
        style: 'destructive',
        onPress: () => {
          clearPendingAnalysisInput();
          navigation.reset({
            index: 0,
            routes: [{ name: 'MainTabs', params: { screen: 'Home' } }],
          });
        },
      },
    ]);
  };

  const confirm = () => {
    addResolvedMeal(
      slot || mealSlotForHour(),
      items,
      'photo',
      analysisId,
      imageUri,
    );
    clearPendingAnalysisInput();
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    navigation.reset({
      index: 0,
      routes: [{ name: 'MainTabs', params: { screen: 'Home' } }],
    });
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <Pressable accessibilityLabel="Close results" onPress={discard} style={styles.close}>
          <Icon name="close" size={27} color={colors.primary} />
        </Pressable>
        <Text style={styles.wordmark}>Nourish</Text>
        <View style={{ width: 40 }} />
      </View>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <View style={styles.heroWrap}>
          <Image
            source={imageUri ? { uri: imageUri } : images.result}
            style={styles.hero}
            resizeMode="cover"
          />
          <View style={styles.scanBadge}>
            <Icon name="check-circle" size={16} color={colors.primary} />
            <Text style={styles.scanBadgeText}>SCAN COMPLETE</Text>
          </View>
        </View>
        <Card style={styles.confidence}>
          <View>
            <Text style={type.label}>AI CONFIDENCE</Text>
            <Text style={styles.confidenceValue}>
              {confidenceState.toUpperCase()} ({Math.round(overallConfidence * 100)}%)
            </Text>
          </View>
          <Pressable
            onPress={() =>
              navigation.replace('EditMeal', {
                slot,
                analysisId,
                imageUri,
                items,
              })
            }
            style={styles.adjust}
          >
            <Icon name="pencil-outline" size={18} color={colors.primary} />
            <Text style={styles.adjustText}>ADJUST</Text>
          </Pressable>
        </Card>
        <Card style={styles.summary}>
          <Text style={styles.summaryTitle}>Meal Summary</Text>
          <View style={styles.totalRow}>
            <Text style={styles.totalValue}>{Math.round(nutrition.kcal)}</Text>
            <Text style={styles.totalUnit}>kcal</Text>
          </View>
          <View style={styles.divider} />
          {state.target ? <MacroSummary nutrition={nutrition} target={state.target} /> : null}
          <Text style={styles.estimate}>~ Estimated from the meal photo. Edit anything before saving.</Text>
        </Card>
        <Text style={styles.ingredientsTitle}>DETECTED INGREDIENTS</Text>
        <View style={styles.ingredients}>
          {items.map((item, index) => (
            <View key={item.id} style={styles.ingredient}>
              <View style={styles.ingredientIcon}>
                <Icon
                  name={index === 0 ? 'silverware-fork-knife' : index === 1 ? 'pot-steam-outline' : 'leaf'}
                  size={22}
                  color={colors.onSurfaceVariant}
                />
              </View>
              <View style={styles.ingredientCopy}>
                <Text style={styles.ingredientName}>{item.foodName.toUpperCase()}</Text>
                <Text style={styles.ingredientDetail} numberOfLines={1}>
                  {item.category} · {Math.round(item.grams)}g
                </Text>
              </View>
              <Text style={styles.ingredientKcal}>~{Math.round(item.nutrition.kcal)} kcal</Text>
            </View>
          ))}
        </View>
        <Button
          label="CONFIRM MEAL"
          icon="check"
          onPress={confirm}
          style={{ marginTop: spacing.xl }}
        />
        <Button
          label="EDIT"
          variant="secondary"
          icon="pencil-outline"
          onPress={() =>
            navigation.replace('EditMeal', {
              slot,
              analysisId,
              imageUri,
              items,
            })
          }
          style={{ marginTop: spacing.sm }}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.surface },
  header: { height: 64, paddingHorizontal: spacing.xl, flexDirection: 'row', alignItems: 'center' },
  close: { width: 40, height: 40, alignItems: 'flex-start', justifyContent: 'center' },
  wordmark: {
    flex: 1,
    textAlign: 'center',
    fontFamily: fonts.bold,
    fontSize: 38,
    letterSpacing: -1.7,
    color: colors.primary,
  },
  content: { paddingHorizontal: spacing.xl, paddingBottom: spacing.xxl },
  heroWrap: { borderRadius: radii.md, overflow: 'hidden', height: 312 },
  hero: { width: '100%', height: '100%' },
  scanBadge: {
    position: 'absolute',
    top: spacing.sm,
    left: spacing.sm,
    height: 32,
    paddingHorizontal: spacing.sm,
    borderRadius: radii.pill,
    backgroundColor: 'rgba(255,255,255,0.94)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  scanBadgeText: { ...type.label, fontSize: 10, color: colors.onSurface },
  confidence: {
    marginTop: spacing.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surfaceLow,
    borderColor: colors.surfaceLow,
    shadowOpacity: 0,
    elevation: 0,
  },
  confidenceValue: {
    fontFamily: fonts.bold,
    fontSize: 21,
    lineHeight: 28,
    color: colors.primary,
    letterSpacing: 0.2,
  },
  adjust: { flexDirection: 'row', alignItems: 'center', gap: 4, padding: spacing.xs },
  adjustText: { ...type.label, color: colors.primary },
  summary: { marginTop: spacing.lg, padding: spacing.lg },
  summaryTitle: { ...type.title },
  totalRow: { flexDirection: 'row', alignItems: 'flex-end', marginTop: spacing.lg },
  totalValue: { fontFamily: fonts.bold, fontSize: 39, letterSpacing: -1.5 },
  totalUnit: { ...type.body, color: colors.onSurfaceVariant, marginLeft: 4, marginBottom: 4 },
  divider: { height: 1, backgroundColor: colors.surfaceHighest, marginVertical: spacing.lg },
  estimate: { ...type.caption, color: colors.onSurfaceVariant, marginTop: spacing.lg, fontStyle: 'italic' },
  ingredientsTitle: { ...type.label, marginTop: spacing.xl, marginBottom: spacing.sm },
  ingredients: { gap: spacing.xs },
  ingredient: {
    minHeight: 86,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: colors.surfaceHighest,
    borderRadius: radii.md,
    backgroundColor: colors.white,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  ingredientIcon: {
    width: 56,
    height: 56,
    borderRadius: radii.sm,
    backgroundColor: colors.surfaceHigh,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ingredientCopy: { flex: 1 },
  ingredientName: { ...type.body, fontFamily: fonts.regular, letterSpacing: 0.3 },
  ingredientDetail: { ...type.bodySmall, color: colors.onSurfaceVariant },
  ingredientKcal: { ...type.bodySmall, fontFamily: fonts.semibold, color: colors.primary },
});
