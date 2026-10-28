import React, { useState } from 'react';
import {
  Alert,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import * as Sharing from 'expo-sharing';
import { File, Paths } from 'expo-file-system';
import type { MainTabParamList, RootStackParamList } from '../../navigation/types';
import { useApp } from '../../state/AppProvider';
import { border, colors, fonts, radii, spacing, type } from '../../theme';
import { Banner, Button, Card, Icon, type IconName } from '../../components/ui';
import { NeoScreenWrapper, NeoTopBar } from '../../components/neo';
import { localDateKey } from '../../utils/date';
import { APP_VERSION } from '../../data/appInfo';

type TabNavigation = BottomTabNavigationProp<MainTabParamList>;
type RootNavigation = NativeStackNavigationProp<RootStackParamList>;

export function ProfileScreen() {
  const tabs = useNavigation<TabNavigation>();
  const navigation = tabs.getParent<RootNavigation>();
  const {
    state,
    syncNow,
    signOut,
    resetLocalData,
  } = useApp();
  const [exporting, setExporting] = useState(false);
  const accountName =
    state.session?.displayName ||
    state.session?.email ||
    state.session?.phone ||
    'Local profile';
  const completedMeals = state.meals.length;

  const exportData = async () => {
    setExporting(true);
    try {
      const payload = {
        exportedAt: new Date().toISOString(),
        profile: {
          phone: state.session?.phone ?? null,
          email: state.session?.email ?? null,
          displayName: state.session?.displayName ?? null,
          onboarding: state.onboarding,
          target: state.target,
          settings: state.settings,
        },
        meals: state.meals,
        water: state.water,
        weights: state.weights,
      };
      if (Platform.OS === 'web') {
        const blob = new Blob([JSON.stringify(payload, null, 2)], {
          type: 'application/json',
        });
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = `nourish-export-${localDateKey()}.json`;
        anchor.click();
        URL.revokeObjectURL(url);
        return;
      }
      const file = new File(Paths.cache, `nourish-export-${localDateKey()}.json`);
      file.create({ overwrite: true });
      file.write(JSON.stringify(payload, null, 2));
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(file.uri, {
          mimeType: 'application/json',
          dialogTitle: 'Export Nourish data',
        });
      } else {
        Alert.alert('Export created', `Saved to ${file.uri}`);
      }
    } catch {
      Alert.alert('Export failed', 'Nourish could not create the export file. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  const confirmReset = () => {
    Alert.alert(
      'Delete local data?',
      'This removes onboarding, meals, water, weights, and queued changes from this device. It cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete local data',
          style: 'destructive',
          onPress: () => {
            void resetLocalData();
          },
        },
      ],
    );
  };

  return (
    <NeoScreenWrapper tone="lavender" scroll contentStyle={styles.content}>
      <NeoTopBar
        title="Profile"
        leftColor={colors.pinkAccent}
        rightColor={colors.skyAccent}
        onBack={() => tabs.navigate('Home')}
        rightIcon="cog-outline"
        rightLabel="Settings"
        onRight={() => navigation?.navigate('Settings')}
      />
        <Card style={styles.accountCard}>
          <View style={styles.accountTop}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{state.session ? 'N' : 'L'}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.accountName}>{accountName}</Text>
              <Text style={styles.accountMeta}>
                {state.session
                  ? `${state.session.plan === 'FREE' ? 'Free plan' : state.session.plan} · ${state.session.authProviders[0] ?? 'account'}`
                  : 'Offline profile · no account connected'}
              </Text>
            </View>
            {state.session ? <Icon name="check-decagram" size={22} color={colors.primary} /> : null}
          </View>
          {!state.session ? (
            <Button
              label="SIGN IN TO BACK UP"
              variant="secondary"
              onPress={() => navigation?.navigate('SignIn')}
              style={{ marginTop: spacing.md }}
            />
          ) : null}
          <View style={styles.stats}>
            <Stat value={String(completedMeals)} label="MEALS LOGGED" />
            <View style={styles.statDivider} />
            <Stat value={String(state.weights.length)} label="WEIGH-INS" />
            <View style={styles.statDivider} />
            <Stat value={`${state.meals.reduce((sum, meal) => sum + meal.items.length, 0)}`} label="FOOD ENTRIES" />
          </View>
        </Card>

        <View style={styles.sectionHeading}>
          <Text style={styles.sectionTitle}>Backup & sync</Text>
          <View style={[styles.queueBadge, state.queue.length > 0 && styles.queueBadgePending]}>
            <Text
              style={[
                styles.queueText,
                state.queue.length > 0 && { color: colors.ink },
              ]}
            >
              {state.queue.length} queued
            </Text>
          </View>
        </View>
        <Card style={styles.backupCard}>
          <View style={styles.backupRow}>
            <View style={styles.backupIcon}>
              <Icon
                name={state.session ? 'cloud-upload-outline' : 'cloud-off-outline'}
                size={24}
                color={colors.primary}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowTitle}>
                {state.session ? 'Account backup' : 'Your data stays on this device'}
              </Text>
              <Text style={styles.rowSubtext}>
                {state.session
                  ? state.syncMessage || 'Changes sync when you’re online.'
                  : 'Offline logging still works without an account.'}
              </Text>
            </View>
          </View>
          {state.session ? (
            <Button
              label={state.syncState === 'syncing' ? 'SYNCING…' : 'SYNC NOW'}
              variant="secondary"
              loading={state.syncState === 'syncing'}
              onPress={() => void syncNow()}
              style={{ marginTop: spacing.md }}
            />
          ) : null}
          {state.syncMessage && state.syncState === 'error' ? (
            <Banner
              tone="warning"
              icon="alert-outline"
              title="Some changes need attention"
              message={state.syncMessage}
            />
          ) : null}
        </Card>

        <Text style={styles.sectionTitle}>Preferences</Text>
        <Card style={styles.menu} padded={false}>
          <MenuRow
            icon="target"
            title="Nutrition target"
            detail={state.target ? `${state.target.targetKcal.toLocaleString()} kcal / day` : 'Not set'}
            onPress={() => navigation?.navigate('Settings')}
          />
          <MenuRow
            icon="bell-outline"
            title="Notifications"
            detail={state.settings.remindersEnabled ? 'Reminders enabled' : 'Reminders off'}
            onPress={() => navigation?.navigate('Settings')}
          />
          <MenuRow
            icon="shield-lock-outline"
            title="Privacy & consent"
            detail="Control health data and AI improvement"
            onPress={() => navigation?.navigate('Privacy')}
          />
          <MenuRow
            icon="download-outline"
            title="Export my data"
            detail="Machine-readable JSON copy"
            loading={exporting}
            onPress={() => void exportData()}
          />
          <MenuRow
            icon="information-outline"
            title="About Nourish"
            detail={`Version ${APP_VERSION} · Ethiopian FCT 2025`}
            onPress={() =>
              Alert.alert(
                'About Nourish',
                `Nourish ${APP_VERSION}\nNutrition, understood.\n\nFood composition data: Ethiopian Food Composition Table 2025 (EPHI & FAO) where imported. Bootstrap foods are labeled as provisional.`,
              )
            }
          />
        </Card>

        {state.session ? (
          <Button
            label="SIGN OUT"
            variant="secondary"
            onPress={() => {
              Alert.alert('Sign out?', 'Your local data remains on this device.', [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Sign out', onPress: () => void signOut() },
              ]);
            }}
            style={{ marginTop: spacing.xl }}
          />
        ) : null}
        <Pressable onPress={confirmReset} style={styles.deleteAction}>
          <Text style={styles.deleteText}>Delete local app data</Text>
        </Pressable>
        <Text style={styles.legal}>General wellness guidance, not medical care.</Text>
    </NeoScreenWrapper>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function MenuRow({
  icon,
  title,
  detail,
  onPress,
  loading,
}: {
  icon: IconName;
  title: string;
  detail: string;
  onPress: () => void;
  loading?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      onPress={onPress}
      style={({ pressed }) => [styles.menuRow, pressed && { opacity: 0.65 }]}
    >
      <View style={styles.menuIcon}>
        <Icon name={icon} size={22} color={colors.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.rowTitle}>{title}</Text>
        <Text style={styles.rowSubtext}>{loading ? 'Preparing export…' : detail}</Text>
      </View>
      <Icon name="chevron-right" size={22} color={colors.outline} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  content: { paddingTop: spacing.xs },
  accountCard: { padding: spacing.lg, marginTop: spacing.md, backgroundColor: colors.coralCard },
  accountTop: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  avatar: {
    width: 58,
    height: 58,
    borderRadius: 29,
    borderWidth: border.standard,
    borderColor: colors.ink,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontFamily: fonts.bold, fontSize: 25, color: colors.ink },
  accountName: { ...type.bodyLarge, fontFamily: fonts.semibold },
  accountMeta: { ...type.bodySmall, color: colors.onSurfaceVariant, marginTop: 2 },
  stats: {
    marginTop: spacing.lg,
    paddingTop: spacing.lg,
    borderTopWidth: border.standard,
    borderTopColor: colors.ink,
    flexDirection: 'row',
    alignItems: 'center',
  },
  stat: { flex: 1, alignItems: 'center' },
  statValue: { fontFamily: fonts.bold, fontSize: 24, color: colors.onSurface },
  statLabel: { ...type.label, fontSize: 8, marginTop: 2, textAlign: 'center' },
  statDivider: { width: border.standard, height: 34, backgroundColor: colors.ink },
  sectionHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: spacing.xl, marginBottom: spacing.md },
  sectionTitle: { ...type.title, marginTop: spacing.xl, marginBottom: spacing.md },
  queueBadge: {
    backgroundColor: colors.mintCard,
    borderWidth: border.standard,
    borderColor: colors.ink,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  queueBadgePending: { backgroundColor: colors.butterCard },
  queueText: { ...type.caption, fontFamily: fonts.bold, color: colors.ink },
  backupCard: { padding: spacing.lg, gap: spacing.md, backgroundColor: colors.mintCard },
  backupRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  backupIcon: {
    width: 46,
    height: 46,
    borderRadius: radii.pill,
    borderWidth: border.standard,
    borderColor: colors.ink,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowTitle: { ...type.body, fontFamily: fonts.semibold },
  rowSubtext: { ...type.bodySmall, color: colors.onSurfaceVariant, marginTop: 2 },
  menu: {
    overflow: 'hidden',
    backgroundColor: colors.white,
  },
  menuRow: {
    minHeight: 72,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    borderBottomWidth: border.standard,
    borderBottomColor: colors.ink,
  },
  menuIcon: {
    width: 44,
    height: 44,
    borderRadius: radii.pill,
    borderWidth: border.standard,
    borderColor: colors.ink,
    backgroundColor: colors.butterCard,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteAction: { alignItems: 'center', padding: spacing.lg },
  deleteText: { ...type.bodySmall, color: colors.error },
  legal: { ...type.caption, textAlign: 'center', lineHeight: 18 },
});
