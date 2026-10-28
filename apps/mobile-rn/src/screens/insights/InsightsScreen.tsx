import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import type { MainTabParamList, RootStackParamList } from '../../navigation/types';
import { useApp } from '../../state/AppProvider';
import { buildWeeklyInsights } from '../../domain/insights';
import { border, colors, fonts, radii, spacing, type } from '../../theme';
import {
  NeoPillBarChart,
  NeoScreenWrapper,
  NeoSplitMetricRow,
  NeoTopBar,
} from '../../components/neo';
import { Button, Icon } from '../../components/ui';

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
        ? buildWeeklyInsights(
            state.meals,
            state.weights,
            target,
            state.catalog,
          )
        : null,
    [state.catalog, state.meals, state.weights, target],
  );

  if (!target || !insights) {
    return (
      <NeoScreenWrapper tone="lime" contentStyle={styles.centerContent}>
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>Set your target first</Text>
          <Text style={styles.emptyCopy}>
            Insights compare your logged days with your target.
          </Text>
        </View>
      </NeoScreenWrapper>
    );
  }

  const chartDays = insights.days.slice(-5);
  const chartTotal = chartDays.reduce(
    (sum, day) => sum + day.nutrition.kcal,
    0,
  );

  return (
    <NeoScreenWrapper tone="lime" scroll contentStyle={styles.content}>
      <NeoTopBar
        title="Insights"
        leftColor={colors.coralButton}
        rightColor={colors.blueAccent}
        onBack={() => navigation.navigate('Home')}
        rightIcon="account-outline"
        onRight={() => navigation.navigate('Profile')}
      />
      <Text style={styles.title}>Patterns,{'\n'}not noise.</Text>
      <Text style={styles.subcopy}>Only your logged days are counted.</Text>

      {insights.isEmpty ? (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>Your week starts here</Text>
          <Text style={styles.emptyCopy}>
            Log a meal to build your first weekly view.
          </Text>
          <Button
            label="LOG A MEAL"
            onPress={() => root?.navigate('ScanMenu')}
            style={styles.emptyAction}
          />
        </View>
      ) : (
        <>
          <NeoPillBarChart
            label="CALORIE BALANCE"
            total={`${Math.round(chartTotal).toLocaleString()} kcal`}
            data={chartDays.map((day) => ({
              label: day.weekday.slice(0, 3),
              value: day.nutrition.kcal,
              displayValue: `${Math.round(day.nutrition.kcal)} kcal`,
            }))}
          />

          <NeoSplitMetricRow
            left={{
              label: 'PROTEIN AVG',
              value: `${Math.round(insights.average.proteinG)}g`,
              trend: `${Math.round(
                (insights.average.proteinG / Math.max(1, target.proteinG)) * 100,
              )}% of goal`,
            }}
            right={{
              label: 'CARBS AVG',
              value: `${Math.round(insights.average.carbsG)}g`,
              trend: `${Math.round(
                (insights.average.carbsG / Math.max(1, target.carbsG)) * 100,
              )}% of goal`,
            }}
          />

          <View style={styles.summaryCard}>
            <Text style={styles.cardTitle}>Week at a glance</Text>
            <View style={styles.summaryRow}>
              <SummaryItem
                label="DAYS LOGGED"
                value={`${insights.loggedDays}/7`}
              />
              <View style={styles.divider} />
              <SummaryItem
                label="FAT AVG"
                value={`${Math.round(insights.average.fatG)}g`}
              />
              <View style={styles.divider} />
              <SummaryItem
                label="ETHIOPIAN"
                value={
                  insights.ethiopianShare == null
                    ? '—'
                    : `${Math.round(insights.ethiopianShare * 100)}%`
                }
              />
            </View>
          </View>

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Highlights</Text>
            <Text style={styles.sectionNote}>FROM YOUR LOG</Text>
          </View>
          {insights.highlights.length === 0 ? (
            <View style={styles.highlightEmpty}>
              <Icon name="chart-box-outline" size={28} color={colors.ink} />
              <Text style={styles.emptyCopy}>
                Log a few more days to see patterns.
              </Text>
            </View>
          ) : (
            <View style={styles.highlightList}>
              {insights.highlights.map((highlight, index) => (
                <View
                  key={`${highlight.title}-${highlight.detail}`}
                  style={[
                    styles.highlight,
                    {
                      backgroundColor:
                        index % 3 === 0
                          ? colors.butterCard
                          : index % 3 === 1
                            ? colors.mintCard
                            : colors.coralCard,
                    },
                  ]}
                >
                  <Icon
                    name={
                      highlight.kind === 'positive'
                        ? 'check-circle-outline'
                        : highlight.kind === 'cautionary'
                          ? 'alert-circle-outline'
                          : 'information-outline'
                    }
                    size={24}
                    color={colors.ink}
                  />
                  <View style={styles.highlightCopy}>
                    <Text style={styles.highlightTitle}>{highlight.title}</Text>
                    <Text style={styles.highlightDetail}>{highlight.detail}</Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </>
      )}
    </NeoScreenWrapper>
  );
}

function SummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.summaryItem}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={styles.summaryValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { paddingTop: spacing.xs },
  centerContent: { justifyContent: 'center' },
  title: {
    ...type.display,
    marginTop: spacing.lg,
    textTransform: 'uppercase',
  },
  subcopy: {
    ...type.body,
    color: colors.secondaryInk,
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
  },
  empty: {
    minHeight: 230,
    borderRadius: radii.lg,
    borderWidth: border.standard,
    borderColor: colors.ink,
    backgroundColor: colors.pinkCanvas,
    padding: spacing.xl,
    justifyContent: 'center',
    marginTop: spacing.lg,
  },
  emptyTitle: { ...type.headline },
  emptyCopy: {
    ...type.body,
    color: colors.secondaryInk,
    marginTop: spacing.xs,
  },
  emptyAction: { marginTop: spacing.lg },
  summaryCard: {
    marginTop: spacing.md,
    borderRadius: radii.lg,
    borderWidth: border.standard,
    borderColor: colors.ink,
    backgroundColor: colors.white,
    padding: spacing.lg,
  },
  cardTitle: { ...type.cardTitle },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    marginTop: spacing.lg,
  },
  summaryItem: { flex: 1, minWidth: 0 },
  summaryLabel: { ...type.caption, fontFamily: fonts.bold },
  summaryValue: { ...type.metricSmall, marginTop: spacing.xs },
  divider: {
    width: border.standard,
    backgroundColor: colors.ink,
    marginHorizontal: spacing.sm,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginTop: spacing.xl,
    marginBottom: spacing.sm,
  },
  sectionTitle: { ...type.headline },
  sectionNote: { ...type.caption, fontFamily: fonts.bold },
  highlightList: { gap: spacing.sm },
  highlight: {
    minHeight: 90,
    borderRadius: radii.md,
    borderWidth: border.standard,
    borderColor: colors.ink,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  highlightCopy: { flex: 1 },
  highlightTitle: { ...type.bodyLarge, fontFamily: fonts.bold },
  highlightDetail: {
    ...type.body,
    color: colors.secondaryInk,
    marginTop: spacing.xxs,
  },
  highlightEmpty: {
    minHeight: 132,
    borderRadius: radii.md,
    borderWidth: border.standard,
    borderColor: colors.ink,
    backgroundColor: colors.white,
    padding: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
