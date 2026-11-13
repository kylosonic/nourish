import React, { useEffect, useState } from 'react';
import {
  Share,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { NeoScreenWrapper, NeoTopBar } from '../../components/neo';
import {
  Banner,
  Button,
  Card,
  Field,
  Icon,
} from '../../components/ui';
import type { RootStackParamList } from '../../navigation/types';
import { useApp } from '../../state/AppProvider';
import type { CoupleSharing } from '../../types';
import { border, colors, fonts, radii, spacing, type as typography } from '../../theme';
import { showAlert } from '../../utils/dialog';

type Navigation = NativeStackNavigationProp<RootStackParamList>;

function dateTime(value: string): string {
  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value));
}

export function CoupleConnectionScreen() {
  const navigation = useNavigation<Navigation>();
  const {
    state,
    setCycleSettings,
    refreshCouple,
    createCoupleInvite,
    joinCouple,
    updatePartnerSharing,
    disconnectPartner,
  } = useApp();
  const wellness = state.coupleWellness;
  const [cycleLength, setCycleLength] = useState(
    String(wellness.cycleLengthDays),
  );
  const [periodLength, setPeriodLength] = useState(
    String(wellness.periodLengthDays),
  );
  const [joinCode, setJoinCode] = useState('');
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    if (state.session) void refreshCouple().catch(() => undefined);
  }, [refreshCouple, state.session]);

  const saveSettings = () => {
    const cycle = Number(cycleLength);
    const period = Number(periodLength);
    if (!Number.isInteger(cycle) || cycle < 21 || cycle > 45) {
      showAlert('Check cycle length', 'Choose a whole number from 21 to 45 days.');
      return;
    }
    if (!Number.isInteger(period) || period < 2 || period > 10) {
      showAlert('Check period length', 'Choose a whole number from 2 to 10 days.');
      return;
    }
    setCycleSettings(cycle, period);
    showAlert(
      'Cycle settings saved',
      'The new estimate will use these defaults until enough period starts are recorded.',
    );
  };

  const invite = async () => {
    setBusy('invite');
    try {
      await createCoupleInvite();
    } catch (error) {
      showAlert(
        'Could not create invite',
        error instanceof Error ? error.message : 'Please try again.',
      );
    } finally {
      setBusy(null);
    }
  };

  const shareInvite = async () => {
    if (!wellness.invitation) return;
    try {
      await Share.share({
        title: 'Connect on Nourish',
        message: `Connect with me on Nourish to share only what we choose. Couple code: ${wellness.invitation.code}`,
      });
    } catch {
      showAlert('Could not share', 'Copy the code manually if sharing is unavailable.');
    }
  };

  const join = async () => {
    setBusy('join');
    try {
      await joinCouple(joinCode);
      setJoinCode('');
    } catch (error) {
      showAlert(
        'Could not connect',
        error instanceof Error ? error.message : 'Check the code and try again.',
      );
    } finally {
      setBusy(null);
    }
  };

  const changeSharing = async (patch: Partial<CoupleSharing>) => {
    const key = Object.keys(patch)[0] ?? 'sharing';
    setBusy(key);
    try {
      await updatePartnerSharing(patch);
    } catch (error) {
      showAlert(
        'Sharing was not changed',
        error instanceof Error ? error.message : 'Please try again.',
      );
    } finally {
      setBusy(null);
    }
  };

  const disconnect = () => {
    showAlert(
      'Disconnect partner?',
      'All sharing permissions end immediately. Your private history and streaks remain in your account.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Disconnect',
          style: 'destructive',
          onPress: () => {
            setBusy('disconnect');
            void disconnectPartner()
              .catch((error: unknown) =>
                showAlert(
                  'Could not disconnect',
                  error instanceof Error ? error.message : 'Please try again.',
                ),
              )
              .finally(() => setBusy(null));
          },
        },
      ],
    );
  };

  return (
    <NeoScreenWrapper tone="lavender" scroll contentStyle={styles.content}>
      <NeoTopBar title="Partner & privacy" onBack={() => navigation.goBack()} />

      <Card style={styles.settingsCard}>
        <View style={styles.headingRow}>
          <View style={styles.headingIcon}>
            <Icon name="tune-variant" size={24} color={colors.ink} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.headingTitle}>Cycle estimate settings</Text>
            <Text style={styles.headingCopy}>
              These defaults are used until you have recorded enough period starts.
            </Text>
          </View>
        </View>
        <View style={styles.twoFields}>
          <Field
            label="Cycle"
            value={cycleLength}
            onChangeText={setCycleLength}
            keyboardType="number-pad"
            suffix="days"
            style={{ flex: 1 }}
          />
          <Field
            label="Period"
            value={periodLength}
            onChangeText={setPeriodLength}
            keyboardType="number-pad"
            suffix="days"
            style={{ flex: 1 }}
          />
        </View>
        <Button label="SAVE CYCLE SETTINGS" variant="secondary" onPress={saveSettings} />
      </Card>

      {!state.session ? (
        <Card style={styles.signInCard}>
          <Icon name="account-lock-outline" size={32} color={colors.ink} />
          <Text style={styles.headingTitle}>Sign in to connect a partner</Text>
          <Text style={styles.headingCopy}>
            Tracking works locally without an account. Partner pairing and
            permissions require a signed-in account.
          </Text>
          <Button label="SIGN IN" onPress={() => navigation.navigate('SignIn')} />
        </Card>
      ) : wellness.connection ? (
        <>
          <Card style={styles.partnerCard}>
            <View style={styles.partnerHeading}>
              <View style={styles.avatar}>
                <Icon name="account-heart" size={28} color={colors.ink} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.partnerName}>
                  {wellness.connection.partnerName}
                </Text>
                <Text style={styles.connectedAt}>
                  Connected {dateTime(wellness.connection.connectedAt)}
                </Text>
              </View>
              <View style={styles.connectedPill}>
                <Text style={styles.connectedPillText}>CONNECTED</Text>
              </View>
            </View>
          </Card>

          <Text style={styles.sectionTitle}>What you share</Text>
          <Text style={styles.sectionCopy}>
            Each permission is separate. Turn one off and your partner loses
            access to that category on their next refresh.
          </Text>
          <Card style={styles.sharingCard} padded={false}>
            <SharingRow
              icon="calendar-heart"
              title="Cycle timing"
              detail="Shares period start dates and cycle length. Never shares symptoms or notes."
              value={wellness.connection.mySharing.shareCycle}
              disabled={busy != null}
              onValueChange={(value) => void changeSharing({ shareCycle: value })}
            />
            <SharingRow
              icon="hand-heart-outline"
              title="Daily check-ins"
              detail="Shares check-in dates so you can build a shared streak."
              value={wellness.connection.mySharing.shareCheckIns}
              disabled={busy != null}
              onValueChange={(value) =>
                void changeSharing({ shareCheckIns: value })
              }
            />
            <SharingRow
              icon="food-apple-outline"
              title="Food-logging streak"
              detail="Shares only dates with a logged meal, never meal contents."
              value={wellness.connection.mySharing.shareFoodStreak}
              disabled={busy != null}
              onValueChange={(value) =>
                void changeSharing({ shareFoodStreak: value })
              }
              last
            />
          </Card>

          <Banner
            tone="info"
            icon="eye-outline"
            title="What your partner currently shares"
            message={[
              wellness.connection.partnerSharing.shareCycle
                ? 'Cycle timing'
                : null,
              wellness.connection.partnerSharing.shareCheckIns
                ? 'Check-ins'
                : null,
              wellness.connection.partnerSharing.shareFoodStreak
                ? 'Food streak'
                : null,
            ]
              .filter(Boolean)
              .join(' · ') || 'Nothing is shared with you right now.'}
          />

          <Button
            label={busy === 'disconnect' ? 'DISCONNECTING…' : 'DISCONNECT PARTNER'}
            variant="danger"
            loading={busy === 'disconnect'}
            onPress={disconnect}
            style={{ marginTop: spacing.xl }}
          />
        </>
      ) : (
        <>
          <Text style={styles.sectionTitle}>Connect with your partner</Text>
          <Text style={styles.sectionCopy}>
            Pair only with someone you trust. Sharing stays off until you enable
            each category after pairing.
          </Text>
          <Card style={styles.connectCard}>
            <View style={styles.headingRow}>
              <View style={styles.headingIcon}>
                <Icon name="ticket-confirmation-outline" size={24} color={colors.ink} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.headingTitle}>Create an invite</Text>
                <Text style={styles.headingCopy}>
                  Single use, private, and valid for 24 hours.
                </Text>
              </View>
            </View>
            {wellness.invitation ? (
              <View style={styles.codeBox}>
                <Text style={styles.codeLabel}>YOUR COUPLE CODE</Text>
                <Text selectable style={styles.codeValue}>
                  {wellness.invitation.code}
                </Text>
                <Text style={styles.codeExpiry}>
                  Expires {dateTime(wellness.invitation.expiresAt)}
                </Text>
                <Button
                  label="SHARE INVITE"
                  icon="share-variant-outline"
                  variant="secondary"
                  onPress={() => void shareInvite()}
                />
              </View>
            ) : (
              <Button
                label={busy === 'invite' ? 'CREATING…' : 'CREATE INVITE'}
                loading={busy === 'invite'}
                onPress={() => void invite()}
              />
            )}
          </Card>

          <View style={styles.orRow}>
            <View style={styles.orLine} />
            <Text style={styles.orText}>OR</Text>
            <View style={styles.orLine} />
          </View>

          <Card style={styles.joinCard}>
            <Text style={styles.headingTitle}>Have a code?</Text>
            <Text style={styles.headingCopy}>
              Enter the 8-character code your partner sent you.
            </Text>
            <Field
              label="Couple code"
              value={joinCode}
              onChangeText={(value) => setJoinCode(value.toUpperCase())}
              placeholder="ABCD2345"
              autoCapitalize="characters"
              autoCorrect={false}
              maxLength={12}
            />
            <Button
              label={busy === 'join' ? 'CONNECTING…' : 'CONNECT'}
              loading={busy === 'join'}
              disabled={joinCode.trim().length < 8}
              onPress={() => void join()}
            />
          </Card>
        </>
      )}

      <Text style={styles.safety}>
        Nourish never shares raw symptoms, period end dates, meal contents,
        nutrition values, or account identifiers with a partner. Disconnecting
        revokes access immediately.
      </Text>
    </NeoScreenWrapper>
  );
}

function SharingRow({
  icon,
  title,
  detail,
  value,
  disabled,
  onValueChange,
  last = false,
}: {
  icon: React.ComponentProps<typeof Icon>['name'];
  title: string;
  detail: string;
  value: boolean;
  disabled: boolean;
  onValueChange: (value: boolean) => void;
  last?: boolean;
}) {
  return (
    <View style={[styles.sharingRow, !last && styles.sharingDivider]}>
      <View style={styles.sharingIcon}>
        <Icon name={icon} size={22} color={colors.ink} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.sharingTitle}>{title}</Text>
        <Text style={styles.sharingDetail}>{detail}</Text>
      </View>
      <Switch
        accessibilityLabel={`Share ${title}`}
        value={value}
        disabled={disabled}
        onValueChange={onValueChange}
        trackColor={{ false: colors.surfaceHighest, true: colors.activeLime }}
        thumbColor={colors.ink}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: spacing.md, paddingBottom: spacing.section },
  settingsCard: { gap: spacing.md, backgroundColor: colors.white },
  headingRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  headingIcon: {
    width: 48,
    height: 48,
    borderRadius: radii.pill,
    borderWidth: border.standard,
    borderColor: colors.ink,
    backgroundColor: colors.butterCard,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headingTitle: { ...typography.cardTitle },
  headingCopy: { ...typography.bodySmall, color: colors.secondaryInk, marginTop: 3 },
  twoFields: { flexDirection: 'row', gap: spacing.sm },
  signInCard: {
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.mintCard,
    marginTop: spacing.lg,
    padding: spacing.xl,
  },
  partnerCard: { marginTop: spacing.lg, backgroundColor: colors.coralCard },
  partnerHeading: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  avatar: {
    width: 58,
    height: 58,
    borderRadius: radii.pill,
    borderWidth: border.standard,
    borderColor: colors.ink,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  partnerName: { ...typography.cardTitle },
  connectedAt: { ...typography.caption, marginTop: 3 },
  connectedPill: {
    borderWidth: border.standard,
    borderColor: colors.ink,
    borderRadius: radii.pill,
    backgroundColor: colors.activeLime,
    paddingHorizontal: spacing.xs,
    paddingVertical: 5,
  },
  connectedPillText: { ...typography.caption, fontFamily: fonts.bold },
  sectionTitle: { ...typography.cardTitle, marginTop: spacing.xl, marginBottom: spacing.xs },
  sectionCopy: { ...typography.bodySmall, color: colors.secondaryInk, marginBottom: spacing.sm },
  sharingCard: { overflow: 'hidden' },
  sharingRow: {
    minHeight: 94,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
  },
  sharingDivider: { borderBottomWidth: border.standard, borderBottomColor: colors.ink },
  sharingIcon: {
    width: 44,
    height: 44,
    borderRadius: radii.pill,
    borderWidth: border.standard,
    borderColor: colors.ink,
    backgroundColor: colors.surfaceLow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sharingTitle: { ...typography.body, fontFamily: fonts.semibold },
  sharingDetail: { ...typography.caption, color: colors.secondaryInk, marginTop: 3 },
  connectCard: { gap: spacing.md, backgroundColor: colors.white },
  codeBox: {
    borderWidth: border.standard,
    borderColor: colors.ink,
    borderRadius: radii.md,
    backgroundColor: colors.activeLime,
    padding: spacing.lg,
    alignItems: 'center',
    gap: spacing.xs,
  },
  codeLabel: { ...typography.caption, fontFamily: fonts.bold, letterSpacing: 1 },
  codeValue: {
    ...typography.metric,
    fontSize: 34,
    letterSpacing: 4,
    fontVariant: ['tabular-nums'],
  },
  codeExpiry: { ...typography.caption, marginBottom: spacing.sm },
  orRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginVertical: spacing.lg },
  orLine: { height: border.standard, flex: 1, backgroundColor: colors.ink },
  orText: { ...typography.label },
  joinCard: { gap: spacing.md, backgroundColor: colors.skyAccent },
  safety: {
    ...typography.caption,
    lineHeight: 17,
    textAlign: 'center',
    marginTop: spacing.xl,
    paddingHorizontal: spacing.md,
  },
});
