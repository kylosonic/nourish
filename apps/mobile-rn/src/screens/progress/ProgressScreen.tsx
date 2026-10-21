import React, { useState } from 'react';
import {
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
import Svg, { Line, Polyline } from 'react-native-svg';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApp, dayWater } from '../../state/AppProvider';
import { colors, fonts, radii, spacing, type } from '../../theme';
import { Button, Card, Chip, EmptyState, Icon, ProgressBar } from '../../components/ui';
import { weekdayShort } from '../../utils/date';

export function ProgressScreen() {
  const { state, addWeight, patchSettings, addWater } = useApp();
  const [range, setRange] = useState<'week' | 'month'>('week');
  const [modalOpen, setModalOpen] = useState(false);
  const [input, setInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const weights = [...state.weights].sort((a, b) => a.loggedAt.localeCompare(b.loggedAt));
  const visibleWeights = weights.slice(range === 'week' ? -7 : -30);
  const latest = weights.at(-1)?.weightKg ?? Number(state.onboarding.currentWeightKg);
  const starting = visibleWeights[0]?.weightKg ?? latest;
  const change = latest - starting;
  const targetWeight = Number(state.onboarding.targetWeightKg);
  const water = dayWater(state);

  const chart = (() => {
    const values = visibleWeights.map((log) => log.weightKg);
    if (values.length < 2) return null;
    const width = 310;
    const height = 150;
    const padding = 16;
    const min = Math.min(...values) - 1;
    const max = Math.max(...values) + 1;
    const span = Math.max(1, max - min);
    const points = values
      .map((value, index) => {
        const x = padding + (index / (values.length - 1)) * (width - padding * 2);
        const y = height - padding - ((value - min) / span) * (height - padding * 2);
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
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <View style={styles.headerIcon}>
          <Icon name="chart-timeline-variant-shimmer" size={24} color={colors.primary} />
        </View>
        <Text style={styles.wordmark}>Progress</Text>
        <Pressable
          accessibilityLabel="Log weight"
          onPress={() => setModalOpen(true)}
          style={styles.addButton}
        >
          <Icon name="plus" size={22} color={colors.white} />
        </Pressable>
      </View>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <Text style={styles.title}>Your progress, without the noise.</Text>
        <Text style={styles.subcopy}>
          Daily weight can move for many reasons. Nourish shows the logged trend and avoids framing
          normal fluctuations as a judgment.
        </Text>

        <Card style={styles.weightCard}>
          <View style={styles.weightTop}>
            <View>
              <Text style={type.label}>CURRENT WEIGHT</Text>
              <View style={styles.weightValueRow}>
                <Text style={styles.weightValue}>{latest ? latest.toFixed(1) : '—'}</Text>
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
          <View style={styles.chipRow}>
            <Chip label="This week" selected={range === 'week'} onPress={() => setRange('week')} />
            <Chip label="This month" selected={range === 'month'} onPress={() => setRange('month')} />
          </View>
          {chart ? (
            <View style={styles.chart}>
              <Svg width={chart.width} height={chart.height}>
                {[40, 80, 120].map((y) => (
                  <Line key={y} x1="16" y1={y} x2="294" y2={y} stroke={colors.surfaceHigh} strokeWidth="1" />
                ))}
                <Polyline
                  points={chart.points}
                  fill="none"
                  stroke={colors.primary}
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
              <View style={styles.changeRow}>
                <Text style={styles.changeLabel}>{visibleWeights.length} weigh-ins</Text>
                <Text style={styles.changeValue}>
                  {change === 0 ? 'No net change' : `${change > 0 ? '+' : ''}${change.toFixed(1)} kg`}
                </Text>
              </View>
            </View>
          ) : (
            <View style={styles.chartEmpty}>
              <Icon name="chart-line" size={30} color={colors.outline} />
              <Text style={styles.chartEmptyText}>
                Log at least two weigh-ins to see a trend. Daily spikes are not used as a headline.
              </Text>
            </View>
          )}
          <Button
            label="LOG WEIGHT"
            variant="secondary"
            icon="scale-bathroom"
            onPress={() => setModalOpen(true)}
            style={{ marginTop: spacing.md }}
          />
        </Card>

        <Card style={styles.hydration}>
          <View style={styles.hydrationTop}>
            <View>
              <Text style={type.label}>HYDRATION TODAY</Text>
              <Text style={styles.waterValue}>{(water / 1000).toFixed(2)} L</Text>
            </View>
            <Text style={styles.waterTarget}>of {(state.settings.waterTargetMl / 1000).toFixed(1)} L</Text>
          </View>
          <ProgressBar value={(water / state.settings.waterTargetMl) * 100} height={9} />
          <View style={styles.waterActions}>
            <Button label="+ 250 ml" onPress={() => addWater(250)} style={{ flex: 1 }} />
            <View style={styles.waterGoal}>
              <Text style={styles.waterGoalLabel}>GOAL</Text>
              <Pressable
                onPress={() =>
                  patchSettings({
                    waterTargetMl: Math.max(1500, state.settings.waterTargetMl - 250),
                  })
                }
                style={styles.goalStep}
              >
                <Icon name="minus" size={17} color={colors.primary} />
              </Pressable>
              <Pressable
                onPress={() =>
                  patchSettings({
                    waterTargetMl: Math.min(4000, state.settings.waterTargetMl + 250),
                  })
                }
                style={styles.goalStep}
              >
                <Icon name="plus" size={17} color={colors.primary} />
              </Pressable>
            </View>
          </View>
        </Card>

        <Text style={styles.sectionTitle}>Weight history</Text>
        {weights.length === 0 ? (
          <EmptyState
            icon="scale-bathroom"
            title="No weigh-ins yet"
            detail="Add a reading whenever it feels useful. The app will not invent a trend from a single entry."
          />
        ) : (
          <Card style={styles.history}>
            {[...weights].reverse().slice(0, 8).map((log, index) => (
              <View key={log.id} style={[styles.historyRow, index > 0 && styles.historyBorder]}>
                <View style={styles.historyDate}>
                  <Text style={styles.historyWeekday}>{weekdayShort(log.dateKey)}</Text>
                  <Text style={styles.historyDateText}>{log.dateKey.slice(5)}</Text>
                </View>
                <Text style={styles.historyKg}>{log.weightKg.toFixed(1)} kg</Text>
              </View>
            ))}
          </Card>
        )}
      </ScrollView>

      <Modal visible={modalOpen} transparent animationType="slide" onRequestClose={() => setModalOpen(false)}>
        <KeyboardAvoidingView
          style={styles.modal}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <Pressable style={styles.modalScrim} onPress={() => setModalOpen(false)} />
          <View style={styles.modalContent}>
            <View style={styles.handle} />
            <Text style={styles.modalTitle}>Log today’s weight</Text>
            <Text style={styles.subcopy}>
              Use the same scale and time of day when possible. Normal day-to-day shifts are not a
              trend.
            </Text>
            <View style={styles.inputRow}>
              <TextInput
                value={input}
                onChangeText={(value) => {
                  setInput(value);
                  setError(null);
                }}
                keyboardType="decimal-pad"
                placeholder={latest ? latest.toFixed(1) : '65.0'}
                style={styles.input}
                autoFocus
                selectionColor={colors.primary}
              />
              <Text style={styles.inputUnit}>kg</Text>
            </View>
            {error ? <Text style={styles.error}>{error}</Text> : null}
            <Button label="SAVE WEIGHT" onPress={saveWeight} />
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.surface },
  header: { height: 68, paddingHorizontal: spacing.xl, flexDirection: 'row', alignItems: 'center' },
  headerIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  wordmark: { flex: 1, textAlign: 'center', fontFamily: fonts.bold, fontSize: 27, color: colors.primary },
  addButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: { padding: spacing.xl, paddingTop: spacing.lg, paddingBottom: spacing.xxl },
  title: { ...type.headline },
  subcopy: { ...type.body, color: colors.onSurfaceVariant, marginTop: spacing.xs },
  weightCard: { marginTop: spacing.xl, padding: spacing.lg },
  weightTop: { flexDirection: 'row', justifyContent: 'space-between' },
  weightValueRow: { flexDirection: 'row', alignItems: 'flex-end' },
  weightValue: { fontFamily: fonts.bold, fontSize: 46, letterSpacing: -1.5, color: colors.onSurface },
  weightUnit: { ...type.body, color: colors.onSurfaceVariant, marginLeft: 5, marginBottom: 7 },
  targetBadge: { alignSelf: 'flex-start', borderRadius: radii.md, backgroundColor: colors.primarySoft, padding: spacing.sm },
  targetLabel: { ...type.label, fontSize: 9, color: colors.primary },
  targetValue: { ...type.bodySmall, fontFamily: fonts.semibold, color: colors.primary, marginTop: 2 },
  chipRow: { flexDirection: 'row', gap: spacing.xs, marginTop: spacing.md },
  chart: { marginTop: spacing.md },
  chartEmpty: {
    minHeight: 150,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surfaceLow,
    borderRadius: radii.md,
    marginTop: spacing.md,
    padding: spacing.xl,
  },
  chartEmptyText: { ...type.bodySmall, color: colors.onSurfaceVariant, textAlign: 'center' },
  changeRow: { flexDirection: 'row', justifyContent: 'space-between' },
  changeLabel: { ...type.caption },
  changeValue: { ...type.label, color: colors.primary },
  hydration: { marginTop: spacing.md, padding: spacing.lg },
  hydrationTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  waterValue: { fontFamily: fonts.bold, fontSize: 34, marginTop: 2 },
  waterTarget: { ...type.bodySmall, color: colors.onSurfaceVariant, marginBottom: 6 },
  waterActions: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.md },
  waterGoal: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  waterGoalLabel: { ...type.label, fontSize: 9 },
  goalStep: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: { ...type.title, marginTop: spacing.xl, marginBottom: spacing.md },
  history: { paddingHorizontal: spacing.md },
  historyRow: { minHeight: 58, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  historyBorder: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.surfaceHigh },
  historyDate: { flexDirection: 'row', alignItems: 'baseline', gap: spacing.xs },
  historyWeekday: { ...type.label, color: colors.primary },
  historyDateText: { ...type.bodySmall, color: colors.onSurfaceVariant },
  historyKg: { ...type.body, fontFamily: fonts.semibold },
  modal: { flex: 1, justifyContent: 'flex-end' },
  modalScrim: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, backgroundColor: colors.scrim },
  modalContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radii.xxl,
    borderTopRightRadius: radii.xxl,
    padding: spacing.xl,
    gap: spacing.md,
  },
  handle: { width: 46, height: 4, borderRadius: 2, backgroundColor: colors.outlineVariant, alignSelf: 'center' },
  modalTitle: { ...type.title },
  inputRow: {
    height: 68,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    backgroundColor: colors.white,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
  },
  input: { flex: 1, fontFamily: fonts.semibold, fontSize: 26, outlineStyle: 'none' as never },
  inputUnit: { ...type.body, color: colors.onSurfaceVariant },
  error: { ...type.bodySmall, color: colors.error },
});
