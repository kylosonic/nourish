import React from 'react';
import {
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
import { Banner, Button, Card, Icon } from '../../components/ui';

type Props = NativeStackScreenProps<RootStackParamList, 'Privacy'>;

export function PrivacyScreen({ navigation }: Props) {
  const { state, patchSettings } = useApp();
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
        <Text style={styles.title}>Privacy Center</Text>
        <View style={{ width: 40 }} />
      </View>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={styles.heroIcon}>
          <Icon name="shield-check-outline" size={34} color={colors.primary} />
        </View>
        <Text style={styles.heading}>Your health data is yours.</Text>
        <Text style={styles.subcopy}>
          Nourish keeps an offline copy of your log on this device. Optional processing is separate
          from using the app, and declining never blocks core tracking.
        </Text>

        <Text style={styles.sectionLabel}>OPTIONAL CONSENT</Text>
        <Card style={styles.consentCard}>
          <ConsentRow
            title="AI improvement"
            detail="Allow metadata-stripped corrections to help improve food recognition. This is off by default."
            value={state.settings.aiImprovementConsent}
            onChange={(value) => patchSettings({ aiImprovementConsent: value })}
          />
          <View style={styles.divider} />
          <ConsentRow
            title="Product analytics"
            detail="Allow non-nutrition usage events. Meal names, weights, and body details are never sent."
            value={state.settings.analyticsConsent}
            onChange={(value) => patchSettings({ analyticsConsent: value })}
          />
        </Card>

        <Text style={styles.sectionLabel}>FOOD PHOTOS</Text>
        <Card style={styles.infoCard}>
          <Icon name="camera-off-outline" size={25} color={colors.primary} />
          <View style={{ flex: 1 }}>
            <Text style={styles.infoTitle}>Analyzed images are not retained</Text>
            <Text style={styles.infoCopy}>
              The current API keeps the uploaded bytes only for the analysis request. Location and
              device metadata are not included. Analysis metadata may be purged on the configured
              retention schedule.
            </Text>
          </View>
        </Card>

        <Text style={styles.sectionLabel}>YOUR DATA RIGHTS</Text>
        <Card style={styles.rightsCard}>
          <Text style={styles.infoTitle}>Export</Text>
          <Text style={styles.infoCopy}>
            Create a machine-readable copy of your profile, target, meals, water, weight, and queues
            from Profile → Export my data.
          </Text>
          <Button
            label="GO TO PROFILE"
            variant="secondary"
            onPress={() =>
              navigation.reset({
                index: 0,
                routes: [{ name: 'MainTabs', params: { screen: 'Profile' } }],
              })
            }
            style={{ marginTop: spacing.md }}
          />
          <View style={styles.divider} />
          <Text style={styles.infoTitle}>Account deletion</Text>
          <Text style={styles.infoCopy}>
            Server-side account erasure is not enabled in this build. Deleting local app data is
            available in Profile and immediately removes this device’s copy.
          </Text>
        </Card>

        <Banner
          tone="warning"
          icon="medical-bag"
          title="Health disclaimer"
          message="Nourish is a general wellness tool. It does not diagnose, treat, or replace care from a qualified nutrition or medical professional."
        />
        <Button
          label="READ FULL PRIVACY POLICY"
          variant="secondary"
          onPress={() =>
            void Linking.openURL('https://nourish.app/privacy')
          }
          style={{ marginTop: spacing.lg }}
        />
        <Text style={styles.footer}>
          Consent changes apply to future processing. Contact privacy@nourish.app for a data-rights
          request while server-side deletion is being completed.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function ConsentRow({
  title,
  detail,
  value,
  onChange,
}: {
  title: string;
  detail: string;
  value: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <View style={styles.consentRow}>
      <View style={{ flex: 1 }}>
        <Text style={styles.infoTitle}>{title}</Text>
        <Text style={styles.infoCopy}>{detail}</Text>
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

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.surface },
  header: { height: 64, flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.xl },
  back: { width: 40, height: 40, justifyContent: 'center' },
  title: { ...type.title, flex: 1, textAlign: 'center', fontSize: 22 },
  content: { padding: spacing.xl, paddingTop: spacing.sm, paddingBottom: spacing.xxl },
  heroIcon: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heading: { ...type.headline, marginTop: spacing.lg },
  subcopy: { ...type.body, color: colors.onSurfaceVariant, marginTop: spacing.xs },
  sectionLabel: { ...type.label, marginTop: spacing.xl, marginBottom: spacing.sm },
  consentCard: { paddingHorizontal: spacing.md },
  consentRow: { minHeight: 96, flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.md },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.surfaceHighest },
  infoCard: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md, padding: spacing.lg },
  infoTitle: { ...type.body, fontFamily: fonts.semibold },
  infoCopy: { ...type.bodySmall, color: colors.onSurfaceVariant, marginTop: 3, lineHeight: 20 },
  rightsCard: { padding: spacing.lg },
  footer: { ...type.caption, textAlign: 'center', marginTop: spacing.lg, lineHeight: 18 },
});
