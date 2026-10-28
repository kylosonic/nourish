import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Platform, StyleSheet, View } from 'react-native';
import { useFonts } from 'expo-font';
import {
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  PlusJakartaSans_800ExtraBold,
} from '@expo-google-fonts/plus-jakarta-sans';
import * as SplashScreen from 'expo-splash-screen';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppProvider } from './src/state/AppProvider';
import { RootNavigator } from './src/navigation/RootNavigator';
import { colors } from './src/theme';

void SplashScreen.preventAutoHideAsync();

export default function App() {
  const [fontsLoaded, fontError] = useFonts({
    'Inter-Regular': require('./assets/fonts/Inter-Regular.ttf'),
    'Inter-SemiBold': require('./assets/fonts/Inter-SemiBold.ttf'),
    'Inter-Bold': require('./assets/fonts/Inter-Bold.ttf'),
    'PlusJakartaSans-Medium': PlusJakartaSans_500Medium,
    'PlusJakartaSans-SemiBold': PlusJakartaSans_600SemiBold,
    'PlusJakartaSans-Bold': PlusJakartaSans_700Bold,
    'PlusJakartaSans-ExtraBold': PlusJakartaSans_800ExtraBold,
    'NotoSansEthiopic-Regular': require('./assets/fonts/NotoSansEthiopic-Regular.ttf'),
    'NotoSansEthiopic-Bold': require('./assets/fonts/NotoSansEthiopic-Bold.ttf'),
    ...MaterialCommunityIcons.font,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      void SplashScreen.hideAsync();
    }
  }, [fontError, fontsLoaded]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <SafeAreaProvider>
      <AppProvider>
        <View style={Platform.OS === 'web' ? styles.webBackdrop : styles.nativeRoot}>
          <View style={Platform.OS === 'web' ? styles.webFrame : styles.nativeRoot}>
            <StatusBar style="dark" />
            <RootNavigator />
          </View>
        </View>
      </AppProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  nativeRoot: { flex: 1 },
  webBackdrop: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: colors.lavenderBackdrop,
  },
  webFrame: {
    flex: 1,
    width: '100%',
    maxWidth: 480,
    backgroundColor: colors.peachCanvas,
    overflow: 'hidden',
  },
});
