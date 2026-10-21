import React, { useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/types';
import { requestOtp, verifyOtp } from '../../data/api';
import { useApp } from '../../state/AppProvider';
import { colors, fonts, radii, spacing, type } from '../../theme';
import { Banner, Button, Field, Header, Screen } from '../../components/ui';

type Props = NativeStackScreenProps<RootStackParamList, 'SignIn'>;

export function normalizeEthiopianPhone(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  if (digits.startsWith('251')) return `+${digits}`;
  if (digits.startsWith('0')) return `+251${digits.slice(1)}`;
  if (digits.length === 9) return `+251${digits}`;
  return raw.trim();
}

function isValidPhone(raw: string): boolean {
  return /^\+251(9|7)\d{8}$/.test(normalizeEthiopianPhone(raw));
}

export function SignInScreen({ navigation }: Props) {
  const { setSession, patchOnboarding, state } = useApp();
  const [step, setStep] = useState<'phone' | 'code'>('phone');
  const [phone, setPhone] = useState('+251');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const codeRef = useRef<React.ComponentRef<typeof TextInput>>(null);

  const sendCode = async () => {
    setError(null);
    if (!isValidPhone(phone)) {
      setError('Enter a valid Ethiopian mobile number.');
      return;
    }
    setBusy(true);
    try {
      const result = await requestOtp(normalizeEthiopianPhone(phone));
      setPhone(normalizeEthiopianPhone(phone));
      setStep('code');
      setNotice(`Code sent. It expires in ${Math.ceil((result.expiresIn || 300) / 60)} minutes.`);
      setTimeout(() => codeRef.current?.focus(), 250);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Could not send a code.');
    } finally {
      setBusy(false);
    }
  };

  const signIn = async () => {
    setError(null);
    if (!/^\d{6}$/.test(code)) {
      setError('Enter the 6-digit code from your SMS.');
      return;
    }
    setBusy(true);
    try {
      const result = await verifyOtp(phone, code);
      setSession(result.session);
      if (!state.onboarding.completed) {
        patchOnboarding({ started: true, step: 1 });
      } else {
        navigation.reset({
          index: 0,
          routes: [{ name: 'MainTabs', params: { screen: 'Profile' } }],
        });
      }
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Could not sign in.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Screen>
        <Header
          onBack={() => {
            if (step === 'code') {
              setStep('phone');
              setCode('');
              setNotice(null);
            } else {
              navigation.goBack();
            }
          }}
        />
        <View style={styles.body}>
          <View style={styles.mark}>
            <Text style={styles.markText}>N</Text>
          </View>
          <Text style={styles.title}>{step === 'phone' ? 'Welcome back' : 'Check your messages'}</Text>
          <Text style={styles.copy}>
            {step === 'phone'
              ? 'Sign in with your Ethiopian mobile number to back up your nutrition history.'
              : `Enter the six-digit code sent to ${phone}.`}
          </Text>
          <View style={styles.form}>
            {step === 'phone' ? (
              <Field
                label="Mobile number"
                value={phone}
                onChangeText={(value) => {
                  setPhone(value);
                  setError(null);
                }}
                keyboardType="phone-pad"
                autoComplete="tel"
                textContentType="telephoneNumber"
                placeholder="+251 911 234 567"
                returnKeyType="done"
                onSubmitEditing={sendCode}
              />
            ) : (
              <View style={{ gap: spacing.xs }}>
                <Text style={type.label}>SIX-DIGIT CODE</Text>
                <TextInput
                  ref={codeRef}
                  accessibilityLabel="Six-digit sign-in code"
                  value={code}
                  onChangeText={(value) => {
                    setCode(value.replace(/\D/g, '').slice(0, 6));
                    setError(null);
                  }}
                  keyboardType="number-pad"
                  autoComplete="one-time-code"
                  textContentType="oneTimeCode"
                  maxLength={6}
                  style={styles.codeInput}
                  selectionColor={colors.primary}
                  placeholder="000000"
                  placeholderTextColor={colors.outlineVariant}
                />
                <Pressable onPress={sendCode} disabled={busy} style={styles.resend}>
                  <Text style={styles.resendText}>Resend code</Text>
                </Pressable>
              </View>
            )}
            {notice ? <Banner tone="success" icon="check-circle" title="Code sent" message={notice} /> : null}
            {error ? <Banner tone="error" icon="alert-circle" title="Couldn’t continue" message={error} /> : null}
          </View>
        </View>
        <View style={styles.footer}>
          <Button
            label={step === 'phone' ? 'SEND CODE' : 'SIGN IN'}
            loading={busy}
            onPress={step === 'phone' ? sendCode : signIn}
          />
          <Text style={styles.privacy}>
            By continuing you agree to Nourish’s Terms and Privacy Policy. We never use your food data
            to train models without permission.
          </Text>
        </View>
      </Screen>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  body: { flex: 1, paddingHorizontal: spacing.xl, paddingTop: spacing.xxl },
  mark: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  markText: { fontFamily: fonts.bold, fontSize: 30, color: colors.primary },
  title: { ...type.headline, marginTop: spacing.xl },
  copy: { ...type.body, color: colors.onSurfaceVariant, marginTop: spacing.sm, maxWidth: 340 },
  form: { gap: spacing.md, marginTop: spacing.xxl },
  codeInput: {
    height: 68,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    backgroundColor: colors.white,
    textAlign: 'center',
    fontFamily: fonts.semibold,
    fontSize: 28,
    letterSpacing: 12,
    color: colors.onSurface,
    outlineStyle: 'none' as never,
  },
  resend: { alignSelf: 'flex-end', paddingVertical: spacing.xs },
  resendText: { ...type.bodySmall, color: colors.primary, fontFamily: fonts.semibold },
  footer: { padding: spacing.xl, gap: spacing.md },
  privacy: { ...type.caption, textAlign: 'center', lineHeight: 18 },
});
