import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';
import { colors, fonts, radii, spacing, type } from '../theme';
import { ProgressBar } from './ui';
import type { DailyTarget, Nutrition } from '../types';

export function CalorieRing({
  consumed,
  target,
}: {
  consumed: number;
  target: number;
}) {
  const size = 212;
  const stroke = 13;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const ratio = target > 0 ? Math.min(1, consumed / target) : 0;
  const over = consumed > target;
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={colors.surfaceHighest}
          strokeWidth={stroke}
          fill="none"
        />
        <G transform={`rotate(-90 ${size / 2} ${size / 2})`}>
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={over ? colors.coral : colors.primary}
            strokeWidth={stroke}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={`${circumference} ${circumference}`}
            strokeDashoffset={circumference * (1 - ratio)}
          />
        </G>
      </Svg>
      <Text style={styles.ringValue}>
        {Math.abs(target - consumed).toLocaleString()}
      </Text>
      <Text style={styles.ringLabel}>{over ? 'CALORIES OVER' : 'CALORIES LEFT'}</Text>
    </View>
  );
}

export function MacroPills({ consumed, target }: { consumed: Nutrition; target: DailyTarget }) {
  const macros = [
    {
      name: 'Protein',
      value: target.proteinG - consumed.proteinG,
      tone: colors.primarySoft,
      dot: colors.primary,
    },
    {
      name: 'Carbs',
      value: target.carbsG - consumed.carbsG,
      tone: colors.amberSoft,
      dot: colors.amber,
    },
    {
      name: 'Fat',
      value: target.fatG - consumed.fatG,
      tone: colors.coralSoft,
      dot: colors.coral,
    },
  ];
  return (
    <View style={styles.pills}>
      {macros.map((macro) => (
        <View key={macro.name} style={[styles.pill, { backgroundColor: macro.tone }]}>
          <View style={[styles.dot, { backgroundColor: macro.dot }]} />
          <Text style={styles.pillTitle}>{macro.name}</Text>
          <Text style={styles.pillValue}>{Math.max(0, Math.round(macro.value))}g left</Text>
        </View>
      ))}
    </View>
  );
}

export function MacroSummary({
  nutrition,
  target,
}: {
  nutrition: Nutrition;
  target: DailyTarget;
}) {
  const macros = [
    { label: 'PROTEIN', value: nutrition.proteinG, target: target.proteinG, color: colors.primaryContainer },
    { label: 'CARBS', value: nutrition.carbsG, target: target.carbsG, color: colors.amber },
    { label: 'FAT', value: nutrition.fatG, target: target.fatG, color: colors.coral },
  ];
  return (
    <View style={styles.macroGrid}>
      {macros.map((macro) => (
        <View key={macro.label} style={styles.macroItem}>
          <Text style={styles.macroLabel}>{macro.label}</Text>
          <Text style={styles.macroValue}>{Math.round(macro.value)}g</Text>
          <ProgressBar
            value={macro.target > 0 ? (macro.value / macro.target) * 100 : 0}
            color={macro.color}
            height={7}
          />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  ringValue: {
    ...type.metric,
    color: colors.primary,
  },
  ringLabel: {
    ...type.label,
    color: colors.primary,
    marginTop: 2,
  },
  pills: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.xs,
    marginTop: spacing.xl,
    flexWrap: 'wrap',
  },
  pill: {
    minWidth: 86,
    minHeight: 84,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xs,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    position: 'absolute',
    left: 15,
    top: 17,
  },
  pillTitle: {
    fontFamily: fonts.regular,
    fontSize: 15,
    color: colors.onSurface,
  },
  pillValue: {
    fontFamily: fonts.bold,
    fontSize: 13,
    color: colors.onSurface,
    marginTop: 2,
  },
  macroGrid: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  macroItem: { flex: 1, gap: 7 },
  macroLabel: {
    fontFamily: fonts.bold,
    fontSize: 10,
    letterSpacing: 0.8,
    color: colors.onSurface,
  },
  macroValue: {
    fontFamily: fonts.bold,
    fontSize: 25,
    color: colors.onSurface,
  },
});
