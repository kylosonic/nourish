import React, { useMemo, useState } from 'react';
import { Pressable, Share, StyleSheet, Text, View } from 'react-native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { useApp } from '../../state/AppProvider';
import type { RootStackParamList } from '../../navigation/types';
import { NeoScreenWrapper, NeoTopBar } from '../../components/neo';
import { Banner, Button, Card, Icon, ProgressBar } from '../../components/ui';
import { border, colors, fonts, radii, spacing, type } from '../../theme';
import { dateFromKey, localDateKey } from '../../utils/date';
import {
  buildCareCardMessage,
  buildCycleCalendar,
  checkInStreak,
  getCycleSnapshot,
  partnerCycleWellness,
  phaseLabel,
  sharedCheckInDates,
  sharedFoodDates,
  streakFromDates,
} from '../../domain/couples';
import { showAlert } from '../../utils/dialog';

type Navigation = NativeStackNavigationProp<RootStackParamList>;
const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

function prettyDate(dateKey: string): string {
  return new Intl.DateTimeFormat('en', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  }).format(dateFromKey(dateKey));
}

export function CoupleWellnessScreen() {
  const navigation = useNavigation<Navigation>();
  const { state, enableCycleTracking, checkInToday } = useApp();
  const wellness = state.coupleWellness;
  const today = localDateKey();
  const [visibleMonth, setVisibleMonth] = useState(
    () => new Date(new Date().getFullYear(), new Date().getMonth(), 1, 12),
  );
  const snapshot = useMemo(
    () => getCycleSnapshot(wellness, today),
    [today, wellness],
  );
  const calendar = useMemo(
    () => buildCycleCalendar(visibleMonth, wellness, today),
    [today, visibleMonth, wellness],
  );
  const care = checkInStreak(wellness.checkIns, today);
  const nourish = streakFromDates(
    state.meals.map((meal) => meal.dateKey),
    today,
  );
  const partnerCheckIns = wellness.connection?.partnerView.checkInDateKeys ?? [];
  const shared = streakFromDates(
    sharedCheckInDates(wellness, partnerCheckIns),
    today,
  );
  const sharedFood = streakFromDates(
    wellness.connection?.mySharing.shareFoodStreak &&
      wellness.connection.partnerSharing.shareFoodStreak
      ? sharedFoodDates(
          state.meals.map((meal) => meal.dateKey),
          wellness.connection.partnerView.foodLogDateKeys,
        )
      : [],
    today,
  );
  const partnerCycle = partnerCycleWellness(
    wellness.connection?.partnerView ?? null,
  );
  const partnerSnapshot = partnerCycle
    ? getCycleSnapshot(partnerCycle, today)
    : null;
  const checkedIn = wellness.checkIns.some((entry) => entry.dateKey === today);
  const monthTitle = new Intl.DateTimeFormat('en', {
    month: 'long',
    year: 'numeric',
  }).format(visibleMonth);

  const shareCareCard = async () => {
    try {
      await Share.share({
        title: 'Nourish care card',
        message: buildCareCardMessage(
          wellness,
          state.meals.map((meal) => meal.dateKey),
          today,
        ),
      });
    } catch {
      showAlert('Could not share', 'The care card could not be opened.');
    }
  };

  if (!wellness.trackingEnabled) {
    return (
      <NeoScreenWrapper tone="pink" scroll contentStyle={styles.content}>
        <NeoTopBar title="Couple wellness" onBack={() => navigation.goBack()} />
        <Card style={styles.introCard}>
          <View style={styles.introIcon}>
            <Icon name="heart-pulse" size={34} color={colors.ink} />
          </View>
          <Text style={styles.heroTitle}>Your cycle, your choice.</Text>
          <Text style={styles.bodyCopy}>
            Track period starts and ends, see on-device estimates, and build
            gentle daily streaks together. Nothing is shared with a partner
            until you turn on a specific sharing control.
          </Text>
          <View style={styles.privateRow}>
            <Icon name="shield-lock-outline" size={20} color={colors.ink} />
            <Text style={styles.privateText}>
              Cycle notes and symptoms stay private from your partner.
            </Text>
          </View>
          <View style={styles.privateRow}>
            <Icon name="calculator-variant-outline" size={20} color={colors.ink} />
            <Text style={styles.privateText}>
              Dates use transparent arithmetic, never AI or medical diagnosis.
            </Text>
          </View>
          <Button
            label="TURN ON PRIVATE TRACKING"
            onPress={() => enableCycleTracking(true)}
          />
        </Card>
        <Text style={styles.disclaimer}>
          Cycle estimates can be wrong, especially with irregular cycles. Use
          them for planning only and speak with a clinician about health concerns.
        </Text>
      </NeoScreenWrapper>
    );
  }

  return (
    <NeoScreenWrapper tone="pink" scroll contentStyle={styles.content}>
      <NeoTopBar
        title="Cycle & couple"
        onBack={() => navigation.goBack()}
        onRight={() => navigation.navigate('CoupleConnection')}
        rightIcon="account-heart-outline"
        rightLabel="Partner and sharing settings"
      />

      <Card style={styles.heroCard}>
        <View style={styles.heroTop}>
          <View style={{ flex: 1 }}>
            <Text style={styles.eyebrow}>
              {snapshot.cycleDay ? `CYCLE DAY ${snapshot.cycleDay}` : 'GET STARTED'}
            </Text>
            <Text style={styles.heroTitle}>
              {snapshot.expectedPeriodStart
                ? snapshot.periodActive
                  ? 'Period window'
                  : snapshot.daysUntilPeriod === 0
                    ? 'Expected today'
                    : snapshot.daysUntilPeriod != null &&
                        snapshot.daysUntilPeriod > 0
                      ? `${snapshot.daysUntilPeriod} days to go`
                      : snapshot.daysUntilPeriod != null &&
                          snapshot.daysUntilPeriod < 0
                        ? `${Math.abs(snapshot.daysUntilPeriod)} days past expected`
                        : phaseLabel(snapshot.phase)
                : 'Log your first period'}
            </Text>
            <Text style={styles.heroCopy}>
              {snapshot.expectedPeriodStart
                ? `Next period estimate: ${prettyDate(snapshot.expectedPeriodStart)}`
                : 'Add the first day of your latest period to create a calendar estimate.'}
            </Text>
          </View>
          <View style={styles.heroIcon}>
            <Icon name="calendar-heart" size={31} color={colors.ink} />
          </View>
        </View>
        {snapshot.fertileStart && snapshot.fertileEnd ? (
          <View style={styles.fertileBand}>
            <Text style={styles.fertileLabel}>LIKELY FERTILE WINDOW · ESTIMATE</Text>
            <Text style={styles.fertileValue}>
              {prettyDate(snapshot.fertileStart)} – {prettyDate(snapshot.fertileEnd)}
            </Text>
          </View>
        ) : null}
      </Card>

      {snapshot.irregular ? (
        <Banner
          tone="warning"
          icon="chart-timeline-variant-shimmer"
          title="Your recent cycles vary"
          message="Predictions may be less reliable. Nourish does not use this variation to diagnose a health condition."
        />
      ) : null}

      <View style={styles.actionRow}>
        <Button
          label="LOG PERIOD"
          icon="water-outline"
          onPress={() => navigation.navigate('CycleLog')}
          style={{ flex: 1 }}
        />
        <Button
          label={checkedIn ? 'CHECKED IN' : 'CHECK IN'}
          variant="secondary"
          icon={checkedIn ? 'check' : 'hand-heart-outline'}
          disabled={checkedIn}
          onPress={() => checkInToday(today)}
          style={{ flex: 1 }}
        />
      </View>

      <Card style={styles.calendarCard} padded={false}>
        <View style={styles.calendarTop}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Previous month"
            onPress={() =>
              setVisibleMonth(
                (month) =>
                  new Date(month.getFullYear(), month.getMonth() - 1, 1, 12),
              )
            }
            style={styles.monthButton}
          >
            <Icon name="chevron-left" size={24} color={colors.ink} />
          </Pressable>
          <Text style={styles.monthTitle}>{monthTitle}</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Next month"
            onPress={() =>
              setVisibleMonth(
                (month) =>
                  new Date(month.getFullYear(), month.getMonth() + 1, 1, 12),
              )
            }
            style={styles.monthButton}
          >
            <Icon name="chevron-right" size={24} color={colors.ink} />
          </Pressable>
        </View>
        <View style={styles.weekRow}>
          {WEEKDAYS.map((day, index) => (
            <Text key={`${day}-${index}`} style={styles.weekday}>
              {day}
            </Text>
          ))}
        </View>
        <View style={styles.grid}>
          {calendar.map((day) => (
            <View key={day.dateKey} style={styles.dayCell}>
              <View
                style={[
                  styles.dayCircle,
                  !day.inMonth && styles.dayOutOfMonth,
                  day.isToday && styles.today,
                  day.status === 'recordedPeriod' && styles.recordedDay,
                  day.status === 'predictedPeriod' && styles.predictedDay,
                  (day.status === 'fertile' || day.status === 'ovulation') &&
                    styles.fertileDay,
                ]}
              >
                <Text style={styles.dayText}>{day.day}</Text>
              </View>
            </View>
          ))}
        </View>
        <View style={styles.legend}>
          <Legend color={colors.coralCard} label="Recorded" />
          <Legend color={colors.pinkCanvas} label="Predicted" />
          <Legend color={colors.activeLime} label="Fertile estimate" />
        </View>
      </Card>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Streaks</Text>
        <Text style={styles.sectionHint}>Consistency, not perfection</Text>
      </View>
      <View style={styles.streakRow}>
        <StreakCard
          color={colors.mintCard}
          icon="food-apple-outline"
          value={nourish.current}
          label="Food logging"
          detail={`Best ${nourish.best}`}
        />
        <StreakCard
          color={colors.butterCard}
          icon="hand-heart-outline"
          value={care.current}
          label="Care check-ins"
          detail={`Best ${care.best}`}
        />
      </View>
      {wellness.connection ? (
        <Card style={styles.sharedStreakCard}>
          <View style={styles.partnerIcon}>
            <Icon name="account-multiple-check" size={25} color={colors.ink} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.partnerTitle}>Couple streak</Text>
            <Text style={styles.partnerCopy}>
              {shared.current > 0
                ? `${shared.current} shared check-in day${shared.current === 1 ? '' : 's'} in a row.`
                : 'Both partners need check-in sharing enabled to start this streak.'}
              {sharedFood.current > 0
                ? ` Food streak: ${sharedFood.current} shared day${sharedFood.current === 1 ? '' : 's'}.`
                : ''}
            </Text>
          </View>
          <Text style={styles.sharedStreakValue}>{shared.current}</Text>
        </Card>
      ) : null}

      <Card style={styles.partnerCard}>
        <View style={styles.partnerTop}>
          <View style={styles.partnerIcon}>
            <Icon name="account-heart" size={25} color={colors.ink} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.partnerTitle}>
              {wellness.connection
                ? `Connected with ${wellness.connection.partnerName}`
                : 'Invite your partner'}
            </Text>
            <Text style={styles.partnerCopy}>
              {wellness.connection
                ? shared.current > 0
                  ? `${shared.current}-day shared check-in streak.`
                  : 'Enable matching sharing controls to build a shared streak.'
                : 'Pair with a private, single-use code that expires in 24 hours.'}
            </Text>
          </View>
        </View>
        <View style={styles.partnerActions}>
          <Button
            label={wellness.connection ? 'MANAGE SHARING' : 'CONNECT PARTNER'}
            variant="secondary"
            onPress={() => navigation.navigate('CoupleConnection')}
            style={{ flex: 1 }}
          />
          {wellness.connection ? (
            <Button
              label="SHARE CARD"
              icon="share-variant-outline"
              onPress={() => void shareCareCard()}
              style={{ flex: 1 }}
            />
          ) : null}
        </View>
      </Card>

      {partnerSnapshot && wellness.connection?.partnerSharing.shareCycle ? (
        <Card style={styles.partnerCycleCard}>
          <View style={styles.partnerTop}>
            <View style={styles.partnerIcon}>
              <Icon name="calendar-heart" size={25} color={colors.ink} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.sectionHint}>SHARED BY YOUR PARTNER</Text>
              <Text style={styles.partnerTitle}>
                {wellness.connection.partnerName}’s cycle estimate
              </Text>
              <Text style={styles.partnerCopy}>
                {partnerSnapshot.periodActive
                  ? 'Estimated period window right now.'
                  : partnerSnapshot.expectedPeriodStart
                    ? `Next period estimate: ${prettyDate(partnerSnapshot.expectedPeriodStart)}`
                    : 'No period dates have been shared yet.'}
                {partnerSnapshot.fertileStart && partnerSnapshot.fertileEnd
                  ? ` Likely fertile window: ${prettyDate(partnerSnapshot.fertileStart)} – ${prettyDate(partnerSnapshot.fertileEnd)}.`
                  : ''}
              </Text>
            </View>
          </View>
          <Text style={styles.partnerPrivacy}>
            This view contains no symptoms, period end dates, or private notes.
          </Text>
        </Card>
      ) : null}

      <Card style={styles.settingsLink} padded={false}>
        <Pressable
          accessibilityRole="button"
          onPress={() => navigation.navigate('CoupleConnection')}
          style={styles.settingsRow}
        >
          <Icon name="tune-variant" size={21} color={colors.ink} />
          <View style={{ flex: 1 }}>
            <Text style={styles.rowTitle}>Cycle settings</Text>
            <Text style={styles.rowDetail}>
              {wellness.cycleLengthDays}-day cycle · {wellness.periodLengthDays}-day period
            </Text>
          </View>
          <Icon name="chevron-right" size={22} color={colors.ink} />
        </Pressable>
      </Card>

      <Text style={styles.disclaimer}>
        Estimates are generated on this device from the dates you record. They
        are not contraception, a fertility test, or medical advice.
      </Text>
    </NeoScreenWrapper>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.legendDot, { backgroundColor: color }]} />
      <Text style={styles.legendText}>{label}</Text>
    </View>
  );
}

function StreakCard({
  color,
  icon,
  value,
  label,
  detail,
}: {
  color: string;
  icon: React.ComponentProps<typeof Icon>['name'];
  value: number;
  label: string;
  detail: string;
}) {
  return (
    <View style={[styles.streakCard, { backgroundColor: color }]}>
      <View style={styles.streakIcon}>
        <Icon name={icon} size={23} color={colors.ink} />
      </View>
      <Text style={styles.streakValue}>{value}</Text>
      <Text style={styles.streakLabel}>{label}</Text>
      <Text style={styles.streakDetail}>{detail} days</Text>
      <ProgressBar value={Math.min(100, value * 10)} height={7} />
    </View>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: spacing.md, paddingBottom: spacing.section },
  introCard: {
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.white,
    padding: spacing.xl,
    marginTop: spacing.lg,
  },
  introIcon: {
    width: 76,
    height: 76,
    borderRadius: radii.pill,
    borderWidth: border.standard,
    borderColor: colors.ink,
    backgroundColor: colors.mintCard,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroCard: {
    backgroundColor: colors.coralCard,
    padding: spacing.lg,
    gap: spacing.md,
  },
  heroTop: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  heroIcon: {
    width: 58,
    height: 58,
    borderRadius: radii.pill,
    borderWidth: border.standard,
    borderColor: colors.ink,
    backgroundColor: colors.butterCard,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eyebrow: { ...type.caption, fontFamily: fonts.bold, letterSpacing: 1.1 },
  heroTitle: { ...type.headline, marginTop: spacing.xs },
  heroCopy: { ...type.body, marginTop: spacing.xs, color: colors.secondaryInk },
  bodyCopy: { ...type.bodyLarge, textAlign: 'center', color: colors.secondaryInk },
  privateRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.sm,
    borderRadius: radii.md,
    backgroundColor: colors.surfaceLow,
  },
  privateText: { ...type.bodySmall, flex: 1 },
  fertileBand: {
    borderRadius: radii.md,
    borderWidth: border.standard,
    borderColor: colors.ink,
    backgroundColor: colors.activeLime,
    padding: spacing.sm,
    gap: 2,
  },
  fertileLabel: { ...type.caption, fontFamily: fonts.bold },
  fertileValue: { ...type.body, fontFamily: fonts.semibold },
  actionRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  calendarCard: { marginTop: spacing.md, overflow: 'hidden' },
  calendarTop: {
    minHeight: 62,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.sm,
    borderBottomWidth: border.standard,
    borderBottomColor: colors.ink,
    backgroundColor: colors.skyAccent,
  },
  monthButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  monthTitle: { ...type.cardTitle },
  weekRow: { flexDirection: 'row', paddingHorizontal: spacing.xs, paddingTop: spacing.sm },
  weekday: { ...type.caption, width: `${100 / 7}%`, textAlign: 'center', fontFamily: fonts.bold },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.xs,
  },
  dayCell: { width: `${100 / 7}%`, alignItems: 'center', paddingVertical: 3 },
  dayCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: border.thin,
    borderColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayOutOfMonth: { opacity: 0.28 },
  today: { borderColor: colors.ink, borderWidth: border.standard },
  recordedDay: { backgroundColor: colors.coralCard, borderColor: colors.ink },
  predictedDay: { backgroundColor: colors.pinkCanvas, borderColor: colors.ink },
  fertileDay: { backgroundColor: colors.activeLime, borderColor: colors.ink },
  dayText: { ...type.bodySmall, fontFamily: fonts.semibold },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    padding: spacing.md,
    borderTopWidth: border.standard,
    borderTopColor: colors.ink,
    backgroundColor: colors.white,
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendDot: {
    width: 13,
    height: 13,
    borderRadius: 7,
    borderWidth: border.thin,
    borderColor: colors.ink,
  },
  legendText: { ...type.caption },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginTop: spacing.xl,
    marginBottom: spacing.sm,
  },
  sectionTitle: { ...type.cardTitle },
  sectionHint: { ...type.caption, color: colors.secondaryInk },
  streakRow: { flexDirection: 'row', gap: spacing.sm },
  streakCard: {
    flex: 1,
    borderWidth: border.standard,
    borderColor: colors.ink,
    borderRadius: radii.lg,
    padding: spacing.md,
    gap: 3,
  },
  streakIcon: {
    width: 42,
    height: 42,
    borderRadius: radii.pill,
    borderWidth: border.standard,
    borderColor: colors.ink,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  streakValue: { ...type.metric },
  streakLabel: { ...type.body, fontFamily: fonts.semibold },
  streakDetail: { ...type.caption, marginBottom: spacing.xs },
  sharedStreakCard: {
    marginTop: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.skyAccent,
  },
  sharedStreakValue: { ...type.metricSmall },
  partnerCard: {
    marginTop: spacing.xl,
    backgroundColor: colors.mintCard,
    gap: spacing.md,
  },
  partnerTop: { flexDirection: 'row', gap: spacing.sm, alignItems: 'center' },
  partnerIcon: {
    width: 52,
    height: 52,
    borderRadius: radii.pill,
    borderWidth: border.standard,
    borderColor: colors.ink,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  partnerTitle: { ...type.cardTitle },
  partnerCopy: { ...type.bodySmall, color: colors.secondaryInk, marginTop: 3 },
  partnerActions: { flexDirection: 'row', gap: spacing.sm },
  partnerCycleCard: {
    marginTop: spacing.md,
    backgroundColor: colors.skyAccent,
    gap: spacing.sm,
  },
  partnerPrivacy: { ...type.caption, color: colors.secondaryInk },
  settingsLink: { marginTop: spacing.md, overflow: 'hidden' },
  settingsRow: {
    minHeight: 76,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
  },
  rowTitle: { ...type.body, fontFamily: fonts.semibold },
  rowDetail: { ...type.caption, color: colors.secondaryInk, marginTop: 2 },
  disclaimer: {
    ...type.caption,
    textAlign: 'center',
    lineHeight: 17,
    marginTop: spacing.lg,
    paddingHorizontal: spacing.md,
  },
});
