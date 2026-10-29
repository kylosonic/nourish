import React, { useState } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import {
  type AppPermissionResult,
  type AppPermissionResults,
  requestAppPermissions,
} from '../../services/permissions';
import { Button, Card, Icon, type IconName } from '../../components/ui';
import { NeoFoodMascot, NeoScreenWrapper } from '../../components/neo';
import { border, colors, fonts, radii, spacing, type } from '../../theme';

const permissionRows: {
  key: keyof AppPermissionResults;
  title: string;
  detail: string;
  icon: IconName;
}[] = [
  {
    key: 'camera',
    title: 'Camera',
    detail: 'Photograph a plate for automatic food suggestions.',
    icon: 'camera-outline',
  },
  {
    key: 'photos',
    title: 'Photos',
    detail: 'Choose an existing meal photo from your library.',
    icon: 'image-multiple-outline',
  },
  {
    key: 'notifications',
    title: 'Notifications',
    detail: 'Get optional hydration reminders during the day.',
    icon: 'bell-outline',
  },
];

function statusLabel(status?: AppPermissionResult): string {
  switch (status) {
    case 'granted':
      return 'ALLOWED';
    case 'limited':
      return 'LIMITED';
    case 'denied':
      return 'OFF';
    case 'unavailable':
      return 'CHECK LATER';
    case 'app-only':
      return 'IN APP';
    default:
      return 'NEEDED';
  }
}

export function PermissionSetupScreen({ onComplete }: { onComplete: () => void }) {
  const [results, setResults] = useState<AppPermissionResults | null>(null);
  const [busy, setBusy] = useState(false);
  const isWeb = Platform.OS === 'web';

  const requestPermissions = async () => {
    if (isWeb) {
      onComplete();
      return;
    }
    setBusy(true);
    try {
      setResults(await requestAppPermissions());
    } finally {
      setBusy(false);
    }
  };

  return (
    <NeoScreenWrapper tone="lavender" scroll contentStyle={styles.content}>
      <View style={styles.hero}>
        <View style={styles.mascot}>
          <NeoFoodMascot size={104} />
        </View>
        <View style={styles.heroCopy}>
          <Text style={styles.eyebrow}>BEFORE YOU START</Text>
          <Text style={styles.title}>A few permissions.</Text>
          <Text style={styles.subtitle}>
            Used only for scanning and reminders. Manual search always works.
          </Text>
        </View>
      </View>

      <View style={styles.permissionList}>
        {permissionRows.map((item) => {
          const status = results?.[item.key];
          return (
            <Card key={item.key} style={styles.permissionCard}>
              <View style={styles.permissionIcon}>
                <Icon name={item.icon} size={24} color={colors.ink} />
              </View>
              <View style={styles.permissionCopy}>
                <Text style={styles.permissionTitle}>{item.title}</Text>
                <Text style={styles.permissionDetail}>{item.detail}</Text>
              </View>
              <View
                style={[
                  styles.status,
                  status === 'denied' && styles.statusDenied,
                  status === 'granted' && styles.statusGranted,
                ]}
              >
                <Text style={styles.statusText}>{statusLabel(status)}</Text>
              </View>
            </Card>
          );
        })}
      </View>

      <Text style={styles.note}>
        {isWeb
          ? 'Native permission prompts appear in the installed Android or iOS app.'
          : results
            ? 'You can change these later in device settings. Nourish still works without them.'
            : 'iOS and Android will show their system prompts next.'}
      </Text>

      <View style={styles.actions}>
        {results ? (
          <Button label="CONTINUE" icon="arrow-right" onPress={onComplete} />
        ) : (
          <Button
            label={isWeb ? 'CONTINUE' : 'ALLOW PERMISSIONS'}
            icon={isWeb ? 'arrow-right' : 'shield-check-outline'}
            loading={busy}
            onPress={() => void requestPermissions()}
          />
        )}
        {!results && !isWeb ? (
          <Button
            label="NOT NOW"
            variant="outline"
            disabled={busy}
            onPress={onComplete}
          />
        ) : null}
      </View>
    </NeoScreenWrapper>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  hero: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  mascot: {
    width: 110,
    height: 110,
    borderRadius: radii.lg,
    borderWidth: border.standard,
    borderColor: colors.ink,
    backgroundColor: colors.butterCard,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  heroCopy: { flex: 1 },
  eyebrow: {
    ...type.caption,
    fontFamily: fonts.bold,
    letterSpacing: 1,
  },
  title: {
    ...type.headline,
    marginTop: spacing.xxs,
  },
  subtitle: {
    ...type.body,
    color: colors.secondaryInk,
    marginTop: spacing.xs,
  },
  permissionList: {
    gap: spacing.sm,
    marginTop: spacing.xl,
  },
  permissionCard: {
    minHeight: 92,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.sm,
    backgroundColor: colors.white,
  },
  permissionIcon: {
    width: 48,
    height: 48,
    borderRadius: radii.pill,
    borderWidth: border.standard,
    borderColor: colors.ink,
    backgroundColor: colors.butterCard,
    alignItems: 'center',
    justifyContent: 'center',
  },
  permissionCopy: { flex: 1, minWidth: 0 },
  permissionTitle: { ...type.cardTitle, fontSize: 16, lineHeight: 20 },
  permissionDetail: {
    ...type.caption,
    color: colors.secondaryInk,
    marginTop: 2,
  },
  status: {
    borderRadius: radii.pill,
    borderWidth: border.standard,
    borderColor: colors.ink,
    backgroundColor: colors.white,
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
  },
  statusGranted: { backgroundColor: colors.mintCard },
  statusDenied: { backgroundColor: colors.coralCard },
  statusText: {
    ...type.caption,
    fontFamily: fonts.bold,
    fontSize: 9,
  },
  note: {
    ...type.caption,
    color: colors.secondaryInk,
    marginTop: spacing.lg,
    textAlign: 'center',
  },
  actions: {
    gap: spacing.sm,
    marginTop: spacing.xl,
  },
});
