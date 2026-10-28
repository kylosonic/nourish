import React, { useEffect, useMemo, useState } from 'react';
import {
  Animated,
  Easing,
  Image,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/types';
import { analyzeImage, analyzeText } from '../../data/api';
import {
  clearPendingAnalysisInput,
  getPendingAnalysisInput,
} from '../../state/analysisSession';
import { border, colors, fonts, radii, spacing, type } from '../../theme';
import { Button, Icon } from '../../components/ui';
import { images } from '../../data/images';
import { useApp } from '../../state/AppProvider';
import { newId } from '../../utils/date';
import type { AnalysisItem, MealItem, PortionUnit } from '../../types';

type Props = NativeStackScreenProps<RootStackParamList, 'Analysis'>;

const stages = [
  'Finding foods...',
  'Estimating portions...',
  'Calculating nutrition...',
];

export function AnalysisScreen({ navigation, route }: Props) {
  const { state } = useApp();
  const pending = useMemo(() => getPendingAnalysisInput(), []);
  const [stage, setStage] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [pulse] = useState(() => new Animated.Value(0));

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 1200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 1200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [pulse]);

  useEffect(() => {
    let active = true;
    const timers = [
      setTimeout(() => active && setStage(1), 600),
      setTimeout(() => active && setStage(2), 1200),
    ];
    const minimumSequence = new Promise((resolve) => setTimeout(resolve, 1900));

    const run = async () => {
      try {
        if (!pending?.imageBase64 && !pending?.text) {
          throw new Error('There is no meal input to analyze. Please start again.');
        }
        const request = pending.imageBase64
          ? analyzeImage(pending.imageBase64)
          : analyzeText(pending.text!);
        const [result] = await Promise.all([request, minimumSequence]);
        if (!active) return;

        const resolvedItems = result.items
          .map((item) => mapAnalysisItem(item, state.catalog))
          .filter((item): item is MealItem => item !== null);
        if (result.confidenceState === 'Low' || resolvedItems.length === 0) {
          navigation.replace('LowConfidence', {
            analysisId: result.id,
            slot: pending.slot || route.params.slot,
            imageUri: pending.imageUri,
            candidates: result.candidates,
          });
          return;
        }
        navigation.replace('Result', {
          analysisId: result.id,
          slot: pending.slot || route.params.slot,
          imageUri: pending.imageUri,
          items: resolvedItems,
          totals: result.totals,
          confidenceState: result.confidenceState,
          overallConfidence: result.overallConfidence,
        });
      } catch (analysisError) {
        if (!active) return;
        timers.forEach(clearTimeout);
        setError(
          analysisError instanceof Error
            ? analysisError.message
            : 'We couldn’t analyze this meal.',
        );
      }
    };
    void run();
    return () => {
      active = false;
      timers.forEach(clearTimeout);
    };
  }, [attempt, navigation, pending, route.params.slot, state.catalog]);

  const scale = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.94, 1.06] });
  const opacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.3, 0.08] });

  if (error) {
    return (
      <View style={styles.page}>
        <Image source={images.analysis} style={StyleSheet.absoluteFill} resizeMode="cover" />
        <View style={styles.failureOverlay}>
          <View style={styles.failureIcon}>
            <Icon name="image-search-outline" size={34} color={colors.error} />
          </View>
          <Text style={styles.failureTitle}>Scan didn’t finish</Text>
          <Text style={styles.failureCopy}>
            Try again or find the foods manually.
          </Text>
          <Button
            label="FIND FOOD MANUALLY"
            onPress={() => {
              clearPendingAnalysisInput();
              navigation.replace('FoodSearch', {
                slot: pending?.slot || route.params.slot,
              });
            }}
            style={{ alignSelf: 'stretch', marginTop: spacing.xl }}
          />
          <Button
            label="TRY AGAIN"
            variant="secondary"
            onPress={() => {
              setError(null);
              setStage(0);
              setAttempt((value) => value + 1);
            }}
            style={{ alignSelf: 'stretch', marginTop: spacing.sm }}
          />
          <Button
            label="CANCEL"
            variant="outline"
            onPress={() => {
              clearPendingAnalysisInput();
              navigation.reset({
                index: 0,
                routes: [{ name: 'MainTabs', params: { screen: 'Home' } }],
              });
            }}
            style={{ alignSelf: 'stretch', marginTop: spacing.sm }}
          />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.page}>
      <Image
        source={pending?.imageUri ? { uri: pending.imageUri } : images.analysis}
        style={StyleSheet.absoluteFill}
        resizeMode="cover"
      />
      <View style={styles.wash} />
      <Text style={styles.wordmark}>Nourish</Text>
      <View style={styles.center}>
        <Animated.View
          style={[
            styles.pulse,
            { transform: [{ scale }], opacity },
          ]}
        />
        <View style={styles.scanner}>
          <Icon name="line-scan" size={38} color={colors.onSurfaceVariant} />
        </View>
      </View>
      <View style={styles.statusList}>
        {stages.map((label, index) => {
          const done = index < stage;
          const active = index === stage;
          return (
            <View key={label} style={styles.statusRow}>
              <View
                style={[
                  styles.statusDot,
                  (done || active) && styles.statusDotActive,
                ]}
              >
                {done ? (
                  <Icon name="check" size={16} color={colors.white} />
                ) : active ? (
                  <View style={styles.activeDot} />
                ) : null}
              </View>
              <Text style={[styles.statusText, (done || active) && styles.statusTextActive]}>
                {label}
              </Text>
            </View>
          );
        })}
      </View>
      <Text style={styles.powered}>POWERED BY NOURISH INTELLIGENCE</Text>
    </View>
  );
}

function mapAnalysisItem(item: AnalysisItem, catalog: ReturnType<typeof useApp>['state']['catalog']): MealItem | null {
  if (
    item.unresolved ||
    !item.foodId ||
    !item.nutrition ||
    item.portion.grams <= 0
  ) {
    return null;
  }
  const food = catalog.find((candidate) => candidate.id === item.foodId);
  return {
    id: newId('item'),
    foodId: item.foodId,
    foodName: food?.canonicalName || item.canonicalName || item.displayName,
    category: food?.category || 'Other',
    portionUnit: item.portion.unit as PortionUnit,
    portionQuantity: item.portion.amount,
    grams: item.portion.grams,
    nutrition: item.nutrition,
    estimated: item.portion.estimated,
  };
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.lavenderBackdrop, overflow: 'hidden' },
  wash: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: colors.lavenderBackdrop,
    opacity: 0.84,
  },
  wordmark: {
    fontFamily: fonts.bold,
    fontSize: 44,
    letterSpacing: -2,
    color: colors.ink,
    textAlign: 'center',
    marginTop: 72,
  },
  center: {
    position: 'absolute',
    top: '28%',
    alignSelf: 'center',
    width: 188,
    height: 188,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulse: {
    position: 'absolute',
    width: 182,
    height: 182,
    borderRadius: 91,
    borderWidth: border.standard,
    borderColor: colors.ink,
    backgroundColor: colors.mintCard,
  },
  scanner: {
    width: 84,
    height: 84,
    borderRadius: radii.pill,
    borderWidth: border.standard,
    borderColor: colors.ink,
    backgroundColor: colors.butterCard,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusList: {
    position: 'absolute',
    bottom: 160,
    left: 48,
    right: 48,
    gap: spacing.md,
  },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  statusDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: border.standard,
    borderColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusDotActive: {
    backgroundColor: colors.activeLime,
    borderColor: colors.ink,
  },
  activeDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.ink },
  statusText: { ...type.bodyLarge, color: colors.ink, opacity: 0.55 },
  statusTextActive: { color: colors.ink, opacity: 1 },
  powered: {
    ...type.label,
    position: 'absolute',
    bottom: 52,
    alignSelf: 'center',
    color: colors.ink,
    fontSize: 10,
  },
  failureOverlay: {
    flex: 1,
    marginTop: 'auto',
    backgroundColor: colors.pinkCanvas,
    borderTopLeftRadius: radii.lg,
    borderTopRightRadius: radii.lg,
    borderWidth: border.standard,
    borderColor: colors.ink,
    padding: spacing.xxl,
    paddingTop: spacing.xxl,
  },
  failureIcon: {
    width: 66,
    height: 66,
    borderRadius: radii.pill,
    borderWidth: border.standard,
    borderColor: colors.ink,
    backgroundColor: colors.coralCard,
    alignItems: 'center',
    justifyContent: 'center',
  },
  failureTitle: { ...type.headline, marginTop: spacing.xl },
  failureCopy: { ...type.body, color: colors.onSurfaceVariant, marginTop: spacing.sm },
});
