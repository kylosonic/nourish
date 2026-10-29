import React from 'react';
import {
  Linking,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/types';
import { useApp } from '../../state/AppProvider';
import { border, colors, fonts, spacing, type } from '../../theme';
import { Banner, Button, Card, Icon } from '../../components/ui';
import { NeoScreenWrapper, NeoTopBar } from '../../components/neo';

type Props = NativeStackScreenProps<RootStackParamList, 'Privacy'>;

export function PrivacyScreen({ navigation }: Props) {
  const { state, updateConsent } = useApp();
  return (
    <NeoScreenWrapper tone="lavender" scroll contentStyle={styles.content}>
      <NeoTopBar
        title="Privacy center"
        leftColor={colors.butterCard}
        rightColor={colors.coralButton}
        onBack={() => navigation.goBack()}
      />
        <View style={styles.heroIcon}>
          <Icon name="shield-check-outline" size={34} color={colors.primary} />
        </View>
        <Text style={styles.heading}>Your health data is yours.</Text>
        <Text style={styles.subcopy}>Your health data stays under your control.</Text>

        <Text style={styles.sectionLabel}>OPTIONAL CONSENT</Text>
        <Card style={styles.consentCard}>
          <ConsentRow
            title="AI improvement"
            detail="Optional and off by default."
            value={state.settings.aiImprovementConsent}
            onChange={(value) =>
              void updateConsent({ aiImprovement: value })
            }
          />
          <View style={styles.divider} />
          <ConsentRow
            title="Product analytics"
            detail="No meal names or body data."
            value={state.settings.analyticsConsent}
            onChange={(value) => void updateConsent({ analytics: value })}
          />
        </Card>

        <Text style={styles.sectionLabel}>FOOD PHOTOS</Text>
        <Card style={styles.infoCard}>
          <Icon name="camera-off-outline" size={25} color={colors.primary} />
          <View style={{ flex: 1 }}>
            <Text style={styles.infoTitle}>Analyzed images are not retained</Text>
            <Text style={styles.infoCopy}>Photos are processed for one request and not retained.</Text>
          </View>
        </Card>

        <Text style={styles.sectionLabel}>YOUR DATA RIGHTS</Text>
        <Card style={styles.rightsCard}>
          <Text style={styles.infoTitle}>Export</Text>
          <Text style={styles.infoCopy}>Download your profile and health logs as JSON.</Text>
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
            Delete your account and all server-side health data permanently.
            Local data is also wiped.
          </Text>
          <Button
            label="DELETE ACCOUNT"
            variant="secondary"
            onPress={() => navigation.navigate('DeleteAccount')}
            style={{ marginTop: spacing.md }}
          />
        </Card>

        <Banner
          tone="warning"
          icon="medical-bag"
          title="Health disclaimer"
          message="Nourish does not diagnose, treat, or replace professional care."
        />
        <Button
          label="READ FULL PRIVACY POLICY"
          variant="secondary"
          onPress={() =>
            void Linking.openURL('https://nourish-kylosonic.vercel.app/privacy')
          }
          style={{ marginTop: spacing.lg }}
        />
        <Text style={styles.footer}>Consent changes apply to future processing.</Text>
    </NeoScreenWrapper>
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
        trackColor={{ true: colors.activeLime, false: colors.white }}
        thumbColor={colors.white}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingTop: spacing.xs,
    paddingBottom: 96,
  },
  heroIcon: {
    width: 68,
    height: 68,
    borderRadius: 34,
    borderWidth: border.standard,
    borderColor: colors.ink,
    backgroundColor: colors.mintCard,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heading: { ...type.headline, marginTop: spacing.lg },
  subcopy: { ...type.body, color: colors.onSurfaceVariant, marginTop: spacing.xs },
  sectionLabel: { ...type.label, marginTop: spacing.xl, marginBottom: spacing.sm },
  consentCard: { paddingHorizontal: spacing.md, backgroundColor: colors.white },
  consentRow: { minHeight: 96, flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.md },
  divider: { height: border.standard, backgroundColor: colors.ink },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    padding: spacing.lg,
    backgroundColor: colors.mintCard,
  },
  infoTitle: { ...type.body, fontFamily: fonts.semibold },
  infoCopy: { ...type.bodySmall, color: colors.onSurfaceVariant, marginTop: 3, lineHeight: 20 },
  rightsCard: { padding: spacing.lg, backgroundColor: colors.white },
  footer: { ...type.caption, textAlign: 'center', marginTop: spacing.lg, lineHeight: 18 },
});
