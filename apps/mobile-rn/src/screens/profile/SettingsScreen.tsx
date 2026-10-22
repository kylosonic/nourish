import React, { useState } from 'react';
import {
  Alert,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/types';
import { useApp } from '../../state/AppProvider';
import { colors, fonts, spacing, type } from '../../theme';
import { Card, Icon, type IconName } from '../../components/ui';
import { fetchReleaseMetadata, releaseDownloadUrl } from '../../data/release';
import { isNewerVersion } from '../../utils/version';
import { APP_VERSION } from '../../data/appInfo';

type Props = NativeStackScreenProps<RootStackParamList, 'Settings'>;

export function SettingsScreen({ navigation }: Props) {
  const { state, patchSettings } = useApp();
  const [checking, setChecking] = useState(false);

  const checkUpdate = async () => {
    setChecking(true);
    try {
      const metadata = await fetchReleaseMetadata();
      if (!metadata) {
        Alert.alert('Update check unavailable', 'Release metadata could not be reached. Try again later.');
      } else if (!isNewerVersion(metadata.version, APP_VERSION)) {
        Alert.alert('Nourish is up to date', `You are using version ${APP_VERSION}.`);
      } else {
        const url = releaseDownloadUrl(metadata);
        if (!url) {
          Alert.alert('No update link available', 'A newer release exists, but no verified download is published.');
        } else {
          Alert.alert('New version available', `Version ${metadata.version} is ready.`, [
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

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Go back"
          onPress={() => navigation.goBack()}
          style={styles.back}
        >
          <Icon name="arrow-left" size={24} color={colors.onSurfaceVariant} />
        </Pressable>
        <Text style={styles.title}>Settings</Text>
        <View style={{ width: 40 }} />
      </View>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
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
              onPress={() => adjustWater(-250)}
              disabled={state.settings.waterTargetMl <= 1500}
              style={[styles.step, state.settings.waterTargetMl <= 1500 && styles.disabled]}
            >
              <Icon name="minus" size={18} color={colors.primary} />
            </Pressable>
            <Pressable
              onPress={() => adjustWater(250)}
              disabled={state.settings.waterTargetMl >= 4000}
              style={[styles.step, state.settings.waterTargetMl >= 4000 && styles.disabled]}
            >
              <Icon name="plus" size={18} color={colors.primary} />
            </Pressable>
          </View>
          <View style={styles.divider} />
          <View style={styles.settingRow}>
            <View style={styles.settingIcon}><Icon name="bell-ring-outline" size={23} color={colors.outline} /></View>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowTitle}>Hydration reminders</Text>
              <Text style={styles.rowDetail}>
                Not configured in this build.
              </Text>
            </View>
            <Switch
              value={false}
              disabled
              trackColor={{ true: colors.primaryContainer, false: colors.surfaceHighest }}
            />
          </View>
        </Card>

        <Text style={styles.sectionLabel}>PRIVACY</Text>
        <Card style={styles.settingCard}>
          <ToggleRow
            icon="brain"
            title="Help improve food recognition"
            detail="Optional. Off by default."
            value={state.settings.aiImprovementConsent}
            onChange={(value) => patchSettings({ aiImprovementConsent: value })}
          />
          <View style={styles.divider} />
          <ToggleRow
            icon="chart-donut"
            title="Product analytics"
            detail="Non-nutrition usage only."
            value={state.settings.analyticsConsent}
            onChange={(value) => patchSettings({ analyticsConsent: value })}
          />
          <View style={styles.divider} />
          <MenuRow
            icon="shield-lock-outline"
            title="Privacy & consent center"
            detail="Control your data"
            onPress={() => navigation.navigate('Privacy')}
          />
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
            onPress={() => void Linking.openURL('https://nourish.app/#download')}
          />
        </Card>
        <Text style={styles.footer}>
          Nourish · Nutrition, understood.
        </Text>
      </ScrollView>
    </SafeAreaView>
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
        value={value}
        onValueChange={onChange}
        trackColor={{ true: colors.primaryContainer, false: colors.surfaceHighest }}
        thumbColor={colors.white}
      />
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
  safe: { flex: 1, backgroundColor: colors.surface },
  header: { height: 64, flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.xl },
  back: { width: 40, height: 40, justifyContent: 'center' },
  title: { ...type.title, flex: 1, textAlign: 'center' },
  content: { padding: spacing.xl, paddingTop: spacing.sm, paddingBottom: spacing.xxl },
  sectionLabel: { ...type.label, marginTop: spacing.xl, marginBottom: spacing.sm },
  planCard: { padding: spacing.lg, backgroundColor: colors.primarySoft, borderColor: colors.primarySoft },
  planTop: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  planValueRow: { flexDirection: 'row', alignItems: 'flex-end', marginTop: spacing.xs },
  planValue: { fontFamily: fonts.bold, fontSize: 43, color: colors.primary, letterSpacing: -1.4 },
  planUnit: { ...type.body, color: colors.primary, marginLeft: 5, marginBottom: 6 },
  targetIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  macros: { flexDirection: 'row', gap: spacing.lg, marginTop: spacing.md },
  macro: { flex: 1 },
  macroLabel: { ...type.label, fontSize: 9, color: colors.primary },
  macroValue: { ...type.bodyLarge, fontFamily: fonts.semibold, marginTop: 2 },
  formula: { ...type.caption, marginTop: spacing.md, lineHeight: 17 },
  settingCard: { paddingHorizontal: spacing.md },
  settingRow: { minHeight: 76, flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.sm },
  settingIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.surfaceLow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowTitle: { ...type.body, fontFamily: fonts.semibold },
  rowDetail: { ...type.bodySmall, color: colors.onSurfaceVariant, marginTop: 2, lineHeight: 18 },
  step: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabled: { opacity: 0.35 },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.surfaceHighest },
  footer: { ...type.caption, textAlign: 'center', marginTop: spacing.xl, lineHeight: 18 },
});
