import React, { useMemo } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import type { MainTabParamList, RootStackParamList } from '../../navigation/types';
import { useApp } from '../../state/AppProvider';
import { buildWeeklyInsights } from '../../domain/insights';
import { colors, fonts, radii, spacing, type } from '../../theme';
import { Button, Card, EmptyState, Icon, ProgressBar } from '../../components/ui';

type TabNavigation = BottomTabNavigationProp<MainTabParamList>;
type RootNavigation = NativeStackNavigationProp<RootStackParamList>;

export function InsightsScreen() {
  const navigation = useNavigation<TabNavigation>();
  const root = navigation.getParent<RootNavigation>();
  const { state } = useApp();
  const target = state.target;
  const insights = useMemo(
    () =>
      target
        ? buildWeeklyInsights(state.meals, state.weights, target, state.catalog)
        : null,
    [state.catalog, state.meals, state.weights, target],
  );

  if (!target || !insights) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
        <View style={styles.center}>
          <EmptyState
            icon="target"
            title="Set your target first"
            detail="Complete onboarding so insights can compare your logged days with your personal target."
          />
        </View>
      </SafeAreaView>
    );
  }

  const maxValue = Math.max(
    target.targetKcal,
    ...insights.days.map((day) => day.nutrition.kcal),
    1,
  );
  const targetLineY = 170 - (target.targetKcal / maxValue) * 150;

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <Pressable
          onPress={() => navigation.navigate('Profile')}
          accessibilityLabel="Open profile"
          style={styles.avatar}
        >
          <Icon name="account" size={24} color={colors.primary} />
        </Pressable>
        <Text style={styles.wordmark}>Nourish</Text>
        <Icon name="bell-outline" size={23} color={colors.onSurfaceVariant} />
      </View>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <Text style={styles.title}>Weekly Insights</Text>
        <Text style={styles.subcopy}>
          Your nutrition from the last 7 days.
        </Text>

        {insights.isEmpty ? (
          <EmptyState
            icon="chart-bar"
            title="Your week starts with your first meal"
            detail="Insights only report data you have logged. There are no zero-filled days or generic claims here."
            action={
              <Button
                label="LOG A MEAL"
                onPress={() => root?.navigate('ScanMenu')}
                style={{ alignSelf: 'stretch', marginTop: spacing.md }}
              />
            }
          />
        ) : (
          <>
            <Card style={styles.chartCard}>
              <View style={styles.cardTitleRow}>
                <Text style={styles.cardTitle}>Caloric Balance</Text>
                <View style={styles.windowBadge}><Text style={styles.windowText}>LAST 7 DAYS</Text></View>
              </View>
              <View style={styles.chart}>
                {[0, 1, 2, 3].map((line) => (
                  <View key={line} style={[styles.gridLine, { bottom: 36 + line * 48 }]} />
                ))}
                <View style={[styles.targetLine, { bottom: 36 + targetLineY }]} />
                <View style={styles.bars}>
                  {insights.days.map((day) => {
                    const height = day.logged
                      ? Math.max(4, (day.nutrition.kcal / maxValue) * 154)
                      : 0;
                    return (
                      <View key={day.dateKey} style={styles.barColumn}>
                        <View style={styles.barSpace}>
                          {day.logged ? (
                            <View
                              style={[
                                styles.bar,
                                {
                                  height,
                                  backgroundColor: day.exceededTarget
                                    ? colors.coral
                                    : colors.primaryContainer,
                                },
                              ]}
                            />
                          ) : (
                            <View style={styles.unloggedMark} />
                          )}
                        </View>
                        <Text style={styles.weekday}>{day.weekday}</Text>
                      </View>
                    );
                  })}
                </View>
              </View>
              <View style={styles.chartFooter}>
                <Text style={styles.chartNote}>
                  {insights.loggedDays === 7
                    ? 'All 7 days have logged meals.'
                    : `${insights.loggedDays} of 7 days logged.`}
                </Text>
                <Text style={styles.targetNote}>{target.targetKcal.toLocaleString()} target</Text>
              </View>
            </Card>

            <Card style={styles.macroCard}>
              <Text style={styles.cardTitle}>Macro Averages</Text>
              <View style={styles.macroList}>
                <MacroAverage
                  label="PROTEIN"
                  average={insights.average.proteinG}
                  target={target.proteinG}
                  color={colors.primary}
                  track={colors.primaryContainer}
                />
                <MacroAverage
                  label="CARBS"
                  average={insights.average.carbsG}
                  target={target.carbsG}
                  color={colors.amber}
                  track={colors.amber}
                />
                <MacroAverage
                  label="FAT"
                  average={insights.average.fatG}
                  target={target.fatG}
                  color={colors.coral}
                  track={colors.coral}
                />
              </View>
            </Card>

            <Card style={styles.highlightCard}>
              <Text style={styles.cardTitle}>Highlights</Text>
              {insights.highlights.length === 0 ? (
                <Text style={styles.noHighlights}>
                  Log a little more to see patterns.
                </Text>
              ) : (
                <View style={{ gap: spacing.sm }}>
                  {insights.highlights.map((highlight) => (
                    <View
                      key={`${highlight.title}-${highlight.detail}`}
                      style={[
                        styles.highlight,
                        {
                          backgroundColor:
                            highlight.kind === 'positive'
                              ? colors.primarySoft
                              : highlight.kind === 'cautionary'
                                ? colors.amberSoft
                                : colors.surfaceLow,
                        },
                      ]}
                    >
                      <Icon
                        name={
                          highlight.kind === 'positive'
                            ? 'check-circle'
                            : highlight.kind === 'cautionary'
                              ? 'alert'
                              : 'information'
                        }
                        size={24}
                        color={
                          highlight.kind === 'positive'
                            ? colors.primary
                            : highlight.kind === 'cautionary'
                              ? colors.amber
                              : colors.onSurfaceVariant
                        }
                      />
                      <View style={{ flex: 1 }}>
                        <Text style={styles.highlightTitle}>{highlight.title}</Text>
                        <Text style={styles.highlightDetail}>{highlight.detail}</Text>
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </Card>

            <Card style={styles.diversityCard}>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>Dietary Diversity</Text>
                <Text style={styles.diversityCopy}>
                  {insights.ethiopianShare == null
                    ? 'There isn’t enough classified food data yet.'
                    : `${Math.round(insights.ethiopianShare * 100)}% Ethiopian foods.`}
                </Text>
              </View>
              <DiversityRing value={insights.ethiopianShare || 0} />
            </Card>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function MacroAverage({
  label,
  average,
  target,
  color,
  track,
}: {
  label: string;
  average: number;
  target: number;
  color: string;
  track: string;
}) {
  const percent = target > 0 ? Math.round((average / target) * 100) : 0;
  return (
    <View style={styles.macroItem}>
      <View style={styles.macroHeading}>
        <Text style={styles.macroLabel}>{label}</Text>
        <Text style={[styles.macroPercent, { color }]}>{percent}%</Text>
      </View>
      <ProgressBar value={percent} color={track} height={8} />
      <Text style={styles.macroText}>
        Avg. {Math.round(average)}g / {target}g
      </Text>
    </View>
  );
}

function DiversityRing({ value }: { value: number }) {
  const size = 78;
  const stroke = 10;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={colors.amber}
          strokeWidth={stroke}
          fill="none"
        />
        <G transform={`rotate(-90 ${size / 2} ${size / 2})`}>
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={colors.primary}
            strokeWidth={stroke}
            fill="none"
            strokeDasharray={`${circumference * value} ${circumference}`}
          />
        </G>
      </Svg>
      <Text style={styles.ringPercent}>{Math.round(value * 100)}%</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.surface },
  header: {
    height: 66,
    paddingHorizontal: spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
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
  content: { padding: spacing.xl, paddingBottom: spacing.xxl },
  title: { ...type.headline },
  subcopy: { ...type.body, color: colors.onSurfaceVariant, marginTop: spacing.xs, marginBottom: spacing.xl },
  chartCard: { padding: spacing.lg },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardTitle: { ...type.title, fontSize: 21 },
  windowBadge: { backgroundColor: colors.surfaceLow, borderRadius: radii.pill, paddingHorizontal: spacing.sm, paddingVertical: 4 },
  windowText: { ...type.label, fontSize: 9 },
  chart: { height: 220, marginTop: spacing.lg, position: 'relative' },
  gridLine: { position: 'absolute', left: 0, right: 0, height: 1, backgroundColor: colors.surfaceHigh },
  targetLine: { position: 'absolute', left: 0, right: 0, borderTopWidth: 1, borderStyle: 'dashed', borderColor: colors.outline },
  bars: {
    position: 'absolute',
    left: 2,
    right: 2,
    bottom: 0,
    height: 196,
    flexDirection: 'row',
    gap: 5,
  },
  barColumn: { flex: 1, alignItems: 'center', justifyContent: 'flex-end' },
  barSpace: { height: 168, width: '100%', alignItems: 'center', justifyContent: 'flex-end' },
  bar: { width: '76%', borderTopLeftRadius: 5, borderTopRightRadius: 5 },
  unloggedMark: {
    width: '60%',
    height: 2,
    backgroundColor: colors.surfaceHighest,
    marginBottom: 4,
  },
  weekday: { ...type.caption, fontFamily: fonts.bold, fontSize: 9, marginTop: spacing.xs },
  chartFooter: { flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.sm },
  chartNote: { ...type.caption },
  targetNote: { ...type.caption, color: colors.primary },
  macroCard: { marginTop: spacing.md, padding: spacing.lg },
  macroList: { gap: spacing.lg, marginTop: spacing.lg },
  macroItem: { gap: 5 },
  macroHeading: { flexDirection: 'row', justifyContent: 'space-between' },
  macroLabel: { ...type.label, fontSize: 10 },
  macroPercent: { ...type.label, fontSize: 10 },
  macroText: { ...type.caption },
  highlightCard: { marginTop: spacing.md, padding: spacing.lg },
  noHighlights: { ...type.bodySmall, color: colors.onSurfaceVariant, marginTop: spacing.md },
  highlight: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm, borderRadius: radii.md, padding: spacing.md },
  highlightTitle: { ...type.body, fontFamily: fonts.semibold },
  highlightDetail: { ...type.bodySmall, color: colors.onSurfaceVariant, marginTop: 2 },
  diversityCard: { marginTop: spacing.md, padding: spacing.lg, flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  diversityCopy: { ...type.bodySmall, color: colors.onSurfaceVariant, marginTop: spacing.xs },
  ringPercent: {
    ...type.label,
    position: 'absolute',
    alignSelf: 'center',
    top: 31,
    color: colors.primary,
    fontSize: 10,
  },
  center: { flex: 1, justifyContent: 'center', padding: spacing.xl },
});
