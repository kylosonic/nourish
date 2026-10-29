import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/types';
import { useApp } from '../../state/AppProvider';
import { border, colors, fonts, spacing, type } from '../../theme';
import { Banner, Button, Card } from '../../components/ui';
import { NeoScreenWrapper, NeoTopBar } from '../../components/neo';

type Props = NativeStackScreenProps<RootStackParamList, 'DeleteAccount'>;

export function DeleteAccountScreen({ navigation }: Props) {
  const { state, deleteCurrentAccount } = useApp();
  const [confirmation, setConfirmation] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const remove = async () => {
    if (confirmation !== 'DELETE' || deleting) return;
    setDeleting(true);
    setError(null);
    try {
      await deleteCurrentAccount();
      navigation.reset({ index: 0, routes: [{ name: 'Welcome' }] });
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : 'Your account could not be deleted. Please try again.',
      );
    } finally {
      setDeleting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <NeoScreenWrapper tone="pink" scroll contentStyle={styles.content}>
        <NeoTopBar
          title="Delete account"
          leftColor={colors.coralCard}
          rightColor={colors.butterCard}
          onBack={() => navigation.goBack()}
        />
        <Text style={styles.title}>This cannot be undone.</Text>
        <Text style={styles.copy}>
          Your account, sessions, consent records, meal history, water, and
          weigh-ins will be permanently removed from Nourish.
        </Text>

        <Banner
          tone="warning"
          icon="alert-outline"
          title="Permanent deletion"
          message="Export your data first if you want to keep a personal copy."
        />

        <Card style={styles.confirmationCard}>
          <Text style={styles.label}>TYPE DELETE TO CONFIRM</Text>
          <TextInput
            accessibilityLabel="Type DELETE to confirm account deletion"
            value={confirmation}
            onChangeText={setConfirmation}
            autoCapitalize="characters"
            autoCorrect={false}
            placeholder="DELETE"
            placeholderTextColor={colors.outline}
            editable={!deleting}
            style={styles.input}
          />
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <Button
            label="PERMANENTLY DELETE ACCOUNT"
            variant="danger"
            disabled={confirmation !== 'DELETE'}
            loading={deleting}
            onPress={() => void remove()}
          />
        </Card>

        {!state.session ? (
          <Text style={styles.copy}>Sign in before deleting an account.</Text>
        ) : null}
      </NeoScreenWrapper>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { paddingTop: spacing.xs, paddingBottom: 96 },
  title: { ...type.headline, marginTop: spacing.lg },
  copy: {
    ...type.body,
    color: colors.onSurfaceVariant,
    lineHeight: 23,
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
  },
  confirmationCard: {
    marginTop: spacing.lg,
    padding: spacing.lg,
    backgroundColor: colors.white,
    gap: spacing.md,
  },
  label: { ...type.label },
  input: {
    height: 60,
    borderRadius: 16,
    borderWidth: border.standard,
    borderColor: colors.ink,
    backgroundColor: colors.pinkCanvas,
    paddingHorizontal: spacing.md,
    fontFamily: fonts.bold,
    fontSize: 22,
    color: colors.ink,
    letterSpacing: 2,
  },
  error: { ...type.bodySmall, color: colors.error },
});
