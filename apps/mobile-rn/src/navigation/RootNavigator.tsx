import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import {
  NavigationContainer,
  type NavigationContainerRef,
} from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import type { RootStackParamList, MainTabParamList } from './types';
import { useApp } from '../state/AppProvider';
import { colors, fonts, spacing } from '../theme';
import { BottomNav } from '../components/BottomNav';
import { HomeScreen } from '../screens/home/HomeScreen';
import { ProgressScreen } from '../screens/progress/ProgressScreen';
import { InsightsScreen } from '../screens/insights/InsightsScreen';
import { RecommendationsScreen } from '../screens/insights/RecommendationsScreen';
import { ProfileScreen } from '../screens/profile/ProfileScreen';
import { SettingsScreen } from '../screens/profile/SettingsScreen';
import { PrivacyScreen } from '../screens/profile/PrivacyScreen';
import { SignInScreen } from '../screens/auth/SignInScreen';
import { HistoryScreen } from '../screens/history/HistoryScreen';
import {
  ActivityScreen,
  BodyScreen,
  DailyTargetScreen,
  FoodPreferenceScreen,
  GoalScreen,
  LanguageScreen,
  PaceScreen,
  WelcomeScreen,
} from '../screens/onboarding/OnboardingScreens';
import { ScanMenuScreen } from '../screens/scan/ScanMenuScreen';
import { CameraScreen } from '../screens/scan/CameraScreen';
import { AnalysisScreen } from '../screens/scan/AnalysisScreen';
import { ResultScreen } from '../screens/scan/ResultScreen';
import { LowConfidenceScreen } from '../screens/scan/LowConfidenceScreen';
import { TextLogScreen } from '../screens/scan/TextLogScreen';
import { FoodSearchScreen } from '../screens/search/FoodSearchScreen';
import { EditMealScreen } from '../screens/scan/EditMealScreen';
import { BarcodeScreen } from '../screens/scan/BarcodeScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

const onboardingRoute: Record<number, keyof RootStackParamList> = {
  1: 'Language',
  2: 'Goal',
  3: 'Body',
  4: 'Activity',
  5: 'Pace',
  6: 'FoodPreference',
  7: 'DailyTarget',
};

function MainTabs({ navigation }: { navigation: { navigate: (name: keyof RootStackParamList) => void } }) {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: colors.surface, paddingBottom: 100 },
        tabBarStyle: {
          position: 'absolute',
          backgroundColor: 'transparent',
          borderTopWidth: 0,
          elevation: 0,
        },
        lazy: true,
      }}
      tabBar={(props) => (
        <BottomNav
          state={props.state}
          navigation={props.navigation}
          onScan={() => navigation.navigate('ScanMenu')}
        />
      )}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Progress" component={ProgressScreen} />
      <Tab.Screen name="Insights" component={InsightsScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

function AppStack() {
  const { state } = useApp();
  if (!state.hydrated) {
    return (
      <View style={styles.loading}>
        <View style={styles.splashMark}>
          <Text style={styles.splashLetter}>N</Text>
        </View>
        <Text style={styles.splashWord}>Nourish</Text>
        <Text style={styles.splashTagline}>Nutrition, understood.</Text>
        <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.xl }} />
      </View>
    );
  }

  const initialOnboarding =
    state.onboarding.started && !state.onboarding.completed
      ? onboardingRoute[state.onboarding.step] || 'Language'
      : undefined;

  return (
    <Stack.Navigator
      initialRouteName={
        state.onboarding.completed
          ? 'MainTabs'
          : state.onboarding.started
            ? initialOnboarding
            : 'Welcome'
      }
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.surface },
        animation: 'slide_from_right',
      }}
    >
      {!state.onboarding.completed ? (
        <>
          <Stack.Screen name="Welcome" component={WelcomeScreen} options={{ animation: 'fade' }} />
          <Stack.Screen name="Language" component={LanguageScreen} />
          <Stack.Screen name="Goal" component={GoalScreen} />
          <Stack.Screen name="Body" component={BodyScreen} />
          <Stack.Screen name="Activity" component={ActivityScreen} />
          <Stack.Screen name="Pace" component={PaceScreen} />
          <Stack.Screen name="FoodPreference" component={FoodPreferenceScreen} />
          <Stack.Screen name="DailyTarget" component={DailyTargetScreen} />
          <Stack.Screen name="SignIn" component={SignInScreen} />
        </>
      ) : (
        <>
          <Stack.Screen name="MainTabs">
            {({ navigation }) => <MainTabs navigation={navigation} />}
          </Stack.Screen>
          <Stack.Screen name="History" component={HistoryScreen} />
          <Stack.Screen name="Recommendations" component={RecommendationsScreen} />
          <Stack.Screen name="Settings" component={SettingsScreen} />
          <Stack.Screen name="Privacy" component={PrivacyScreen} />
          <Stack.Screen name="SignIn" component={SignInScreen} />
          <Stack.Screen
            name="ScanMenu"
            component={ScanMenuScreen}
            options={{
              presentation: 'transparentModal',
              animation: 'slide_from_bottom',
              contentStyle: { backgroundColor: 'transparent' },
            }}
          />
          <Stack.Screen
            name="Camera"
            component={CameraScreen}
            options={{ presentation: 'fullScreenModal', animation: 'fade' }}
          />
          <Stack.Screen
            name="Analysis"
            component={AnalysisScreen}
            options={{ presentation: 'fullScreenModal', animation: 'fade' }}
          />
          <Stack.Screen name="Result" component={ResultScreen} />
          <Stack.Screen name="LowConfidence" component={LowConfidenceScreen} />
          <Stack.Screen name="TextLog" component={TextLogScreen} />
          <Stack.Screen name="FoodSearch" component={FoodSearchScreen} />
          <Stack.Screen name="EditMeal" component={EditMealScreen} />
          <Stack.Screen name="Barcode" component={BarcodeScreen} />
        </>
      )}
    </Stack.Navigator>
  );
}

export function RootNavigator({
  navigationRef,
}: {
  navigationRef?: React.RefObject<NavigationContainerRef<RootStackParamList> | null>;
}) {
  return (
    <NavigationContainer ref={navigationRef}>
      <AppStack />
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  splashMark: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: colors.primarySoft,
    borderWidth: 2,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  splashLetter: { fontFamily: fonts.bold, fontSize: 47, color: colors.primary },
  splashWord: {
    fontFamily: fonts.bold,
    fontSize: 40,
    letterSpacing: -1.6,
    color: colors.primary,
    marginTop: spacing.lg,
  },
  splashTagline: { fontFamily: fonts.regular, fontSize: 16, color: colors.onSurfaceVariant },
});
