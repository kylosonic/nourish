import React, { useState } from 'react';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/types';
import { useEntitlements } from '../../state/EntitlementProvider';
import { border, colors, fonts, radii, spacing, type } from '../../theme';
import { Banner, Button, Card, Icon } from '../../components/ui';
import { NeoScreenWrapper, NeoTopBar } from '../../components/neo';

type Props = NativeStackScreenProps<RootStackParamList, 'Paywall'>;

export function PaywallScreen({ navigation }: Props) {
  const {
    plans,
    entitlement,
    loading,
    purchase,
    restore,
    error,
    mode,
  } = useEntitlements();
  const [selected, setSelected] = useState<string | null>(null);
  const effectiveSelected =
    selected ??
    plans.find((plan) => plan.period === 'annual')?.id ??
    plans[0]?.id ??
    null;

  return (
    <NeoScreenWrapper tone="lavender" scroll contentStyle={styles.content}>
      <NeoTopBar
        title="Nourish Plus"
        leftColor={colors.butterCard}
        rightColor={colors.pinkAccent}
        onBack={() => navigation.goBack()}
        rightIcon="close"
        onRight={() => navigation.goBack()}
      />

      <View style={styles.hero}>
        <View style={styles.proMark}>
          <Icon name="crown-outline" size={38} color={colors.ink} />
        </View>
        <Text style={styles.kicker}>NOURISH PLUS</Text>
        <Text style={styles.title}>More understanding, less guesswork.</Text>
        <Text style={styles.copy}>
          Unlock packaged-food label reading and future premium nutrition tools.
          Your food database and calorie targets stay deterministic.
        </Text>
      </View>

      <View style={styles.benefits}>
        <Benefit icon="text-recognition" text="Read nutrition labels on-device through your account" />
        <Benefit icon="barcode-scan" text="Keep barcode lookup and verified product data" />
        <Benefit icon="shield-check-outline" text="Cancel through your app store at any time" />
      </View>

      {mode === 'mock' ? (
        <Banner
          tone="warning"
          icon="flask-outline"
          title="UAT mock billing"
          message="RevenueCat keys are not configured. Purchases here unlock Plus only on this device for testing."
        />
      ) : null}

      {entitlement.isPro ? (
        <Card style={styles.activeCard}>
          <Icon name="check-decagram" size={32} color={colors.primary} />
          <Text style={styles.activeTitle}>Nourish Plus is active</Text>
          <Text style={styles.copy}>Premium features are unlocked on this device.</Text>
          <Button label="CONTINUE" onPress={() => navigation.goBack()} />
        </Card>
      ) : (
        <>
          <View style={styles.planRow}>
            {plans.map((plan) => {
              const isSelected = effectiveSelected === plan.id;
              return (
                <Pressable
                  key={plan.id}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isSelected }}
                  onPress={() => setSelected(plan.id)}
                  style={[styles.plan, isSelected && styles.planSelected]}
                >
                  {plan.period === 'annual' ? (
                    <View style={styles.bestValue}>
                      <Text style={styles.bestValueText}>BEST VALUE</Text>
                    </View>
                  ) : null}
                  <Text style={styles.planTitle}>{plan.title}</Text>
                  <Text style={styles.planPrice}>{plan.price}</Text>
                  <Text style={styles.planPeriod}>
                    {plan.period === 'annual' ? 'per year' : 'per month'}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {plans.length === 0 && !loading ? (
            <Banner
              tone="warning"
              icon="store-off-outline"
              title="Subscriptions unavailable"
              message="Store billing is not configured for this build."
            />
          ) : null}
          {error ? (
            <Banner tone="error" icon="alert-circle" title="Purchase issue" message={error} />
          ) : null}
          <Button
            label="START NOURISH PLUS"
            loading={loading}
            disabled={!effectiveSelected}
            onPress={() =>
              effectiveSelected && void purchase(effectiveSelected)
            }
            style={{ marginTop: spacing.lg }}
          />
          <Button
            label="RESTORE PURCHASES"
            variant="secondary"
            loading={loading}
            onPress={() => void restore()}
            style={{ marginTop: spacing.sm }}
          />
        </>
      )}

      <Text style={styles.legal}>
        Subscriptions renew automatically unless cancelled at least 24 hours
        before renewal. Manage billing in your app store.
      </Text>
      <View style={styles.links}>
        <Pressable
          onPress={() =>
            void Linking.openURL('https://nourish-kylosonic.vercel.app/terms')
          }
        >
          <Text style={styles.link}>Terms of Service</Text>
        </Pressable>
        <Pressable
          onPress={() =>
            void Linking.openURL('https://nourish-kylosonic.vercel.app/privacy')
          }
        >
          <Text style={styles.link}>Privacy Policy</Text>
        </Pressable>
      </View>
    </NeoScreenWrapper>
  );
}

function Benefit({ icon, text }: { icon: 'text-recognition' | 'barcode-scan' | 'shield-check-outline'; text: string }) {
  return (
    <View style={styles.benefit}>
      <View style={styles.benefitIcon}>
        <Icon name={icon} size={22} color={colors.ink} />
      </View>
      <Text style={styles.benefitText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { paddingTop: spacing.xs, paddingBottom: 96 },
  hero: { alignItems: 'center', marginTop: spacing.lg },
  proMark: {
    width: 82,
    height: 82,
    borderRadius: 41,
    borderWidth: border.standard,
    borderColor: colors.ink,
    backgroundColor: colors.butterCard,
    alignItems: 'center',
    justifyContent: 'center',
  },
  kicker: { ...type.label, marginTop: spacing.lg },
  title: { ...type.headline, fontSize: 36, lineHeight: 40, textAlign: 'center', marginTop: spacing.sm },
  copy: { ...type.body, color: colors.onSurfaceVariant, textAlign: 'center', lineHeight: 22, marginTop: spacing.sm },
  benefits: { gap: spacing.sm, marginTop: spacing.xl, marginBottom: spacing.lg },
  benefit: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderRadius: 16,
    borderWidth: border.standard,
    borderColor: colors.ink,
    backgroundColor: colors.white,
    padding: spacing.md,
  },
  benefitIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: border.standard,
    borderColor: colors.ink,
    backgroundColor: colors.mintCard,
    alignItems: 'center',
    justifyContent: 'center',
  },
  benefitText: { ...type.body, flex: 1, fontFamily: fonts.semibold },
  planRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  plan: {
    flex: 1,
    minHeight: 154,
    borderRadius: radii.lg,
    borderWidth: border.standard,
    borderColor: colors.ink,
    backgroundColor: colors.white,
    padding: spacing.md,
    overflow: 'hidden',
  },
  planSelected: { backgroundColor: colors.mintCard, borderWidth: 3 },
  bestValue: {
    alignSelf: 'flex-start',
    borderRadius: radii.pill,
    backgroundColor: colors.pinkAccent,
    borderWidth: border.thin,
    borderColor: colors.ink,
    paddingHorizontal: spacing.xs,
    paddingVertical: 3,
    marginBottom: spacing.sm,
  },
  bestValueText: { ...type.caption, fontFamily: fonts.bold },
  planTitle: { ...type.body, fontFamily: fonts.semibold },
  planPrice: { fontFamily: fonts.bold, fontSize: 28, color: colors.ink, marginTop: spacing.sm },
  planPeriod: { ...type.caption, marginTop: 2 },
  activeCard: { padding: spacing.lg, gap: spacing.md, alignItems: 'center', backgroundColor: colors.mintCard },
  activeTitle: { ...type.title },
  legal: { ...type.caption, textAlign: 'center', lineHeight: 17, marginTop: spacing.xl },
  links: { flexDirection: 'row', justifyContent: 'center', gap: spacing.lg, marginTop: spacing.md },
  link: { ...type.bodySmall, fontFamily: fonts.semibold, textDecorationLine: 'underline' },
});
