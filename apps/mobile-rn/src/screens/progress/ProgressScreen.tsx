import React, { useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Svg, { Line, Polyline } from 'react-native-svg';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import type { MainTabParamList, RootStackParamList } from '../../navigation/types';
import { useApp, dayWater } from '../../state/AppProvider';
import { buildWeeklyInsights } from '../../domain/insights';
import { border, colors, fonts, radii, spacing, type } from '../../theme';
import {
  NeoFilterRow,
  NeoPillBarChart,
  NeoScreenWrapper,
  NeoSplitMetricRow,
  NeoTopBar,
} from '../../components/neo';
import { Button, Icon } from '../../components/ui';
import { weekdayShort } from '../../utils/date';

type TabNavigation = BottomTabNavigationProp<MainTabParamList>;
type RootNavigation = NativeStackNavigationProp<RootStackParamList>;

export function ProgressScreen() {
  const navigation = useNavigation<TabNavigation>();
  const root = navigation.getParent<RootNavigation>();
  const { state, addWeight, patchSettings, addWater } = useApp();
  const [range, setRange] = useState('This week');
  const [modalOpen, setModalOpen] = useState(false);
  const [input, setInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const weights = [...state.weights].sort((a, b) =>
    a.loggedAt.localeCompare(b.loggedAt),
  );
  const visibleWeights = weights.slice(range === 'This week' ? -7 : -30);
  const latest =
    weights.at(-1)?.weightKg ?? Number(state.onboarding.currentWeightKg);
  const starting = visibleWeights[0]?.weightKg ?? latest;
  const change = latest - starting;
  const targetWeight = Number(state.onboarding.targetWeightKg);
  const water = dayWater(state);
  const insights = useMemo(
    () =>
      state.target
        ? buildWeeklyInsights(
            state.meals,
            state.weights,
            state.target,
            state.catalog,
          )
        : null,
    [state.catalog, state.meals, state.target, state.weights],
  );
  const chartDays = (insights?.days ?? []).slice(-5);
  const chartTotal = chartDays.reduce(
    (sum, day) => sum + day.nutrition.kcal,
    0,
  );

  const chart = (() => {
    const values = visibleWeights.map((log) => log.weightKg);
    if (values.length < 2) return null;
    const width = 310;
    const height = 132;
    const padding = 14;
    const min = Math.min(...values) - 1;
    const max = Math.max(...values) + 1;
    const span = Math.max(1, max - min);
    const points = values
      .map((value, index) => {
        const x =
          padding + (index / (values.length - 1)) * (width - padding * 2);
        const y =
          height -
          padding -
          ((value - min) / span) * (height - padding * 2);
        return `${x},${y}`;
      })
      .join(' ');
    return { width, height, points };
  })();

  const saveWeight = () => {
    const parsed = Number(input);
    if (!Number.isFinite(parsed) || parsed < 30 || parsed > 350) {
      setError('Enter a weight between 30 and 350 kg.');
      return;
    }
    addWeight(parsed);
    setInput('');
    setError(null);
    setModalOpen(false);
  };

  return (
    <NeoScreenWrapper tone="lime" scroll contentStyle={styles.content}>
      <NeoTopBar
        title="Progress"
        leftColor={colors.coralButton}
        rightColor={colors.pinkAccent}
        onBack={() => navigation.navigate('Home')}
        onRight={() => root?.navigate('Settings')}
      />

      <Text style={styles.title}>Your progress.</Text>
      <Text style={styles.subcopy}>Focus on the trend, not one day.</Text>

      <NeoPillBarChart
        label="CALORIES / LAST 5 DAYS"
        total={`${Math.round(chartTotal).toLocaleString()} kcal`}
        data={
          chartDays.length > 0
            ? chartDays.map((day) => ({
                label: day.weekday.slice(0, 3),
                value: day.nutrition.kcal,
                displayValue: `${Math.round(day.nutrition.kcal)} kcal`,
              }))
            : ['M', 'T', 'W', 'T', 'F'].map((label) => ({
                label,
                value: 0,
                displayValue: 'No meals',
              }))
        }
      />

      <NeoSplitMetricRow
        left={{
          label: 'PROTEIN AVG',
          value: `${Math.round(insights?.average.proteinG ?? 0)}g`,
          trend: `${state.target?.proteinG ?? 0}g target`,
        }}
        right={{
          label: 'HYDRATION',
          value: `${(water / 1000).toFixed(1)}L`,
          trend: `of ${(state.settings.waterTargetMl / 1000).toFixed(1)}L`,
        }}
      />

      <View style={styles.weightCard}>
        <View style={styles.weightTop}>
          <View>
            <Text style={styles.cardLabel}>CURRENT WEIGHT</Text>
            <View style={styles.weightValueRow}>
              <Text style={styles.weightValue}>
                {latest ? latest.toFixed(1) : '—'}
              </Text>
              <Text style={styles.weightUnit}>kg</Text>
            </View>
          </View>
          <View style={styles.targetBadge}>
            <Text style={styles.targetLabel}>TARGET</Text>
            <Text style={styles.targetValue}>
              {Number.isFinite(targetWeight) ? targetWeight.toFixed(1) : '—'} kg
            </Text>
          </View>
        </View>
        <NeoFilterRow
          items={['This week', 'This month']}
          selected={range}
          onSelect={setRange}
        />
        {chart ? (
          <View style={styles.chart}>
            <Svg
              width="100%"
              height={chart.height}
              viewBox={`0 0 ${chart.width} ${chart.height}`}
            >
              {[36, 76, 116].map((y) => (
                <Line
                  key={y}
                  x1="14"
                  y1={y}
                  x2="296"
                  y2={y}
                  stroke={colors.chartBlue}
                  strokeWidth={border.thin}
                />
              ))}
              <Polyline
                points={chart.points}
                fill="none"
                stroke={colors.ink}
                strokeWidth={border.heavy}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
            <View style={styles.changeRow}>
              <Text style={styles.changeLabel}>
                {visibleWeights.length} weigh-ins
              </Text>
              <Text style={styles.changeValue}>
                {change === 0
                  ? 'No net change'
                  : `${change > 0 ? '+' : ''}${change.toFixed(1)} kg`}
              </Text>
            </View>
          </View>
        ) : (
          <View style={styles.chartEmpty}>
            <Icon name="chart-line" size={30} color={colors.ink} />
            <Text style={styles.chartEmptyText}>
              Log two weigh-ins to see a trend.
            </Text>
          </View>
        )}
        <Button
          label="LOG WEIGHT"
          variant="secondary"
          icon="scale-bathroom"
          onPress={() => setModalOpen(true)}
          style={styles.cardButton}
        />
      </View>

      <View style={styles.hydration}>
        <View style={styles.hydrationTop}>
          <View>
            <Text style={styles.cardLabel}>HYDRATION TODAY</Text>
            <Text style={styles.waterValue}>{(water / 1000).toFixed(2)} L</Text>
          </View>
          <Text style={styles.waterTarget}>
            of {(state.settings.waterTargetMl / 1000).toFixed(1)} L
          </Text>
        </View>
        <View style={styles.waterTrack}>
          <View
            style={[
              styles.waterFill,
              {
                width: `${Math.min(
                  100,
                  (water / state.settings.waterTargetMl) * 100,
                )}%`,
              },
            ]}
          />
        </View>
        <View style={styles.waterActions}>
          <Button
            label="+ 250 ML"
            onPress={() => addWater(250)}
            style={styles.waterButton}
          />
          <View style={styles.waterGoal}>
            <Text style={styles.waterGoalLabel}>GOAL</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Decrease water goal"
              onPress={() =>
                patchSettings({
                  waterTargetMl: Math.max(
                    1500,
                    state.settings.waterTargetMl - 250,
                  ),
                })
              }
              style={styles.goalStep}
            >
              <Icon name="minus" size={17} color={colors.ink} />
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Increase water goal"
              onPress={() =>
                patchSettings({
                  waterTargetMl: Math.min(
                    4000,
                    state.settings.waterTargetMl + 250,
                  ),
                })
              }
              style={styles.goalStep}
            >
              <Icon name="plus" size={17} color={colors.ink} />
            </Pressable>
          </View>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Weight history</Text>
      {weights.length === 0 ? (
        <View style={styles.emptyHistory}>
          <Icon name="scale-bathroom" size={30} color={colors.ink} />
          <Text style={styles.emptyTitle}>No weigh-ins yet</Text>
          <Text style={styles.emptyDetail}>A trend needs at least two readings.</Text>
        </View>
      ) : (
        <View style={styles.history}>
          {[...weights]
            .reverse()
            .slice(0, 8)
            .map((log, index) => (
              <View
                key={log.id}
                style={[styles.historyRow, index > 0 && styles.historyBorder]}
              >
                <View style={styles.historyDate}>
                  <Text style={styles.historyWeekday}>
                    {weekdayShort(log.dateKey)}
                  </Text>
                  <Text style={styles.historyDateText}>{log.dateKey.slice(5)}</Text>
                </View>
                <Text style={styles.historyKg}>{log.weightKg.toFixed(1)} kg</Text>
              </View>
            ))}
        </View>
      )}

      <Modal
        visible={modalOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setModalOpen(false)}
      >
        <KeyboardAvoidingView
          style={styles.modal}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <Pressable
            accessibilityLabel="Close weight entry"
            style={styles.modalScrim}
            onPress={() => setModalOpen(false)}
          />
          <View style={styles.modalContent}>
            <View style={styles.handle} />
            <Text style={styles.modalTitle}>Log today’s weight</Text>
            <Text style={styles.subcopy}>Use the same scale and time of day.</Text>
            <View style={styles.inputRow}>
              <TextInput
                value={input}
                onChangeText={(value) => {
                  setInput(value);
                  setError(null);
                }}
                keyboardType="decimal-pad"
                placeholder={latest ? latest.toFixed(1) : '65.0'}
                placeholderTextColor={colors.secondaryInk}
                style={styles.input}
                autoFocus
                selectionColor={colors.ink}
              />
              <Text style={styles.inputUnit}>kg</Text>
            </View>
            {error ? <Text style={styles.error}>{error}</Text> : null}
            <Button label="SAVE WEIGHT" onPress={saveWeight} />
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </NeoScreenWrapper>
  );
}

const styles = StyleSheet.create({
  content: { paddingTop: spacing.xs },
  title: { ...type.headline, marginTop: spacing.lg },
  subcopy: {
    ...type.body,
    color: colors.secondaryInk,
    marginTop: spacing.xs,
    marginBottom: spacing.lg,
  },
  cardLabel: { ...type.label, fontSize: 11 },
  weightCard: {
    marginTop: spacing.md,
    borderRadius: radii.lg,
    borderWidth: border.standard,
    borderColor: colors.ink,
    backgroundColor: colors.white,
    padding: spacing.sm,
  },
  weightTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: spacing.sm,
  },
  weightValueRow: { flexDirection: 'row', alignItems: 'flex-end' },
  weightValue: {
    ...type.metric,
    fontSize: 40,
    lineHeight: 44,
  },
  weightUnit: {
    ...type.body,
    color: colors.secondaryInk,
    marginLeft: spacing.xxs,
    marginBottom: 5,
  },
  targetBadge: {
    alignSelf: 'flex-start',
    borderRadius: radii.pill,
    borderWidth: border.standard,
    borderColor: colors.ink,
    backgroundColor: colors.splitPink,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  targetLabel: { ...type.caption, fontFamily: fonts.bold },
  targetValue: { ...type.body, fontFamily: fonts.bold, marginTop: 2 },
  chart: { marginTop: spacing.sm },
  chartEmpty: {
    minHeight: 150,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.mintCard,
    borderRadius: radii.md,
    borderWidth: border.standard,
    borderColor: colors.ink,
    marginTop: spacing.sm,
    padding: spacing.lg,
  },
  chartEmptyText: {
    ...type.body,
    color: colors.secondaryInk,
    textAlign: 'center',
  },
  changeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xs,
  },
  changeLabel: { ...type.caption },
  changeValue: { ...type.label },
  cardButton: { marginTop: spacing.md },
  hydration: {
    marginTop: spacing.md,
    borderRadius: radii.lg,
    borderWidth: border.standard,
    borderColor: colors.ink,
    backgroundColor: colors.splitPeach,
    padding: spacing.lg,
  },
  hydrationTop: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  waterValue: { ...type.metric, marginTop: spacing.xxs },
  waterTarget: { ...type.body, marginBottom: 4 },
  waterTrack: {
    height: 16,
    borderRadius: radii.pill,
    borderWidth: border.standard,
    borderColor: colors.ink,
    backgroundColor: colors.white,
    overflow: 'hidden',
    marginTop: spacing.md,
  },
  waterFill: { height: '100%', backgroundColor: colors.skyAccent },
  waterActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  waterButton: { flex: 1 },
  waterGoal: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  waterGoalLabel: { ...type.caption, fontFamily: fonts.bold },
  goalStep: {
    width: 44,
    height: 44,
    borderRadius: radii.pill,
    borderWidth: border.standard,
    borderColor: colors.ink,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    ...type.headline,
    marginTop: spacing.xl,
    marginBottom: spacing.sm,
  },
  history: {
    borderWidth: border.standard,
    borderColor: colors.ink,
    borderRadius: radii.lg,
    backgroundColor: colors.white,
    paddingHorizontal: spacing.md,
  },
  historyRow: {
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  historyBorder: {
    borderTopWidth: border.standard,
    borderTopColor: colors.ink,
  },
  historyDate: { flexDirection: 'row', alignItems: 'baseline', gap: spacing.xs },
  historyWeekday: { ...type.label },
  historyDateText: { ...type.body, color: colors.secondaryInk },
  historyKg: { ...type.cardTitle },
  emptyHistory: {
    alignItems: 'center',
    gap: spacing.xs,
    borderRadius: radii.lg,
    borderWidth: border.standard,
    borderColor: colors.ink,
    backgroundColor: colors.pinkCanvas,
    padding: spacing.xl,
  },
  emptyTitle: { ...type.cardTitle },
  emptyDetail: {
    ...type.body,
    color: colors.secondaryInk,
    textAlign: 'center',
  },
  modal: { flex: 1, justifyContent: 'flex-end' },
  modalScrim: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: colors.lavenderBackdrop,
    opacity: 0.9,
  },
  modalContent: {
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
  modalTitle: { ...type.headline },
  inputRow: {
    height: 68,
    borderRadius: radii.pill,
    borderWidth: border.standard,
    borderColor: colors.ink,
    backgroundColor: colors.white,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  input: {
    flex: 1,
    fontFamily: fonts.bold,
    fontSize: 26,
    color: colors.ink,
    outlineStyle: 'none' as never,
  },
  inputUnit: { ...type.body, color: colors.secondaryInk },
  error: { ...type.body, color: colors.error },
});
