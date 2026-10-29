import React, { useState } from 'react';
import {
  Linking,
  Platform,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/types';
import { useApp } from '../../state/AppProvider';
import { border, colors, fonts, radii, spacing, type } from '../../theme';
import { Card, Icon, type IconName } from '../../components/ui';
import { NeoScreenWrapper, NeoTopBar } from '../../components/neo';
import { fetchReleaseMetadata, releaseDownloadUrl } from '../../data/release';
import { isNewerVersion } from '../../utils/version';
import { APP_VERSION } from '../../data/appInfo';
import {
  hydrationReminderLabel,
  setHydrationReminders,
} from '../../services/notifications';
import { showAlert } from '../../utils/dialog';

type Props = NativeStackScreenProps<RootStackParamList, 'Settings'>;

export function SettingsScreen({ navigation }: Props) {
  const { state, patchSettings, updateConsent } = useApp();
  const [checking, setChecking] = useState(false);
  const [updatingReminders, setUpdatingReminders] = useState(false);

  const checkUpdate = async () => {
    setChecking(true);
    try {
      const metadata = await fetchReleaseMetadata();
      if (!metadata) {
        showAlert('Update check unavailable', 'Release metadata could not be reached. Try again later.');
      } else if (!isNewerVersion(metadata.version, APP_VERSION)) {
        showAlert('Nourish is up to date', `You are using version ${APP_VERSION}.`);
      } else {
        const url = releaseDownloadUrl(metadata);
        if (!url) {
          showAlert('No update link available', 'A newer release exists, but no verified download is published.');
        } else {
          showAlert('New version available', `Version ${metadata.version} is ready.`, [
            { text: 'Later', style: 'cancel' },
            { text: 'Download update', onPress: () => void Linking.openURL(url) },
          ]);
        }
      }
    } finally {
      setChecking(false);
    }
  };

  const adjustWater = (delta: number) => {
    patchSettings({
      waterTargetMl: Math.min(
        4000,
        Math.max(1500, state.settings.waterTargetMl + delta),
      ),
    });
  };

  const toggleReminders = async (enabled: boolean) => {
    if (Platform.OS === 'web') {
      showAlert(
        'Device notifications required',
        'Hydration notifications are available in the Android and iOS app.',
      );
      return;
    }
    setUpdatingReminders(true);
    try {
      const result = await setHydrationReminders(enabled, state.settings);
      if (result === 'denied') {
        showAlert(
          'Notifications are off',
          'Allow notifications in your device settings to use hydration reminders.',
        );
        return;
      }
      patchSettings({ remindersEnabled: enabled });
    } catch {
      showAlert(
        'Couldn’t update reminders',
        'Please check your notification permission and try again.',
      );
    } finally {
      setUpdatingReminders(false);
    }
  };

  return (
    <NeoScreenWrapper tone="lavender" scroll contentStyle={styles.content}>
      <NeoTopBar
        title="Settings"
        leftColor={colors.butterCard}
        rightColor={colors.mintCard}
        onBack={() => navigation.goBack()}
      />
        <Text style={styles.sectionLabel}>YOUR PLAN</Text>
        <Card style={styles.planCard}>
          <View style={styles.planTop}>
            <View>
              <Text style={type.label}>DAILY TARGET</Text>
              <View style={styles.planValueRow}>
                <Text style={styles.planValue}>{state.target?.targetKcal.toLocaleString() ?? '—'}</Text>
                <Text style={styles.planUnit}>kcal</Text>
              </View>
            </View>
            <View style={styles.targetIcon}>
              <Icon name="target" size={27} color={colors.primary} />
            </View>
          </View>
          {state.target ? (
            <>
              <View style={styles.macros}>
                <Macro value={`${state.target.proteinG}g`} label="PROTEIN" />
                <Macro value={`${state.target.carbsG}g`} label="CARBS" />
                <Macro value={`${state.target.fatG}g`} label="FAT" />
              </View>
              <Text style={styles.formula}>
                Calculated locally with {state.target.formulaVersion}.
              </Text>
            </>
          ) : null}
        </Card>

        <Text style={styles.sectionLabel}>HYDRATION</Text>
        <Card style={styles.settingCard}>
          <View style={styles.settingRow}>
            <View style={styles.settingIcon}><Icon name="water-outline" size={23} color={colors.primary} /></View>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowTitle}>Daily water goal</Text>
              <Text style={styles.rowDetail}>
                {(state.settings.waterTargetMl / 1000).toFixed(2)} L · adjustable from 1.5 to 4.0 L
              </Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Decrease water goal"
              onPress={() => adjustWater(-250)}
              disabled={state.settings.waterTargetMl <= 1500}
              style={[styles.step, state.settings.waterTargetMl <= 1500 && styles.disabled]}
            >
              <Icon name="minus" size={18} color={colors.primary} />
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Increase water goal"
              onPress={() => adjustWater(250)}
              disabled={state.settings.waterTargetMl >= 4000}
              style={[styles.step, state.settings.waterTargetMl >= 4000 && styles.disabled]}
            >
              <Icon name="plus" size={18} color={colors.primary} />
            </Pressable>
          </View>
          <View style={styles.divider} />
          <View style={styles.settingRow}>
            <View style={styles.settingIcon}>
              <Icon
                name={state.settings.remindersEnabled ? 'bell-ring' : 'bell-ring-outline'}
                size={23}
                color={state.settings.remindersEnabled ? colors.primary : colors.outline}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowTitle}>Hydration reminders</Text>
              <Text style={styles.rowDetail}>
                {Platform.OS === 'web'
                  ? 'Available in the installed app.'
                  : updatingReminders
                    ? 'Updating notifications…'
                    : state.settings.remindersEnabled
                      ? `Daily at ${hydrationReminderLabel}`
                      : 'Off'}
              </Text>
            </View>
            <Switch
              accessibilityLabel="Hydration reminders"
              value={state.settings.remindersEnabled}
              disabled={Platform.OS === 'web' || updatingReminders}
              onValueChange={(enabled) => void toggleReminders(enabled)}
              trackColor={{ true: colors.activeLime, false: colors.white }}
              thumbColor={colors.white}
            />
          </View>
          {state.settings.remindersEnabled ? (
            <View style={styles.reminderConfig}>
              <ReminderTime
                label="START"
                minutes={state.settings.reminderStartMinutes}
                onChange={(minutes) =>
                  patchSettings({
                    reminderStartMinutes: Math.min(
                      state.settings.reminderEndMinutes,
                      minutes,
                    ),
                  })
                }
              />
              <ReminderTime
                label="END"
                minutes={state.settings.reminderEndMinutes}
                onChange={(minutes) =>
                  patchSettings({
                    reminderEndMinutes: Math.max(
                      state.settings.reminderStartMinutes,
                      minutes,
                    ),
                  })
                }
              />
              <Text style={styles.reminderLabel}>EVERY</Text>
              <View style={styles.intervalRow}>
                {[60, 120, 180, 240].map((minutes) => (
                  <Pressable
                    key={minutes}
                    accessibilityRole="button"
                    accessibilityState={{
                      selected:
                        state.settings.reminderIntervalMinutes === minutes,
                    }}
                    onPress={() =>
                      patchSettings({ reminderIntervalMinutes: minutes })
                    }
                    style={[
                      styles.intervalOption,
                      state.settings.reminderIntervalMinutes === minutes &&
                        styles.intervalSelected,
                    ]}
                  >
                    <Text style={styles.intervalText}>{minutes / 60}h</Text>
                  </Pressable>
                ))}
              </View>
              <Text style={styles.reminderHint}>
                Reminders pause for the rest of the day once your water goal is met.
              </Text>
            </View>
          ) : null}
        </Card>

        <Text style={styles.sectionLabel}>PRIVACY</Text>
        <Card style={styles.settingCard}>
          <ToggleRow
            icon="brain"
            title="Help improve food recognition"
            detail="Optional. Off by default."
            value={state.settings.aiImprovementConsent}
            onChange={(value) =>
              void updateConsent({ aiImprovement: value })
            }
          />
          <View style={styles.divider} />
          <ToggleRow
            icon="chart-donut"
            title="Product analytics"
            detail="Non-nutrition usage only."
            value={state.settings.analyticsConsent}
            onChange={(value) => void updateConsent({ analytics: value })}
          />
          <View style={styles.divider} />
          <MenuRow
            icon="shield-lock-outline"
            title="Privacy & consent center"
            detail="Control your data"
            onPress={() => navigation.navigate('Privacy')}
          />
          {state.session ? (
            <>
              <View style={styles.divider} />
              <MenuRow
                icon="trash-can-outline"
                title="Delete account"
                detail="Permanently remove your account and health data"
                onPress={() => navigation.navigate('DeleteAccount')}
              />
            </>
          ) : null}
        </Card>

        <Text style={styles.sectionLabel}>APP</Text>
        <Card style={styles.settingCard}>
          <MenuRow
            icon="download-outline"
            title="Check for updates"
            detail={checking ? 'Checking release metadata…' : `Current version ${APP_VERSION}`}
            onPress={() => void checkUpdate()}
          />
          <View style={styles.divider} />
          <MenuRow
            icon="file-document-outline"
            title="Open release page"
            detail="View Android downloads and checksums"
            onPress={() =>
              void Linking.openURL('https://nourish-kylosonic.vercel.app/#download')
            }
          />
          <View style={styles.divider} />
          <MenuRow
            icon="crown-outline"
            title="Nourish Plus"
            detail="Unlock premium label reading"
            onPress={() => navigation.navigate('Paywall')}
          />
        </Card>
        <Text style={styles.footer}>
          Nourish · Nutrition, understood.
        </Text>
    </NeoScreenWrapper>
  );
}

function Macro({ value, label }: { value: string; label: string }) {
  return (
    <View style={styles.macro}>
      <Text style={styles.macroLabel}>{label}</Text>
      <Text style={styles.macroValue}>{value}</Text>
    </View>
  );
}

function ToggleRow({
  icon,
  title,
  detail,
  value,
  onChange,
}: {
  icon: IconName;
  title: string;
  detail: string;
  value: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <View style={styles.settingRow}>
      <View style={styles.settingIcon}><Icon name={icon} size={23} color={colors.primary} /></View>
      <View style={{ flex: 1 }}>
        <Text style={styles.rowTitle}>{title}</Text>
        <Text style={styles.rowDetail}>{detail}</Text>
      </View>
      <Switch
        accessibilityLabel={title}
        value={value}
        onValueChange={onChange}
        trackColor={{ true: colors.activeLime, false: colors.white }}
        thumbColor={colors.white}
      />
    </View>
  );
}

function ReminderTime({
  label,
  minutes,
  onChange,
}: {
  label: string;
  minutes: number;
  onChange: (minutes: number) => void;
}) {
  const hour = Math.floor(minutes / 60);
  const minute = minutes % 60;
  return (
    <View style={styles.timeControl}>
      <Text style={styles.reminderLabel}>{label}</Text>
      <View style={styles.timeValue}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Earlier ${label.toLowerCase()} time`}
          onPress={() => onChange(Math.max(0, minutes - 30))}
          style={styles.timeStep}
        >
          <Icon name="minus" size={16} color={colors.ink} />
        </Pressable>
        <Text style={styles.timeText}>
          {String(hour).padStart(2, '0')}:{String(minute).padStart(2, '0')}
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Later ${label.toLowerCase()} time`}
          onPress={() => onChange(Math.min(1439, minutes + 30))}
          style={styles.timeStep}
        >
          <Icon name="plus" size={16} color={colors.ink} />
        </Pressable>
      </View>
    </View>
  );
}

function MenuRow({
  icon,
  title,
  detail,
  onPress,
}: {
  icon: IconName;
  title: string;
  detail: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      onPress={onPress}
      style={styles.settingRow}
    >
      <View style={styles.settingIcon}><Icon name={icon} size={23} color={colors.primary} /></View>
      <View style={{ flex: 1 }}>
        <Text style={styles.rowTitle}>{title}</Text>
        <Text style={styles.rowDetail}>{detail}</Text>
      </View>
      <Icon name="chevron-right" size={21} color={colors.outline} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingTop: spacing.xs,
    paddingBottom: 96,
  },
  sectionLabel: { ...type.label, marginTop: spacing.xl, marginBottom: spacing.sm },
  planCard: { padding: spacing.lg, backgroundColor: colors.mintCard },
  planTop: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  planValueRow: { flexDirection: 'row', alignItems: 'flex-end', marginTop: spacing.xs },
  planValue: { ...type.metric, fontSize: 42, lineHeight: 46 },
  planUnit: { ...type.body, marginLeft: 5, marginBottom: 6 },
  targetIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: border.standard,
    borderColor: colors.ink,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  macros: { flexDirection: 'row', gap: spacing.lg, marginTop: spacing.md },
  macro: { flex: 1 },
  macroLabel: { ...type.caption, fontFamily: fonts.bold },
  macroValue: { ...type.bodyLarge, fontFamily: fonts.semibold, marginTop: 2 },
  formula: { ...type.caption, marginTop: spacing.md, lineHeight: 17 },
  settingCard: { paddingHorizontal: spacing.md, backgroundColor: colors.white },
  settingRow: { minHeight: 76, flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.sm },
  settingIcon: {
    width: 44,
    height: 44,
    borderRadius: radii.pill,
    borderWidth: border.standard,
    borderColor: colors.ink,
    backgroundColor: colors.butterCard,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reminderConfig: {
    borderTopWidth: border.standard,
    borderTopColor: colors.ink,
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  reminderLabel: { ...type.caption, fontFamily: fonts.bold },
  timeControl: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  timeValue: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  timeStep: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: border.standard,
    borderColor: colors.ink,
    backgroundColor: colors.butterCard,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeText: { minWidth: 58, textAlign: 'center', fontFamily: fonts.bold },
  intervalRow: { flexDirection: 'row', gap: spacing.xs },
  intervalOption: {
    flex: 1,
    minHeight: 40,
    borderRadius: 12,
    borderWidth: border.standard,
    borderColor: colors.ink,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  intervalSelected: { backgroundColor: colors.activeLime },
  intervalText: { ...type.bodySmall, fontFamily: fonts.bold },
  reminderHint: { ...type.caption, lineHeight: 17 },
  rowTitle: { ...type.body, fontFamily: fonts.semibold },
  rowDetail: { ...type.bodySmall, color: colors.onSurfaceVariant, marginTop: 2, lineHeight: 18 },
  step: {
    width: 44,
    height: 44,
    borderRadius: radii.pill,
    borderWidth: border.standard,
    borderColor: colors.ink,
    backgroundColor: colors.mintCard,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabled: { opacity: 0.35 },
  divider: { height: border.standard, backgroundColor: colors.ink },
  footer: { ...type.caption, textAlign: 'center', marginTop: spacing.xl, lineHeight: 18 },
});
