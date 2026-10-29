import React, { useCallback, useEffect, useRef, useState } from 'react';
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
import { useIdTokenAuthRequest } from 'expo-auth-session/providers/google';
import type { RootStackParamList } from '../../navigation/types';
import {
  loginEmail,
  registerEmail,
  requestEmailOtp,
  requestOtp,
  signInWithGoogle,
  verifyEmailOtp,
  verifyOtp,
} from '../../data/api';
import { useApp } from '../../state/AppProvider';
import { border, colors, fonts, radii, spacing, type } from '../../theme';
import { Banner, Button, Field } from '../../components/ui';
import { NeoScreenWrapper, NeoTopBar } from '../../components/neo';
import type { AccountSession } from '../../types';
import { showAlert } from '../../utils/dialog';

type Props = NativeStackScreenProps<RootStackParamList, 'SignIn'>;
type Mode = 'choose' | 'email' | 'email-code' | 'phone' | 'code';
type EmailMode = 'signup' | 'login';

const webClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID?.trim();
const iosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID?.trim();
const androidClientId = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID?.trim();
const googleConfigured =
  Platform.OS === 'android'
    ? Boolean(androidClientId || webClientId)
    : Platform.OS === 'ios'
      ? Boolean(iosClientId || webClientId)
      : Boolean(webClientId);

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
  const [mode, setMode] = useState<Mode>('choose');
  const [emailMode, setEmailMode] = useState<EmailMode>('signup');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('+251');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [emailCodeSent, setEmailCodeSent] = useState(false);
  const codeRef = useRef<React.ComponentRef<typeof TextInput>>(null);

  const finishAuth = useCallback(
    (session: AccountSession) => {
      setSession(session);
      if (!state.onboarding.completed) {
        patchOnboarding({ started: true, step: 1 });
        navigation.reset({
          index: 0,
          routes: [{ name: 'Language' }],
        });
      } else {
        navigation.reset({
          index: 0,
          routes: [{ name: 'MainTabs', params: { screen: 'Profile' } }],
        });
      }
    },
    [navigation, patchOnboarding, setSession, state.onboarding.completed],
  );

  const submitEmail = async () => {
    setError(null);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Enter a valid email address.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    setBusy(true);
    try {
      const result =
        emailMode === 'signup'
          ? await registerEmail(email.trim(), password, displayName.trim() || undefined)
          : await loginEmail(email.trim(), password);
      finishAuth(result.session);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Could not continue.');
    } finally {
      setBusy(false);
    }
  };

  const submitGoogleToken = async (idToken: string) => {
    setBusy(true);
    setError(null);
    try {
      const result = await signInWithGoogle(idToken);
      finishAuth(result.session);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Google sign-in failed.');
    } finally {
      setBusy(false);
    }
  };

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
      setMode('code');
      setNotice(`Code sent. Valid for ${Math.ceil((result.expiresIn || 300) / 60)} minutes.`);
      setTimeout(() => codeRef.current?.focus(), 250);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Could not send a code.');
    } finally {
      setBusy(false);
    }
  };

  const sendEmailCode = async () => {
    setError(null);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Enter a valid email address.');
      return;
    }
    setBusy(true);
    try {
      const result = await requestEmailOtp(email.trim());
      setEmail(result.email);
      setEmailCodeSent(true);
      setCode('');
      setNotice(
        `Code sent. Valid for ${Math.ceil((result.expiresIn || 300) / 60)} minutes.`,
      );
      setTimeout(() => codeRef.current?.focus(), 250);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Could not send an email code.',
      );
    } finally {
      setBusy(false);
    }
  };

  const submitMessageCode = async () => {
    setError(null);
    if (!/^\d{6}$/.test(code)) {
      setError('Enter the 6-digit code.');
      return;
    }
    setBusy(true);
    try {
      const result = await verifyOtp(phone, code);
      finishAuth(result.session);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Could not sign in.');
    } finally {
      setBusy(false);
    }
  };

  const submitEmailCode = async () => {
    setError(null);
    if (!/^\d{6}$/.test(code)) {
      setError('Enter the 6-digit code.');
      return;
    }
    setBusy(true);
    try {
      const result = await verifyEmailOtp(email.trim(), code);
      finishAuth(result.session);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Could not sign in.',
      );
    } finally {
      setBusy(false);
    }
  };

  const goBack = () => {
    setError(null);
    setNotice(null);
    if (mode === 'choose') navigation.goBack();
    else if (mode === 'code') setMode('phone');
    else if (mode === 'email-code') {
      if (emailCodeSent) setEmailCodeSent(false);
      else setMode('choose');
    }
    else setMode('choose');
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <NeoScreenWrapper tone="lavender">
        <NeoTopBar
          title="Nourish"
          leftColor={colors.butterCard}
          rightColor={colors.pinkAccent}
          onBack={goBack}
          rightIcon="account-outline"
        />
        <View style={styles.body}>
          <View style={styles.mark}>
            <Text style={styles.markText}>N</Text>
          </View>

          {mode === 'choose' ? (
            <>
              <Text style={styles.title}>Welcome</Text>
              <Text style={styles.copy}>Choose how to continue.</Text>
              <View style={styles.actions}>
                {googleConfigured ? (
                  <GoogleSignInButton
                    busy={busy}
                    onToken={(token) => void submitGoogleToken(token)}
                    onStart={() => {
                      setBusy(true);
                      setError(null);
                    }}
                    onCancel={() => setBusy(false)}
                  />
                ) : (
                  <Button
                    label="CONTINUE WITH GOOGLE"
                    variant="outline"
                    icon="google"
                    onPress={() =>
                      showAlert(
                        'Google sign-in needs setup',
                        'Add the Google OAuth client IDs to the app and API environment, then rebuild.',
                      )
                    }
                  />
                )}
                <Button
                  label="CONTINUE WITH EMAIL"
                  icon="email-outline"
                  onPress={() => {
                    setMode('email');
                    setEmailMode('signup');
                  }}
                />
                <Button
                  label="USE PHONE"
                  variant="secondary"
                  icon="phone-outline"
                  onPress={() => setMode('phone')}
                />
                <Button
                  label="EMAIL ME A CODE"
                  variant="outline"
                  icon="email-fast-outline"
                  onPress={() => {
                    setMode('email-code');
                    setEmailCodeSent(false);
                  }}
                />
              </View>
            </>
          ) : null}

          {mode === 'email' ? (
            <>
              <Text style={styles.title}>
                {emailMode === 'signup' ? 'Create account' : 'Welcome back'}
              </Text>
              <Text style={styles.copy}>
                {emailMode === 'signup'
                  ? 'Save your history.'
                  : 'Sign in to continue.'}
              </Text>
              <View style={styles.form}>
                {emailMode === 'signup' ? (
                  <Field
                    label="Name"
                    value={displayName}
                    onChangeText={setDisplayName}
                    autoCapitalize="words"
                    textContentType="name"
                    placeholder="Your name"
                  />
                ) : null}
                <Field
                  label="Email"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  textContentType="emailAddress"
                  placeholder="you@example.com"
                />
                <Field
                  label="Password"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  autoCapitalize="none"
                  autoComplete={emailMode === 'signup' ? 'new-password' : 'current-password'}
                  textContentType={emailMode === 'signup' ? 'newPassword' : 'password'}
                  placeholder="At least 8 characters"
                  returnKeyType="done"
                  onSubmitEditing={() => void submitEmail()}
                />
                <Button
                  label={emailMode === 'signup' ? 'CREATE ACCOUNT' : 'SIGN IN'}
                  loading={busy}
                  onPress={() => void submitEmail()}
                />
                <Pressable
                  onPress={() => {
                    setEmailMode((value) => (value === 'signup' ? 'login' : 'signup'));
                    setError(null);
                  }}
                  style={styles.switchAction}
                >
                  <Text style={styles.switchText}>
                    {emailMode === 'signup'
                      ? 'Already have an account? Sign in'
                      : 'New here? Create an account'}
                  </Text>
                </Pressable>
              </View>
            </>
          ) : null}

          {mode === 'phone' || mode === 'code' ? (
            <>
              <Text style={styles.title}>
                {mode === 'phone' ? 'Use your phone' : 'Enter code'}
              </Text>
              <Text style={styles.copy}>
                {mode === 'phone' ? 'We’ll text you a one-time code.' : `Sent to ${phone}`}
              </Text>
              <View style={styles.form}>
                {mode === 'phone' ? (
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
                    onSubmitEditing={() => void sendCode()}
                  />
                ) : (
                  <>
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
                      placeholderTextColor={colors.secondaryInk}
                    />
                    <Pressable onPress={() => void sendCode()} disabled={busy} style={styles.resend}>
                      <Text style={styles.resendText}>Resend code</Text>
                    </Pressable>
                  </>
                )}
                <Button
                  label={mode === 'phone' ? 'SEND CODE' : 'SIGN IN'}
                  loading={busy}
                  onPress={() => void (mode === 'phone' ? sendCode() : submitMessageCode())}
                />
              </View>
            </>
          ) : null}

          {mode === 'email-code' ? (
            <>
              <Text style={styles.title}>
                {emailCodeSent ? 'Check your email' : 'Email sign-in code'}
              </Text>
              <Text style={styles.copy}>
                {emailCodeSent
                  ? `We sent a code to ${email}.`
                  : 'A free passwordless fallback when SMS is unavailable.'}
              </Text>
              <View style={styles.form}>
                {!emailCodeSent ? (
                  <Field
                    label="Email"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoComplete="email"
                    textContentType="emailAddress"
                    placeholder="you@example.com"
                    returnKeyType="done"
                    onSubmitEditing={() => void sendEmailCode()}
                  />
                ) : (
                  <TextInput
                    ref={codeRef}
                    accessibilityLabel="Six-digit email sign-in code"
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
                    placeholderTextColor={colors.secondaryInk}
                  />
                )}
                <Button
                  label={emailCodeSent ? 'SIGN IN' : 'SEND EMAIL CODE'}
                  loading={busy}
                  onPress={() =>
                    void (emailCodeSent ? submitEmailCode() : sendEmailCode())
                  }
                />
                {emailCodeSent ? (
                  <Pressable
                    onPress={() => void sendEmailCode()}
                    disabled={busy}
                    style={styles.resend}
                  >
                    <Text style={styles.resendText}>Resend code</Text>
                  </Pressable>
                ) : null}
              </View>
            </>
          ) : null}

          {notice ? (
            <Banner tone="success" icon="check-circle" title="Code sent" message={notice} />
          ) : null}
          {error ? (
            <Banner tone="error" icon="alert-circle" title="Couldn’t continue" message={error} />
          ) : null}
        </View>
        <Text style={styles.privacy}>By continuing you accept our Terms and Privacy Policy.</Text>
      </NeoScreenWrapper>
    </KeyboardAvoidingView>
  );
}

function GoogleSignInButton({
  busy,
  onToken,
  onStart,
  onCancel,
}: {
  busy: boolean;
  onToken: (token: string) => void;
  onStart: () => void;
  onCancel: () => void;
}) {
  const [request, response, promptAsync] = useIdTokenAuthRequest({
    webClientId,
    iosClientId,
    androidClientId,
    selectAccount: true,
  });
  const handled = useRef(false);

  useEffect(() => {
    if (response?.type === 'success') {
      if (handled.current) return;
      handled.current = true;
      const idToken = response.params.id_token;
      if (idToken) onToken(idToken);
      else onCancel();
    } else if (response) {
      onCancel();
    }
  }, [onCancel, onToken, response]);

  return (
    <Button
      label="CONTINUE WITH GOOGLE"
      variant="outline"
      icon="google"
      disabled={!request || busy}
      loading={busy}
      onPress={() => {
        handled.current = false;
        onStart();
        void promptAsync();
      }}
    />
  );
}

const styles = StyleSheet.create({
  body: { flex: 1, paddingTop: spacing.lg, paddingBottom: spacing.lg },
  mark: {
    width: 54,
    height: 54,
    borderRadius: 27,
    borderWidth: border.standard,
    borderColor: colors.ink,
    backgroundColor: colors.butterCard,
    alignItems: 'center',
    justifyContent: 'center',
  },
  markText: { fontFamily: fonts.bold, fontSize: 28, color: colors.ink },
  title: { ...type.headline, marginTop: spacing.xl },
  copy: { ...type.body, color: colors.onSurfaceVariant, marginTop: spacing.xs },
  actions: { gap: spacing.sm, marginTop: spacing.xxl },
  form: { gap: spacing.md, marginTop: spacing.xl },
  switchAction: { alignItems: 'center', padding: spacing.sm },
  switchText: { ...type.bodySmall, color: colors.primary, fontFamily: fonts.semibold },
  codeInput: {
    height: 68,
    borderRadius: radii.pill,
    borderWidth: border.standard,
    borderColor: colors.ink,
    backgroundColor: colors.white,
    textAlign: 'center',
    fontFamily: fonts.semibold,
    fontSize: 28,
    letterSpacing: 12,
    color: colors.ink,
    outlineStyle: 'none' as never,
  },
  resend: { alignSelf: 'flex-end', paddingVertical: spacing.xs },
  resendText: { ...type.bodySmall, color: colors.primary, fontFamily: fonts.semibold },
  privacy: { ...type.caption, textAlign: 'center', padding: spacing.lg },
});
