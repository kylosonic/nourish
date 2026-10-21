import React from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/types';
import { colors, fonts, radii, spacing, type } from '../../theme';
import { Button, Card, Icon } from '../../components/ui';
import { images } from '../../data/images';
import { useApp } from '../../state/AppProvider';
import { nutritionFor } from '../../domain/nutrition';
import { newId } from '../../utils/date';

type Props = NativeStackScreenProps<RootStackParamList, 'LowConfidence'>;

const candidateImages: Record<string, number> = {
  shiro_wot: images.candidateShiro,
  misir_wot: images.candidateMisir,
  kik_alicha: images.candidateKik,
};

export function LowConfidenceScreen({ navigation, route }: Props) {
  const { state } = useApp();
  const { candidates, slot, imageUri, analysisId } = route.params;

  const choose = (foodId: string | null) => {
    if (!foodId) {
      navigation.replace('FoodSearch', {
        slot,
        mode: 'candidate',
        analysisId,
        imageUri,
        candidates,
      });
      return;
    }
    const food = state.catalog.find((candidate) => candidate.id === foodId);
    if (!food) {
      navigation.replace('FoodSearch', {
        slot,
        mode: 'candidate',
        analysisId,
        imageUri,
        candidates,
      });
      return;
    }
    const grams = food.defaultPortion.grams;
    navigation.replace('Result', {
      analysisId,
      slot,
      imageUri,
      confidenceState: 'Medium',
      overallConfidence: 0.72,
      totals: nutritionFor(food.per100g, grams),
      items: [
        {
          id: newId('item'),
          foodId: food.id,
          foodName: food.canonicalName,
          category: food.category,
          portionUnit: food.defaultPortion.unit,
          portionQuantity: food.defaultPortion.quantity,
          grams,
          nutrition: nutritionFor(food.per100g, grams),
          estimated: true,
        },
      ],
    });
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <Pressable
          accessibilityLabel="Close"
          onPress={() =>
            navigation.reset({
              index: 0,
              routes: [{ name: 'MainTabs', params: { screen: 'Home' } }],
            })
          }
          style={styles.close}
        >
          <Icon name="close" size={25} color={colors.primary} />
        </Pressable>
        <Text style={styles.wordmark}>Nourish</Text>
        <Icon name="bell-outline" size={23} color={colors.onSurfaceVariant} />
      </View>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={styles.heroWrap}>
          <Image
            source={imageUri ? { uri: imageUri } : images.candidateShiro}
            style={StyleSheet.absoluteFill}
            resizeMode="cover"
            blurRadius={8}
          />
          <View style={styles.heroWash} />
          <View style={styles.warning}>
            <Icon name="alert-outline" size={15} color="#855300" />
            <Text style={styles.warningText}>LOW CONFIDENCE</Text>
          </View>
        </View>
        <View style={styles.copyWrap}>
          <Text style={styles.title}>We’re not completely sure.</Text>
          <Text style={styles.subcopy}>
            {candidates.length > 0
              ? 'Which one of these looks right?'
              : 'We could not confidently identify the foods. Search the database so you stay in control.'}
          </Text>
        </View>
        <View style={styles.candidates}>
          {candidates.map((candidate) => {
            const food = state.catalog.find((item) => item.id === candidate.foodId);
            return (
              <Card key={`${candidate.foodId}-${candidate.displayName}`} style={styles.candidate} padded={false}>
                <Image
                  source={
                    (candidate.foodId && candidateImages[candidate.foodId]) ||
                    imageForCandidate(candidate.displayName)
                  }
                  style={styles.candidateImage}
                />
                <View style={styles.candidateCopy}>
                  <Text style={styles.candidateName}>{candidate.displayName}</Text>
                  <Text style={styles.candidateDetail}>
                    {candidate.foodId === 'shiro_wot'
                      ? 'Classic chickpea stew'
                      : candidate.foodId === 'misir_wot'
                        ? 'Spicy red lentil stew'
                        : candidate.foodId === 'kik_alicha'
                          ? 'Yellow split pea stew'
                          : food
                            ? `${food.category} · ${Math.round(food.defaultPortion.grams)}g`
                            : 'Look up this food manually'}
                  </Text>
                </View>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => choose(candidate.foodId)}
                  style={styles.select}
                >
                  <Text style={styles.selectText}>SELECT</Text>
                </Pressable>
              </Card>
            );
          })}
        </View>
        <Button
          label="SEARCH MANUALLY"
          variant="secondary"
          icon="magnify"
          onPress={() =>
            navigation.replace('FoodSearch', {
              slot,
              mode: 'candidate',
              analysisId,
              imageUri,
              candidates,
            })
          }
          style={{ marginTop: spacing.xl }}
        />
        <Text style={styles.footnote}>
          Your selection is used only to finish this entry and is never guessed for you.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function imageForCandidate(name: string): number {
  const lower = name.toLowerCase();
  if (lower.includes('misir')) return images.candidateMisir;
  if (lower.includes('kik')) return images.candidateKik;
  return images.candidateShiro;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.surface },
  header: {
    height: 64,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  close: { width: 40, height: 40, justifyContent: 'center' },
  wordmark: {
    flex: 1,
    textAlign: 'center',
    fontFamily: fonts.bold,
    fontSize: 35,
    letterSpacing: -1.5,
    color: colors.primary,
  },
  content: { paddingHorizontal: spacing.md, paddingBottom: spacing.xxl },
  heroWrap: { height: 156, borderRadius: radii.sm, overflow: 'hidden' },
  heroWash: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: 'rgba(252,249,248,0.15)',
  },
  warning: {
    position: 'absolute',
    top: 10,
    alignSelf: 'center',
    left: '25%',
    right: '25%',
    height: 31,
    borderRadius: radii.pill,
    backgroundColor: 'rgba(255,248,232,0.95)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  warningText: { ...type.label, fontSize: 9, color: '#855300' },
  copyWrap: { paddingHorizontal: spacing.sm, paddingVertical: spacing.lg },
  title: { ...type.title, textAlign: 'center' },
  subcopy: { ...type.bodySmall, color: colors.onSurfaceVariant, textAlign: 'center', marginTop: spacing.xs },
  candidates: { gap: spacing.sm },
  candidate: { minHeight: 94, flexDirection: 'row', alignItems: 'center', padding: spacing.sm, gap: spacing.sm },
  candidateImage: { width: 70, height: 70, borderRadius: radii.sm },
  candidateCopy: { flex: 1 },
  candidateName: { ...type.body, fontFamily: fonts.semibold },
  candidateDetail: { ...type.bodySmall, color: colors.onSurfaceVariant, marginTop: 2 },
  select: {
    height: 30,
    borderRadius: radii.xs,
    backgroundColor: colors.primarySoft,
    paddingHorizontal: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectText: { ...type.label, fontSize: 9, color: colors.primary },
  footnote: { ...type.caption, textAlign: 'center', marginTop: spacing.md },
});
