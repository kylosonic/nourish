import {
  Alert,
  Platform,
  type AlertButton,
  type AlertOptions,
} from 'react-native';

/**
 * React Native Web implements Alert.alert as a no-op. Use browser dialogs on
 * web so confirmations and recovery actions remain functional in the preview.
 */
export function showAlert(
  title: string,
  message?: string,
  buttons?: AlertButton[],
  _options?: AlertOptions,
): void {
  if (Platform.OS !== 'web') {
    Alert.alert(title, message, buttons, _options);
    return;
  }

  const copy = [title, message].filter(Boolean).join('\n\n');
  if (!buttons || buttons.length <= 1) {
    window.alert(copy);
    buttons?.[0]?.onPress?.();
    return;
  }

  const primary =
    buttons.find((button) => button.style !== 'cancel') ||
    buttons[buttons.length - 1];
  if (window.confirm(copy)) {
    primary?.onPress?.();
  } else {
    buttons.find((button) => button.style === 'cancel')?.onPress?.();
  }
}
