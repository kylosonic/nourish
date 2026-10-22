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
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/types';
import { colors, fonts, radii, spacing, type } from '../../theme';
import { Banner, Button, Icon } from '../../components/ui';
import { setPendingAnalysisInput } from '../../state/analysisSession';

type Props = NativeStackScreenProps<RootStackParamList, 'TextLog'>;

const examples = [
  '2 injera with shiro and an orange',
  'one bowl of misir wot',
  'chechebsa with honey and buna',
];

export function TextLogScreen({ navigation, route }: Props) {
  const [text, setText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const input = useRef<React.ComponentRef<typeof TextInput>>(null);
  const voice = route.params?.mode === 'voice';

  const submit = () => {
    const clean = text.trim();
    if (clean.length < 2) {
      setError('Describe at least one food before continuing.');
      return;
    }
    setPendingAnalysisInput({ text: clean, slot: route.params?.slot });
    navigation.replace('Analysis', { slot: route.params?.slot, text: clean });
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
        <View style={styles.header}>
          <Pressable
            accessibilityLabel="Go back"
            onPress={() => navigation.goBack()}
            style={styles.back}
          >
            <Icon name="arrow-left" size={24} color={colors.onSurfaceVariant} />
          </Pressable>
          <Text style={styles.wordmark}>Nourish</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.content}>
          <View style={styles.iconWrap}>
            <Icon name={voice ? 'microphone-outline' : 'text-box-edit-outline'} size={30} color={colors.primary} />
          </View>
          <Text style={styles.title}>{voice ? 'Say what you ate' : 'Describe your meal'}</Text>
          <Text style={styles.copy}>Add foods and portions.</Text>
          {voice ? (
            <Banner
              tone="info"
              icon="microphone-off"
              title="Voice isn’t available"
              message="Type your meal below instead."
              action={
                <Pressable onPress={() => input.current?.focus()} style={styles.bannerAction}>
                  <Text style={styles.bannerActionText}>TYPE TRANSCRIPT</Text>
                </Pressable>
              }
            />
          ) : null}
          <View style={styles.inputWrap}>
            <TextInput
              ref={input}
              value={text}
              onChangeText={(value) => {
                setText(value);
                setError(null);
              }}
              placeholder="What did you eat?"
              placeholderTextColor={colors.outline}
              multiline
              textAlignVertical="top"
              maxLength={500}
              autoFocus={!voice}
              style={styles.input}
              selectionColor={colors.primary}
            />
            <Text style={styles.counter}>{text.length}/500</Text>
          </View>
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <Text style={styles.examplesTitle}>TRY AN EXAMPLE</Text>
          <View style={styles.examples}>
            {examples.map((example) => (
              <Pressable
                key={example}
                onPress={() => {
                  setText(example);
                  setError(null);
                }}
                style={styles.example}
              >
                <Icon name="plus" size={17} color={colors.primary} />
                <Text style={styles.exampleText}>{example}</Text>
              </Pressable>
            ))}
          </View>
        </View>
        <View style={styles.footer}>
          <Button label="ANALYZE MEAL" icon="arrow-right" onPress={submit} />
          <Text style={styles.footnote}>Review before saving.</Text>
        </View>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.surface },
  header: {
    height: 64,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  back: { width: 40, height: 40, justifyContent: 'center' },
  wordmark: {
    flex: 1,
    textAlign: 'center',
    fontFamily: fonts.bold,
    fontSize: 31,
    color: colors.primary,
  },
  content: { flex: 1, paddingHorizontal: spacing.xl, paddingTop: spacing.lg },
  iconWrap: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { ...type.headline, marginTop: spacing.lg },
  copy: { ...type.body, color: colors.onSurfaceVariant, marginTop: spacing.xs, marginBottom: spacing.lg },
  bannerAction: { alignSelf: 'flex-start', paddingTop: spacing.sm },
  bannerActionText: { ...type.label, color: colors.primary },
  inputWrap: {
    minHeight: 150,
    borderRadius: radii.lg,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    padding: spacing.md,
  },
  input: {
    minHeight: 104,
    fontFamily: fonts.regular,
    fontSize: 18,
    lineHeight: 27,
    color: colors.onSurface,
    outlineStyle: 'none' as never,
  },
  counter: { ...type.caption, textAlign: 'right' },
  error: { ...type.bodySmall, color: colors.error, marginTop: spacing.xs },
  examplesTitle: { ...type.label, marginTop: spacing.xl, marginBottom: spacing.sm },
  examples: { gap: spacing.xs },
  example: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    minHeight: 44,
    borderRadius: radii.md,
    backgroundColor: colors.surfaceLow,
    paddingHorizontal: spacing.md,
  },
  exampleText: { ...type.bodySmall, color: colors.onSurfaceVariant, flex: 1 },
  footer: { padding: spacing.xl, gap: spacing.sm },
  footnote: { ...type.caption, textAlign: 'center' },
});
