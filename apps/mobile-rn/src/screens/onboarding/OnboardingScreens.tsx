import React, { useMemo, useState } from 'react';
import {
  Image,
  ImageBackground,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { RootStackParamList } from '../../navigation/types';
import { useApp } from '../../state/AppProvider';
import { border, colors, fonts, radii, spacing, type } from '../../theme';
import {
  Button,
  Field,
  Header,
  Icon,
  ProgressBar,
  Radio,
} from '../../components/ui';
import { NeoScreenWrapper } from '../../components/neo';
import { images } from '../../data/images';
import { targetFromOnboarding } from '../../domain/nutrition';
import type {
  Activity,
  FoodPreference,
  Goal,
  Language,
  Pace,
  Sex,
} from '../../types';

type Props<Name extends keyof RootStackParamList> = NativeStackScreenProps<RootStackParamList, Name>;

export function WelcomeScreen({ navigation }: Props<'Welcome'>) {
  const insets = useSafeAreaInsets();
  const { startOnboarding } = useApp();
  return (
    <View style={styles.welcome}>
      <ImageBackground
        source={images.welcome}
        resizeMode="cover"
        style={styles.welcomeImage}
        imageStyle={styles.welcomeImageInner}
      />
      <View style={styles.welcomeWash} />
      <View style={[styles.brandMark, { top: insets.top + 28 }]}>
        <View style={styles.brandLeaf}>
          <Icon name="leaf" color={colors.primary} size={24} />
        </View>
      </View>
      <View style={[styles.welcomeCopy, { paddingBottom: Math.max(24, insets.bottom + 16) }]}>
        <Text style={styles.welcomeTitle}>Eat smarter. Understand your food.</Text>
        <Text style={styles.welcomeBody}>
          Nutrition built for the way you eat.
        </Text>
        <Button
          label="GET STARTED"
          icon="arrow-right"
          onPress={() => {
            startOnboarding();
            navigation.navigate('Language');
          }}
          style={{ marginTop: spacing.xl }}
        />
        <Button
          label="I ALREADY HAVE AN ACCOUNT"
          variant="outline"
          onPress={() => navigation.navigate('SignIn')}
          style={{ marginTop: spacing.sm }}
        />
      </View>
    </View>
  );
}

function StepProgress({ value, label }: { value: number; label?: string }) {
  return (
    <View style={styles.stepProgress}>
      <ProgressBar value={value} height={4} color={colors.primary} />
      {label ? <Text style={styles.stepLabel}>{label}</Text> : null}
    </View>
  );
}

function OnboardingFrame({
  children,
  navigation,
  progress,
  stepLabel,
  right,
  footer,
}: {
  children: React.ReactNode;
  navigation: { goBack: () => void };
  progress?: number;
  stepLabel?: string;
  right?: React.ReactNode;
  footer: React.ReactNode;
}) {
  return (
    <NeoScreenWrapper tone="lavender">
      <View style={styles.onboardingHeader}>
        <Header
          onBack={() => navigation.goBack()}
          wordmark={false}
          title=""
          right={right}
        />
        {typeof progress === 'number' ? <StepProgress value={progress} label={stepLabel} /> : null}
      </View>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.onboardingContent}
        keyboardShouldPersistTaps="handled"
      >
        {children}
      </ScrollView>
      <View style={styles.onboardingFooter}>{footer}</View>
    </NeoScreenWrapper>
  );
}

export function LanguageScreen({ navigation }: Props<'Language'>) {
  const { state, patchOnboarding } = useApp();
  const languages: { id: Language; name: string; native: string }[] = [
    { id: 'en', name: 'English', native: 'English' },
    { id: 'am', name: 'Amharic', native: 'አማርኛ' },
    { id: 'om', name: 'Afaan Oromo', native: 'Afaan Oromoo' },
  ];
  return (
    <OnboardingFrame
      navigation={navigation}
      progress={20}
      stepLabel="STEP 1 OF 5"
      footer={
        <Button
          label="Continue"
          icon="arrow-right"
          onPress={() => {
            patchOnboarding({ step: 2 });
            navigation.navigate('Goal');
          }}
        />
      }
    >
      <Text style={styles.centerTitle}>Language</Text>
      <Text style={[styles.subcopy, { textAlign: 'center', marginBottom: 28 }]}>
        Choose your language.
      </Text>
      <View style={{ gap: spacing.sm }}>
        {languages.map((language) => (
          <Radio
            key={language.id}
            label={language.native}
            sublabel={language.name}
            selected={state.onboarding.language === language.id}
            onPress={() => patchOnboarding({ language: language.id })}
          />
        ))}
      </View>
    </OnboardingFrame>
  );
}

export function GoalScreen({ navigation }: Props<'Goal'>) {
  const { state, patchOnboarding } = useApp();
  const goals: { id: Goal; title: string; icon: React.ComponentProps<typeof Icon>['name'] }[] = [
    { id: 'lose', title: 'Lose weight', icon: 'trending-down' },
    { id: 'muscle', title: 'Build muscle', icon: 'dumbbell' },
    { id: 'maintain', title: 'Maintain weight', icon: 'scale-balance' },
    { id: 'healthy', title: 'Eat healthier', icon: 'leaf' },
  ];
  return (
    <OnboardingFrame
      navigation={navigation}
      progress={28}
      footer={
        <Button
          label="Next"
          disabled={!state.onboarding.goal}
          onPress={() => {
            patchOnboarding({ step: 3 });
            navigation.navigate('Body');
          }}
        />
      }
    >
      <Text style={styles.onboardingTitle}>What is your goal?</Text>
      <Text style={styles.subcopy}>Choose one.</Text>
      <View style={[styles.cardList, { marginTop: spacing.xxl }]}>
        {goals.map((goal) => {
          const selected = state.onboarding.goal === goal.id;
          return (
            <Pressable
              key={goal.id}
              onPress={() => patchOnboarding({ goal: goal.id })}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              style={[styles.goalCard, selected && styles.goalCardSelected]}
            >
              <View style={[styles.goalIcon, selected && { backgroundColor: colors.primarySoft }]}>
                <Icon
                  name={goal.icon}
                  color={selected ? colors.primary : colors.onSurfaceVariant}
                  size={24}
                />
              </View>
              <Text style={[type.body, styles.goalTitle]}>{goal.title}</Text>
            </Pressable>
          );
        })}
      </View>
    </OnboardingFrame>
  );
}

export function BodyScreen({ navigation }: Props<'Body'>) {
  const { state, patchOnboarding } = useApp();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const validate = () => {
    const next: Record<string, string> = {};
    const age = Number(state.onboarding.age);
    const height = Number(state.onboarding.heightCm);
    const weight = Number(state.onboarding.currentWeightKg);
    const targetWeight = Number(state.onboarding.targetWeightKg);
    if (!Number.isFinite(age) || age < 18 || age > 100) next.age = 'Enter an age from 18 to 100.';
    if (!Number.isFinite(height) || height < 100 || height > 250) {
      next.height = 'Enter a height from 100 to 250 cm.';
    }
    if (!Number.isFinite(weight) || weight < 30 || weight > 350) {
      next.weight = 'Enter a weight from 30 to 350 kg.';
    }
    if (!Number.isFinite(targetWeight) || targetWeight < 30 || targetWeight > 350) {
      next.target = 'Enter a target from 30 to 350 kg.';
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };
  return (
    <OnboardingFrame
      navigation={navigation}
      progress={36}
      footer={
        <Button
          label="Continue"
          icon="arrow-right"
          onPress={() => {
            if (!validate()) return;
            patchOnboarding({ step: 4 });
            navigation.navigate('Activity');
          }}
        />
      }
    >
      <Text style={styles.onboardingTitle}>Your body</Text>
      <Text style={styles.subcopy}>
        Used for your daily nutrition target.
      </Text>
      <Text style={[type.label, { marginTop: spacing.xxl, marginBottom: spacing.xs }]}>
        BIOLOGICAL SEX
      </Text>
      <View style={styles.segmented}>
        {(['female', 'male'] as Sex[]).map((sex) => (
          <Pressable
            key={sex}
            onPress={() => patchOnboarding({ sex })}
            style={[
              styles.segment,
              state.onboarding.sex === sex && styles.segmentSelected,
            ]}
          >
            <Text
              style={[
                styles.segmentText,
                state.onboarding.sex === sex && styles.segmentTextSelected,
              ]}
            >
              {sex === 'female' ? 'Female' : 'Male'}
            </Text>
          </Pressable>
        ))}
      </View>
      <View style={styles.fieldGrid}>
        <Field
          label="Age"
          value={state.onboarding.age}
          onChangeText={(age) => {
            patchOnboarding({ age });
            setErrors((current) => ({ ...current, age: '' }));
          }}
          keyboardType="number-pad"
          suffix="years"
          error={errors.age}
          style={styles.halfField}
          placeholder="25"
        />
        <Field
          label="Height"
          value={state.onboarding.heightCm}
          onChangeText={(heightCm) => {
            patchOnboarding({ heightCm });
            setErrors((current) => ({ ...current, height: '' }));
          }}
          keyboardType="decimal-pad"
          suffix="cm"
          error={errors.height}
          style={styles.halfField}
          placeholder="170"
        />
        <Field
          label="Current weight"
          value={state.onboarding.currentWeightKg}
          onChangeText={(currentWeightKg) => {
            patchOnboarding({ currentWeightKg });
            setErrors((current) => ({ ...current, weight: '' }));
          }}
          keyboardType="decimal-pad"
          suffix="kg"
          error={errors.weight}
          style={styles.halfField}
          placeholder="65"
        />
        <Field
          label="Target weight"
          value={state.onboarding.targetWeightKg}
          onChangeText={(targetWeightKg) => {
            patchOnboarding({ targetWeightKg });
            setErrors((current) => ({ ...current, target: '' }));
          }}
          keyboardType="decimal-pad"
          suffix="kg"
          error={errors.target}
          style={styles.halfField}
          placeholder="60"
        />
      </View>
    </OnboardingFrame>
  );
}

export function ActivityScreen({ navigation }: Props<'Activity'>) {
  const { state, patchOnboarding } = useApp();
  const options: { id: Activity; title: string; detail: string }[] = [
    { id: 'sedentary', title: 'Sedentary', detail: 'Mostly sitting' },
    { id: 'light', title: 'Light', detail: '1–3 workouts / week' },
    { id: 'moderate', title: 'Moderate', detail: '3–5 workouts / week' },
    { id: 'veryActive', title: 'Very active', detail: '6–7 workouts / week' },
    { id: 'athlete', title: 'Athlete', detail: 'Daily hard training' },
  ];
  return (
    <OnboardingFrame
      navigation={navigation}
      progress={48}
      stepLabel="STEP 2 OF 5"
      footer={
        <Button
          label="Continue"
          icon="arrow-right"
          onPress={() => {
            const next = state.onboarding.goal === 'lose' ? 'Pace' : 'FoodPreference';
            patchOnboarding({ step: next === 'Pace' ? 5 : 6 });
            navigation.navigate(next);
          }}
        />
      }
    >
      <Text style={styles.onboardingTitle}>Activity level</Text>
      <Text style={styles.subcopy}>On a typical day.</Text>
      <View style={[styles.cardList, { marginTop: spacing.xxl }]}>
        {options.map((option) => (
          <Radio
            key={option.id}
            label={option.title}
            sublabel={option.detail}
            selected={state.onboarding.activity === option.id}
            onPress={() => patchOnboarding({ activity: option.id })}
          />
        ))}
      </View>
    </OnboardingFrame>
  );
}

export function PaceScreen({ navigation }: Props<'Pace'>) {
  const { state, patchOnboarding } = useApp();
  const options: { id: Pace; title: string; amount: string; detail: string; tag?: string }[] = [
    {
      id: 'conservative',
      title: 'Conservative',
      amount: '-0.25 kg / week',
      detail: 'Steady and sustainable.',
      tag: 'Recommended',
    },
    {
      id: 'moderate',
      title: 'Moderate',
      amount: '-0.5 kg / week',
      detail: 'Balanced and consistent.',
    },
    {
      id: 'aggressive',
      title: 'Aggressive',
      amount: '-1.0 kg / week',
      detail: 'Demanding and restrictive.',
      tag: 'Hard',
    },
  ];
  return (
    <OnboardingFrame
      navigation={navigation}
      progress={68}
      stepLabel="Step 4 of 6"
      right={
        <Pressable
          onPress={() => {
            patchOnboarding({ pace: null, step: 6 });
            navigation.navigate('FoodPreference');
          }}
        >
          <Text style={styles.skip}>Skip</Text>
        </Pressable>
      }
      footer={
        <Button
          label="Continue"
          onPress={() => {
            patchOnboarding({ step: 6 });
            navigation.navigate('FoodPreference');
          }}
        />
      }
    >
      <Text style={styles.centerTitle}>Preferred pace</Text>
      <Text style={[styles.subcopy, { textAlign: 'center' }]}>
        Choose a pace you can maintain.
      </Text>
      <View style={[styles.cardList, { marginTop: spacing.xl }]}>
        {options.map((option) => {
          const selected = state.onboarding.pace === option.id;
          return (
            <Pressable
              key={option.id}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              onPress={() => patchOnboarding({ pace: option.id })}
              style={[styles.paceCard, selected && styles.goalCardSelected]}
            >
              <View style={styles.paceCopy}>
                <View style={styles.paceTitleRow}>
                  <Text style={styles.paceTitle}>{option.title}</Text>
                  {option.tag ? (
                    <View
                      style={[
                        styles.paceTag,
                        option.id === 'aggressive' && { backgroundColor: colors.coralSoft },
                      ]}
                    >
                      <Text
                        style={[
                          styles.paceTagText,
                          option.id === 'aggressive' && { color: colors.error },
                        ]}
                      >
                        {option.tag}
                      </Text>
                    </View>
                  ) : null}
                </View>
                <Text style={styles.paceAmount}>{option.amount}</Text>
                <Text style={styles.optionDetail}>{option.detail}</Text>
              </View>
              <View style={[styles.radioOuter, selected && styles.radioOuterSelected]}>
                {selected ? <View style={styles.radioInner} /> : null}
              </View>
            </Pressable>
          );
        })}
      </View>
    </OnboardingFrame>
  );
}

export function FoodPreferenceScreen({ navigation }: Props<'FoodPreference'>) {
  const { state, patchOnboarding } = useApp();
  const options: {
    id: FoodPreference;
    title: string;
    detail: string;
    image: number;
  }[] = [
    {
      id: 'ethiopian',
      title: 'Ethiopian',
      detail: 'Traditional dishes like Injera, wot, and tibs.',
      image: images.preferenceEthiopian,
    },
    {
      id: 'mixed',
      title: 'Mixed',
      detail: 'A balance of traditional meals and modern preps.',
      image: images.preferenceMixed,
    },
    {
      id: 'international',
      title: 'International',
      detail: 'Global cuisine, pastas, salads, and proteins.',
      image: images.preferenceInternational,
    },
  ];
  return (
    <OnboardingFrame
      navigation={navigation}
      progress={72}
      stepLabel="1 OF 3"
      footer={
        <Button
          label="Continue"
          onPress={() => {
            patchOnboarding({ step: 7 });
            navigation.navigate('DailyTarget');
          }}
        />
      }
    >
      <Text style={styles.onboardingTitle}>What do you usually eat?</Text>
      <Text style={styles.subcopy}>
        This shapes your food suggestions.
      </Text>
      <View style={[styles.cardList, { marginTop: spacing.xl }]}>
        {options.map((option) => {
          const selected = state.onboarding.foodPreference === option.id;
          return (
            <Pressable
              key={option.id}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              onPress={() => patchOnboarding({ foodPreference: option.id })}
              style={[styles.preferenceCard, selected && styles.goalCardSelected]}
            >
              <Image source={option.image} style={styles.preferenceImage} />
              <View style={styles.preferenceCopy}>
                <Text style={styles.preferenceTitle}>{option.title}</Text>
                <Text style={styles.optionDetail}>{option.detail}</Text>
              </View>
              {selected ? <Icon name="check-circle" size={22} color={colors.primary} /> : null}
            </Pressable>
          );
        })}
      </View>
    </OnboardingFrame>
  );
}

export function DailyTargetScreen({ navigation }: Props<'DailyTarget'>) {
  const { state, completeOnboarding } = useApp();
  const target = useMemo(() => {
    try {
      return targetFromOnboarding(state.onboarding);
    } catch {
      return null;
    }
  }, [state.onboarding]);

  return (
    <NeoScreenWrapper tone="pink" contentStyle={styles.targetScreen}>
      <View style={styles.targetCard}>
        <Image source={images.dailyTarget} style={styles.targetImage} />
        <View style={styles.targetContent}>
          <Text style={styles.targetEyebrow}>YOUR DAILY TARGET</Text>
          {target ? (
            <>
              <View style={styles.targetNumberRow}>
                <Text style={styles.targetNumber}>{target.targetKcal.toLocaleString()}</Text>
                <Text style={styles.targetUnit}>kcal</Text>
              </View>
              <View style={styles.targetMacros}>
                <TargetMacro label="PROTEIN" value={`${target.proteinG}g`} color={colors.primaryContainer} />
                <TargetMacro label="CARBS" value={`${target.carbsG}g`} color={colors.amber} />
                <TargetMacro label="FAT" value={`${target.fatG}g`} color={colors.coral} />
              </View>
            </>
          ) : (
            <Text style={[type.body, { color: colors.error, marginVertical: spacing.xl }]}>
              We could not calculate a target from those details. Go back and check your body information.
            </Text>
          )}
        </View>
      </View>
      <View style={styles.targetFooter}>
        <Button
          label="START TRACKING"
          disabled={!target}
          onPress={() => {
            completeOnboarding();
            navigation.reset({ index: 0, routes: [{ name: 'MainTabs' }] });
          }}
        />
        <Text style={styles.targetFootnote}>Adjust anytime in Settings.</Text>
      </View>
    </NeoScreenWrapper>
  );
}

function TargetMacro({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <View style={styles.targetMacro}>
      <Text style={styles.targetMacroLabel}>{label}</Text>
      <Text style={styles.targetMacroValue}>{value}</Text>
      <View style={[styles.targetMacroBar, { backgroundColor: color }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  welcome: { flex: 1, backgroundColor: colors.lavenderBackdrop },
  welcomeImage: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: '42%',
    left: 0,
    width: '100%',
  },
  welcomeImageInner: { width: '100%', height: '100%' },
  welcomeWash: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: '42%',
    backgroundColor: colors.lavenderBackdrop,
    opacity: 0.32,
  },
  brandMark: {
    position: 'absolute',
    alignSelf: 'center',
    width: 70,
    height: 70,
    borderRadius: radii.pill,
    borderWidth: border.standard,
    borderColor: colors.ink,
    backgroundColor: colors.butterCard,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandLeaf: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: border.standard,
    borderColor: colors.ink,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  welcomeCopy: {
    marginTop: 'auto',
    backgroundColor: colors.pinkCanvas,
    borderTopLeftRadius: radii.lg,
    borderTopRightRadius: radii.lg,
    borderWidth: border.standard,
    borderColor: colors.ink,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xxl,
  },
  welcomeTitle: {
    ...type.headline,
    fontSize: 30,
    lineHeight: 38,
    textAlign: 'center',
  },
  welcomeBody: {
    ...type.body,
    color: colors.onSurfaceVariant,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  onboardingHeader: { paddingBottom: spacing.sm },
  stepProgress: { gap: spacing.xs },
  stepLabel: {
    ...type.caption,
    fontFamily: fonts.bold,
    letterSpacing: 0.8,
    textAlign: 'right',
    color: colors.onSurfaceVariant,
    marginTop: 4,
  },
  onboardingContent: {
    paddingTop: spacing.xl,
    paddingBottom: 120,
  },
  onboardingFooter: {
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
    backgroundColor: colors.lavenderBackdrop,
    borderTopWidth: border.standard,
    borderTopColor: colors.ink,
  },
  onboardingTitle: { ...type.headline },
  centerTitle: { ...type.headline, textAlign: 'center', marginTop: spacing.sm },
  subcopy: {
    ...type.body,
    color: colors.onSurfaceVariant,
    marginTop: spacing.xs,
    lineHeight: 25,
  },
  cardList: { gap: spacing.sm },
  goalCard: {
    minHeight: 82,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderRadius: radii.lg,
    borderWidth: border.standard,
    borderColor: colors.ink,
    backgroundColor: colors.white,
    paddingHorizontal: spacing.lg,
  },
  goalCardSelected: { backgroundColor: colors.activeLime },
  goalIcon: {
    width: 48,
    height: 48,
    borderRadius: radii.pill,
    borderWidth: border.standard,
    borderColor: colors.ink,
    backgroundColor: colors.butterCard,
    alignItems: 'center',
    justifyContent: 'center',
  },
  goalTitle: { fontFamily: fonts.semibold },
  segmented: {
    flexDirection: 'row',
    borderWidth: border.standard,
    borderColor: colors.ink,
    borderRadius: radii.pill,
    overflow: 'hidden',
    backgroundColor: colors.white,
  },
  segment: { flex: 1, minHeight: 48, alignItems: 'center', justifyContent: 'center' },
  segmentSelected: { backgroundColor: colors.activeLime },
  segmentText: { ...type.body, color: colors.onSurfaceVariant },
  segmentTextSelected: { color: colors.primary, fontFamily: fonts.semibold },
  fieldGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginTop: spacing.xl,
  },
  halfField: { width: '47%', flexGrow: 1 },
  skip: { ...type.body, color: colors.onSurface, fontFamily: fonts.semibold },
  paceCard: {
    minHeight: 130,
    borderWidth: border.standard,
    borderColor: colors.ink,
    borderRadius: radii.lg,
    backgroundColor: colors.white,
    padding: spacing.md,
    flexDirection: 'row',
    gap: spacing.sm,
  },
  paceCopy: { flex: 1, gap: 2 },
  paceTitleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  paceTitle: { ...type.body, fontFamily: fonts.semibold },
  paceTag: {
    backgroundColor: colors.primarySoft,
    borderRadius: radii.pill,
    borderWidth: border.standard,
    borderColor: colors.ink,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  paceTagText: { ...type.caption, color: colors.primary, fontFamily: fonts.semibold },
  paceAmount: {
    ...type.title,
    fontFamily: fonts.bold,
    marginTop: 2,
  },
  radioOuter: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.outline,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  radioOuterSelected: { borderColor: colors.primary },
  radioInner: { width: 12, height: 12, borderRadius: 6, backgroundColor: colors.primary },
  optionDetail: { ...type.bodySmall, color: colors.onSurfaceVariant },
  preferenceCard: {
    minHeight: 112,
    borderWidth: border.standard,
    borderColor: colors.ink,
    borderRadius: radii.lg,
    backgroundColor: colors.white,
    padding: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  preferenceImage: {
    width: 92,
    height: 92,
    borderRadius: radii.sm,
    borderWidth: border.standard,
    borderColor: colors.ink,
  },
  preferenceCopy: { flex: 1, gap: spacing.xs },
  preferenceTitle: { ...type.bodyLarge, fontFamily: fonts.semibold },
  targetScreen: { padding: spacing.lg, paddingBottom: spacing.xxl },
  targetCard: {
    flex: 1,
    borderRadius: radii.lg,
    borderWidth: border.standard,
    borderColor: colors.ink,
    overflow: 'hidden',
    backgroundColor: colors.white,
  },
  targetImage: {
    width: '100%',
    height: '48%',
    borderBottomWidth: border.standard,
    borderBottomColor: colors.ink,
  },
  targetContent: {
    flex: 1,
    padding: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  targetEyebrow: { ...type.label, color: colors.onSurfaceVariant },
  targetNumberRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, marginTop: 4 },
  targetNumber: { ...type.metric, fontSize: 42 },
  targetUnit: { ...type.body, color: colors.onSurfaceVariant, marginBottom: 6 },
  targetMacros: {
    flexDirection: 'row',
    gap: spacing.lg,
    marginTop: spacing.xl,
    width: '100%',
  },
  targetMacro: { flex: 1, gap: 4 },
  targetMacroLabel: { ...type.caption, fontFamily: fonts.bold },
  targetMacroValue: { ...type.bodyLarge, fontFamily: fonts.semibold },
  targetMacroBar: {
    height: 8,
    borderRadius: radii.pill,
    borderWidth: border.standard,
    borderColor: colors.ink,
    width: '72%',
    marginTop: 3,
  },
  targetFooter: { paddingTop: spacing.lg, gap: spacing.sm },
  targetFootnote: { ...type.bodySmall, textAlign: 'center', color: colors.onSurfaceVariant },
});
