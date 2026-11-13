import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { NeoScreenWrapper, NeoTopBar } from '../../components/neo';
import {
  Banner,
  Button,
  Card,
  Chip,
  Field,
  Icon,
} from '../../components/ui';
import type { RootStackParamList } from '../../navigation/types';
import type { CycleEntry, CycleSymptom } from '../../types';
import { useApp } from '../../state/AppProvider';
import { border, colors, fonts, radii, spacing, type } from '../../theme';
import { cycleSymptoms } from '../../domain/couples';
import { dateFromKey, localDateKey } from '../../utils/date';
import { showAlert } from '../../utils/dialog';

type Navigation = NativeStackNavigationProp<RootStackParamList>;

function isDateKey(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    localDateKey(dateFromKey(value)) === value;
}

function displayDate(dateKey: string): string {
  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(dateFromKey(dateKey));
}

export function CycleLogScreen() {
  const navigation = useNavigation<Navigation>();
  const { state, saveCycleEntry, deleteCycleEntry } = useApp();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [startDate, setStartDate] = useState(localDateKey());
  const [endDate, setEndDate] = useState('');
  const [symptoms, setSymptoms] = useState<CycleSymptom[]>([]);
  const [errors, setErrors] = useState<{ start?: string; end?: string }>({});
  const entries = useMemo(
    () =>
      [...state.coupleWellness.cycleEntries].sort((a, b) =>
        b.startDateKey.localeCompare(a.startDateKey),
      ),
    [state.coupleWellness.cycleEntries],
  );

  const reset = () => {
    setEditingId(null);
    setStartDate(localDateKey());
    setEndDate('');
    setSymptoms([]);
    setErrors({});
  };

  const edit = (entry: CycleEntry) => {
    setEditingId(entry.id);
    setStartDate(entry.startDateKey);
    setEndDate(entry.endDateKey ?? '');
    setSymptoms(entry.symptoms);
    setErrors({});
  };

  const toggleSymptom = (symptom: CycleSymptom) => {
    setSymptoms((selected) =>
      selected.includes(symptom)
        ? selected.filter((item) => item !== symptom)
        : [...selected, symptom],
    );
  };

  const submit = () => {
    const nextErrors: typeof errors = {};
    if (!isDateKey(startDate)) {
      nextErrors.start = 'Use YYYY-MM-DD.';
    } else if (startDate > localDateKey()) {
      nextErrors.start = 'A period start cannot be in the future.';
    }
    if (endDate && !isDateKey(endDate)) {
      nextErrors.end = 'Use YYYY-MM-DD or leave it blank.';
    } else if (endDate && endDate < startDate) {
      nextErrors.end = 'The end date cannot be before the start.';
    } else if (endDate && endDate > localDateKey()) {
      nextErrors.end = 'The end date cannot be in the future.';
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;
    saveCycleEntry({
      id: editingId ?? undefined,
      startDateKey: startDate,
      endDateKey: endDate || null,
      symptoms,
    });
    reset();
  };

  const remove = (entry: CycleEntry) => {
    showAlert(
      'Delete this period entry?',
      'This removes the recorded dates from the calendar and from your account backup.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            deleteCycleEntry(entry.id);
            if (editingId === entry.id) reset();
          },
        },
      ],
    );
  };

  return (
    <NeoScreenWrapper tone="lime" scroll contentStyle={styles.content}>
      <NeoTopBar
        title={editingId ? 'Edit period' : 'Log period'}
        onBack={() => navigation.goBack()}
      />
      <Card style={styles.formCard}>
        <View style={styles.formHeading}>
          <View style={styles.formIcon}>
            <Icon name="calendar-edit" size={26} color={colors.ink} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.formTitle}>
              {editingId ? 'Update these dates' : 'When did it start?'}
            </Text>
            <Text style={styles.formCopy}>
              Record the first day. Adding an end date makes the calendar more
              precise, but it is optional.
            </Text>
          </View>
        </View>
        <Field
          label="Period start"
          value={startDate}
          onChangeText={setStartDate}
          placeholder="YYYY-MM-DD"
          inputMode="numeric"
          error={errors.start}
        />
        <View style={styles.quickRow}>
          <Chip label="Today" onPress={() => setStartDate(localDateKey())} />
          {entries[0] ? (
            <Chip
              label="Last logged"
              onPress={() => setStartDate(entries[0].startDateKey)}
            />
          ) : null}
        </View>
        <Field
          label="Period end"
          value={endDate}
          onChangeText={setEndDate}
          placeholder="Optional · YYYY-MM-DD"
          inputMode="numeric"
          error={errors.end}
        />
        {endDate ? (
          <Pressable
            accessibilityRole="button"
            onPress={() => setEndDate('')}
            style={styles.clearEnd}
          >
            <Text style={styles.clearEndText}>Clear end date</Text>
          </Pressable>
        ) : null}
      </Card>

      <Text style={styles.sectionLabel}>HOW ARE YOU FEELING? · PRIVATE</Text>
      <Text style={styles.sectionCopy}>
        These symptoms are visible only to you. They are never included in the
        partner summary.
      </Text>
      <View style={styles.symptomGrid}>
        {cycleSymptoms.map((symptom) => (
          <Chip
            key={symptom.id}
            label={symptom.label}
            selected={symptoms.includes(symptom.id)}
            onPress={() => toggleSymptom(symptom.id)}
          />
        ))}
      </View>

      <Banner
        tone="info"
        icon="shield-lock-outline"
        title="Private by default"
        message="Your partner sees only the summary categories you explicitly enable. Symptoms and period end dates are not returned to them."
      />

      <Button
        label={editingId ? 'SAVE CHANGES' : 'SAVE PERIOD'}
        icon="check"
        onPress={submit}
        style={{ marginTop: spacing.lg }}
      />
      {editingId ? (
        <Button
          label="CANCEL EDIT"
          variant="outline"
          onPress={reset}
          style={{ marginTop: spacing.sm }}
        />
      ) : null}

      <Text style={styles.historyTitle}>Period history</Text>
      {entries.length === 0 ? (
        <Card style={styles.emptyCard}>
          <Icon name="calendar-blank-outline" size={30} color={colors.ink} />
          <Text style={styles.emptyTitle}>No period entries yet</Text>
          <Text style={styles.emptyCopy}>
            Your first entry will begin the on-device cycle estimate.
          </Text>
        </Card>
      ) : (
        <View style={styles.history}>
          {entries.slice(0, 12).map((entry) => (
            <Card key={entry.id} style={styles.historyRow} padded={false}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Edit period starting ${entry.startDateKey}`}
                onPress={() => edit(entry)}
                style={styles.historyMain}
              >
                <View style={styles.historyIcon}>
                  <Icon name="water" size={20} color={colors.ink} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.historyDate}>{displayDate(entry.startDateKey)}</Text>
                  <Text style={styles.historyDetail}>
                    {entry.endDateKey
                      ? `Ended ${displayDate(entry.endDateKey)}`
                      : 'End date not recorded'}
                    {entry.symptoms.length > 0
                      ? ` · ${entry.symptoms.length} private symptom${entry.symptoms.length === 1 ? '' : 's'}`
                      : ''}
                  </Text>
                </View>
                <Icon name="pencil-outline" size={20} color={colors.ink} />
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Delete period entry"
                onPress={() => remove(entry)}
                style={styles.deleteButton}
              >
                <Icon name="trash-can-outline" size={20} color={colors.error} />
              </Pressable>
            </Card>
          ))}
        </View>
      )}
      <Text style={styles.disclaimer}>
        Predictions are estimates calculated from your recorded dates. They are
        not a diagnosis or a method of contraception.
      </Text>
    </NeoScreenWrapper>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: spacing.md, paddingBottom: spacing.section },
  formCard: { gap: spacing.md, backgroundColor: colors.white, padding: spacing.lg },
  formHeading: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  formIcon: {
    width: 52,
    height: 52,
    borderRadius: radii.pill,
    borderWidth: border.standard,
    borderColor: colors.ink,
    backgroundColor: colors.pinkAccent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  formTitle: { ...type.cardTitle },
  formCopy: { ...type.bodySmall, color: colors.secondaryInk, marginTop: 3 },
  quickRow: { flexDirection: 'row', gap: spacing.xs, flexWrap: 'wrap' },
  clearEnd: { alignSelf: 'flex-start', minHeight: 44, justifyContent: 'center' },
  clearEndText: { ...type.bodySmall, textDecorationLine: 'underline' },
  sectionLabel: {
    ...type.label,
    letterSpacing: 0.8,
    marginTop: spacing.xl,
    marginBottom: spacing.xs,
  },
  sectionCopy: { ...type.caption, color: colors.secondaryInk, marginBottom: spacing.sm },
  symptomGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginBottom: spacing.lg },
  historyTitle: { ...type.cardTitle, marginTop: spacing.xl, marginBottom: spacing.sm },
  history: { gap: spacing.sm },
  historyRow: { flexDirection: 'row', overflow: 'hidden' },
  historyMain: {
    flex: 1,
    minHeight: 82,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.sm,
  },
  historyIcon: {
    width: 42,
    height: 42,
    borderRadius: radii.pill,
    borderWidth: border.standard,
    borderColor: colors.ink,
    backgroundColor: colors.coralCard,
    alignItems: 'center',
    justifyContent: 'center',
  },
  historyDate: { ...type.body, fontFamily: fonts.semibold },
  historyDetail: { ...type.caption, color: colors.secondaryInk, marginTop: 3 },
  deleteButton: {
    width: 52,
    borderLeftWidth: border.standard,
    borderLeftColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.coralSoft,
  },
  emptyCard: { alignItems: 'center', gap: spacing.xs, padding: spacing.xl },
  emptyTitle: { ...type.cardTitle, marginTop: spacing.xs },
  emptyCopy: { ...type.bodySmall, textAlign: 'center', color: colors.secondaryInk },
  disclaimer: {
    ...type.caption,
    textAlign: 'center',
    lineHeight: 17,
    marginTop: spacing.xl,
    paddingHorizontal: spacing.md,
  },
});
